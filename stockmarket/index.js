import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

/* ===== Models ===== */
class Order {
  constructor({ userId, userName, symbol, side, type, price, qty }) {
    this.id = uuidv4();
    this.userId = userId;
    this.userName = userName;
    this.symbol = symbol;
    this.side = side;          // 'buy' | 'sell'
    this.type = type;          // 'limit' | 'market'
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
  sort() { this.bids.sort((a,b)=>b.price-a.price||a.ts-b.ts); this.asks.sort((a,b)=>a.price-b.price||a.ts-b.ts); }
  top(n=8){ return { bids:this.bids.slice(0,n).map(o=>({price:o.price,qty:o.remaining})), asks:this.asks.slice(0,n).map(o=>({price:o.price,qty:o.remaining})), last:this.last }; }
  addLimit(o){ (o.side==='buy'?this.bids:this.asks).push(o); this.sort(); }
  match(onTrade){
    while(this.bids.length&&this.asks.length&&this.bids[0].price>=this.asks[0].price){
      const bid=this.bids[0], ask=this.asks[0];
      const qty=Math.min(bid.remaining,ask.remaining);
      const price=(ask.ts<=bid.ts)?ask.price:bid.price; // maker price
      const t={ id:uuidv4(), symbol:this.symbol, price, qty, buyOrderId:bid.id, sellOrderId:ask.id,
        buyUserId:bid.userId, sellUserId:ask.userId, buyUserName:bid.userName, sellUserName:ask.userName, ts:Date.now() };
      this.last=price; bid.remaining-=qty; ask.remaining-=qty; this.trades.unshift(t); this.trades=this.trades.slice(0,50);
      onTrade(t); if(bid.remaining<=0)this.bids.shift(); if(ask.remaining<=0)this.asks.shift();
    }
  }
  addMarket(o,onTrade){
    const book=o.side==='buy'?this.asks:this.bids;
    while(o.remaining>0&&book.length){
      const best=book[0], fill=Math.min(o.remaining,best.remaining), price=best.price;
      const t={ id:uuidv4(), symbol:this.symbol, price, qty:fill,
        buyOrderId:o.side==='buy'?o.id:best.id, sellOrderId:o.side==='sell'?o.id:best.id,
        buyUserId:o.side==='buy'?o.userId:best.userId, sellUserId:o.side==='sell'?o.userId:best.userId,
        buyUserName:o.side==='buy'?o.userName:best.userName, sellUserName:o.side==='sell'?o.userName:best.userName, ts:Date.now() };
      this.last=price; o.remaining-=fill; best.remaining-=fill; this.trades.unshift(t); this.trades=this.trades.slice(0,50);
      onTrade(t); if(best.remaining<=0)book.shift();
    }
  }
}
class Player {
  constructor({ id, name, cash=100000, seedShares=100 }) {
    this.id=id; this.name=name; this.cash=cash; this.positions={ ACME: seedShares }; // seed so sells can fill
  }
  qty(sym){ return this.positions[sym]||0; }
  add(sym,q){ this.positions[sym]=(this.positions[sym]||0)+q; }
}

/* ===== Game State ===== */
const game = {
  id: 'lobby',
  symbols: ['ACME'],
  players: new Map(),
  books: new Map([['ACME', new OrderBook('ACME', 100)]]),
};
const lastPrice = (sym) => game.books.get(sym)?.last ?? 0;
const portfolioValue = (p) => Object.entries(p.positions).reduce((v,[sym,q])=>v+q*lastPrice(sym), p.cash);
const leaderboard = () => Array.from(game.players.values())
  .map(p=>({userId:p.id,name:p.name,netWorth:portfolioValue(p)}))
  .sort((a,b)=>b.netWorth-a.netWorth).slice(0,20);

/* ===== Server ===== */
const app = express();

// tighten this to your GH Pages origin when ready:
const ALLOWED_ORIGINS = [
  "https://<your-github-username>.github.io",
  "http://localhost:5173", // dev preview origins (optional)
  "http://localhost:5500"
];
app.use(cors({ origin: (origin, cb) => cb(null, true) })); // open CORS for testing
app.get("/health", (_req,res)=>res.json({ ok:true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: (origin, cb) => cb(null, true) }
});

io.on("connection", (socket) => {
  socket.on("join", ({ name }) => {
    const id = socket.id;
    const player = game.players.get(id) || new Player({ id, name: (name||'Player').trim() });
    player.name = (name||'Player').trim();
    game.players.set(id, player);
    socket.join(game.id);
    socket.emit("joined", { userId:id, gameId: game.id, symbols: game.symbols });
    pushState();
  });

  socket.on("placeOrder", (p) => {
    const userId = socket.id;
    const player = game.players.get(userId); if(!player) return;
    const { symbol, side, type } = p;
    let { price, qty } = p;
    const ob = game.books.get(symbol); if(!ob) return;

    qty = Math.max(1, Math.floor(Number(qty)||0));
    price = type==='market' ? null : Number(price);

    // risk checks
    if (side==='sell' && player.qty(symbol)<qty) { socket.emit('errorMsg','Not enough shares to sell.'); return; }
    if (side==='buy' && type==='limit' && player.cash < Number(price)*qty) { socket.emit('errorMsg','Not enough cash for this limit order.'); return; }
    if (side==='buy' && type==='market') { const bestAsk=ob.asks[0]?.price; if(bestAsk && player.cash < bestAsk*qty){ socket.emit('errorMsg','Not enough cash for this market order.'); return; } }

    const order = new Order({ userId, userName: player.name, symbol, side, type, price, qty });

    const settle = (t) => {
      const buyer=game.players.get(t.buyUserId), seller=game.players.get(t.sellUserId); if(!buyer||!seller) return;
      const cost=t.price*t.qty; if(buyer.cash<cost||seller.qty(t.symbol)<t.qty) return;
      buyer.cash -= cost; buyer.add(t.symbol, +t.qty);
      seller.add(t.symbol, -t.qty); seller.cash += cost;
      io.to(game.id).emit('trade', t);
    };

    if (type==='market') ob.addMarket(order, settle); else { ob.addLimit(order); ob.match(settle); }
    pushState();
  });

  socket.on("disconnect", () => { pushState(); });
});

function pushState(){
  const snap = {
    books: Object.fromEntries(Array.from(game.books.entries()).map(([s,ob])=>[s,ob.top(8)])),
    leaderboard: leaderboard()
  };
  io.to(game.id).emit('state', snap);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on :${PORT}`));
