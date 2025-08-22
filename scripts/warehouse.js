'use strict';

/* =======================
   TAB TOGGLING
   ======================= */
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab-button');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      // activate tab button
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // show target screen, hide others
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

// Prestige / Tokens UI
const resetBtn = document.getElementById('reset-btn');
const tokensTxt = document.getElementById('tokens-txt');
const nextTokensTxt = document.getElementById('next-tokens-txt');

const nodeWorkerBtn = document.getElementById('node-worker');
const nodeWorkerCostTxt = document.getElementById('node-worker-cost');
const nodeWorkerLevelTxt = document.getElementById('node-worker-level');

const nodeTruckBtn = document.getElementById('node-truck');
const nodeTruckCostTxt = document.getElementById('node-truck-cost');
const nodeTruckLevelTxt = document.getElementById('node-truck-level');

const nodeManualBtn = document.getElementById('node-manual');
const nodeManualCostTxt = document.getElementById('node-manual-cost');
const nodeManualLevelTxt = document.getElementById('node-manual-level');

const nodeCritBtn = document.getElementById('node-crit');
const nodeCritCostTxt = document.getElementById('node-crit-cost');
const nodeCritLevelTxt = document.getElementById('node-crit-level');

const nodeManagerBtn = document.getElementById('node-manager');
const nodeManagerCostTxt = document.getElementById('node-manager-cost');
const nodeManagerLevelTxt = document.getElementById('node-manager-level');

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
const BASE_CRIT_CHANCE = 0.05;     // 5%
const CRIT_PER_LEVEL = 0.01;       // +1% per level
const PRESTIGE_CRIT_PER_LVL = 0.005; // +0.5% per prestige level
const CRIT_MULTIPLIER = 10;
const MAX_TOTAL_CRIT = 0.25;       // hard cap 25%

const SKILL_BASE_COST = 150;
const SKILL_COST_SCALE = 1.5;
const SKILL_BASE_DURATION = 10;    // seconds
const SKILL_DURATION_PER_LEVEL = 2;
const SKILL_MAX_LEVEL = 5;
const SKILL_COOLDOWN = 60;         // seconds

const EFF_WINDOW_MS = 60000;       // 60s

// Prestige base costs (exponential: cost = base * 2^level)
const TREE_BASE_COST = {
  workerBoost: 1,
  truckBoost: 2,
  manualBoost: 1,
  critBoost: 3,
  managerBoost: 4
};

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
    workerBoost: 0, // +1% per level
    truckBoost: 0,  // +1 capacity per truck per level
    manualBoost: 0, // +1 click power per level
    critBoost: 0,   // +0.5% crit per level
    managerBoost: 0 // +1 load per manager tick per level
  }
};

// Efficiency rolling arrays
const eff = {
  produced: [],
  shipped: [],
  blocked: []
};

/* =======================
   LOAD SAVE
   ======================= */
try {
  const saved = JSON.parse(localStorage.getItem('save'));
  if (saved && typeof saved === 'object') {
    Object.assign(gameState, saved);
  }
} catch (_) {
  // ignore corrupted saves
}

/* =======================
   HELPERS
   ======================= */
const nowMs = () => Date.now();

function pluralize(n, singular, plural = null) {
  return `${n} ${n === 1 ? singular : (plural ?? singular + 's')}`;
}

function getTruckCapacity() {
  return BASE_TRUCK_CAPACITY + gameState.tree.truckBoost;
}

function storageCost() {
  return Math.floor(STORAGE_BASE_COST * Math.pow(STORAGE_COST_SCALE, Math.floor((gameState.storage - 10) / 10)));
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
  const raw =
    BASE_CRIT_CHANCE +
    gameState.critLevel * CRIT_PER_LEVEL +
    gameState.tree.critBoost * 0.005;
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
  if (button.disabled) {
    button.classList.add('unaffordable');
  } else if (affordable) {
    button.classList.add('affordable');
  }
}

