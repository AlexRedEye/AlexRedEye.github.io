import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

// ====== Models ======
class Order {
  constructor({ userId, userName, symbol, side, type, price, qty }) {
    this.id = uuidv4();
    this.userId = userId;
    this.userName = userName;
    this.symbol = symbol;         // 'ACME'
    this.side = side;             // 'buy' | 'sell'
    this.type = type;             // 'limit' | 'market'
    this.price = type === 'market' ? null : Number(price);
    this.qty = Math.max(1, Math.floor(Number(qty) || 0));
    this.remaining = this.qty;
    this.ts = Date.now();
  }
}

class OrderBook {
  constructor(symbol, initialPrice = 100) {
    this.symbol = symbol;
    this.bids = []; // price desc, time asc
    this.asks = []; // price asc, time asc
    this.last = initialPrice;
    this.trades = [];
  }
  sort() {
    this.bids.sort((a,b) => b.price - a.price || a.ts - b.ts);
    this.asks.sort((a,b) => a.price - b.price || a.ts - a.ts);
  }
  top(n = 8) {
    return {
      bids: this.bids.slice(0, n).map(o => ({ price: o.price, qty: o.remaining })),
      asks: this.asks.slice(0, n).map(o => ({ price: o.price, qty: o.remaining })),
      last: this.last
    };
  }
  addLimit(order) {
    (order.side === 'buy' ? this.bids : this.asks).push(order);
    this.sort();
  }
  // continuous crossing at maker price
  match(onTrade) {
    while (this.bids.length && this.asks.length && this.bids[0].price >= this.asks[0].price) {
      const bid = this.bids[0], ask = this.asks[0];
      const qty = Math.min(bid.remaining, ask.remaining);
      const price = (ask.ts <= bid.ts) ? ask.price : bid.price; // maker = older
      const trade = {
        id: uuidv4(), symbol: this.symbol, price, qty,
        buyOrderId: bid.id, sellOrderId: ask.id,
        buyUserId: bid.userId, sellUserId: ask.userId,
        buyUserName: bid.userName, sellUserName: ask.userName,
        ts: Date.now()
      };
      this.last = price;
      bid.remaining -= qty;
      ask.remaining -= qty;
      this.trades.unshift(trade);
      this.trades = this.trades.slice(0, 50);
      onTrade(trade);
      if (bid.remaining <= 0) this.bids.shift();
      if (ask.remaining <= 0) this.asks.shift();
    }
  }
  // market consumes opposite book
  addMarket(order, onTrade) {
    const book = order.side === 'buy' ? this.asks : this.bids;
    while (order.remaining > 0 && book.length) {
      const best = book[0];
      const fill = Math.min(order.remaining, best.remaining);
      const price = best.price;
      const trade = {
        id: uuidv4(), symbol: this.symbol, price, qty: fill,
        buyOrderId: order.side === 'buy' ? order.id : best.id,
        sellOrderId: order.side === 'sell' ? order.id : best.id,
        buyUserId: order.side === 'buy' ? order.userId : best.userId,
        sellUserId: order.side === 'sell' ? order.userId : best.userId,
        buyUserName: order.side === 'buy' ? order.userName : best.userName,
        sellUserName: order.side === 'sell' ? order.userName : best.userName,
        ts: Date.now()
      };
      this.last = price;
      order.remaining -= fill;
      best.remaining -= fill;
      this.trades.unshift(trade);
      this.trades = this.trades.slice(0, 50);
      onTrade(trade);
      if (best.remaining <= 0) book.shift();
    }
  }
}

class Player {
  constructor({ id, name, cash = 100000, seedShares = 100 }) {
    this.id = id;
    this.name = name;
    this.cash = cash;
    this.positions = { ACME: seedShares }; // seed shares so sells can execute
  }
  qty(sym) { return this.positions[sym] || 0; }
  add(sym, q) { this.positions[sym] = this.qty(sym) + q; }
}

