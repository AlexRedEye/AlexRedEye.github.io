// app.js — client-side logic for the Stock Market Simulator (GH Pages + Remote Server)

// --- Helpers ---
const $ = (id) => document.getElementById(id);
const fmt = (n) =>
  Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
const ts = (ms) => new Date(ms).toLocaleTimeString();

function setStatus(text, cls = '') {
  const s = $('status');
  s.textContent = text;
  s.className = cls;
}

function msg(text, level = '') {
  const box = $('messages');
  const p = document.createElement('div');
  p.textContent = text;
  p.className = level;
  box.prepend(p);
  while (box.children.length > 6) box.removeChild(box.lastChild);
}

// --- Socket.IO connection ---
let socket = null;
let userId = null;
let symbols = [];

// Optional: preview UI without a server
const USE_MOCK = false;

// Initialize after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  $('join').addEventListener('click', onJoin);
  $('place').addEventListener('click', onPlaceOrder);
  if (USE_MOCK) {
    mockBoot();
  } else {
    bootSocket();
  }
});

function bootSocket() {
  try {
    // Default to your Render URL; allow override via ?server=https://foo.onrender.com
    const p = new URLSearchParams(location.search);
    const SERVER_URL =
      p.get('server') || 'https://stockmarket-server.onrender.com';

    // Connect to remote server (works from GitHub Pages)
    socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: false
    });
  } catch (e) {
    setStatus('Socket.IO not found', 'err');
    msg('Could not load Socket.IO client or connect to server', 'err');
    return;
  }

  socket.on('connect', () => setStatus('Connected', 'ok'));
  socket.on('disconnect', () => setStatus('Disconnected', 'err'));

  // From server when we successfully join a game
  socket.on('joined', ({ userId: uid, symbols: syms }) => {
    userId = uid;
    symbols = syms || ['ACME'];
    hydrateSymbols(symbols);
    setStatus('Joined lobby', 'ok');
    msg('Joined as ' + uid);
  });

  // Server sends compact snapshot frequently
  socket.on('state', (snap) => {
    const sym = $('symbol').value || symbols[0];
    const book = snap.books?.[sym];
    if (book) {
      renderBook(book);
      $('last').textContent = `(${sym}) Last: ${fmt(book.last)}`;
    }
    renderLeaderboard(snap.leaderboard || []);
  });

  // Server emits on each trade fill
  socket.on('trade', (t) => {
    renderTrade(t);
  });

  // Basic error channel
  socket.on('errorMsg', (m) => msg(m, 'err'));
}

function hydrateSymbols(syms) {
  $('symbol').innerHTML = syms
    .map((s) => `<option value="${s}">${s}</option>`)
    .join('');
}

// --- UI actions ---
function onJoin() {
  if (!socket && !USE_MOCK) {
    msg('No server connection. Is the server running?', 'warn');
    return;
  }
  const name = $('name').value || 'Player';
  if (USE_MOCK) {
    mockJoin(name);
  } else {
    socket.emit('join', { name });
  }
}

function onPlaceOrder() {
  const payload = {
    symbol: $('symbol').value,
    side: $('side').value, // 'buy' | 'sell'
    type: $('type').value, // 'limit' | 'market'
    price: Number($('price').value),
    qty: Number($('qty').value)
  };
  if (payload.type === 'market') delete payload.price;

  if (USE_MOCK) {
    mockPlace(payload);
    return;
  }
  if (!socket) {
    msg('No server connection. Is the server running?', 'warn');
    return;
  }
  socket.emit('placeOrder', payload);
}

// --- Renderers ---
function renderBook(book) {
  const asksBody = $('asks').querySelector('tbody');
  const bidsBody = $('bids').querySelector('tbody');
  asksBody.innerHTML = '';
  bidsBody.innerHTML = '';

  // Asks best-first
  book.asks.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${fmt(row.price)}</td><td>${row.qty}</td>`;
    asksBody.appendChild(tr);
  });

  // Bids best-first
  book.bids.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${fmt(row.price)}</td><td>${row.qty}</td>`;
    bidsBody.appendChild(tr);
  });
}