// Toasts
function showToast(text, type, originElement) {
  if (!toastContainer) return;
  const div = document.createElement('div');
  div.className = `toast ${type}`;
  const rect = originElement ? originElement.getBoundingClientRect() : { left: window.innerWidth / 2, top: 0, width: 0 };
  div.style.left = rect.left + rect.width / 2 + 'px';
  div.style.top = rect.top + window.scrollY + 'px';
  div.textContent = text;
  toastContainer.appendChild(div);
  setTimeout(() => div.remove(), 1000);
}

/* =======================
   CORE ACTIONS
   ======================= */
function produceBox() {
  let amount = clickPower();
  if (isSkillActive()) amount *= 2;
  if (Math.random() < critChance()) amount *= 10;
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

  showToast(`+${boxesToShip * BOX_VALUE} Muns`, 'muns', shipButton);
  updateUI();
}

function upgrade(type) {
  if (type === 'storage') {
    const cost = storageCost();
    if (gameState.muns < cost) return;
    gameState.muns -= cost;
    gameState.storage += STORAGE_STEP;
  }

  if (type === 'truck') {
    const cost = truckCost();
    if (gameState.muns < cost) return;
    gameState.muns -= cost;
    gameState.trucks += 1;
  }

  if (type === 'worker') {
    const cost = workerCost();
    if (gameState.muns < cost) return;
    gameState.muns -= cost;
    gameState.workers += 1;
  }

  if (type === 'manager') {
    const cost = managerCost();
    if (gameState.muns < cost) return;
    gameState.muns -= cost;
    gameState.managerLevel += 1;
  }

  if (type === 'click') {
    if (gameState.clickPowerLevel >= MAX_CLICK_POWER_LEVEL) return;
    const cost = clickCost();
    if (gameState.muns < cost) return;
    gameState.muns -= cost;
    gameState.clickPowerLevel += 1;
  }

  if (type === 'crit') {
    const cost = critCost();
    if (gameState.muns < cost) return;
    gameState.muns -= cost;
    gameState.critLevel += 1;
  }

  if (type === 'skill') {
    if (gameState.skillLevel >= SKILL_MAX_LEVEL) return;
    const cost = skillCost();
    if (gameState.muns < cost) return;
    gameState.muns -= cost;
    gameState.skillLevel += 1;
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
  // 1 Token per 100 boxes shipped this run
  return Math.floor(gameState.runShipped / 100);
}

function doReset() {
  const tokensEarned = tokensEarnedThisReset();
  if (tokensEarned <= 0) {
    alert('Ship more boxes first! You earn 1 Token per 100 boxes shipped.');
    return;
  }

  gameState.tokens += tokensEarned;

  // Reset run state
  gameState.box = 0;
  gameState.muns = 0;
  gameState.storage = 10;
  gameState.trucks = 1;
  gameState.workers = 0;
  gameState.managerLevel = 0;
  gameState.totalBoxes = 0;
  gameState.runShipped = 0;

  // Clear rolling efficiency windows
  eff.produced = [];
  eff.shipped = [];
  eff.blocked = [];

  updateUI();
}

function buyNode(nodeKey) {
  const cost = treeCost(nodeKey);
  if (gameState.tokens < cost) return;
  gameState.tokens -= cost;
  gameState.tree[nodeKey] += 1;
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

  // Manager power is base level + prestige managerBoost
  const managerPower = gameState.managerLevel + gameState.tree.managerBoost;
  const loadsToSend = Math.min(fullLoads, gameState.trucks, managerPower);
  if (loadsToSend <= 0) return;

  const boxesToShip = loadsToSend * capacity;
  gameState.box -= boxesToShip;
  gameState.muns += boxesToShip * BOX_VALUE;

  effAdd(eff.shipped, boxesToShip);
  gameState.runShipped += boxesToShip;

  showToast(`+${boxesToShip * BOX_VALUE} Muns (Auto)`, 'muns', shipButton);
  updateUI();
}, MANAGER_INTERVAL);

