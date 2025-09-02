/* =========================
   MVP Data + Systems (no libs)
   v0.1.2: Per-stage Deadline (anti-rest-spam) + Summary Modal
   ========================= */
const RARITY = { R:'R', SR:'SR', SSR:'SSR' };
const ARCH = { BRAWLER:'Brawler', BLADE:'Blade', GUNNER:'Gunner', MAGE:'Mage' };

// ------- Catalogs (placeholder) -------
const UNITS = [
  { id:'u_rai',   name:'Rai',   arche:ARCH.BLADE,   rarity:RARITY.SR,  base:{pow:9,  spd:8, foc:5,  grt:7} },
  { id:'u_nox',   name:'Nox',   arche:ARCH.MAGE,    rarity:RARITY.SSR, base:{pow:7,  spd:7, foc:12, grt:6} },
  { id:'u_brick', name:'Brick', arche:ARCH.BRAWLER, rarity:RARITY.R,   base:{pow:10, spd:5, foc:3,  grt:10} },
];

const WEAPONS = [
  { id:'w_katana', name:'Storm Katana',    rarity:RARITY.SR,  pref:ARCH.BLADE,  add:{pow:4, spd:2, foc:0, grt:0}, growth:0.07, max:5 },
  { id:'w_staff',  name:'Orbweaver Staff', rarity:RARITY.SSR, pref:ARCH.MAGE,   add:{pow:1, spd:1, foc:5, grt:1}, growth:0.08, max:5 },
  { id:'w_gaunt',  name:'Titan Gauntlets', rarity:RARITY.R,   pref:ARCH.BRAWLER,add:{pow:3, spd:0, foc:0, grt:2}, growth:0.05, max:5 },
  { id:'w_pistol', name:'Silent Pistol',   rarity:RARITY.R,   pref:ARCH.GUNNER, add:{pow:2, spd:2, foc:0, grt:0}, growth:0.05, max:5 },
];

const SUPPORTS = [
  { id:'s_cardio', name:'Cardio Coach',    rarity:RARITY.R,   train:{pow:0.00,spd:0.12,foc:0.00,grt:0.00}, dmg:0.00 },
  { id:'s_brutal', name:'Brutal Sparring', rarity:RARITY.SR,  train:{pow:0.15,spd:0.00,foc:0.00,grt:0.05}, dmg:0.05 },
  { id:'s_mind',   name:'Mind Palace',     rarity:RARITY.SR,  train:{pow:0.00,spd:0.00,foc:0.18,grt:0.00}, dmg:0.06 },
  { id:'s_guard',  name:'Guard Drills',    rarity:RARITY.R,   train:{pow:0.00,spd:0.00,foc:0.00,grt:0.15}, dmg:0.02 },
  { id:'s_aegis',  name:'Aegis Mentor',    rarity:RARITY.SSR, train:{pow:0.05,spd:0.05,foc:0.05,grt:0.10}, dmg:0.10 },
  { id:'s_split',  name:'Split Focus',     rarity:RARITY.R,   train:{pow:0.05,spd:0.05,foc:0.05,grt:0.05}, dmg:0.00 },
];

// ------- Player Profile -------
const profile = {
  gold: 0, gems: 0, mats: 0,
  units: [],        // {id, lvl, exp}
  weapons: [],      // {id, lvl, exp}
  supports: [],     // {id, lvl, exp, expNext}
  seenIds: new Set(), // not serialized
};

// util
const byId = (arr,id)=>arr.find(x=>x.id===id);
const fmt = n => Number(n).toLocaleString();
const q = s => document.querySelector(s);
const qa = s => Array.from(document.querySelectorAll(s));

// ------- Save/Load -------
function save() {
  const copy = {...profile, seenIds: undefined};
  localStorage.setItem('pf_save', JSON.stringify(copy));
  log('💾 Saved.', true);
}
function load() {
  const raw = localStorage.getItem('pf_save');
  if (!raw) return false;
  const data = JSON.parse(raw);
  Object.assign(profile, data);
  rebuildSeen();
  renderWallet();
  renderInventory();
  rebuildPickers();
  log('📂 Loaded.', true);
  return true;
}
function wipe() {
  localStorage.removeItem('pf_save');
  Object.assign(profile, {gold:0,gems:0,mats:0,units:[],weapons:[],supports:[],seenIds:new Set()});
  renderWallet(); renderInventory(); rebuildPickers();
  log('🧹 Save wiped.', true);
}
function rebuildSeen(){
  profile.seenIds = new Set();
  for (const u of profile.units) profile.seenIds.add(u.id);
  for (const w of profile.weapons) profile.seenIds.add(w.id);
  for (const s of profile.supports) profile.seenIds.add(s.id);
}

