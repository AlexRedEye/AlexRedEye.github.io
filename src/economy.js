import {
  BASE_TRUCK_CAPACITY, STORAGE_BASE_COST, STORAGE_COST_SCALE,
  TRUCK_BASE_COST, TRUCK_COST_SCALE, WORKER_BASE_COST, WORKER_COST_SCALE,
  MANAGER_BASE_COST, MANAGER_COST_SCALE, CLICK_BASE_COST, CLICK_COST_SCALE,
  CRIT_BASE_COST, CRIT_COST_SCALE, BASE_CRIT_CHANCE, CRIT_PER_LEVEL,
  PRESTIGE_CRIT_PER_LVL, CRIT_MULTIPLIER, MAX_TOTAL_CRIT,
  SKILL_BASE_DURATION, SKILL_DURATION_PER_LEVEL, SKILL_BASE_COST, SKILL_COST_SCALE,
  WORKER_INTERVAL, MANAGER_INTERVAL, BOX_VALUE,
  PALLETIZER_BASE_COST, PALLETIZER_COST_SCALE, PALLETIZER_PER_LVL,
  CONVEYOR_BASE_COST, CONVEYOR_COST_SCALE, CONVEYOR_PER_LVL,
  TURBO_BASE_COST, TURBO_COST_SCALE, TURBO_PER_LVL,
  VALUATION_BASE_COST, VALUATION_COST_SCALE, VALUATION_PER_LVL
} from './constants.js';
import { gameState } from './state.js';
import { nowMs } from './utils.js';

// ===== Costs =====
export const storageCost = () =>
  Math.floor(STORAGE_BASE_COST * Math.pow(
    STORAGE_COST_SCALE, Math.floor((gameState.storage - 10) / 10)
  ));

export const truckCost = () => {
  const purchased = Math.max(0, gameState.trucks - 1);
  return Math.floor(TRUCK_BASE_COST * Math.pow(TRUCK_COST_SCALE, purchased));
};

export const workerCost = () =>
  Math.floor(WORKER_BASE_COST * Math.pow(WORKER_COST_SCALE, gameState.workers));

export const managerCost = () =>
  Math.floor(MANAGER_BASE_COST * Math.pow(MANAGER_COST_SCALE, gameState.managerLevel));

export const clickCost = () =>
  Math.floor(CLICK_BASE_COST * Math.pow(CLICK_COST_SCALE, gameState.clickPowerLevel));

export const critCost = () =>
  Math.floor(CRIT_BASE_COST * Math.pow(CRIT_COST_SCALE, gameState.critLevel));

// New upgrade costs
export const palletizerCost = () =>
  Math.floor(PALLETIZER_BASE_COST * Math.pow(PALLETIZER_COST_SCALE, gameState.palletizerLevel));

export const conveyorCost = () =>
  Math.floor(CONVEYOR_BASE_COST * Math.pow(CONVEYOR_COST_SCALE, gameState.conveyorLevel));

export const turboCost = () =>
  Math.floor(TURBO_BASE_COST * Math.pow(TURBO_COST_SCALE, gameState.turboLevel));

export const valuationCost = () =>
  Math.floor(VALUATION_BASE_COST * Math.pow(VALUATION_COST_SCALE, gameState.valuationLevel));

export const skillCost = () =>
  Math.floor(SKILL_BASE_COST * Math.pow(SKILL_COST_SCALE, gameState.skillLevel));

// ===== Derived stats =====
export const getTruckCapacity = () =>
  BASE_TRUCK_CAPACITY + gameState.tree.truckBoost;

export const effectiveWorkerBatch = (workers) => {
  const prestige = 1 + (gameState.tree.workerBoost * 0.01);
  const conveyorMult = 1 + gameState.conveyorLevel * CONVEYOR_PER_LVL;
  return Math.max(1, Math.floor(workers * prestige * conveyorMult));
};

export const clickPower = () => {
  const base = 1 + gameState.clickPowerLevel + gameState.tree.manualBoost;
  const palletMult = 1 + gameState.palletizerLevel * PALLETIZER_PER_LVL;
  return Math.floor(base * palletMult);
};

export const critChance = () =>
  Math.min(
    BASE_CRIT_CHANCE +
      gameState.critLevel * CRIT_PER_LEVEL +
      gameState.tree.critBoost * PRESTIGE_CRIT_PER_LVL,
    MAX_TOTAL_CRIT
  );

export const getCritMultiplier = () => CRIT_MULTIPLIER;

export const getBoxValue = () => {
  const mult = 1 + gameState.valuationLevel * VALUATION_PER_LVL;
  return Math.max(1, Math.floor(BOX_VALUE * mult));
};

export const getManagerPower = () => {
  const base = gameState.managerLevel + gameState.tree.managerBoost;
  const turboMult = 1 + gameState.turboLevel * TURBO_PER_LVL;
  return Math.max(0, Math.floor(base * turboMult));
};

// ===== Skill helpers =====
export const isSkillActive = () => nowMs() < gameState.skillActiveUntil;
export const isSkillOnCooldown = () => nowMs() < gameState.skillCooldownUntil;
export const skillDurationSec = () => SKILL_BASE_DURATION + gameState.skillLevel * SKILL_DURATION_PER_LEVEL;


export const setSkillActive = (ms) =>
  (gameState.skillActiveUntil = nowMs() + ms);

export const setSkillCooldown = (ms) =>
  (gameState.skillCooldownUntil = nowMs() + ms);

// ===== Intervals =====
export { WORKER_INTERVAL, MANAGER_INTERVAL };

