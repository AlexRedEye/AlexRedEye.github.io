'use strict';

/* =======================
   TAB TOGGLING
   ======================= */
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab-button');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.dataset.target;
      document.querySelectorAll('main[id^="screen-"]').forEach(m => {
        if (m.id === targetId) m.classList.remove('hidden');
        else m.classList.add('hidden');
      });
    });
  });
});

/* =======================
   DOM ELEMENTS
   ======================= */
const boxText = document.getElementById('box-txt');
const munsText = document.getElementById('muns-txt');
const storageText = document.getElementById('storage-txt');
const trucksText = document.getElementById('trucks-txt');
const capText = document.getElementById('cap-txt');
const totalText = document.getElementById('total-txt');

const prodButton = document.getElementById('production-btn');
const shipButton = document.getElementById('shipping-btn');

const storageUpgradeBtn = document.getElementById('storage-upgrade');
const trucksUpgradeBtn = document.getElementById('trucks-upgrade');
const storageCostTxt = document.getElementById('storage-cost');
const trucksCostTxt = document.getElementById('trucks-cost');

// Worker UI
const workerUpgradeBtn = document.getElementById('worker-upgrade');
const workerCostTxt = document.getElementById('worker-cost');
const workerCountTxt = document.getElementById('worker-count');
const workerNoteTxt = document.getElementById('worker-note');

// Shipping Manager UI
const managerUpgradeBtn = document.getElementById('manager-upgrade');
const managerCostTxt    = document.getElementById('manager-cost');
const managerLevelTxt   = document.getElementById('manager-level');

// Manual Click Upgrades
const clickUpgradeBtn = document.getElementById('click-upgrade');
const clickCostTxt = document.getElementById('click-cost');
const clickLevelTxt = document.getElementById('click-level');

// Crit Upgrades
const critUpgradeBtn = document.getElementById('crit-upgrade');
const critCostTxt = document.getElementById('crit-cost');
const critChanceTxt = document.getElementById('crit-chance');

// Priority Pick Skill
const skillBtn = document.getElementById('skill-btn');
const skillTimerTxt = document.getElementById('skill-timer');
const skillUpgradeBtn = document.getElementById('skill-upgrade');
const skillCostTxt = document.getElementById('skill-cost');
const skillDurationTxt = document.getElementById('skill-duration');

// Efficiency UI
const effScoreTxt = document.getElementById('eff-score');
const effProdTxt  = document.getElementById('eff-prod');
const effShipTxt  = document.getElementById('eff-ship');
const effBlockTxt = document.getElementById('eff-block');

// Prestige / Tokens UI (also shown on side panel)
const resetBtn = document.getElementById('reset-btn');
const tokensTxt = document.getElementById('tokens-txt');
const nextTokensTxt = document.getElementById('next-tokens-txt');

// SVG Prestige Tree side controls
const treeSvg = document.getElementById('tree-svg');
const nodeTitle = document.getElementById('node-title');
const nodeDesc = document.getElementById('node-desc');
const nodeLevel = document.getElementById('node-level');
const nodeCostLine = document.getElementById('node-cost');
const nodeBuyBtn = document.getElementById('node-buy');

// Contracts UI
const cActiveCard = document.getElementById('contract-active');
const cDesc = document.getElementById('contract-desc');
const cProgressBar = document.getElementById('contract-progress');
const cProgressText = document.getElementById('contract-progress-text');
const cTimer = document.getElementById('contract-timer');
const cStatus = document.getElementById('contract-status');
const cGenerateBtn = document.getElementById('contract-generate');
const cAbandonBtn = document.getElementById('contract-abandon');

// Toasts
const toastContainer = document.getElementById('toast-container');

/* =======================
   CONSTANTS
   ======================= */
const BASE_TRUCK_CAPACITY = 5;

const STORAGE_STEP = 10;
const BOX_VALUE = 1;

const STORAGE_BASE_COST = 50;
const STORAGE_COST_SCALE = 1.15;

const TRUCK_BASE_COST = 100;
const TRUCK_COST_SCALE = 1.20;

const WORKER_BASE_COST = 50;
const WORKER_COST_SCALE = 1.20;
const WORKER_INTERVAL = 2000; // ms

const MANAGER_BASE_COST = 250;
const MANAGER_COST_SCALE = 1.35;
const MANAGER_INTERVAL = 5000; // ms