// ------- Starter grant -------
function grantStarter(){
  profile.gold += 1000;
  profile.gems += 600;
  profile.mats += 50;
  giveUnit('u_brick', 1);
  giveWeapon('w_pistol', 1);
  giveSupport('s_cardio');
  renderWallet(); renderInventory(); rebuildPickers();
  log('🎁 Starter pack: +1000 gold, +600 gems, +50 mats, +starter items.', true);
}

// ------- Inventory helpers (report level-ups) -------
function giveUnit(id, lvl=1){
  let e = profile.units.find(x=>x.id===id);
  if (!e){ profile.units.push({id, lvl, exp:0}); }
  else { e.exp += 1; if (tryLevelUnit(e)) log(`⬆️ Unit ${byId(UNITS,id).name} leveled to Lv ${e.lvl}.`); }
  profile.seenIds.add(id);
}
function giveWeapon(id, lvl=1){
  let e = profile.weapons.find(x=>x.id===id);
  if (!e){ profile.weapons.push({id, lvl, exp:0}); }
  else { e.exp += 1; if (tryLevelWeapon(e)) log(`⬆️ Weapon ${byId(WEAPONS,id).name} leveled to Lv ${e.lvl}.`); }
  profile.seenIds.add(id);
}
function giveSupport(id){
  let e = profile.supports.find(x=>x.id===id);
  if (!e){ profile.supports.push({id, lvl:1, exp:0, expNext:5}); }
  else { e.exp += 1; if (tryLevelSupport(e)) log(`⬆️ Support ${byId(SUPPORTS,id).name} leveled to Lv ${e.lvl}.`); }
  profile.seenIds.add(id);
}

// return true if at least one level gained
function tryLevelUnit(e){
  let up=false; while (e.exp >= 5){ e.exp -= 5; e.lvl++; up=true; } return up;
}
function tryLevelWeapon(e){
  let up=false; while (e.exp >= 5){ e.exp -= 5; e.lvl++; up=true; } return up;
}
function tryLevelSupport(e){
  let up=false;
  while (e.exp >= e.expNext){
    e.exp -= e.expNext; e.lvl++; up=true;
    e.expNext = Math.ceil(e.expNext * 1.35);
  }
  return up;
}

// ------- Rendering -------
function renderWallet(){
  q('#gold').textContent = `🪙 ${fmt(profile.gold)}`;
  q('#gems').textContent = `💎 ${fmt(profile.gems)}`;
  q('#mats').textContent = `📦 ${fmt(profile.mats)}`;
}
function rarityClass(r){ return r===RARITY.SSR?'ssr':(r===RARITY.SR?'sr':'r'); }
function cardHtml({title, subtitle, rarity, body=''}) {
  return `<div class="card ${rarityClass(rarity)}">
    <div class="title">${title}</div>
    <div class="tiny">${subtitle||''}</div>
    ${body?`<div class="chips">${body}</div>`:''}
  </div>`;
}
function renderInventory(){
  // Units
  const uCont = q('#inv-units'); uCont.innerHTML='';
  for (const e of profile.units){
    const u = byId(UNITS,e.id);
    const body = `<span class="chip">Lv ${e.lvl}</span>
                  <span class="chip">${u.arche}</span>
                  <span class="chip">${u.rarity}</span>`;
    uCont.insertAdjacentHTML('beforeend', cardHtml({title:u.name, subtitle:`ATK ${u.base.pow} / SPD ${u.base.spd} / FOC ${u.base.foc} / GRT ${u.base.grt}`, rarity:u.rarity, body}));
  }
  // Weapons
  const wCont = q('#inv-weapons'); wCont.innerHTML='';
  for (const e of profile.weapons){
    const w = byId(WEAPONS,e.id);
    const body = `<span class="chip">Lv ${e.lvl}</span>
                  <span class="chip">${w.pref}</span>
                  <span class="chip">${w.rarity}</span>`;
    wCont.insertAdjacentHTML('beforeend', cardHtml({title:w.name, subtitle:`+${w.add.pow} POW / +${w.add.spd} SPD / +${w.add.foc} FOC / +${w.add.grt} GRT`, rarity:w.rarity, body}));
  }
  // Supports
  const sCont = q('#inv-supports'); sCont.innerHTML='';
  for (const e of profile.supports){
    const s = byId(SUPPORTS,e.id);
    const body = `<span class="chip">Lv ${e.lvl}</span>
                  <span class="chip">${s.rarity}</span>
                  <span class="chip">Train +${Math.round((s.train.pow+s.train.spd+s.train.foc+s.train.grt)*100)}%</span>`;
    sCont.insertAdjacentHTML('beforeend', cardHtml({title:s.name, subtitle:`DMG +${Math.round(s.dmg*100)}%`, rarity:s.rarity, body}));
  }
}

