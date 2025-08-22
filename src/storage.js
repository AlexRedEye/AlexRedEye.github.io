import { APP_VERSION, SAVE_SCHEMA_VERSION } from './constants.js';
import { gameState as GS, contractState as CS, eff as EFF, DEFAULT_SETTINGS, settings } from './state.js';

// Minimal deep merge (arrays by replace, objects by merge)
function deepMerge(target, source) {
  if (typeof source !== 'object' || source === null) return target;
  for (const k of Object.keys(source)) {
    const sv = source[k];
    const tv = target[k];
    if (Array.isArray(sv)) target[k] = sv.slice();
    else if (sv && typeof sv === 'object') {
      target[k] = (tv && typeof tv === 'object') ? deepMerge({ ...tv }, sv) : deepMerge({}, sv);
    } else {
      target[k] = sv;
    }
  }
  return target;
}

// Default save shape
function defaultSave() {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    game: {
      box: 0, storage: 10, trucks: 1, muns: 0,
      workers: 0, managerLevel: 0,
      clickPowerLevel: 0, critLevel: 0,
      skillLevel: 0, skillActiveUntil: 0, skillCooldownUntil: 0,
      totalBoxes: 0, runShipped: 0,
      tokens: 0,
      tree: { workerBoost: 0, truckBoost: 0, manualBoost: 0, critBoost: 0, managerBoost: 0 },
      palletizerLevel: 0, conveyorLevel: 0, turboLevel: 0, valuationLevel: 0
    },
    contracts: {
      active: false, quota: 0, reward: 0, timeLimit: 0, endTime: 0,
      progress: 0, tier: 0, effRate: 0, rewardMult: 0, rarity: 'common'
    },
    efficiency: { produced: [], shipped: [], blocked: [] },
    settings: { ...DEFAULT_SETTINGS }
  };
}

/** Migrate to current schema */
function migrateSave(raw) {
  if (!raw || typeof raw !== 'object') return defaultSave();

  const looksLikeOldFlat =
    !raw.schemaVersion &&
    (raw.box !== undefined || raw.muns !== undefined || raw.storage !== undefined);

  if (looksLikeOldFlat) {
    const v1 = defaultSave();
    v1.schemaVersion = 1;
    v1.appVersion = raw.appVersion || 'pre-modules';
    v1.game.box = raw.box ?? 0;
    v1.game.storage = raw.storage ?? 10;
    v1.game.trucks = raw.trucks ?? raw.truck ?? 1;
    v1.game.muns = raw.muns ?? 0;
    v1.game.workers = raw.workers ?? 0;
    v1.game.managerLevel = (raw.managerLevel ?? raw.manager ?? 0);
    v1.game.clickPowerLevel = (raw.clickPowerLevel ?? raw.clickPower ?? 0);
    v1.game.critLevel = raw.critLevel ?? 0;
    v1.game.skillLevel = raw.skillLevel ?? 0;
    v1.game.skillActiveUntil = raw.skillActiveUntil ?? 0;
    v1.game.skillCooldownUntil = raw.skillCooldownUntil ?? 0;
    v1.game.totalBoxes = raw.totalBoxes ?? 0;
    v1.game.runShipped = raw.runShipped ?? 0;
    v1.game.tokens = raw.tokens ?? 0;

    const tree = raw.tree || {};
    v1.game.tree = {
      workerBoost: tree.workerBoost ?? 0,
      truckBoost:  tree.truckBoost ?? 0,
      manualBoost: tree.manualBoost ?? 0,
      critBoost:   tree.critBoost ?? 0,
      managerBoost:tree.managerBoost ?? 0
    };

    v1.contracts = {
      active: false, quota: 0, reward: 0, timeLimit: 0, endTime: 0,
      progress: 0, tier: 0, effRate: 0, rewardMult: 0, rarity: 'common'
    };

    v1.efficiency = { produced: [], shipped: [], blocked: [] };

    raw = v1;
  }

  let save = deepMerge(defaultSave(), raw);

  const g = save.game;
  const t = g.tree || {};
  g.tree = {
    workerBoost: Number.isFinite(t.workerBoost) ? t.workerBoost : 0,
    truckBoost:  Number.isFinite(t.truckBoost)  ? t.truckBoost  : 0,
    manualBoost: Number.isFinite(t.manualBoost) ? t.manualBoost : 0,
    critBoost:   Number.isFinite(t.critBoost)   ? t.critBoost   : 0,
    managerBoost:Number.isFinite(t.managerBoost)? t.managerBoost: 0
  };

  const from = Number.isFinite(save.schemaVersion) ? save.schemaVersion : 1;

  // v1 -> v2
  if (from < 2) {
    g.managerLevel = Math.max(0, Math.floor(g.managerLevel || 0));
    const c = save.contracts || {};
    save.contracts = {
      active: !!c.active,
      quota: Math.max(0, Math.floor(c.quota || 0)),
      reward: Math.max(0, Math.floor(c.reward || 0)),
      timeLimit: Math.max(0, Math.floor(c.timeLimit || 0)),
      endTime: Math.max(0, Math.floor(c.endTime || 0)),
      progress: Math.max(0, Math.floor(c.progress || 0)),
      tier: Math.max(0, Math.floor(c.tier || 0)),
      effRate: Number.isFinite(c.effRate) ? c.effRate : 0,
      rewardMult: Number.isFinite(c.rewardMult) ? c.rewardMult : 0,
      rarity: c.rarity || 'common'
    };
    save.schemaVersion = 2;
  }

  // v2 -> v3: new upgrade levels persisted
  if (from < 3) {
    g.palletizerLevel = Math.max(0, Math.floor(g.palletizerLevel || 0));
    g.conveyorLevel   = Math.max(0, Math.floor(g.conveyorLevel   || 0));
    g.turboLevel      = Math.max(0, Math.floor(g.turboLevel      || 0));
    g.valuationLevel  = Math.max(0, Math.floor(g.valuationLevel  || 0));
    save.schemaVersion = 3;
  }

  // v3 -> v4: add settings
  if (from < 4) {
    save.settings = { ...DEFAULT_SETTINGS, ...(save.settings || {}) };
    save.schemaVersion = 4;
  }

  save.appVersion = APP_VERSION;

  // Final normalization
  save = deepMerge(defaultSave(), save);
  return save;
}

