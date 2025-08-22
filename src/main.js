import { setupTabs, updateUI } from './ui.js';
import { drawPrestigeTree, updatePrestigeSide, buyNode, getSelectedOrNull } from './prestige.js';
import { loadSave, setupAutosave } from './storage.js';
import { wireEvents } from './events.js';
import { setupIntervals } from './automation.js';

setupTabs();
loadSave();
drawPrestigeTree();
updatePrestigeSide();
updateUI();
wireEvents();
setupIntervals();
setupAutosave(); // ensure autosave runs

// Buy button: use exported getter directly
document.getElementById('node-buy')?.addEventListener('click', () => {
  const k = getSelectedOrNull();
  if (k) buyNode(k);
});