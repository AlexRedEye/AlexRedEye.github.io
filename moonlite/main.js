import Game from './game.js';

const logEl = document.getElementById('log');
const game = new Game(logEl);

// global error handler
window.addEventListener('error', (e) => {
  try { game.logger?.error(`Uncaught: ${e.message}`); }
  catch { /* no-op if game not ready */ }
});

try {
  game.init();
} catch (err) {
  console.error(err);
  try { game.logger?.error(`Init failed: ${err?.message || err}`); } catch {}
}
