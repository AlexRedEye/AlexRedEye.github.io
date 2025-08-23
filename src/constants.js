// Versioning
export const APP_VERSION = '0.1.1-Alpha';
export const SAVE_SCHEMA_VERSION = 4; // ⬅ bumped to include settings

// Base economy
export const BASE_TRUCK_CAPACITY = 5;
export const STORAGE_STEP = 10;
export const BOX_VALUE = 1; // base (multiplied by valuation upgrade)

export const STORAGE_BASE_COST = 50;
export const STORAGE_COST_SCALE = 1.15;

export const TRUCK_BASE_COST = 100;
export const TRUCK_COST_SCALE = 1.20;

export const WORKER_BASE_COST = 50;
export const WORKER_COST_SCALE = 1.20;
export const WORKER_INTERVAL = 2000;

export const MANAGER_BASE_COST = 250;
export const MANAGER_COST_SCALE = 1.35;
export const MANAGER_INTERVAL = 5000;

export const CLICK_BASE_COST = 30;
export const CLICK_COST_SCALE = 1.35;
export const MAX_CLICK_POWER_LEVEL = 10;

export const CRIT_BASE_COST = 100;
export const CRIT_COST_SCALE = 1.5;
export const BASE_CRIT_CHANCE = 0.05;
export const CRIT_PER_LEVEL = 0.01;
export const PRESTIGE_CRIT_PER_LVL = 0.005;
export const CRIT_MULTIPLIER = 10;
export const MAX_TOTAL_CRIT = 0.25;

export const SKILL_BASE_COST = 150;
export const SKILL_COST_SCALE = 1.5;
export const SKILL_BASE_DURATION = 10;
export const SKILL_DURATION_PER_LEVEL = 2;
export const SKILL_MAX_LEVEL = 5;
export const SKILL_COOLDOWN = 60;

export const EFF_WINDOW_MS = 60000;

// Prestige tree
export const TREE_BASE_COST = {
  workerBoost: 1,
  truckBoost: 2,
  manualBoost: 1,
  critBoost: 3,
  managerBoost: 4
};
export const TREE_NODES = [
  { key: 'manualBoost',  label: 'M',  cat: 'prod', desc: '+1 click power / level', x: 500, y: 1100, deps: [] },
  { key: 'workerBoost',  label: 'W',  cat: 'prod', desc: '+1% worker output / level', x: 300, y: 900, deps: ['manualBoost'] },
  { key: 'truckBoost',   label: 'T',  cat: 'log',  desc: '+1 capacity / truck / level', x: 700, y: 900, deps: ['manualBoost'] },
  { key: 'managerBoost', label: 'D',  cat: 'log',  desc: 'Manager +1 load / tick / level', x: 700, y: 700, deps: ['truckBoost'] },
  { key: 'critBoost',    label: 'C',  cat: 'meta', desc: '+0.5% crit chance / level', x: 300, y: 700, deps: ['workerBoost'] }
];
export const TREE_NODE_MAP = Object.fromEntries(TREE_NODES.map(n => [n.key, n]));

// Rarity weights & payout bands
export const RARITY_BASE_WEIGHTS = {
  common: 70,
  rare: 22,
  epic: 7,
  legendary: 1
};

export const RARITY_MULT_RANGE = {
  common:    [1.80, 2.20],
  rare:      [2.20, 2.60],
  epic:      [2.60, 3.20],
  legendary: [3.20, 3.80]
};

// New upgrade costs & tuning
export const PALLETIZER_BASE_COST = 90;
export const PALLETIZER_COST_SCALE = 1.30;
export const CONVEYOR_BASE_COST = 120;
export const CONVEYOR_COST_SCALE = 1.25;
export const TURBO_BASE_COST = 180;
export const TURBO_COST_SCALE = 1.28;
export const VALUATION_BASE_COST = 200;
export const VALUATION_COST_SCALE = 1.35;

// Effects (multiplicative per level)
export const PALLETIZER_PER_LVL = 0.25;
export const CONVEYOR_PER_LVL   = 0.15;
export const TURBO_PER_LVL      = 0.25;
export const VALUATION_PER_LVL  = 0.10;
