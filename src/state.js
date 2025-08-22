// ====== Game State ======
export const gameState = {
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
  runShipped: 0,

  // Prestige
  tokens: 0,
  tree: {
    workerBoost: 0,
    truckBoost: 0,
    manualBoost: 0,
    critBoost: 0,
    managerBoost: 0
  },

  // New Upgrades
  palletizerLevel: 0,
  conveyorLevel: 0,
  turboLevel: 0,
  valuationLevel: 0
};

// Efficiency rolling arrays
export const eff = { produced: [], shipped: [], blocked: [] };

// Contract state
export const contractState = {
  active: false,
  quota: 0,
  reward: 0,
  timeLimit: 0,
  endTime: 0,
  progress: 0,
  tier: 0,
  effRate: 0,
  rewardMult: 0,
  rarity: 'common'
};

// ====== Settings ======
export const DEFAULT_SETTINGS = {
  sound: true,
  confetti: true,
  toasts: true,
  reducedMotion: false
};

export const settings = { ...DEFAULT_SETTINGS };
