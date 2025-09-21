import Game from './game.js';

// Moonrakers-Lite Version System
const MOONLITE_VERSION = '0.1.0-alpha';
const VERSION_DATE = '2025-09-21';

console.log(`%c🚀 Moonrakers-Lite v${MOONLITE_VERSION}`, 'color: #4f46e5; font-weight: bold;');
console.log(`Built: ${VERSION_DATE}`);

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