// ------- Tabs -------
qa('.tabs button').forEach(b=>{
  b.addEventListener('click', ()=>{
    qa('.tabs button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const tab = b.getAttribute('data-tab');
    qa('main .tab').forEach(s=>s.classList.remove('active'));
    q('#'+tab).classList.add('active');
  });
});

// ------- Logger (verbose) -------
function log(msg, quiet=false){
  const el = q('#run-log');
  if (!el || quiet) return;
  const p = document.createElement('div');
  p.className = 'logline';
  p.textContent = msg;
  el.prepend(p);
  while (el.children.length>160) el.removeChild(el.lastChild);
}

// ------- Gacha Pools -------
const RATES = { SSR:0.03, SR:0.17, R:0.80 };
function pickRarity(){
  const r = Math.random();
  if (r < RATES.SSR) return RARITY.SSR;
  if (r < RATES.SSR + RATES.SR) return RARITY.SR;
  return RARITY.R;
}
function poolCharacterByRarity(r){
  const units = UNITS.filter(x=>x.rarity===r);
  const supports = SUPPORTS.filter(x=>x.rarity===r);
  return [...units, ...supports];
}
function poolWeaponByRarity(r){
  const weaps = WEAPONS.filter(x=>x.rarity===r);
  const supports = SUPPORTS.filter(x=>x.rarity===r);
  return [...weaps, ...supports];
}
function rollOne(fromPool){
  const rarity = pickRarity();
  const pool = fromPool(rarity);
  const pick = pool[Math.floor(Math.random()*pool.length)];
  const isSupport = SUPPORTS.some(s=>s.id===pick.id);
  const isUnit = UNITS.some(u=>u.id===pick.id);
  const isWeapon = WEAPONS.some(w=>w.id===pick.id);

  if (isSupport) { giveSupport(pick.id); }
  if (isUnit)    { giveUnit(pick.id); }
  if (isWeapon)  { giveWeapon(pick.id); }

  renderInventory(); renderWallet();
  return { name: pick.name, rarity, type: isSupport?'Support':(isUnit?'Unit':'Weapon') };
}
function spendGems(cost){
  if (profile.gems < cost) { alert('Not enough gems!'); return false; }
  profile.gems -= cost; renderWallet(); return true;
}

// attach gacha buttons
function attachGacha(){
  q('[data-pull="char-1"]').addEventListener('click', ()=>{
    if (!spendGems(30)) return;
    const r = rollOne(poolCharacterByRarity);
    q('#char-results').insertAdjacentHTML('afterbegin', cardHtml({title:r.name, subtitle:r.type, rarity:r.rarity}));
  });
  q('[data-pull="char-10"]').addEventListener('click', ()=>{
    if (!spendGems(300)) return;
    const box = q('#char-results'); let html='';
    for (let i=0;i<10;i++){ const r = rollOne(poolCharacterByRarity); html+=cardHtml({title:r.name, subtitle:r.type, rarity:r.rarity}); }
    box.insertAdjacentHTML('afterbegin', html);
  });

  q('[data-pull="weap-1"]').addEventListener('click', ()=>{
    if (!spendGems(30)) return;
    const r = rollOne(poolWeaponByRarity);
    q('#weap-results').insertAdjacentHTML('afterbegin', cardHtml({title:r.name, subtitle:r.type, rarity:r.rarity}));
  });
  q('[data-pull="weap-10"]').addEventListener('click', ()=>{
    if (!spendGems(300)) return;
    const box = q('#weap-results'); let html='';
    for (let i=0;i<10;i++){ const r = rollOne(poolWeaponByRarity); html+=cardHtml({title:r.name, subtitle:r.type, rarity:r.rarity}); }
    box.insertAdjacentHTML('afterbegin', html);
  });
}

// ------- Career Mode with Deadline -------
const run = {
  active:false, stage:1, maxStage:10, stamina:5,
  unit:null, weapon:null, supports:[],
  stats:{pow:0,spd:0,foc:0,grt:0},
  lastReport:null,

  // Deadline system
  deadlineMax: 5,     // time units per stage
  deadline: 5,        // current remaining time
  costTrain: 1,
  costRest: 2
};

function rebuildPickers(){
  // units
  const uWrap = q('#pick-unit'); uWrap.innerHTML='';
  for (const e of profile.units){
    const u = byId(UNITS,e.id);
    const div = document.createElement('div');
    div.className='card pick '+rarityClass(u.rarity);
    div.innerHTML = `<div class="title">${u.name}</div>
      <div class="tiny">Lv ${e.lvl} • ${u.arche}</div>`;
    div.addEventListener('click', ()=>{
      qa('#pick-unit .pick').forEach(x=>x.classList.remove('selected'));
      div.classList.add('selected'); run.unit={def:u, meta:e};
      enableStartIfReady();
    });
    uWrap.appendChild(div);
  }
  // weapons
  const wWrap = q('#pick-weapon'); wWrap.innerHTML='';
  for (const e of profile.weapons){
    const w = byId(WEAPONS,e.id);
    const div = document.createElement('div');
    div.className='card pick '+rarityClass(w.rarity);
    div.innerHTML = `<div class="title">${w.name}</div>
      <div class="tiny">Lv ${e.lvl} • Pref ${w.pref}</div>`;
    div.addEventListener('click', ()=>{
      qa('#pick-weapon .pick').forEach(x=>x.classList.remove('selected'));
      div.classList.add('selected'); run.weapon={def:w, meta:e};
      enableStartIfReady();
    });
    wWrap.appendChild(div);
  }
  // supports (multiselect up to 2)
  const sWrap = q('#pick-supports'); sWrap.innerHTML='';
  const picks = new Set();
  for (const e of profile.supports){
    const s = byId(SUPPORTS,e.id);
    const div = document.createElement('div');
    div.className='card pick '+rarityClass(s.rarity);
    div.innerHTML = `<div class="title">${s.name}</div>
      <div class="tiny">Lv ${e.lvl} • DMG +${Math.round(s.dmg*100)}%</div>`;
    div.addEventListener('click', ()=>{
      if (div.classList.contains('selected')){
        div.classList.remove('selected'); picks.delete(e.id);
      } else {
        if (picks.size>=2) return;
        div.classList.add('selected'); picks.add(e.id);
      }
      run.supports = [...picks].map(id=>{
        const meta = profile.supports.find(x=>x.id===id);
        const def  = byId(SUPPORTS,id);
        return {def, meta};
      });
      enableStartIfReady();
    });
    sWrap.appendChild(div);
  }
}

function enableStartIfReady(){
  q('#start-run').disabled = !(run.unit && run.weapon);
}

function resetDeadline(){
  run.deadline = run.deadlineMax;
  updateDeadlineUI();
}

function startRun(){
  if (!run.unit || !run.weapon){ alert('Pick a unit and weapon.'); return; }
  run.active = true; run.stage=1; run.stamina=5; q('#run-log').innerHTML='';
  const u = run.unit.def, ulvl = run.unit.meta.lvl;
  const w = run.weapon.def, wlvl = run.weapon.meta.lvl;
  const weaponScale = 1 + w.growth * (wlvl-1);
  run.stats = {
    pow: Math.round((u.base.pow + w.add.pow*weaponScale) * (1 + 0.05*(ulvl-1))),
    spd: Math.round((u.base.spd + w.add.spd*weaponScale) * (1 + 0.05*(ulvl-1))),
    foc: Math.round((u.base.foc + w.add.foc*weaponScale) * (1 + 0.05*(ulvl-1))),
    grt: Math.round((u.base.grt + w.add.grt*weaponScale) * (1 + 0.05*(ulvl-1))),
  };
  run.lastReport = null;

  q('#career-setup').classList.add('hidden');
  q('#career-run').classList.remove('hidden');
  resetDeadline();
  updateRunUI();
  log(`▶️ Run started with ${u.name} (Lv ${ulvl}) + ${w.name} (Lv ${wlvl}).`);
  log(`Stats → POW ${run.stats.pow} | SPD ${run.stats.spd} | FOC ${run.stats.foc} | GRT ${run.stats.grt}`);
}

function updateDeadlineUI(){
  const label = q('#deadline-label');
  const bar = q('#deadline-bar');
  const pct = Math.max(0, Math.min(1, run.deadline / run.deadlineMax));
  if (label) label.textContent = `Time Left: ${Math.max(0, run.deadline)}`;
  if (bar) bar.style.width = `${pct*100}%`;
  // disable Rest if not enough time left to pay its cost
  const restBtn = q('#btn-rest');
  if (restBtn) restBtn.disabled = (run.deadline < run.costRest) || !run.active;
}

function updateRunUI(){
  const s = run.stats;
  const sup = run.supports?.map(x=>`${x.def.name} (Lv ${x.meta.lvl})`).join(', ') || 'None';
  q('#run-summary').innerHTML = `
    <div><b>${run.unit.def.name}</b> • Lv ${run.unit.meta.lvl} • ${run.unit.def.arche}</div>
    <div><b>${run.weapon.def.name}</b> • Lv ${run.weapon.meta.lvl}</div>
    <div>Support: ${sup}</div>`;
  q('#run-stats').innerHTML = `
    <div>POW ${s.pow} • SPD ${s.spd} • FOC ${s.foc} • GRT ${s.grt}</div>`;
  q('#run-stage').textContent = `Stage ${run.stage} / ${run.maxStage} • Stamina ${run.stamina}`;
  updateDeadlineUI();
}

// Spend time; if time runs out, force battle
function spendTime(cost, causeLabel){
  run.deadline -= cost;
  updateDeadlineUI();
  log(`⏳ Time spent: -${cost} (${causeLabel}). Time Left: ${Math.max(0, run.deadline)}.`);
  if (run.deadline <= 0){
    log('⏰ Deadline reached! Forced battle.');
    // Avoid re-entrant actions: immediately start forced battle
    battleStage(true);
    return false;
  }
  return true;
}

// --- Training: choose exact stat ---
function trainOnce(which){
  if (!run.active) return;
  if (run.stamina<=0){ log('😓 Too tired to train. Rest or Battle.'); return; }
  if (!['pow','spd','foc','grt'].includes(which)) which='pow';

  const before = {...run.stats};
  run.stamina--;

  const baseGain = 2;
  let boost = 0, pieces = [];
  for (const s of run.supports||[]){
    const t = s.def.train;
    const part = (which==='pow'?t.pow:which==='spd'?t.spd:which==='foc'?t.foc:t.grt) * (1 + 0.02*(s.meta.lvl-1));
    if (part>0) pieces.push(`${s.def.name}+${Math.round(part*100)}%`);
    boost += part;
    s.meta.exp += 1;
    if (tryLevelSupport(s.meta)) log(`⬆️ Support ${s.def.name} leveled to Lv ${s.meta.lvl}.`);
  }
  const gain = Math.round(baseGain * (1 + boost));
  run.stats[which] += gain;

  updateRunUI();
  const boostStr = pieces.length? ` (boosts: ${pieces.join(', ')})` : '';
  log(`💪 Training ${which.toUpperCase()}: base +${baseGain}${boost>0?` with +${Math.round(boost*100)}%`:""} → +${gain}${boostStr}.`);
  log(`Stats: POW ${before.pow}→${run.stats.pow} | SPD ${before.spd}→${run.stats.spd} | FOC ${before.foc}→${run.stats.foc} | GRT ${before.grt}→${run.stats.grt}`);

  spendTime(run.costTrain, `Training ${which.toUpperCase()}`);
}

function restOnce(){
  if (!run.active) return;
  if (run.deadline < run.costRest){ log('⛔ Not enough time left to Rest.'); return; }

  const before = run.stamina;
  run.stamina = Math.min(5, run.stamina+2);
  for (const s of run.supports||[]){
    s.meta.exp += 1;
    if (tryLevelSupport(s.meta)) log(`⬆️ Support ${s.def.name} leveled to Lv ${s.meta.lvl}.`);
  }
  updateRunUI();
  log(`🛌 Rested: Stamina ${before}→${run.stamina}.`);

  spendTime(run.costRest, 'Rest');
}

function battleStage(forced=false){
  if (!run.active && !forced) return; // allow forced battle to run even if run.active was toggled

  // Enemy difficulty
  const d = run.stage;
  const enemy = {
    pow: 6 + d*2,
    spd: 5 + d*2,
    foc: 5 + Math.floor(d*1.8),
    grt: 7 + Math.floor(d*2.2),
  };

  // Support damage bonus
  let supDmg = 0, dmgPieces = [];
  for (const s of run.supports||[]){
    const part = s.def.dmg * (1 + 0.02*(s.meta.lvl-1));
    if (part>0) dmgPieces.push(`${s.def.name}+${Math.round(part*100)}%`);
    supDmg += part;
    s.meta.exp += 1;
    if (tryLevelSupport(s.meta)) log(`⬆️ Support ${s.def.name} leveled to Lv ${s.meta.lvl}.`);
  }

  const atkScore = run.stats.pow*1.0 + run.stats.spd*0.6 + run.stats.foc*0.8;
  const defScore = enemy.grt*1.0 + enemy.spd*0.4;
  const playerScore = atkScore * (1 + supDmg);
  const enemyScore = enemy.pow*1.0 + enemy.spd*0.6 + enemy.foc*0.8;
  const playerDef  = (run.stats.grt*1.0 + run.stats.spd*0.4);
  const playerEffective = playerScore - defScore;
  const enemyEffective  = enemyScore - playerDef;
  const randomness = (Math.random()*10 - 5);
  const margin = playerEffective - enemyEffective + randomness;

  // Detailed logs
  log(`⚔️ ${forced ? 'Forced ' : ''}Battle — Stage ${run.stage}`);
  if (forced) log('• Reason: Time Left reached 0.');
  log(`• Enemy Stats → POW ${enemy.pow} | SPD ${enemy.spd} | FOC ${enemy.foc} | GRT ${enemy.grt}`);
  log(`• Player Scores → ATK ${atkScore.toFixed(1)} (DMG bonus +${Math.round(supDmg*100)}%${dmgPieces.length?`; ${dmgPieces.join(', ')}`:''}) vs Enemy DEF ${defScore.toFixed(1)}`);
  log(`• Enemy Score → ${enemyScore.toFixed(1)} vs Player DEF ${playerDef.toFixed(1)}`);
  log(`• Effective → You ${playerEffective.toFixed(1)} | Enemy ${enemyEffective.toFixed(1)} | RNG ${randomness.toFixed(1)} | Margin ${margin.toFixed(1)}`);

  const report = {
    stage: run.stage,
    victory: margin >= 0,
    margin: Number(margin.toFixed(1)),
    rng: Number(randomness.toFixed(1)),
    forced,
    player: {
      stats: {...run.stats},
      atkScore: Number(atkScore.toFixed(1)),
      defScore: Number(playerDef.toFixed(1)),
      supDmgPct: Math.round(supDmg*100),
      supBreakdown: dmgPieces,
    },
    enemy: {
      stats: enemy,
      atkScore: Number(enemyScore.toFixed(1)),
      defScore: Number(defScore.toFixed(1)),
    }
  };
  run.lastReport = report;

  if (report.victory){
    // Win
    const goldGain = 80 + run.stage*20;
    const matGain  = 3 + Math.floor(run.stage/2);
    profile.gold += goldGain; profile.mats += matGain;

    run.unit.meta.exp += 2;
    run.weapon.meta.exp += 2;
    const unitUp   = tryLevelUnit(run.unit.meta);
    const weaponUp = tryLevelWeapon(run.weapon.meta);

    renderWallet(); renderInventory();

    log(`✅ Victory! Rewards → +${goldGain} gold, +${matGain} mats.`);
    if (unitUp)   log(`⬆️ ${run.unit.def.name} is now Lv ${run.unit.meta.lvl}.`);
    if (weaponUp) log(`⬆️ ${run.weapon.def.name} is now Lv ${run.weapon.meta.lvl}.`);

    if (run.stage >= run.maxStage){
      log(`🏆 Run complete! Cleared all ${run.maxStage} stages.`);
      showSummaryModal('Victory', buildSummaryText(report, {gold:goldGain, mats:matGain, final:true}));
      run.active = false;
      return;
    }
    run.stage++;
    const oldStam = run.stamina;
    run.stamina = Math.min(5, run.stamina+1);
    resetDeadline(); // new stage → reset time
    updateRunUI();
    log(`➡️ Proceed to Stage ${run.stage}. Stamina ${oldStam}→${run.stamina}. Time reset to ${run.deadlineMax}.`);
  } else {
    log(`❌ Defeat at Stage ${run.stage}.`);
    showSummaryModal('Defeat', buildSummaryText(report, {gold:0, mats:0, final:false}));
    run.active = false;
  }
}

function buildSummaryText(report, rewards){
  const p = report.player, e = report.enemy;
  const sup = (p.supBreakdown && p.supBreakdown.length) ? `\n• Support DMG: +${p.supDmgPct}% (${p.supBreakdown.join(', ')})` : `\n• Support DMG: +${p.supDmgPct}%`;
  const forcedLine = report.forced ? `\n• Forced Battle: Time Left reached 0` : '';
  const base =
`Stage ${report.stage} — ${report.victory ? 'VICTORY' : 'DEFEAT'}
Margin: ${report.margin} (RNG ${report.rng})${forcedLine}

Player
• Stats: POW ${p.stats.pow} | SPD ${p.stats.spd} | FOC ${p.stats.foc} | GRT ${p.stats.grt}
• ATK Score: ${p.atkScore}  | DEF Score: ${p.defScore}${sup}

Enemy
• Stats: POW ${e.stats.pow} | SPD ${e.stats.spd} | FOC ${e.stats.foc} | GRT ${e.stats.grt}
• ATK Score: ${e.atkScore}  | DEF Score: ${e.defScore}`;

  const rewardLine = (rewards && (rewards.gold>0 || rewards.mats>0))
    ? `\n\nRewards\n• +${rewards.gold} gold, +${rewards.mats} mats`
    : '';

  const hint = report.victory
    ? (rewards.final ? `\n\nRun complete! Press Confirm to return.` : ``)
    : `\n\nWhy you lost
• Your effective ${p.atkScore - e.defScore >= 0 ? 'defense was lower than enemy attack' : 'attack was lower than enemy defense'}.
• Consider training ${p.atkScore - e.defScore < e.atkScore - p.defScore ? 'POW/FOC' : 'GRT/SPD'} next time, or slot supports that boost those.
${report.forced ? '• You ran out of Time. Try battling earlier or spending fewer Rests.' : ''}`;

  return base + rewardLine + hint;
}

// ------- Summary Modal -------
const modal = q('#summary-modal');
const modalTitle = q('#summary-title');
const modalBody = q('#summary-body');
const modalConfirm = q('#btn-summary-confirm');

function showSummaryModal(title, text){
  modalTitle.textContent = `Run Summary — ${title}`;
  modalBody.textContent = text;
  modal.classList.remove('hidden');
  setTimeout(()=>modalConfirm.focus(), 0);
}

modalConfirm.addEventListener('click', ()=>{
  modal.classList.add('hidden');
  // After confirmation, return to setup screen and reset UI
  q('#career-run').classList.add('hidden');
  q('#career-setup').classList.remove('hidden');
  rebuildPickers();
  renderInventory();
  updateRunUI();
});

// ------- Manual end (abandon) still asks for confirm summary -------
q('#btn-abandon').addEventListener('click', ()=>{
  if (!run.active){
    modal.classList.add('hidden');
    q('#career-run').classList.add('hidden');
    q('#career-setup').classList.remove('hidden');
    rebuildPickers(); renderInventory(); updateRunUI();
    return;
  }
  const report = {
    stage: run.stage,
    victory: false,
    margin: 0,
    rng: 0,
    forced: false,
    player: { stats:{...run.stats}, atkScore:0, defScore:0, supDmgPct:0, supBreakdown:[] },
    enemy:  { stats:{pow:0,spd:0,foc:0,grt:0}, atkScore:0, defScore:0 }
  };
  showSummaryModal('Abandoned', buildSummaryText(report, {gold:0,mats:0}));
  run.active = false;
});

// ------- UI wires -------
q('#btn-grant-starter').addEventListener('click', grantStarter);
q('#start-run').addEventListener('click', startRun);

// Training buttons
qa('[data-train]').forEach(b=>{
  b.addEventListener('click', ()=>trainOnce(b.getAttribute('data-train')));
});

q('#btn-rest').addEventListener('click', restOnce);
q('#btn-battle').addEventListener('click', ()=>battleStage(false));

q('#btn-save').addEventListener('click', save);
q('#btn-load').addEventListener('click', load);
q('#btn-wipe').addEventListener('click', wipe);

// ------- Boot -------
attachGacha();
renderWallet();
renderInventory();
rebuildPickers();
load(); // auto-load if present