const CLICK_BASE_COST = 30;
const CLICK_COST_SCALE = 1.35;
const MAX_CLICK_POWER_LEVEL = 10;

const CRIT_BASE_COST = 100;
const CRIT_COST_SCALE = 1.5;
const BASE_CRIT_CHANCE = 0.05;
const CRIT_PER_LEVEL = 0.01;
const PRESTIGE_CRIT_PER_LVL = 0.005;
const CRIT_MULTIPLIER = 10;
const MAX_TOTAL_CRIT = 0.25;

const SKILL_BASE_COST = 150;
const SKILL_COST_SCALE = 1.5;
const SKILL_BASE_DURATION = 10;
const SKILL_DURATION_PER_LEVEL = 2;
const SKILL_MAX_LEVEL = 5;
const SKILL_COOLDOWN = 60;

const EFF_WINDOW_MS = 60000; // 60s

// Prestige base costs (exponential: cost = base * 2^level)
const TREE_BASE_COST = {
  workerBoost: 1,
  truckBoost: 2,
  manualBoost: 1,
  critBoost: 3,
  managerBoost: 4
};

// --- Prestige Tree Graph Layout ---
const TREE_NODES = [
  // key, label, category, description, x [0..1000], y [0..1200], dependencies
  { key: 'manualBoost',  label: 'M',  cat: 'prod', desc: '+1 click power / level',
    x: 500, y: 1100, deps: [] },

  { key: 'workerBoost',  label: 'W',  cat: 'prod', desc: '+1% worker output / level',
    x: 300, y: 900,  deps: ['manualBoost'] },

  { key: 'truckBoost',   label: 'T',  cat: 'log',  desc: '+1 capacity / truck / level',
    x: 700, y: 900,  deps: ['manualBoost'] },

  { key: 'managerBoost', label: 'D',  cat: 'log',  desc: 'Manager +1 load / tick / level',
    x: 700, y: 700,  deps: ['truckBoost'] },

  { key: 'critBoost',    label: 'C',  cat: 'meta', desc: '+0.5% crit chance / level',
    x: 300, y: 700,  deps: ['workerBoost'] },
];
const TREE_NODE_MAP = Object.fromEntries(TREE_NODES.map(n => [n.key, n]));

/* =======================
   GAME STATE
   ======================= */
const gameState = {
  // Core
  box: 0,
  storage: 10,
  trucks: 1,
  muns: 0,

  // Automation
  workers: 0,
  managerLevel: 0,

  // Manual upgrades
  clickPowerLevel: 0,
  critLevel: 0,

  // Skill
  skillLevel: 0,
  skillActiveUntil: 0,
  skillCooldownUntil: 0,

  // Run stats
  totalBoxes: 0,
  runShipped: 0, // shipped this run (for tokens)

  // Prestige
  tokens: 0,
  tree: {
    workerBoost: 0,
    truckBoost: 0,
    manualBoost: 0,
    critBoost: 0,
    managerBoost: 0
  }
};

// Efficiency rolling arrays
const eff = { produced: [], shipped: [], blocked: [] };

/* =======================
   CONTRACT STATE
   ======================= */
const contractState = {
  active: false,
  quota: 0,
  reward: 0,
  timeLimit: 0,  // seconds
  endTime: 0,    // timestamp
  progress: 0
};

/* =======================
   LOAD SAVE
   ======================= */
try {
  const saved = JSON.parse(localStorage.getItem('save'));
  if (saved && typeof saved === 'object') Object.assign(gameState, saved);
} catch (_) {}

/* =======================
   HELPERS
   ======================= */
const nowMs = () => Date.now();

