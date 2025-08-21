'use strict';

/* =======================
   DOM ELEMENTS
   ======================= */
const boxText = document.getElementById('box-txt');
const munsText = document.getElementById('muns-txt');
const storageText = document.getElementById('storage-txt');
const trucksText = document.getElementById('trucks-txt');
const totalText = document.getElementById('total-txt');
const bonusTxt = document.getElementById('bonus-txt');

const prodButton = document.getElementById('production-btn');
const shipButton = document.getElementById('shipping-btn');
const resetBtn = document.getElementById('reset-btn');

const storageUpgradeBtn = document.getElementById('storage-upgrade');
const trucksUpgradeBtn = document.getElementById('trucks-upgrade');
const storageCostTxt = document.getElementById('storage-cost');
const trucksCostTxt = document.getElementById('trucks-cost');

// Worker UI
const workerUpgradeBtn = document.getElementById('worker-upgrade');
const workerCostTxt = document.getElementById('worker-cost');
const workerCountTxt = document.getElementById('worker-count');

// Manual Click Upgrades
const clickUpgradeBtn = document.getElementById('click-upgrade');  // "Stronger Arms"
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

// Toasts
const toastContainer = document.getElementById('toast-container');

/* =======================
   CONSTANTS
   ======================= */
const CAPACITY_PER_TRUCK = 5;    // each truck ships 5 boxes
const STORAGE_STEP = 10;         // each storage upgrade adds +10 capacity
const BOX_VALUE = 1;             // each shipped box gives 1 Mun

// Upgrade pricing (scaling)
const STORAGE_BASE_COST = 50;
const STORAGE_COST_SCALE = 1.15;

const TRUCK_BASE_COST = 100;
const TRUCK_COST_SCALE = 1.20;

// Worker automation
const WORKER_BASE_COST = 50;
const WORKER_COST_SCALE = 1.20;
const WORKER_INTERVAL = 2000; // every 2 seconds

// Click Power
const CLICK_BASE_COST = 30;
const CLICK_COST_SCALE = 1.35;
const MAX_CLICK_POWER_LEVEL = 10; // soft cap for MVP

// Crit
const CRIT_BASE_COST = 100;
const CRIT_COST_SCALE = 1.5;
const BASE_CRIT_CHANCE = 0.05;     // 5%
const CRIT_PER_LEVEL = 0.01;       // +1% per level
const MAX_CRIT_LEVEL = 10;         // 5% + 10% = 15% total
const CRIT_MULTIPLIER = 10;

// Priority Pick Skill
const SKILL_BASE_COST = 150;
const SKILL_COST_SCALE = 1.5;
const SKILL_BASE_DURATION = 10;      // seconds
const SKILL_DURATION_PER_LEVEL = 2;  // +2s per level
const SKILL_MAX_LEVEL = 5;
const SKILL_COOLDOWN = 60;           // seconds

/* =======================
   GAME STATE
   ======================= */
