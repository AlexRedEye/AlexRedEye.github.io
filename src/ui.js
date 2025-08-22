import { APP_VERSION } from './constants.js';
import { gameState, contractState, settings } from './state.js';
import { pluralize, formatDuration, setButtonState } from './utils.js';
import {
  getTruckCapacity, storageCost, truckCost, workerCost, managerCost,
  clickCost, critCost, isSkillActive, isSkillOnCooldown, skillDurationSec,
  WORKER_INTERVAL, MANAGER_INTERVAL,
  palletizerCost, conveyorCost, turboCost, valuationCost,
  clickPower, critChance, getManagerPower,
  skillCost
} from './economy.js';
import { updatePrestigeSide } from './prestige.js';

export function setupTabs(){
  const tabs = document.querySelectorAll('.tab-button');
  tabs.forEach(btn=>{
    btn.addEventListener('click',()=>{
      tabs.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.dataset.target;
      document.querySelectorAll('main[id^="screen-"]').forEach(m=>{
        if (m.id===targetId) m.classList.remove('hidden');
        else m.classList.add('hidden');
      });
    });
  });
}

export function updateUI(){
  const $ = (id)=>document.getElementById(id);
  const set = (id, val)=>{ const el=$(id); if (el) el.innerText = val; };
  const setChecked = (id, val)=>{ const el=$(id); if (el && typeof el.checked === 'boolean') el.checked = !!val; };

  // Version
  const v = $('version-txt'); if (v) { v.textContent = `v${APP_VERSION}`; }

  // Top stats
  set('box-txt', pluralize(gameState.box,'Box'));
  set('muns-txt', pluralize(gameState.muns,'Mun','Muns'));
  set('storage-txt', String(gameState.storage));
  set('trucks-txt', String(gameState.trucks));
  set('cap-txt', String(getTruckCapacity()));
  set('total-txt', pluralize(gameState.totalBoxes,'Total Box','Total Boxes'));

  // Costs
  set('storage-cost', storageCost());
  set('trucks-cost',  truckCost());
  set('worker-cost',  workerCost());
  set('manager-cost', managerCost());
  set('click-cost',   gameState.clickPowerLevel>=10 ? 'MAX' : clickCost());
  set('crit-cost',    critCost());
  set('skill-cost',   gameState.skillLevel>=5 ? 'MAX' : skillCost());

  // New upgrade costs
  set('palletizer-cost', palletizerCost());
  set('conveyor-cost',   conveyorCost());
  set('turbo-cost',      turboCost());
  set('valuation-cost',  valuationCost());

  // Counts / notes
  set('worker-count', pluralize(gameState.workers,'Worker'));
  const perTick = Math.max(0, Math.floor(
    gameState.workers *
    (1 + gameState.tree.workerBoost*0.01) *
    (1 + gameState.conveyorLevel*0.15)
  ));
  const wn = $('worker-note'); if (wn) wn.innerText = `Lv ${gameState.workers} (Auto: ${perTick} / ${WORKER_INTERVAL/1000}s)`;

  const ml = $('manager-level'); if (ml){
    const power = getManagerPower();
    ml.innerText = `Lv ${gameState.managerLevel} (Auto: ${power} load${power===1?'':'s'} / ${MANAGER_INTERVAL/1000}s)`;
  }

  const clk = $('click-level'); if (clk) clk.innerText = `Lv ${gameState.clickPowerLevel} (Power: ${clickPower()})`;
  const cc = $('crit-chance');  if (cc)  cc.innerText  = `${Math.round(critChance()*100)}% crit`;

  const clv = $('conveyor-level'); if (clv) clv.innerText = `Lv ${gameState.conveyorLevel} (Workers ×${(1 + gameState.conveyorLevel*0.15).toFixed(2)})`;
  const tlv = $('turbo-level');    if (tlv) tlv.innerText = `Lv ${gameState.turboLevel} (Manager ×${(1 + gameState.turboLevel*0.25).toFixed(2)})`;

  const sd = $('skill-duration'); if (sd) sd.innerText = `${skillDurationSec()}s duration, 60s CD`;

  // Buttons enabled + state colors
  const setDis = (id, disabled, afford=true)=>{
    const el=$(id); if(!el) return;
    el.disabled = !!disabled; setButtonState(el, afford && !disabled);
  };

  setDis('storage-upgrade', gameState.muns < storageCost(), gameState.muns >= storageCost());
  setDis('trucks-upgrade',  gameState.muns < truckCost(),  gameState.muns >= truckCost());
  setDis('worker-upgrade',  gameState.muns < workerCost(), gameState.muns >= workerCost());
  setDis('manager-upgrade', gameState.muns < managerCost(),gameState.muns >= managerCost());
  setDis('click-upgrade',   (gameState.clickPowerLevel>=10) || gameState.muns < clickCost(), gameState.muns >= clickCost());
  setDis('crit-upgrade',    gameState.muns < critCost(),    gameState.muns >= critCost());

  setDis('palletizer-upgrade', gameState.muns < palletizerCost(), gameState.muns >= palletizerCost());
  setDis('conveyor-upgrade',   gameState.muns < conveyorCost(),   gameState.muns >= conveyorCost());
  setDis('turbo-upgrade',      gameState.muns < turboCost(),      gameState.muns >= turboCost());
  setDis('valuation-upgrade',  gameState.muns < valuationCost(),  gameState.muns >= valuationCost());

  // Skill button state hint
  const skillBtn = $('skill-btn');
  if (skillBtn){
    skillBtn.disabled = isSkillActive() || isSkillOnCooldown();
    skillBtn.classList.toggle('affordable', !skillBtn.disabled);
  }

  const canShip = Math.floor(gameState.box / getTruckCapacity()) >= 1;
  const shipBtn = $('shipping-btn'); if (shipBtn) shipBtn.disabled = !canShip;

  // Tokens & prestige side
  const t = $('tokens-txt'); if (t) t.textContent = String(gameState.tokens);
  updatePrestigeSide();

  // Tooltips
  const tt = (id, text) => { const el = $(id); if (el) el.title = text; };
  tt('production-btn',    `Click power: ${clickPower()}${isSkillActive() ? ' (×2 active)' : ''}`);
  tt('shipping-btn',      `Ships full loads • Capacity/Truck: ${getTruckCapacity()} • Trucks: ${gameState.trucks}`);
  tt('worker-upgrade',    `Auto-produce every 2s • Current: ${gameState.workers} • Next Cost: ${workerCost()}`);
  tt('manager-upgrade',   `Auto-dispatch every 5s • Current Lv: ${gameState.managerLevel} • Next Cost: ${managerCost()}`);
  tt('click-upgrade',     `Increase manual click by +1 • Current Power: ${clickPower()} • Next Cost: ${gameState.clickPowerLevel>=10?'MAX':clickCost()}`);
  tt('crit-upgrade',      `Increase crit chance • Current: ${Math.round(critChance()*100)}% • Next Cost: ${critCost()}`);
  tt('palletizer-upgrade',`Multiply click output • Current Power: ${clickPower()} • Next Cost: ${palletizerCost()}`);
  tt('conveyor-upgrade',  `Boost worker output • Next Cost: ${conveyorCost()}`);
  tt('turbo-upgrade',     `Boost manager loads/tick • Current: ${getManagerPower()} loads/tick • Next Cost: ${turboCost()}`);
  tt('valuation-upgrade', `Increase muns/box • Next Cost: ${valuationCost()}`);
  tt('skill-btn',         `Priority Pick: 2× clicks for ${skillDurationSec()}s • Cooldown: 60s`);

  // Contracts panel
  const cCard = $('contract-active');
  const cAbn  = $('contract-abandon');
  const cGen  = $('contract-generate');
  const cPB   = $('contract-progress');
  const cPT   = $('contract-progress-text');
  const cDesc = $('contract-desc');
  const cMeta = $('contract-meta');
  const cR    = $('contract-rarity');

  if (contractState.active){
    cCard?.classList.remove('hidden');
    cAbn?.classList.remove('hidden');
    if (cGen) cGen.disabled = true;

    const remain = Math.max(0, Math.ceil((contractState.endTime - Date.now())/1000));
    const cTimer = $('contract-timer'); if (cTimer) cTimer.textContent = formatDuration(remain);

    const pct = Math.max(0, Math.min(100, (contractState.progress/contractState.quota)*100));
    if (cPB) cPB.style.width = pct + '%';
    if (cPT) cPT.textContent = `${contractState.progress} / ${contractState.quota}`;

    if (cDesc) cDesc.textContent = `Deliver ${contractState.quota} boxes in ${formatDuration(contractState.timeLimit)} for ${contractState.reward} Muns.`;

    if (cR){
      cR.textContent = contractState.rarity.charAt(0).toUpperCase()+contractState.rarity.slice(1);
      cR.className = 'badge';
      cR.classList.add(`badge-${contractState.rarity}`);
    }

    if (cMeta){
      const cap = getTruckCapacity();
      const mult = contractState.rewardMult ? ` ×${contractState.rewardMult.toFixed(2)}` : '';
      cMeta.textContent = `Tier ${contractState.tier} • Est. rate ${contractState.effRate}/s • Payout${mult} • Truck cap ${cap}`;
    }
  }else{
    cCard?.classList.add('hidden');
    cAbn?.classList.add('hidden');
    if (cGen) cGen.disabled = false;
    if (cPB) cPB.style.width = '0%';
    if (cPT) cPT.textContent = '0 / 0';
    if (cR){ cR.textContent='Common'; cR.className='badge badge-common'; }
    if (cMeta) cMeta.textContent = '—';
  }

  // ===== Settings UI sync =====
  setChecked('set-sound', settings.sound);
  setChecked('set-confetti', settings.confetti);
  setChecked('set-toasts', settings.toasts);
  setChecked('set-reduced-motion', settings.reducedMotion);
}