function pluralize(n, singular, plural = null) {
  return `${n} ${n === 1 ? singular : (plural ?? singular + 's')}`;
}
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function formatDuration(sec) {
  sec = Math.max(0, Math.ceil(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function getTruckCapacity() {
  return BASE_TRUCK_CAPACITY + gameState.tree.truckBoost;
}

function storageCost() {
  return Math.floor(STORAGE_BASE_COST * Math.pow(
    STORAGE_COST_SCALE, Math.floor((gameState.storage - 10) / 10)
  ));
}
function truckCost() {
  const purchased = Math.max(0, gameState.trucks - 1);
  return Math.floor(TRUCK_BASE_COST * Math.pow(TRUCK_COST_SCALE, purchased));
}
function workerCost() {
  return Math.floor(WORKER_BASE_COST * Math.pow(WORKER_COST_SCALE, gameState.workers));
}
function managerCost() {
  return Math.floor(MANAGER_BASE_COST * Math.pow(MANAGER_COST_SCALE, gameState.managerLevel));
}
function clickCost() {
  return Math.floor(CLICK_BASE_COST * Math.pow(CLICK_COST_SCALE, gameState.clickPowerLevel));
}
function critCost() {
  return Math.floor(CRIT_BASE_COST * Math.pow(CRIT_COST_SCALE, gameState.critLevel));
}
function skillCost() {
  return Math.floor(SKILL_BASE_COST * Math.pow(SKILL_COST_SCALE, gameState.skillLevel));
}
function treeCost(node) {
  const base = TREE_BASE_COST[node] || 1;
  const lvl = gameState.tree[node] || 0;
  return base * Math.pow(2, lvl);
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(880, ctx.currentTime);          // A5
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15); // quick rise
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.42);
  } catch (_) { /* ignore if blocked */ }
}

function celebrateContract() {
  // Status line
  if (cStatus) {
    cStatus.textContent = 'Contract Complete!';
    cStatus.classList.add('success');
  }

  // Pulse the Contracts tab
  const tabContracts = document.getElementById('tab-contracts');
  if (tabContracts) {
    tabContracts.classList.add('pulse');
    setTimeout(() => tabContracts.classList.remove('pulse'), 2400);
  }

  // Confetti inside the contract card
  const container = document.getElementById('contract-burst');
  if (container) {
    const COLORS = ['#ff5252', '#ffd740', '#69f0ae', '#40c4ff', '#b388ff', '#ffab91'];
    const pieces = 40;
    for (let i = 0; i < pieces; i++) {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.style.background = COLORS[i % COLORS.length];
      // random start position near top-center
      const startX = 50 + (Math.random() * 20 - 10);    // percent
      const startY = 10 + Math.random() * 10;           // percent
      el.style.left = `${startX}%`;
      el.style.top = `${startY}%`;
      // random end delta
      const dx = (Math.random() * 240 - 120); // px
      const dy = 180 + Math.random() * 140;   // px
      el.style.setProperty('--dx', `${dx}px`);
      el.style.setProperty('--dy', `${dy}px`);
      container.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }
  }

  // Sound
  playChime();
}


// Efficiency arrays
function effAdd(arr, v) { arr.push({ t: nowMs(), v }); }
function effSumLast60(arr) {
  const cutoff = nowMs() - EFF_WINDOW_MS;
  while (arr.length && arr[0].t < cutoff) arr.shift();
  return arr.reduce((s, e) => s + e.v, 0);
}

// Outputs & chances with prestige applied
function effectiveWorkerBatch(workers) {
  const prestige = 1 + (gameState.tree.workerBoost * 0.01);
  return Math.max(1, Math.floor(workers * prestige));
}
function clickPower() {
  return 1 + gameState.clickPowerLevel + gameState.tree.manualBoost;
}
function critChance() {
  const raw = BASE_CRIT_CHANCE + gameState.critLevel * CRIT_PER_LEVEL + gameState.tree.critBoost * PRESTIGE_CRIT_PER_LVL;
  return Math.min(raw, MAX_TOTAL_CRIT);
}
function isSkillActive()   { return nowMs() < gameState.skillActiveUntil; }
function isSkillOnCooldown(){ return nowMs() < gameState.skillCooldownUntil; }
function skillDurationSec() { return SKILL_BASE_DURATION + gameState.skillLevel * SKILL_DURATION_PER_LEVEL; }
function skillRemainingSec(){ return Math.max(0, Math.ceil((gameState.skillActiveUntil - nowMs()) / 1000)); }
function cooldownRemainingSec(){ return Math.max(0, Math.ceil((gameState.skillCooldownUntil - nowMs()) / 1000)); }

// Button visual state helper
function setButtonState(button, affordable) {
  if (!button) return;
  button.classList.remove('affordable', 'unaffordable');
  if (button.disabled) button.classList.add('unaffordable');
  else if (affordable) button.classList.add('affordable');
}