function writeSave(save) {
  try {
    localStorage.setItem('save', JSON.stringify(save));
    localStorage.setItem('saveVersion', save.appVersion);
    localStorage.setItem('saveSchema', String(save.schemaVersion));
  } catch (_) { /* ignore */ }
}

export function loadSave() {
  try {
    const raw = JSON.parse(localStorage.getItem('save'));
    const migrated = migrateSave(raw);

    Object.assign(GS, migrated.game);
    Object.assign(CS, migrated.contracts);
    Object.assign(settings, migrated.settings || DEFAULT_SETTINGS);

    EFF.produced = migrated.efficiency.produced || [];
    EFF.shipped  = migrated.efficiency.shipped  || [];
    EFF.blocked  = migrated.efficiency.blocked  || [];

    writeSave(migrated);
  } catch (_) {
    const fresh = defaultSave();
    Object.assign(GS, fresh.game);
    Object.assign(CS, fresh.contracts);
    Object.assign(settings, fresh.settings);
    EFF.produced = []; EFF.shipped = []; EFF.blocked = [];
    writeSave(fresh);
  }
}

// keep efficiency arrays small in storage
function trim60(arr){
  const cutoff = Date.now() - 60000;
  let i = 0; while (i < arr.length && arr[i].t < cutoff) i++;
  return i ? arr.slice(i) : arr;
}

export function setupAutosave() {
  const snapshot = () => ({
    schemaVersion: SAVE_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    game: { ...GS },
    contracts: { ...CS },
    efficiency: {
      produced: trim60(EFF.produced),
      shipped:  trim60(EFF.shipped),
      blocked:  trim60(EFF.blocked)
    },
    settings: { ...settings }
  });

  setInterval(() => {
    const s = snapshot();
    EFF.produced = s.efficiency.produced;
    EFF.shipped  = s.efficiency.shipped;
    EFF.blocked  = s.efficiency.blocked;
    writeSave(s);
  }, 1500);

  window.addEventListener('beforeunload', () => {
    writeSave(snapshot());
  });
}