// Skill/cooldown + efficiency + tokens estimate updater
setInterval(() => {
  // Skill
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
  if (totalText) totalText.innerText = pluralize(gameState.totalBoxes, 'Total Box', 'Total Boxes');

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
    const secs = WORKER_INTERVAL / 1000;
    workerNoteTxt.innerText = `Lv ${gameState.workers} (Auto: ${perTick} box${perTick === 1 ? '' : 'es'} / ${secs}s)`;
  }
  if (managerLevelTxt) {
    const power = gameState.managerLevel + gameState.tree.managerBoost;
    managerLevelTxt.innerText = `Lv ${gameState.managerLevel} (Auto: ${power} load${power===1?'':'s'} / ${MANAGER_INTERVAL/1000}s)`;
  }
  if (clickLevelTxt)  clickLevelTxt.innerText = `Lv ${gameState.clickPowerLevel} (Power: ${clickPower()})`;
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

  // Tokens & node UI
  if (tokensTxt) tokensTxt.textContent = String(gameState.tokens);

  // Node levels
  if (nodeWorkerLevelTxt) nodeWorkerLevelTxt.textContent = `Lv ${gameState.tree.workerBoost}`;
  if (nodeTruckLevelTxt)  nodeTruckLevelTxt.textContent  = `Lv ${gameState.tree.truckBoost}`;
  if (nodeManualLevelTxt) nodeManualLevelTxt.textContent = `Lv ${gameState.tree.manualBoost}`;
  if (nodeCritLevelTxt)   nodeCritLevelTxt.textContent   = `Lv ${gameState.tree.critBoost}`;
  if (nodeManagerLevelTxt)nodeManagerLevelTxt.textContent= `Lv ${gameState.tree.managerBoost}`;

  // Node costs
  const cWorker  = treeCost('workerBoost');
  const cTruck   = treeCost('truckBoost');
  const cManual  = treeCost('manualBoost');
  const cCrit    = treeCost('critBoost');
  const cManager = treeCost('managerBoost');

  if (nodeWorkerCostTxt)  nodeWorkerCostTxt.textContent  = String(cWorker);
  if (nodeTruckCostTxt)   nodeTruckCostTxt.textContent   = String(cTruck);
  if (nodeManualCostTxt)  nodeManualCostTxt.textContent  = String(cManual);
  if (nodeCritCostTxt)    nodeCritCostTxt.textContent    = String(cCrit);
  if (nodeManagerCostTxt) nodeManagerCostTxt.textContent = String(cManager);

  // Node button states
  if (nodeWorkerBtn)  { nodeWorkerBtn.disabled  = gameState.tokens < cWorker;  setButtonState(nodeWorkerBtn,  gameState.tokens >= cWorker); }
  if (nodeTruckBtn)   { nodeTruckBtn.disabled   = gameState.tokens < cTruck;   setButtonState(nodeTruckBtn,   gameState.tokens >= cTruck); }
  if (nodeManualBtn)  { nodeManualBtn.disabled  = gameState.tokens < cManual;  setButtonState(nodeManualBtn,  gameState.tokens >= cManual); }
  if (nodeCritBtn)    { nodeCritBtn.disabled    = gameState.tokens < cCrit;    setButtonState(nodeCritBtn,    gameState.tokens >= cCrit); }
  if (nodeManagerBtn) { nodeManagerBtn.disabled = gameState.tokens < cManager; setButtonState(nodeManagerBtn, gameState.tokens >= cManager); }
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

// Skill tree buttons
if (nodeWorkerBtn)  nodeWorkerBtn.addEventListener('click', () => buyNode('workerBoost'));
if (nodeTruckBtn)   nodeTruckBtn.addEventListener('click', () => buyNode('truckBoost'));
if (nodeManualBtn)  nodeManualBtn.addEventListener('click', () => buyNode('manualBoost'));
if (nodeCritBtn)    nodeCritBtn.addEventListener('click', () => buyNode('critBoost'));
if (nodeManagerBtn) nodeManagerBtn.addEventListener('click', () => buyNode('managerBoost'));

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
updateUI();