// Toasts
function showToast(text, type, originElement) {
  if (!toastContainer) return;
  const div = document.createElement('div');
  div.className = `toast ${type}`;
  const rect = originElement ? originElement.getBoundingClientRect()
                             : { left: window.innerWidth / 2, top: 0, width: 0 };
  div.style.left = rect.left + rect.width / 2 + 'px';
  div.style.top = rect.top + window.scrollY + 'px';
  div.textContent = text;
  toastContainer.appendChild(div);
  setTimeout(() => div.remove(), 1000);
}

/* =======================
   PRESTIGE TREE RENDERING
   ======================= */
let selectedNodeKey = null;

function prettyNodeName(key) {
  return ({
    workerBoost: 'Stronger Workers',
    truckBoost:  'Bigger Trucks',
    manualBoost: 'Manual Mastery',
    critBoost:   'Lucky Crits',
    managerBoost:'Dispatch Pro'
  })[key] || key;
}

function drawPrestigeTree() {
  if (!treeSvg) return;
  treeSvg.innerHTML = '';

  // edges
  TREE_NODES.forEach(n => {
    n.deps.forEach(parentKey => {
      const p = TREE_NODE_MAP[parentKey];
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', p.x); line.setAttribute('y1', p.y);
      line.setAttribute('x2', n.x); line.setAttribute('y2', n.y);
      line.setAttribute('class', 'edge');
      treeSvg.appendChild(line);
    });
  });

  // nodes
  TREE_NODES.forEach(n => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `node ${n.cat} ${selectedNodeKey===n.key?'selected':''}`);
    g.dataset.key = n.key;

    const r = 56;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', n.x); circle.setAttribute('cy', n.y); circle.setAttribute('r', r);
    g.appendChild(circle);

    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('x', n.x); txt.setAttribute('y', n.y); txt.setAttribute('font-size', '34');
    txt.textContent = n.label;
    g.appendChild(txt);

    const lvl = (gameState.tree[n.key] || 0);
    const lvlTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lvlTxt.setAttribute('x', n.x + r - 6);
    lvlTxt.setAttribute('y', n.y - r + 20);
    lvlTxt.setAttribute('class', 'lvl');
    lvlTxt.textContent = `Lv ${lvl}`;
    g.appendChild(lvlTxt);

    g.addEventListener('click', () => {
      selectedNodeKey = n.key;
      updatePrestigeSide();
      drawPrestigeTree();
    });

    treeSvg.appendChild(g);
  });
}

function updatePrestigeSide() {
  if (!nodeTitle) return;
  if (!selectedNodeKey) {
    nodeTitle.textContent = 'Select a node';
    nodeDesc.textContent = 'Click a circle to see details.';
    nodeLevel.textContent = 'Level: —';
    nodeCostLine.textContent = 'Cost: —';
    if (nodeBuyBtn) nodeBuyBtn.disabled = true;
    return;
  }

  const n = TREE_NODE_MAP[selectedNodeKey];
  const lvl = gameState.tree[selectedNodeKey] || 0;
  const cost = treeCost(selectedNodeKey);
  const depsMet = (n.deps || []).every(key => (gameState.tree[key] || 0) >= 1);

  nodeTitle.textContent = `${n.label} — ${prettyNodeName(selectedNodeKey)}`;
  nodeDesc.textContent = n.desc + (n.deps.length ? ` (Requires: ${n.deps.map(prettyNodeName).join(', ')})` : '');
  nodeLevel.textContent = `Level: ${lvl}`;
  nodeCostLine.textContent = `Cost: ${cost} token${cost===1?'':'s'}`;

  const canAfford = gameState.tokens >= cost;
  if (nodeBuyBtn) {
    nodeBuyBtn.disabled = !(canAfford && depsMet);
    setButtonState(nodeBuyBtn, canAfford && depsMet);
  }
}

/* =======================
   CORE ACTIONS
   ======================= */
function produceBox() {
  let amount = 1 + gameState.clickPowerLevel + gameState.tree.manualBoost;
  if (isSkillActive()) amount *= 2;
  if (Math.random() < critChance()) amount *= CRIT_MULTIPLIER;
  amount = Math.floor(amount);

  const spaceLeft = gameState.storage - gameState.box;
  const applied = Math.max(0, Math.min(amount, spaceLeft));
  const blocked = Math.max(0, amount - applied);

  if (applied > 0) {
    gameState.box += applied;
    gameState.totalBoxes += applied;
    effAdd(eff.produced, applied);
    showToast(`+${applied} Box${applied === 1 ? '' : 'es'}`, 'box', prodButton);
    updateUI();
  }
  if (blocked > 0) effAdd(eff.blocked, blocked);
}