// ====== Game State ======
const game = {
  id: 'lobby',
  symbols: ['ACME'],
  players: new Map(),                     // userId -> Player
  books: new Map([['ACME', new OrderBook('ACME', 100)]]),
};

function lastPrice(sym) { return game.books.get(sym)?.last ?? 0; }
function portfolioValue(p) {
  let v = p.cash;
  for (const [sym, q] of Object.entries(p.positions)) v += q * lastPrice(sym);
  return v;
}
function leaderboard() {
  const rows = [];
  for (const p of game.players.values()) rows.push({ userId: p.id, name: p.name, netWorth: portfolioValue(p) });
  rows.sort((a,b) => b.netWorth - a.netWorth);
  return rows.slice(0, 20);
}

// ====== Server setup ======
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
app.use(cors());
const PUBLIC_DIR = path.join(__dirname, "public");
app.use(express.static(PUBLIC_DIR));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.get("/health", (_req, res) => res.json({ ok: true, servedFrom: PUBLIC_DIR }));

io.on("connection", (socket) => {
  // join
  socket.on("join", ({ name }) => {
    const id = socket.id;
    if (!game.players.has(id)) {
      game.players.set(id, new Player({ id, name: (name || 'Player').trim() }));
    } else {
      game.players.get(id).name = (name || 'Player').trim();
    }
    socket.join(game.id);
    socket.emit("joined", { userId: id, gameId: game.id, symbols: game.symbols });
    pushState();
  });

  // place order
  socket.on("placeOrder", (p) => {
    const userId = socket.id;
    const player = game.players.get(userId);
    if (!player) return;

    const { symbol, side, type } = p;
    let { price, qty } = p;
    const ob = game.books.get(symbol);
    if (!ob) return;

    qty = Math.max(1, Math.floor(Number(qty) || 0));
    price = type === 'market' ? null : Number(price);

    // Risk checks
    if (side === 'sell' && player.qty(symbol) < qty) {
      socket.emit('errorMsg', 'Not enough shares to sell.');
      return;
    }
    if (side === 'buy' && type === 'limit') {
      const need = Number(price) * qty;
      if (player.cash < need) {
        socket.emit('errorMsg', 'Not enough cash for this limit order.');
        return;
      }
    }
    if (side === 'buy' && type === 'market') {
      const bestAsk = ob.asks[0]?.price;
      if (bestAsk && player.cash < bestAsk * qty) {
        socket.emit('errorMsg', 'Not enough cash for this market order.');
        return;
      }
    }

    const order = new Order({
      userId, userName: player.name, symbol, side, type, price, qty
    });

    const settle = (trade) => {
      const buyer  = game.players.get(trade.buyUserId);
      const seller = game.players.get(trade.sellUserId);
      if (!buyer || !seller) return;

      const cost = trade.price * trade.qty;
      if (buyer.cash < cost) return;
      if (seller.qty(trade.symbol) < trade.qty) return;

      buyer.cash -= cost;
      buyer.add(trade.symbol, +trade.qty);

      seller.add(trade.symbol, -trade.qty);
      seller.cash += cost;

      io.to(game.id).emit('trade', trade);
    };

    if (type === 'market') {
      ob.addMarket(order, settle);
    } else {
      ob.addLimit(order);
      ob.match(settle);
    }
    pushState();
  });

  socket.on("disconnect", () => {
    // keep players in memory so leaderboard persists
    pushState();
  });
});

// broadcast compact snapshot
function pushState() {
  const snap = {
    books: Object.fromEntries(
      Array.from(game.books.entries()).map(([sym, ob]) => [sym, ob.top(8)])
    ),
    leaderboard: leaderboard()
  };
  io.to(game.id).emit('state', snap);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("✅ Stockmarket server");
  console.log("   Public dir:", PUBLIC_DIR);
  console.log(`   URL:        http://localhost:${PORT}`);
  console.log(`   Try:        http://localhost:${PORT}/stockmarket.html`);
});