function renderTrade(t) {
  const tb = $('trades').querySelector('tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${ts(t.ts)}</td><td>${fmt(t.price)}</td><td>${t.qty}</td><td>${t.buyUserName}</td><td>${t.sellUserName}</td>`;
  tb.prepend(tr);
  while (tb.children.length > 25) tb.removeChild(tb.lastChild);
}

function renderLeaderboard(rows) {
  const tb = $('lb').querySelector('tbody');
  tb.innerHTML = '';
  rows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="text-align:left">${escapeHtml(
      r.name
    )}</td><td>${fmt(r.netWorth)}</td>`;
    tb.appendChild(tr);
  });
}

// --- Utilities ---
function escapeHtml(s = '') {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// --- MOCK MODE (optional, for static preview without server) ---
let mockState = {
  symbols: ['ACME'],
  last: 100,
  books: {
    ACME: {
      last: 100,
      bids: [
        { price: 100.0, qty: 20 },
        { price: 99.9, qty: 40 },
        { price: 99.8, qty: 40 }
      ],
      asks: [
        { price: 100.1, qty: 20 },
        { price: 100.2, qty: 30 },
        { price: 100.25, qty: 50 }
      ]
    }
  },
  leaderboard: [
    { name: 'Alice', netWorth: 100000 },
    { name: 'Bob', netWorth: 99950 }
  ]
};

function mockBoot() {
  setStatus('Mock mode', 'warn');
  symbols = mockState.symbols;
  hydrateSymbols(symbols);
  $('last').textContent = `(ACME) Last: ${fmt(mockState.books.ACME.last)}`;
  renderBook(mockState.books.ACME);
  renderLeaderboard(mockState.leaderboard);

  // tiny animation so UI looks alive
  setInterval(() => {
    const jitter = (Math.random() - 0.5) * 0.2;
    mockState.books.ACME.last = Math.max(1, mockState.books.ACME.last + jitter);
    $('last').textContent = `(ACME) Last: ${fmt(mockState.books.ACME.last)}`;

    const b0 = mockState.books.ACME.bids[0];
    const a0 = mockState.books.ACME.asks[0];
    if (b0 && a0) {
      b0.price = +(b0.price + jitter).toFixed(2);
      a0.price = +(a0.price + jitter).toFixed(2);
      renderBook(mockState.books.ACME);
    }
  }, 1500);
}

function mockJoin(name) {
  userId = 'mock-' + Math.random().toString(36).slice(2, 8);
  msg(`(mock) Joined as ${name} [${userId}]`);
  setStatus('Joined lobby (mock)', 'ok');
}

function mockPlace(p) {
  if (p.type === 'market') {
    const price =
      p.side === 'buy'
        ? mockState.books.ACME.asks[0].price
        : mockState.books.ACME.bids[0].price;
    renderTrade({
      ts: Date.now(),
      price,
      qty: p.qty || 1,
      buyUserName: p.side === 'buy' ? $('name').value || 'You' : 'MM',
      sellUserName: p.side === 'sell' ? $('name').value || 'You' : 'MM'
    });
    msg(`(mock) Market ${p.side} filled ~ ${fmt(price)}`);
    return;
  }

  if (p.type === 'limit') {
    const sideKey = p.side === 'buy' ? 'bids' : 'asks';
    const row = {
      price: +(+p.price || 100).toFixed(2),
      qty: Math.max(1, +p.qty || 1)
    };
    mockState.books.ACME[sideKey].push(row);
    if (sideKey === 'bids') {
      mockState.books.ACME.bids.sort((a, b) => b.price - a.price);
    } else {
      mockState.books.ACME.asks.sort((a, b) => a.price - b.price);
    }
    renderBook(mockState.books.ACME);
    msg(`(mock) Placed ${p.side} limit ${fmt(row.price)} x ${row.qty}`);
  }
}
