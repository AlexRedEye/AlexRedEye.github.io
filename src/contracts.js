import { contractState, gameState, eff } from './state.js';
import { nowMs, randomInt, clamp, formatDuration } from './utils.js';
import { celebrateContract, showToast } from './effects.js';
import {
  getTruckCapacity, effectiveWorkerBatch,
  WORKER_INTERVAL, MANAGER_INTERVAL
} from './economy.js';
import { RARITY_BASE_WEIGHTS, RARITY_MULT_RANGE } from './constants.js';
import { updateUI } from './ui.js';

/* =======================
   Throughput estimate
   ======================= */
export function estimateThroughput(){
  const prodPerTick = effectiveWorkerBatch(gameState.workers);
  const prodRate = prodPerTick / (WORKER_INTERVAL/1000);
  const cap = getTruckCapacity();
  const loadsPerSec = (gameState.managerLevel + gameState.tree.managerBoost) / (MANAGER_INTERVAL/1000);
  const shipRate = loadsPerSec * cap;
  return { prodRate, shipRate };
}

/* =======================
   Efficiency → rarity tweaks
   ======================= */
function sumLast60(arr){
  const cutoff = Date.now() - 60000;
  while (arr.length && arr[0].t < cutoff) arr.shift();
  return arr.reduce((s,e)=>s+e.v,0);
}
function currentEfficiencyScore(){
  const produced60 = sumLast60(eff.produced);
  const shipped60  = sumLast60(eff.shipped);
  const blocked60  = sumLast60(eff.blocked);
  const flow = produced60>0 ? Math.min(1, shipped60/produced60) : 1;
  const attempts = produced60 + blocked60;
  const discipline = attempts>0 ? (1 - blocked60/attempts) : 1;
  return Math.round(60*flow + 40*discipline);
}

/* =======================
   Weighted rarity & rewards
   ======================= */
function rollRarity(tier, effScore){
  const w = { ...RARITY_BASE_WEIGHTS };
  const t = Math.min(10, Math.max(0, tier));
  w.rare      += 0.6 * t;
  w.epic      += 0.3 * t;
  w.legendary += 0.10 * t;
  w.common    -= 1.00 * t;

  const e = Math.max(-1, Math.min(1, (effScore - 65) / 35));
  if (e > 0){
    const boost = 3.5 * e;
    w.rare      += boost;
    w.epic      += boost * 0.6;
    w.legendary += boost * 0.25;
    w.common    -= boost * 1.85;
  } else if (e < 0){
    const tilt = 3 * (-e);
    w.common    += tilt;
    w.rare      -= tilt * 0.7;
    w.epic      -= tilt * 0.25;
  }

  w.common    = Math.max(25, w.common);
  w.rare      = Math.max(5,  w.rare);
  w.epic      = Math.max(1,  w.epic);
  w.legendary = Math.max(0.5,w.legendary);

  const total = w.common + w.rare + w.epic + w.legendary;
  let r = Math.random() * total;
  if ((r -= w.common)    < 0) return 'common';
  if ((r -= w.rare)      < 0) return 'rare';
  if ((r -= w.epic)      < 0) return 'epic';
  return 'legendary';
}

function rollRewardMultiplier(rarity, tier){
  const band = RARITY_MULT_RANGE[rarity] || [2.0, 2.0];
  let mult = band[0] + Math.random() * (band[1] - band[0]);
  const tierBoost = 1 + 0.05 * Math.min(6, Math.max(0, tier));
  mult *= tierBoost;
  return Math.round(mult * 100) / 100;
}

/* =======================
   Start / Abandon / Progress
   ======================= */
export function startRandomContract(){
  if (contractState.active) return;

  const { prodRate, shipRate } = estimateThroughput();
  const tier = Math.floor((gameState.tokens||0)/10);
  const baseMin = 50*(1+0.7*tier);
  const baseMax = 200*(1+1.0*tier);

  const targetSec = clamp(randomInt(60,120) - 3*tier, 30, 120);
  const effRate = Math.max(1, Math.min(prodRate, shipRate + prodRate*0.30));

  let quota = Math.round(effRate*targetSec*(1.1+0.10*tier));
  quota = clamp(quota, Math.floor(baseMin), Math.floor(baseMax));

  const effScore = currentEfficiencyScore();
  const rarity = rollRarity(tier, effScore);
  const rewardMult = rollRewardMultiplier(rarity, tier);
  const reward = Math.max(1, Math.round(quota * rewardMult));

  Object.assign(contractState, {
    active: true,
    quota,
    timeLimit: targetSec,
    reward,
    progress: 0,
    endTime: nowMs() + targetSec*1000,
    tier,
    effRate: Math.round(effRate*10)/10,
    rewardMult,
    rarity
  });

  const cStatus = document.getElementById('contract-status');
  if (cStatus) cStatus.textContent = '';
  updateUI();
}

export function abandonContract(){
  if (!contractState.active) return;
  Object.assign(contractState, {
    active:false, quota:0, reward:0, timeLimit:0, endTime:0,
    progress:0, tier:0, effRate:0, rewardMult:0, rarity:'common'
  });
  const cStatus = document.getElementById('contract-status');
  if (cStatus) cStatus.textContent = 'Abandoned';
  updateUI();
}

export async function onBoxesShipped(count){
  if (!contractState.active) return;
  contractState.progress += count;

  if (contractState.progress >= contractState.quota){
    // Reward locally
    gameState.muns += contractState.reward;

    // Notify backend (Phase 1)
    try{
      await submitContractScore({
        quota: contractState.quota,
        delivered: contractState.progress,
        reward: contractState.reward,
        rarity: contractState.rarity,
        timeLimit: contractState.timeLimit,
        // Simple result flag:
        success: true
      });
    }catch(_e){
      // ignore network errors in Phase 1
    }

    // Celebrate
    celebrateContract();
    const shipBtn = document.getElementById('shipping-btn');
    const card = document.getElementById('contract-active');
    showToast(`Contract +${contractState.reward} Muns!`, 'muns', card || shipBtn);

    // Clear contract shortly after the confetti
    setTimeout(()=>{
      const cStatus = document.getElementById('contract-status');
      if (cStatus) cStatus.classList.remove('success');
      Object.assign(contractState, {
        active:false, progress:0, quota:0, reward:0, timeLimit:0, endTime:0,
        tier:0, effRate:0, rewardMult:0, rarity:'common'
      });
      updateUI();
    }, 900);
  }
  updateUI();
}

/* =======================
   Timer tick
   ======================= */
export function tickContractTimer(){
  if (!contractState.active) return;
  const remain = (contractState.endTime - nowMs())/1000;
  if (remain <= 0){
    const cStatus = document.getElementById('contract-status');
    if (contractState.progress < contractState.quota && cStatus) cStatus.textContent = 'Failed';
    Object.assign(contractState, {
      active:false, progress:0, quota:0, reward:0, timeLimit:0, endTime:0,
      tier:0, effRate:0, rewardMult:0, rarity:'common'
    });
    updateUI();
  }else{
    const cTimer = document.getElementById('contract-timer');
    if (cTimer) cTimer.textContent = formatDuration(remain);
  }
}