const gameState = {
  box: 0,               // current boxes in storage
  storage: 10,          // storage capacity
  trucks: 1,            // number of trucks
  muns: 0,              // currency
  storageUpgrades: 0,   // how many storage upgrades bought

  // Automation
  workers: 0,           // number of workers (automation)

  // Manual upgrades
  clickPowerLevel: 0,   // each level = +1 box per click (base is 1)
  critLevel: 0,         // each level = +1% crit chance

  // Skill
  skillLevel: 0,             // extends duration
  skillActiveUntil: 0,       // ms timestamp when active ends
  skillCooldownUntil: 0,     // ms timestamp when cooldown ends

  // Meta
  totalBoxes: 0,        // cumulative boxes produced this run
  efficiencyBonus: 0,   // % applied to workers
  lifetimeResets: 0     // (optional)
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
function pluralize(n, singular, plural = null) {
  return `${n} ${n === 1 ? singular : (plural ?? singular + 's')}`;
}

function storageCost() {
  return Math.floor(STORAGE_BASE_COST * Math.pow(STORAGE_COST_SCALE, gameState.storageUpgrades));
}

function truckCost() {
  const purchased = Math.max(0, gameState.trucks - 1);
  return Math.floor(TRUCK_BASE_COST * Math.pow(TRUCK_COST_SCALE, purchased));
}

function workerCost() {
  return Math.floor(WORKER_BASE_COST * Math.pow(WORKER_COST_SCALE, gameState.workers));
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

function eligibleBonusFromRun() {
  // 1% per 100 total boxes (this run)
  return Math.floor(gameState.totalBoxes / 100);
}

// Worker output applies efficiency bonus
function effectiveWorkerBatch(workers) {
  const bonusFactor = 1 + (gameState.efficiencyBonus / 100);
  return Math.max(1, Math.floor(workers * bonusFactor));
}

// Manual click power
function clickPower() {
  return 1 + gameState.clickPowerLevel;
}

// Crit chance
function critChance() {
  const raw = BASE_CRIT_CHANCE + gameState.critLevel * CRIT_PER_LEVEL;
  return Math.min(raw, BASE_CRIT_CHANCE + MAX_CRIT_LEVEL * CRIT_PER_LEVEL);
}

// Skill helpers
function nowMs() { return Date.now(); }
function skillDurationSec() {
  return SKILL_BASE_DURATION + gameState.skillLevel * SKILL_DURATION_PER_LEVEL;
}
function isSkillActive() {
  return nowMs() < gameState.skillActiveUntil;
}
function isSkillOnCooldown() {
  return nowMs() < gameState.skillCooldownUntil;
}
function skillRemainingSec() {
  return Math.max(0, Math.ceil((gameState.skillActiveUntil - nowMs()) / 1000));
}
function cooldownRemainingSec() {
  return Math.max(0, Math.ceil((gameState.skillCooldownUntil - nowMs()) / 1000));
}

// Visual state for upgrade buttons
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
  if (gameState.box >= gameState.storage) return;

  // Base amount from click power
  let amount = clickPower();

  // Skill multiplier
  if (isSkillActive()) amount *= 2;

  // Crit roll
  if (Math.random() < critChance()) {
    amount *= CRIT_MULTIPLIER;
  }

  // Respect storage cap
  amount = Math.floor(amount);
  const spaceLeft = gameState.storage - gameState.box;
  const applied = Math.min(amount, spaceLeft);

  if (applied <= 0) return;

  gameState.box += applied;
  gameState.totalBoxes += applied;

  showToast(`+${applied} Box${applied === 1 ? '' : 'es'}`, 'box', prodButton);
  updateUI();
}

function shipStorage() {
  // Only ship full truckloads, up to the number of trucks you own
  const fullLoads = Math.floor(gameState.box / CAPACITY_PER_TRUCK);
  if (fullLoads === 0) return;

  const loadsToSend = Math.min(fullLoads, gameState.trucks);
  const boxesToShip = loadsToSend * CAPACITY_PER_TRUCK;

  gameState.box -= boxesToShip;
  gameState.muns += boxesToShip * BOX_VALUE;

  showToast(`+${boxesToShip * BOX_VALUE} Muns`, 'muns', shipButton);
  updateUI();
}

function upgrade(type) {
  if (type === 'storage') {
    const cost = storageCost();
    if (gameState.muns < cost) return;
    gameState.muns -= cost;
    gameState.storage += STORAGE_STEP;
    gameState.storageUpgrades += 1;
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

  if (type === 'click') {
    if (gameState.clickPowerLevel >= MAX_CLICK_POWER_LEVEL) return;
    const cost = clickCost();
    if (gameState.muns < cost) return;
    gameState.muns -= cost;
    gameState.clickPowerLevel += 1;
  }

  if (type === 'crit') {
    if (gameState.critLevel >= MAX_CRIT_LEVEL) return;
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

function doReset() {
  const gained = eligibleBonusFromRun();
  if (gained <= 0) {
    alert('Ship more boxes first! You gain +1% per 100 total boxes.');
    return;
  }

  // Apply & persist bonus
  gameState.efficiencyBonus += gained;
  gameState.lifetimeResets = (gameState.lifetimeResets || 0) + 1;

  // Hard reset run state
  gameState.box = 0;
  gameState.muns = 0;
  gameState.storage = 10;
  gameState.trucks = 1;
  gameState.storageUpgrades = 0;
  gameState.workers = 0;
  gameState.totalBoxes = 0;

  // Keep manual/crit/skill purchases across resets for MVP
  // (If you want true prestige, reset those here.)

  updateUI();
}

/* =======================
   AUTOMATION & TIMERS
   ======================= */
setInterval(() => {
  // Workers produce boxes every tick, respecting storage cap
  if (gameState.workers > 0 && gameState.box < gameState.storage) {
    const spaceLeft = gameState.storage - gameState.box;
    const producedRaw = effectiveWorkerBatch(gameState.workers);
    const produced = Math.min(producedRaw, spaceLeft);
    gameState.box += produced;
    gameState.totalBoxes += produced;
    updateUI();
  }
}, WORKER_INTERVAL);

// Skill/cooldown display updater
setInterval(() => {
  if (!skillTimerTxt && !skillBtn) return;

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
}, 250);

/* =======================
   UI UPDATE
   ======================= */
function updateUI() {
  // Top stats
  if (boxText)   boxText.innerText = pluralize(gameState.box, 'Box');
  if (munsText)  munsText.innerText = pluralize(gameState.muns, 'Mun', 'Muns');
  if (storageText) storageText.innerText = String(gameState.storage);
  if (trucksText)  trucksText.innerText = String(gameState.trucks);
  if (totalText) totalText.innerText = pluralize(gameState.totalBoxes, 'Total Box', 'Total Boxes');
  if (bonusTxt)  bonusTxt.innerText = `Efficiency Bonus: ${gameState.efficiencyBonus}%`;

  // Costs
  if (storageCostTxt) storageCostTxt.innerText = storageCost();
  if (trucksCostTxt)  trucksCostTxt.innerText = truckCost();
  if (workerCostTxt)  workerCostTxt.innerText = workerCost();
  if (clickCostTxt)   clickCostTxt.innerText = (gameState.clickPowerLevel >= MAX_CLICK_POWER_LEVEL) ? 'MAX' : clickCost();
  if (critCostTxt)    critCostTxt.innerText = (gameState.critLevel >= MAX_CRIT_LEVEL) ? 'MAX' : critCost();
  if (skillCostTxt)   skillCostTxt.innerText = (gameState.skillLevel >= SKILL_MAX_LEVEL) ? 'MAX' : skillCost();

  // Counts / levels
  if (workerCountTxt) workerCountTxt.innerText = pluralize(gameState.workers, 'Worker');
  if (clickLevelTxt)  clickLevelTxt.innerText = `Lv ${gameState.clickPowerLevel} (Power: ${1 + gameState.clickPowerLevel})`;
  if (critChanceTxt)  critChanceTxt.innerText = `${Math.round(critChance() * 100)}% crit`;
  if (skillDurationTxt) skillDurationTxt.innerText = `${skillDurationSec()}s duration, ${SKILL_COOLDOWN}s CD`;

  // Button states (disabled + CSS states)
  const canAffordStorage = gameState.muns >= storageCost();
  const canAffordTruck = gameState.muns >= truckCost();
  const canAffordWorker = gameState.muns >= workerCost();
  const canAffordClick = (gameState.clickPowerLevel < MAX_CLICK_POWER_LEVEL) && gameState.muns >= clickCost();
  const canAffordCrit = (gameState.critLevel < MAX_CRIT_LEVEL) && gameState.muns >= critCost();
  const canAffordSkill = (gameState.skillLevel < SKILL_MAX_LEVEL) && gameState.muns >= skillCost();

  if (storageUpgradeBtn) storageUpgradeBtn.disabled = !canAffordStorage;
  if (trucksUpgradeBtn)  trucksUpgradeBtn.disabled = !canAffordTruck;
  if (workerUpgradeBtn)  workerUpgradeBtn.disabled = !canAffordWorker;
  if (clickUpgradeBtn)   clickUpgradeBtn.disabled = !canAffordClick || gameState.clickPowerLevel >= MAX_CLICK_POWER_LEVEL;
  if (critUpgradeBtn)    critUpgradeBtn.disabled = !canAffordCrit || gameState.critLevel >= MAX_CRIT_LEVEL;
  if (skillUpgradeBtn)   skillUpgradeBtn.disabled = !canAffordSkill || gameState.skillLevel >= SKILL_MAX_LEVEL;

  setButtonState(storageUpgradeBtn, canAffordStorage);
  setButtonState(trucksUpgradeBtn, canAffordTruck);
  setButtonState(workerUpgradeBtn, canAffordWorker);
  setButtonState(clickUpgradeBtn, canAffordClick && gameState.clickPowerLevel < MAX_CLICK_POWER_LEVEL);
  setButtonState(critUpgradeBtn, canAffordCrit && gameState.critLevel < MAX_CRIT_LEVEL);
  setButtonState(skillUpgradeBtn, canAffordSkill && gameState.skillLevel < SKILL_MAX_LEVEL);

  // Shipping enablement
  const canShip = Math.floor(gameState.box / CAPACITY_PER_TRUCK) >= 1;
  if (shipButton) shipButton.disabled = !canShip;

  // Skill button state is also updated by the timer interval
}

/* =======================
   EVENTS
   ======================= */
if (prodButton)  prodButton.addEventListener('click', produceBox);
if (shipButton)  shipButton.addEventListener('click', shipStorage);

if (storageUpgradeBtn) storageUpgradeBtn.addEventListener('click', () => upgrade('storage'));
if (trucksUpgradeBtn)  trucksUpgradeBtn.addEventListener('click', () => upgrade('truck'));
if (workerUpgradeBtn)  workerUpgradeBtn.addEventListener('click', () => upgrade('worker'));
if (clickUpgradeBtn)   clickUpgradeBtn.addEventListener('click', () => upgrade('click'));
if (critUpgradeBtn)    critUpgradeBtn.addEventListener('click', () => upgrade('crit'));
if (skillUpgradeBtn)   skillUpgradeBtn.addEventListener('click', () => upgrade('skill'));
if (skillBtn)          skillBtn.addEventListener('click', activateSkill);
if (resetBtn)          resetBtn.addEventListener('click', doReset);

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