function onBoxesShipped(count) {
  // Normal shipping already adds muns elsewhere; here we only handle contracts.
  if (!contractState.active) return;

  contractState.progress += count;

  if (contractState.progress >= contractState.quota) {
    // Reward
    gameState.muns += contractState.reward;

    // Celebrate (confetti + chime + banner + tab pulse)
    celebrateContract();

    // Optional toast (still fun for consistency)
    showToast(`Contract +${contractState.reward} Muns!`, 'muns', cActiveCard || shipButton);

    // Let celebration play, then clear the contract
    setTimeout(() => {
      if (cStatus) cStatus.classList.remove('success');
      contractState.active = false;
      contractState.progress = 0;
      contractState.quota = 0;
      contractState.reward = 0;
      contractState.timeLimit = 0;
      contractState.endTime = 0;
      updateUI();
    }, 900); // matches confetti duration
  }

  updateUI();
}


function shipStorage() {
  const capacity = getTruckCapacity();
  const fullLoads = Math.floor(gameState.box / capacity);
  if (fullLoads === 0) return;

  const loadsToSend = Math.min(fullLoads, gameState.trucks);
  const boxesToShip = loadsToSend * capacity;

  gameState.box -= boxesToShip;
  gameState.muns += boxesToShip * BOX_VALUE;

  effAdd(eff.shipped, boxesToShip);
  gameState.runShipped += boxesToShip;

  // Contract progress
  onBoxesShipped(boxesToShip);

  showToast(`+${boxesToShip * BOX_VALUE} Muns`, 'muns', shipButton);
  updateUI();
}

function upgrade(type) {
  if (type === 'storage') {
    const cost = storageCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.storage += STORAGE_STEP;
  }
  if (type === 'truck') {
    const cost = truckCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.trucks += 1;
  }
  if (type === 'worker') {
    const cost = workerCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.workers += 1;
  }
  if (type === 'manager') {
    const cost = managerCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.managerLevel += 1;
  }
  if (type === 'click') {
    if (gameState.clickPowerLevel >= MAX_CLICK_POWER_LEVEL) return;
    const cost = clickCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.clickPowerLevel += 1;
  }
  if (type === 'crit') {
    const cost = critCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.critLevel += 1;
  }
  if (type === 'skill') {
    if (gameState.skillLevel >= SKILL_MAX_LEVEL) return;
    const cost = skillCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.skillLevel += 1;
  }
  updateUI();
}

function activateSkill() {
  if (isSkillActive() || isSkillOnCooldown()) return;
  const duration = skillDurationSec() * 1000;
  gameState.skillActiveUntil = nowMs() + duration;
  gameState.skillCooldownUntil = nowMs() + SKILL_COOLDOWN * 1000;
  updateUI();
}

/* =======================
   PRESTIGE / SKILL TREE
   ======================= */
function tokensEarnedThisReset() {
  return Math.floor(gameState.runShipped / 100); // 1 token per 100 shipped boxes
}

function doReset() {
  const tokensEarned = tokensEarnedThisReset();
  if (tokensEarned <= 0) { alert('Ship more boxes first!'); return; }
  gameState.tokens += tokensEarned;

  // Reset run state
  gameState.box = 0; gameState.muns = 0; gameState.storage = 10; gameState.trucks = 1;
  gameState.workers = 0; gameState.managerLevel = 0;
  gameState.totalBoxes = 0; gameState.runShipped = 0;

  // Contracts are cancelled on reset
  contractState.active = false;
  contractState.progress = 0; contractState.quota = 0; contractState.reward = 0; contractState.endTime = 0;

  eff.produced = []; eff.shipped = []; eff.blocked = [];
  updateUI();
}

function buyNode(nodeKey) {
  const cost = treeCost(nodeKey);
  if (gameState.tokens < cost) return;
  // Dependency check
  const n = TREE_NODE_MAP[nodeKey];
  const depsMet = (n.deps || []).every(k => (gameState.tree[k] || 0) >= 1);
  if (!depsMet) return;

  gameState.tokens -= cost;
  gameState.tree[nodeKey] += 1;
  updatePrestigeSide();
  drawPrestigeTree();
  updateUI();
}

