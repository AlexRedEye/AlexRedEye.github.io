import { gameState, settings, DEFAULT_SETTINGS } from './state.js';
import { updateUI } from './ui.js';
import { showToast } from './effects.js';
import { startRandomContract, abandonContract, onBoxesShipped } from './contracts.js';

import {
  // Costs (existing)
  storageCost, truckCost, workerCost, managerCost, clickCost, critCost,
  // New costs
  palletizerCost, conveyorCost, turboCost, valuationCost, skillCost,
  // Helpers
  clickPower, critChance, getCritMultiplier, getTruckCapacity, getBoxValue, getManagerPower,
  // Skill helpers
  setSkillActive, setSkillCooldown, skillDurationSec, isSkillActive, isSkillOnCooldown
} from './economy.js';

function $(id){ return document.getElementById(id); }

export function wireEvents(){
  const prod = $('production-btn');
  const ship = $('shipping-btn');

  // ===== Produce (manual click) =====
  prod?.addEventListener('click', ()=>{
    let amount = clickPower();
    if (isSkillActive()) amount *= 2;
    if (Math.random() < critChance()) amount *= getCritMultiplier();
    amount = Math.floor(amount);

    const space = gameState.storage - gameState.box;
    const applied = Math.max(0, Math.min(amount, space));
    const blocked = Math.max(0, amount - applied);

    if (applied > 0){
      gameState.box += applied;
      gameState.totalBoxes += applied;
      showToast(`+${applied} Box${applied===1?'':'es'}`, 'box', prod);
      updateUI();
    }
    if (blocked > 0){ /* no-op; efficiency tracked elsewhere */ }
  });

  // ===== Ship (manual) =====
  ship?.addEventListener('click', ()=>{
    const capacity = getTruckCapacity();
    const fullLoads = Math.floor(gameState.box / capacity);
    if (fullLoads === 0) return;

    const loads = Math.min(fullLoads, gameState.trucks);
    const boxes = loads * capacity;

    gameState.box -= boxes;
    gameState.muns += boxes * getBoxValue();
    gameState.runShipped += boxes;

    onBoxesShipped(boxes);
    showToast(`+${boxes * getBoxValue()} Muns`, 'muns', ship);
    updateUI();
  });

  // ===== Core Upgrades =====
  $('storage-upgrade')?.addEventListener('click', ()=>{
    const cost = storageCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.storage += 10; updateUI();
  });

  $('trucks-upgrade')?.addEventListener('click', ()=>{
    const cost = truckCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.trucks += 1; updateUI();
  });

  $('worker-upgrade')?.addEventListener('click', ()=>{
    const cost = workerCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.workers += 1; updateUI();
  });

  $('manager-upgrade')?.addEventListener('click', ()=>{
    const cost = managerCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.managerLevel += 1; updateUI();
  });

  // ===== Manual & Crit Upgrades =====
  $('click-upgrade')?.addEventListener('click', ()=>{
    if (gameState.clickPowerLevel >= 10) return;
    const cost = clickCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.clickPowerLevel += 1; updateUI();
  });

  $('crit-upgrade')?.addEventListener('click', ()=>{
    const cost = critCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.critLevel += 1; updateUI();
  });

  // ===== NEW Upgrades =====
  $('palletizer-upgrade')?.addEventListener('click', ()=>{
    const cost = palletizerCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.palletizerLevel += 1; updateUI();
  });

  $('conveyor-upgrade')?.addEventListener('click', ()=>{
    const cost = conveyorCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.conveyorLevel += 1; updateUI();
  });

  $('turbo-upgrade')?.addEventListener('click', ()=>{
    const cost = turboCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.turboLevel += 1; updateUI();
  });

  $('valuation-upgrade')?.addEventListener('click', ()=>{
    const cost = valuationCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.valuationLevel += 1; updateUI();
  });

  // ===== Skill (Priority Pick) =====
  $('skill-upgrade')?.addEventListener('click', ()=>{
    if (gameState.skillLevel >= 5) return;
    const cost = skillCost(); if (gameState.muns < cost) return;
    gameState.muns -= cost; gameState.skillLevel += 1; updateUI();
  });

  $('skill-btn')?.addEventListener('click', ()=>{
    if (isSkillActive() || isSkillOnCooldown()) return;
    const dur = skillDurationSec() * 1000;
    setSkillActive(dur);
    setSkillCooldown(60000); // 60s
    updateUI();
  });

  // ===== Contracts =====
  $('contract-generate')?.addEventListener('click', startRandomContract);
  $('contract-abandon')?.addEventListener('click', abandonContract);

  // ===== Prestige Reset =====
  $('reset-btn')?.addEventListener('click', ()=>{
    const tokensEarned = Math.floor(gameState.runShipped / 100);
    if (tokensEarned <= 0){ alert('Ship more boxes first!'); return; }

    gameState.tokens += tokensEarned;

    Object.assign(gameState, {
      box: 0, muns: 0, storage: 10, trucks: 1,
      workers: 0, managerLevel: 0,
      totalBoxes: 0, runShipped: 0,
      // reset new upgrades
      palletizerLevel: 0, conveyorLevel: 0, turboLevel: 0, valuationLevel: 0
    });

    updateUI();
  });

  // ===== Settings Toggles =====
  $('set-sound')?.addEventListener('change', e => {
    settings.sound = !!e.target.checked; updateUI();
  });
  $('set-confetti')?.addEventListener('change', e => {
    settings.confetti = !!e.target.checked; updateUI();
  });
  $('set-toasts')?.addEventListener('change', e => {
    settings.toasts = !!e.target.checked; updateUI();
  });
  $('set-reduced-motion')?.addEventListener('change', e => {
    settings.reducedMotion = !!e.target.checked; updateUI();
  });
  $('settings-reset')?.addEventListener('click', () => {
    Object.assign(settings, DEFAULT_SETTINGS);
    updateUI();
  });
}
