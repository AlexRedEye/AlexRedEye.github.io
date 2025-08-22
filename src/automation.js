import { gameState, eff } from './state.js';
import {
  effectiveWorkerBatch, WORKER_INTERVAL, MANAGER_INTERVAL,
  getTruckCapacity, getManagerPower, getBoxValue
} from './economy.js';
import { showToast } from './effects.js';
import { updateUI } from './ui.js';
import { onBoxesShipped, tickContractTimer } from './contracts.js';

const effAdd = (arr, v)=> arr.push({ t: Date.now(), v });
function prune60(arr){
  const cutoff = Date.now() - 60000;
  while (arr.length && arr[0].t < cutoff) arr.shift();
  return arr.reduce((s,e)=>s+e.v,0);
}

export function setupIntervals(){
  // Workers
  setInterval(()=>{
    if (gameState.workers<=0) return;
    const producedRaw = effectiveWorkerBatch(gameState.workers);
    const space = gameState.storage - gameState.box;
    const applied = Math.max(0, Math.min(producedRaw, space));
    const blocked = Math.max(0, producedRaw - applied);
    if (applied>0){
      gameState.box += applied; gameState.totalBoxes += applied;
      effAdd(eff.produced, applied); updateUI();
    }
    if (blocked>0) effAdd(eff.blocked, blocked);
  }, WORKER_INTERVAL);

  // Manager
  setInterval(()=>{
    if (gameState.managerLevel<=0 && getManagerPower()<=0) return;
    const cap = getTruckCapacity();
    const fullLoads = Math.floor(gameState.box / cap);
    if (fullLoads<=0) return;

    const managerPower = getManagerPower();
    const loads = Math.min(fullLoads, gameState.trucks, managerPower);
    if (loads<=0) return;

    const boxes = loads * cap;
    gameState.box -= boxes;
    gameState.muns += boxes * getBoxValue();
    effAdd(eff.shipped, boxes);
    gameState.runShipped += boxes;

    onBoxesShipped(boxes);
    const shipBtn = document.getElementById('shipping-btn');
    showToast(`+${boxes*getBoxValue()} Muns (Auto)`, 'muns', shipBtn);
    updateUI();
  }, MANAGER_INTERVAL);

  // Skill/cooldowns + efficiency + tokens estimate + contract timer
  setInterval(()=>{
    const skillBtn = document.getElementById('skill-btn');
    const timer = document.getElementById('skill-timer');
    const activeUntil = gameState.skillActiveUntil, cooldownUntil = gameState.skillCooldownUntil;
    const now = Date.now();
    if (now < activeUntil){
      if (timer) timer.textContent = `Priority Pick: ${Math.ceil((activeUntil-now)/1000)}s`;
      if (skillBtn) skillBtn.disabled = true;
    } else if (now < cooldownUntil){
      if (timer) timer.textContent = `Cooldown: ${Math.ceil((cooldownUntil-now)/1000)}s`;
      if (skillBtn) skillBtn.disabled = true;
    } else {
      if (timer) timer.textContent = 'Ready';
      if (skillBtn) skillBtn.disabled = false;
    }

    const produced60 = prune60(eff.produced);
    const shipped60  = prune60(eff.shipped);
    const blocked60  = prune60(eff.blocked);
    const flow = produced60>0 ? Math.min(1, shipped60/produced60) : 1;
    const attempts = produced60 + blocked60;
    const discipline = attempts>0 ? (1 - blocked60/attempts) : 1;
    const score = Math.round(60*flow + 40*discipline);
    const set = (id,val)=>{ const el=document.getElementById(id); if (el) el.textContent=String(val); };
    set('eff-score',score); set('eff-prod',produced60); set('eff-ship',shipped60); set('eff-block',blocked60);
    set('next-tokens-txt', Math.floor(gameState.runShipped/100));

    tickContractTimer();
  }, 250);
}