/* =======================
   CONTRACTS
   ======================= */
function startRandomContract() {
  if (contractState.active) return;
  const quota = randomInt(50, 200);
  const timeLimit = randomInt(30, 120);      // seconds
  const reward = quota * 2;                   // simple baseline: 2× better than raw selling

  contractState.active = true;
  contractState.quota = quota;
  contractState.timeLimit = timeLimit;
  contractState.reward = reward;
  contractState.progress = 0;
  contractState.endTime = nowMs() + timeLimit * 1000;

  cStatus.textContent = '';
  updateUI();
}

function abandonContract() {
  if (!contractState.active) return;
  contractState.active = false;
  contractState.progress = 0;
  contractState.quota = 0;
  contractState.reward = 0;
  contractState.timeLimit = 0;
  contractState.endTime = 0;
  cStatus.textContent = 'Abandoned';
  updateUI();
}

/* =======================
   AUTOMATION & TIMERS
   ======================= */
// Workers
setInterval(() => {
  if (gameState.workers > 0) {
    const producedRaw = effectiveWorkerBatch(gameState.workers);
    const spaceLeft = gameState.storage - gameState.box;
    const applied = Math.max(0, Math.min(producedRaw, spaceLeft));
    const blocked = Math.max(0, producedRaw - applied);

    if (applied > 0) {
      gameState.box += applied;
      gameState.totalBoxes += applied;
      effAdd(eff.produced, applied);
      updateUI();
    }
    if (blocked > 0) effAdd(eff.blocked, blocked);
  }
}, WORKER_INTERVAL);

// Shipping Manager
setInterval(() => {
  if (gameState.managerLevel <= 0) return;
  const capacity = getTruckCapacity();
  const fullLoads = Math.floor(gameState.box / capacity);
  if (fullLoads <= 0) return;

  const managerPower = gameState.managerLevel + gameState.tree.managerBoost;
  const loadsToSend = Math.min(fullLoads, gameState.trucks, managerPower);
  if (loadsToSend <= 0) return;

  const boxesToShip = loadsToSend * capacity;
  gameState.box -= boxesToShip;
  gameState.muns += boxesToShip * BOX_VALUE;

  effAdd(eff.shipped, boxesToShip);
  gameState.runShipped += boxesToShip;

  onBoxesShipped(boxesToShip); // contract progress

  showToast(`+${boxesToShip * BOX_VALUE} Muns (Auto)`, 'muns', shipButton);
  updateUI();
}, MANAGER_INTERVAL);

// Skill/cooldown + efficiency + tokens estimate + contracts timer
setInterval(() => {
  // Skill UI
  if (isSkillActive()) {
    if (skillTimerTxt) skillTimerTxt.textContent = `Priority Pick: ${skillRemainingSec()}s`;
    if (skillBtn) skillBtn.disabled = true;
  } else if (isSkillOnCooldown()) {
    if (skillTimerTxt) skillTimerTxt.textContent = `Cooldown: ${cooldownRemainingSec()}s`;
    if (skillBtn) skillBtn.disabled = true;
  } else {
    if (skillTimerTxt) skillTimerTxt.textContent = `Ready`;
    if (skillBtn) skillBtn.disabled = false;
  }

  // Efficiency (last 60s)
  const produced60 = effSumLast60(eff.produced);
  const shipped60  = effSumLast60(eff.shipped);
  const blocked60  = effSumLast60(eff.blocked);

  const flow = produced60 > 0 ? Math.min(1, shipped60 / produced60) : 1;
  const attempts = produced60 + blocked60;
  const discipline = attempts > 0 ? (1 - blocked60 / attempts) : 1;
  const score = Math.round(60 * flow + 40 * discipline);

  if (effScoreTxt) effScoreTxt.textContent = String(score);
  if (effProdTxt)  effProdTxt.textContent = String(produced60);
  if (effShipTxt)  effShipTxt.textContent = String(shipped60);
  if (effBlockTxt) effBlockTxt.textContent = String(blocked60);

  // Tokens estimate
  if (nextTokensTxt) nextTokensTxt.textContent = String(tokensEarnedThisReset());

  // Contracts timer
  if (contractState.active) {
    const remain = (contractState.endTime - nowMs()) / 1000;
    if (remain <= 0) {
      const success = contractState.progress >= contractState.quota;
      if (!success) cStatus.textContent = 'Failed';
      // (if success, it would have completed in onBoxesShipped)
      contractState.active = false;
      contractState.progress = 0;
      contractState.quota = 0;
      contractState.reward = 0;
      contractState.timeLimit = 0;
      contractState.endTime = 0;
      updateUI();
    } else {
      if (cTimer) cTimer.textContent = formatDuration(remain);
    }
  }
}, 250);

/* =======================
   UI UPDATE
   ======================= */
function updateUI() {
  // Top stats
  if (boxText)    boxText.innerText = pluralize(gameState.box, 'Box');
  if (munsText)   munsText.innerText = pluralize(gameState.muns, 'Mun', 'Muns');
  if (storageText) storageText.innerText = String(gameState.storage);
  if (trucksText)  trucksText.innerText = String(gameState.trucks);
  if (capText)     capText.innerText = String(getTruckCapacity());
  if (totalText)   totalText.innerText = pluralize(gameState.totalBoxes, 'Total Box', 'Total Boxes');

  // Costs
  if (storageCostTxt) storageCostTxt.innerText = storageCost();
  if (trucksCostTxt)  trucksCostTxt.innerText = truckCost();
  if (workerCostTxt)  workerCostTxt.innerText = workerCost();
  if (managerCostTxt) managerCostTxt.innerText = managerCost();
  if (clickCostTxt)   clickCostTxt.innerText = (gameState.clickPowerLevel >= MAX_CLICK_POWER_LEVEL) ? 'MAX' : clickCost();
  if (critCostTxt)    critCostTxt.innerText = critCost();
  if (skillCostTxt)   skillCostTxt.innerText = (gameState.skillLevel >= SKILL_MAX_LEVEL) ? 'MAX' : skillCost();

  // Counts / levels / notes
  if (workerCountTxt) workerCountTxt.innerText = pluralize(gameState.workers, 'Worker');
  if (workerNoteTxt) {
    const perTick = effectiveWorkerBatch(gameState.workers);
    const secs = 2;
    workerNoteTxt.innerText = `Lv ${gameState.workers} (Auto: ${perTick} box${perTick === 1 ? '' : 'es'} / ${secs}s)`;
  }
  if (managerLevelTxt) {
    const power = gameState.managerLevel + gameState.tree.managerBoost;
    managerLevelTxt.innerText = `Lv ${gameState.managerLevel} (Auto: ${power} load${power===1?'':'s'} / ${MANAGER_INTERVAL/1000}s)`;
  }
  if (clickLevelTxt)  clickLevelTxt.innerText = `Lv ${gameState.clickPowerLevel} (Power: ${1 + gameState.clickPowerLevel + gameState.tree.manualBoost})`;
  if (critChanceTxt)  critChanceTxt.innerText = `${Math.round(critChance() * 100)}% crit`;
  if (skillDurationTxt) skillDurationTxt.innerText = `${skillDurationSec()}s duration, ${SKILL_COOLDOWN}s CD`;

  // Buttons enabled + state colors
  const canAffordStorage = gameState.muns >= storageCost();
  const canAffordTruck = gameState.muns >= truckCost();
  const canAffordWorker = gameState.muns >= workerCost();
  const canAffordManager = gameState.muns >= managerCost();
  const canAffordClick = (gameState.clickPowerLevel < MAX_CLICK_POWER_LEVEL) && gameState.muns >= clickCost();
  const canAffordCrit = gameState.muns >= critCost();
  const canAffordSkill = (gameState.skillLevel < SKILL_MAX_LEVEL) && gameState.muns >= skillCost();

  if (storageUpgradeBtn) storageUpgradeBtn.disabled = !canAffordStorage;
  if (trucksUpgradeBtn)  trucksUpgradeBtn.disabled = !canAffordTruck;
  if (workerUpgradeBtn)  workerUpgradeBtn.disabled = !canAffordWorker;
  if (managerUpgradeBtn) managerUpgradeBtn.disabled = !canAffordManager;
  if (clickUpgradeBtn)   clickUpgradeBtn.disabled = !canAffordClick || gameState.clickPowerLevel >= MAX_CLICK_POWER_LEVEL;
  if (critUpgradeBtn)    critUpgradeBtn.disabled = !canAffordCrit;
  if (skillUpgradeBtn)   skillUpgradeBtn.disabled = !canAffordSkill || gameState.skillLevel >= SKILL_MAX_LEVEL;

  setButtonState(storageUpgradeBtn, canAffordStorage);
  setButtonState(trucksUpgradeBtn, canAffordTruck);
  setButtonState(workerUpgradeBtn, canAffordWorker);
  setButtonState(managerUpgradeBtn, canAffordManager);
  setButtonState(clickUpgradeBtn, canAffordClick && gameState.clickPowerLevel < MAX_CLICK_POWER_LEVEL);
  setButtonState(critUpgradeBtn, canAffordCrit);
  setButtonState(skillUpgradeBtn, canAffordSkill && gameState.skillLevel < SKILL_MAX_LEVEL);

  // Shipping enablement
  const canShip = Math.floor(gameState.box / getTruckCapacity()) >= 1;
  if (shipButton) shipButton.disabled = !canShip;

  // Tokens & prestige side
  if (tokensTxt) tokensTxt.textContent = String(gameState.tokens);
  updatePrestigeSide();

  // Contracts UI
  if (contractState.active) {
    cActiveCard.classList.remove('hidden');
    cAbandonBtn.classList.remove('hidden');
    cGenerateBtn.disabled = true;

    const remain = Math.max(0, Math.ceil((contractState.endTime - nowMs()) / 1000));
    if (cTimer) cTimer.textContent = formatDuration(remain);

    const pct = Math.max(0, Math.min(100, (contractState.progress / contractState.quota) * 100));
    if (cProgressBar) cProgressBar.style.width = pct + '%';
    if (cProgressText) cProgressText.textContent = `${contractState.progress} / ${contractState.quota}`;

    cDesc.textContent = `Deliver ${contractState.quota} boxes in ${formatDuration(contractState.timeLimit)} for ${contractState.reward} Muns.`;
  } else {
    cActiveCard.classList.add('hidden');
    cAbandonBtn.classList.add('hidden');
    cGenerateBtn.disabled = false;
    if (cProgressBar) cProgressBar.style.width = '0%';
    if (cProgressText) cProgressText.textContent = `0 / 0`;
  }
}

/* =======================
   EVENTS
   ======================= */
if (prodButton)  prodButton.addEventListener('click', produceBox);
if (shipButton)  shipButton.addEventListener('click', shipStorage);

if (storageUpgradeBtn) storageUpgradeBtn.addEventListener('click', () => upgrade('storage'));
if (trucksUpgradeBtn)  trucksUpgradeBtn.addEventListener('click', () => upgrade('truck'));
if (workerUpgradeBtn)  workerUpgradeBtn.addEventListener('click', () => upgrade('worker'));
if (managerUpgradeBtn) managerUpgradeBtn.addEventListener('click', () => upgrade('manager'));
if (clickUpgradeBtn)   clickUpgradeBtn.addEventListener('click', () => upgrade('click'));
if (critUpgradeBtn)    critUpgradeBtn.addEventListener('click', () => upgrade('crit'));
if (skillUpgradeBtn)   skillUpgradeBtn.addEventListener('click', () => upgrade('skill'));
if (skillBtn)          skillBtn.addEventListener('click', () => activateSkill());

if (resetBtn)          resetBtn.addEventListener('click', () => doReset());

// Prestige tree buy button
if (nodeBuyBtn) nodeBuyBtn.addEventListener('click', () => {
  if (!selectedNodeKey) return;
  buyNode(selectedNodeKey);
});

// Contracts
if (cGenerateBtn) cGenerateBtn.addEventListener('click', startRandomContract);
if (cAbandonBtn)  cAbandonBtn.addEventListener('click', abandonContract);

/* =======================
   AUTOSAVE
   ======================= */
setInterval(() => {
  localStorage.setItem('save', JSON.stringify(gameState));
}, 1500);

window.addEventListener('beforeunload', () => {
  localStorage.setItem('save', JSON.stringify(gameState));
});

/* =======================
   INITIAL RENDER
   ======================= */
drawPrestigeTree();
updatePrestigeSide();
updateUI();
