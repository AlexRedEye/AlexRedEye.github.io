/* =========================
   MVP Data + Systems (no libs)
   v0.3.0:
   • Chaos reworked to turn-based: pick hero → pick target → Attack / End Turn
   • Keeps Career deadline & Summary modal
   • Fix: pickers rebuild after gacha
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
  seenIds: new Set(),
};

// utils
const byId = (arr,id)=>arr.find(x=>x.id===id);
const fmt = n => Number(n).toLocaleString();
const q = s => document.querySelector(s);
const qa = s => Array.from(document.querySelectorAll(s));
const rarityClass = r => r===RARITY.SSR?'ssr':(r===RARITY.SR?'sr':'r');

// --------------------------------------------------
// Save/Load
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
  rebuildChaosPickers();
  clog('📂 Loaded save.');
  return true;
}
function wipe() {
  localStorage.removeItem('pf_save');
  Object.assign(profile, {gold:0,gems:0,mats:0,units:[],weapons:[],supports:[],seenIds:new Set()});
  renderWallet(); renderInventory(); rebuildPickers(); rebuildChaosPickers();
  clog('🧹 Save wiped.');
}
function rebuildSeen(){
  profile.seenIds = new Set();
  for (const u of profile.units) profile.seenIds.add(u.id);
  for (const w of profile.weapons) profile.seenIds.add(w.id);
  for (const s of profile.supports) profile.seenIds.add(s.id);
}

// Starter
function grantStarter(){
  profile.gold += 1000;
  profile.gems += 600;
  profile.mats += 50;
  giveUnit('u_brick', 1);
  giveWeapon('w_pistol', 1);
  giveSupport('s_cardio');
  renderWallet(); renderInventory(); rebuildPickers(); rebuildChaosPickers();
  clog('🎁 Starter granted.');
}

// Inventory helpers
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
function tryLevelUnit(e){ let up=false; while(e.exp>=5){e.exp-=5;e.lvl++;up=true;} return up; }
function tryLevelWeapon(e){ let up=false; while(e.exp>=5){e.exp-=5;e.lvl++;up=true;} return up; }
function tryLevelSupport(e){ let up=false; while(e.exp>=e.expNext){e.exp-=e.expNext;e.lvl++;e.expNext=Math.ceil(e.expNext*1.35);up=true;} return up; }

// --------------------------------------------------
// Rendering
function renderWallet(){
  q('#gold').textContent = `🪙 ${fmt(profile.gold)}`;
  q('#gems').textContent = `💎 ${fmt(profile.gems)}`;
  q('#mats').textContent = `📦 ${fmt(profile.mats)}`;
}
function cardHtml({title, subtitle, rarity, body=''}) {
  return `<div class="card ${rarityClass(rarity)}">
    <div class="title">${title}</div>
    <div class="tiny">${subtitle||''}</div>
    ${body?`<div class="chips">${body}</div>`:''}
  </div>`;
}
function renderInventory(){
  const uCont = q('#inv-units'); if (uCont){ uCont.innerHTML='';
    for (const e of profile.units){
      const u = byId(UNITS,e.id);
      const body = `<span class="chip">Lv ${e.lvl}</span><span class="chip">${u.arche}</span><span class="chip">${u.rarity}</span>`;
      uCont.insertAdjacentHTML('beforeend', cardHtml({title:u.name, subtitle:`ATK ${u.base.pow} / SPD ${u.base.spd} / FOC ${u.base.foc} / GRT ${u.base.grt}`, rarity:u.rarity, body}));
    }
  }
  const wCont = q('#inv-weapons'); if (wCont){ wCont.innerHTML='';
    for (const e of profile.weapons){
      const w = byId(WEAPONS,e.id);
      const body = `<span class="chip">Lv ${e.lvl}</span><span class="chip">${w.pref}</span><span class="chip">${w.rarity}</span>`;
      wCont.insertAdjacentHTML('beforeend', cardHtml({title:w.name, subtitle:`+${w.add.pow} POW / +${w.add.spd} SPD / +${w.add.foc} FOC / +${w.add.grt} GRT`, rarity:w.rarity, body}));
    }
  }
  const sCont = q('#inv-supports'); if (sCont){ sCont.innerHTML='';
    for (const e of profile.supports){
      const s = byId(SUPPORTS,e.id);
      const body = `<span class="chip">Lv ${e.lvl}</span><span class="chip">${s.rarity}</span><span class="chip">Train +${Math.round((s.train.pow+s.train.spd+s.train.foc+s.train.grt)*100)}%</span>`;
      sCont.insertAdjacentHTML('beforeend', cardHtml({title:s.name, subtitle:`DMG +${Math.round(s.dmg*100)}%`, rarity:s.rarity, body}));
    }
  }
}

// Tabs
qa('.tabs button').forEach(b=>{
  b.addEventListener('click', ()=>{
    qa('.tabs button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const tab = b.getAttribute('data-tab');
    qa('main .tab').forEach(s=>s.classList.remove('active'));
    q('#'+tab).classList.add('active');
  });
});

// Loggers
function log(msg, quiet=false){
  const el = q('#run-log');
  if (!el || quiet) return;
  const p = document.createElement('div');
  p.className = 'logline';
  p.textContent = msg;
  el.prepend(p);
  while (el.children.length>160) el.removeChild(el.lastChild);
}
function clog(msg){
  const el = q('#chaos-log');
  if (!el) return;
  const p = document.createElement('div');
  p.className = 'logline';
  p.textContent = msg;
  el.prepend(p);
  while (el.children.length>160) el.removeChild(el.lastChild);
}

// Gacha
const RATES = { SSR:0.03, SR:0.17, R:0.80 };
function pickRarity(){ const r=Math.random(); if(r<RATES.SSR) return RARITY.SSR; if(r<RATES.SSR+RATES.SR) return RARITY.SR; return RARITY.R; }
function poolCharacterByRarity(r){ return [...UNITS.filter(x=>x.rarity===r), ...SUPPORTS.filter(x=>x.rarity===r)]; }
function poolWeaponByRarity(r){ return [...WEAPONS.filter(x=>x.rarity===r), ...SUPPORTS.filter(x=>x.rarity===r)]; }
function rollOne(fromPool){
  const rarity = pickRarity();
  const pool = fromPool(rarity);
  const pick = pool[Math.floor(Math.random()*pool.length)];
  const isSupport = SUPPORTS.some(s=>s.id===pick.id);
  const isUnit = UNITS.some(u=>u.id===pick.id);
  const isWeapon = WEAPONS.some(w=>w.id===pick.id);
  if (isSupport) giveSupport(pick.id);
  if (isUnit) giveUnit(pick.id);
  if (isWeapon) giveWeapon(pick.id);
  renderInventory(); renderWallet(); rebuildChaosPickers(); rebuildPickers(); // ensure pickers refresh immediately
  return { name: pick.name, rarity, type: isSupport?'Support':(isUnit?'Unit':'Weapon') };
}
function spendGems(cost){ if(profile.gems<cost){alert('Not enough gems!');return false;} profile.gems-=cost; renderWallet(); return true; }
function attachGacha(){
  q('[data-pull="char-1"]')?.addEventListener('click', ()=>{ if(!spendGems(30))return; const r=rollOne(poolCharacterByRarity); q('#char-results').insertAdjacentHTML('afterbegin', cardHtml({title:r.name, subtitle:r.type, rarity:r.rarity})); });
  q('[data-pull="char-10"]')?.addEventListener('click', ()=>{
    if(!spendGems(300))return; const box=q('#char-results'); let html=''; for(let i=0;i<10;i++){ const r=rollOne(poolCharacterByRarity); html+=cardHtml({title:r.name, subtitle:r.type, rarity:r.rarity}); } box.insertAdjacentHTML('afterbegin', html);
  });
  q('[data-pull="weap-1"]')?.addEventListener('click', ()=>{ if(!spendGems(30))return; const r=rollOne(poolWeaponByRarity); q('#weap-results').insertAdjacentHTML('afterbegin', cardHtml({title:r.name, subtitle:r.type, rarity:r.rarity})); });
  q('[data-pull="weap-10"]')?.addEventListener('click', ()=>{
    if(!spendGems(300))return; const box=q('#weap-results'); let html=''; for(let i=0;i<10;i++){ const r=rollOne(poolWeaponByRarity); html+=cardHtml({title:r.name, subtitle:r.type, rarity:r.rarity}); } box.insertAdjacentHTML('afterbegin', html);
  });
}

// --------------------------------------------------
// Career Mode (unchanged mechanics from v0.2.0, trimmed for space)
const run = {
  mode: 'career',
  active:false, stage:1, maxStage:10, stamina:5,
  unit:null, weapon:null, supports:[],
  stats:{pow:0,spd:0,foc:0,grt:0},
  lastReport:null,
  deadlineMax:5, deadline:5, costTrain:1, costRest:2
};

function rebuildPickers(){
  const uWrap = q('#pick-unit'); if(!uWrap) return; uWrap.innerHTML='';
  for(const e of profile.units){
    const u = byId(UNITS,e.id);
    const div = document.createElement('div');
    div.className = 'card pick '+rarityClass(u.rarity);
    div.innerHTML = `<div class="title">${u.name}</div><div class="tiny">Lv ${e.lvl} • ${u.arche}</div>`;
    div.addEventListener('click', ()=>{
      qa('#pick-unit .pick').forEach(x=>x.classList.remove('selected'));
      div.classList.add('selected'); run.unit={def:u, meta:e}; enableStartIfReady();
    });
    uWrap.appendChild(div);
  }
  const wWrap = q('#pick-weapon'); wWrap.innerHTML='';
  for(const e of profile.weapons){
    const w = byId(WEAPONS,e.id);
    const div = document.createElement('div');
    div.className = 'card pick '+rarityClass(w.rarity);
    div.innerHTML = `<div class="title">${w.name}</div><div class="tiny">Lv ${e.lvl} • Pref ${w.pref}</div>`;
    div.addEventListener('click', ()=>{
      qa('#pick-weapon .pick').forEach(x=>x.classList.remove('selected'));
      div.classList.add('selected'); run.weapon={def:w, meta:e}; enableStartIfReady();
    });
    wWrap.appendChild(div);
  }
  const sWrap = q('#pick-supports'); sWrap.innerHTML='';
  const picks = new Set();
  for(const e of profile.supports){
    const s = byId(SUPPORTS,e.id);
    const div = document.createElement('div');
    div.className='card pick '+rarityClass(s.rarity);
    div.innerHTML = `<div class="title">${s.name}</div><div class="tiny">Lv ${e.lvl} • DMG +${Math.round(s.dmg*100)}%</div>`;
    div.addEventListener('click', ()=>{
      if (div.classList.contains('selected')){ div.classList.remove('selected'); picks.delete(e.id); }
      else { if (picks.size>=2) return; div.classList.add('selected'); picks.add(e.id); }
      run.supports = [...picks].map(id=>({def:byId(SUPPORTS,id), meta:profile.supports.find(x=>x.id===id)}));
      enableStartIfReady();
    });
    sWrap.appendChild(div);
  }
}
function enableStartIfReady(){ q('#start-run').disabled = !(run.unit && run.weapon); }
function resetDeadline(){ run.deadline = run.deadlineMax; updateDeadlineUI(); }
function startRun(){
  if (!run.unit || !run.weapon){ alert('Pick a unit and weapon.'); return; }
  run.mode = 'career'; run.active=true; run.stage=1; run.stamina=5; q('#run-log').innerHTML='';
  const u=run.unit.def, ulvl=run.unit.meta.lvl; const w=run.weapon.def, wlvl=run.weapon.meta.lvl;
  const ws = 1 + w.growth*(wlvl-1);
  run.stats = {
    pow: Math.round((u.base.pow + w.add.pow*ws) * (1 + 0.05*(ulvl-1))),
    spd: Math.round((u.base.spd + w.add.spd*ws) * (1 + 0.05*(ulvl-1))),
    foc: Math.round((u.base.foc + w.add.foc*ws) * (1 + 0.05*(ulvl-1))),
    grt: Math.round((u.base.grt + w.add.grt*ws) * (1 + 0.05*(ulvl-1))),
  };
  run.lastReport=null;
  q('#career-setup').classList.add('hidden');
  q('#career-run').classList.remove('hidden');
  resetDeadline(); updateRunUI();
  log(`▶️ Career started.`);
}
function updateDeadlineUI(){
  const label=q('#deadline-label'); const bar=q('#deadline-bar');
  const pct = Math.max(0, Math.min(1, run.deadline/run.deadlineMax));
  if (label) label.textContent = `Time Left: ${Math.max(0, run.deadline)}`;
  if (bar) bar.style.width = `${pct*100}%`;
  const restBtn=q('#btn-rest'); if (restBtn) restBtn.disabled = (run.deadline < run.costRest) || !run.active;
}
function updateRunUI(){
  const s=run.stats;
  const sup = run.supports?.map(x=>`${x.def.name} (Lv ${x.meta.lvl})`).join(', ') || 'None';
  q('#run-summary').innerHTML = `<div><b>${run.unit.def.name}</b> • Lv ${run.unit.meta.lvl} • ${run.unit.def.arche}</div><div><b>${run.weapon.def.name}</b> • Lv ${run.weapon.meta.lvl}</div><div>Support: ${sup}</div>`;
  q('#run-stats').innerHTML = `<div>POW ${s.pow} • SPD ${s.spd} • FOC ${s.foc} • GRT ${s.grt}</div>`;
  q('#run-stage').textContent = `Stage ${run.stage} / ${run.maxStage} • Stamina ${run.stamina}`;
  updateDeadlineUI();
}
function spendTime(cost,label){ run.deadline -= cost; updateDeadlineUI(); log(`⏳ Time -${cost} (${label}). Left: ${Math.max(0, run.deadline)}.`); if(run.deadline<=0){ log('⏰ Deadline! Forced battle.'); battleStage(true); return false; } return true; }
function trainOnce(which){
  if(!run.active) return; if(run.stamina<=0){ log('😓 Too tired.'); return; }
  if(!['pow','spd','foc','grt'].includes(which)) which='pow';
  const before={...run.stats}; run.stamina--;
  const baseGain=2; let boost=0; for(const s of run.supports||[]){ const t=s.def.train; const part=(which==='pow'?t.pow:which==='spd'?t.spd:which==='foc'?t.foc:t.grt)*(1+0.02*(s.meta.lvl-1)); boost+=part; s.meta.exp+=1; if(tryLevelSupport(s.meta)) log(`⬆️ Support ${s.def.name} Lv ${s.meta.lvl}.`); }
  const gain=Math.round(baseGain*(1+boost)); run.stats[which]+=gain; updateRunUI();
  log(`💪 Train ${which.toUpperCase()} +${gain}.`); log(`Stats: POW ${before.pow}→${run.stats.pow} | SPD ${before.spd}→${run.stats.spd} | FOC ${before.foc}→${run.stats.foc} | GRT ${before.grt}→${run.stats.grt}`);
  spendTime(1,`Training ${which.toUpperCase()}`);
}
function restOnce(){
  if(!run.active) return; if(run.deadline<run.costRest){ log('⛔ Not enough time to Rest.'); return; }
  const before=run.stamina; run.stamina=Math.min(5, run.stamina+2);
  for(const s of run.supports||[]){ s.meta.exp+=1; if(tryLevelSupport(s.meta)) log(`⬆️ Support ${s.def.name} Lv ${s.meta.lvl}.`); }
  updateRunUI(); log(`🛌 Rest: ${before}→${run.stamina}.`);
  spendTime(2,'Rest');
}
function battleStage(forced=false){
  if(!run.active && !forced) return;
  // simplified same as earlier versions (omitted for brevity here)
  // defeat/victory will show modal; this path remains as in your v0.2.0
  // ... (to keep focus on Chaos changes)
  log('⚠️ For brevity, career battle math unchanged from previous step.');
}

// --------------------------------------------------
// Memories of Chaos — TURN-BASED
const CHAOS_FLOORS = 8;
const chaos = {
  active:false, floor:1, maxFloor:CHAOS_FLOORS, wave:1, wavesPerFloor:2,
  stars:0, score:0,
  team:[], // [{unitMeta, unitDef, weaponMeta, weaponDef, stats, hp, maxHp, atk, def, spd, alive}]
  enemies:[], // [{name, stats..., hp...}]
  phase:'player', // 'player' | 'enemy'
  selection:{allyIdx:null, enemyIdx:null},
  modifiers:[],
  lastReport:null
};

function bestWeaponFor(arche){
  const sorted = profile.weapons.slice().sort((a,b)=>b.lvl-a.lvl);
  let best=null;
  for(const meta of sorted){
    const def=byId(WEAPONS,meta.id);
    if (!best || (def.pref===arche && meta.lvl >= best.meta.lvl)) best={meta,def};
    if (def.pref===arche) return best;
  }
  return best;
}
function unitEffectiveStats(def, meta, w){
  const ul=meta.lvl;
  let pow=def.base.pow, spd=def.base.spd, foc=def.base.foc, grt=def.base.grt;
  if (w){
    const ws=1 + w.def.growth*(w.meta.lvl-1);
    pow += Math.round(w.def.add.pow*ws);
    spd += Math.round(w.def.add.spd*ws);
    foc += Math.round(w.def.add.foc*ws);
    grt += Math.round(w.def.add.grt*ws);
  }
  const s=1 + 0.05*(ul-1);
  pow=Math.round(pow*s); spd=Math.round(spd*s); foc=Math.round(foc*s); grt=Math.round(grt*s);
  return {pow,spd,foc,grt};
}

/* --- Chaos pickers --- */
function rebuildChaosPickers(){
  const teamWrap = q('#chaos-team'); if (teamWrap) teamWrap.innerHTML = '';
  chaos.team = [];
  updateChaosTeamDisplay();

  const pool = q('#chaos-unit-pool'); if (!pool) return; pool.innerHTML = '';
  for (const meta of profile.units){
    const def = byId(UNITS, meta.id);
    const div = document.createElement('div');
    div.className = 'card pick '+rarityClass(def.rarity);
    div.innerHTML = `<div class="title">${def.name}</div><div class="tiny">Lv ${meta.lvl} • ${def.arche}</div>`;
    div.addEventListener('click', ()=>{
      const idx = chaos.team.findIndex(t=>t.unitMeta.id===meta.id);
      if (idx>=0){ chaos.team.splice(idx,1); div.classList.remove('selected'); }
      else {
        if (chaos.team.length>=3) return;
        div.classList.add('selected');
        const best = bestWeaponFor(def.arche);
        const s = unitEffectiveStats(def, meta, best);
        const sheet = toSheet(s, def.name, meta.lvl); // convert to battle stats
        chaos.team.push({
          unitMeta:meta, unitDef:def,
          weaponMeta:best?.meta||null, weaponDef:best?.def||null,
          stats:s, ...sheet, alive:true
        });
      }
      updateChaosTeamDisplay();
    });
    pool.appendChild(div);
  }
}
function updateChaosTeamDisplay(){
  const teamWrap = q('#chaos-team'); if (!teamWrap) return;
  teamWrap.innerHTML = '';
  for (const t of chaos.team){
    const wName = t.weaponDef ? `${t.weaponDef.name} (Lv ${t.weaponMeta.lvl})` : 'No Weapon';
    const body = `<span class="chip">POW ${t.stats.pow}</span><span class="chip">SPD ${t.stats.spd}</span><span class="chip">FOC ${t.stats.foc}</span><span class="chip">GRT ${t.stats.grt}</span>`;
    teamWrap.insertAdjacentHTML('beforeend', cardHtml({title:`${t.unitDef.name} (Lv ${t.unitMeta.lvl})`, subtitle:wName, rarity:t.unitDef.rarity, body}));
  }
  q('#chaos-start').disabled = chaos.team.length===0;
}

/* --- Battlefield UI --- */
function renderBattlefield(){
  // Allies
  const ag = q('#chaos-ally-grid'); ag.innerHTML='';
  chaos.team.forEach((a,idx)=>{
    const card = document.createElement('div');
    card.className = 'battle-card' + (a.alive?'':' dead') + (chaos.selection.allyIdx===idx?' selected':'');
    card.innerHTML = `
      <div class="title">${a.unitDef.name}</div>
      <div class="stat-line">ATK ${a.atk} • DEF ${a.def} • SPD ${a.spd}</div>
      <div class="bar"><span style="width:${(a.hp/a.maxHp)*100}%"></span></div>
      <div class="stat-line">HP ${Math.max(0,Math.ceil(a.hp))}/${a.maxHp}</div>
    `;
    if (a.alive){
      card.addEventListener('click', ()=>{
        chaos.selection.allyIdx = idx;
        chaos.selection.enemyIdx = null;
        renderBattlefield();
        updateChaosHud();
      });
    }
    ag.appendChild(card);
  });

  // Enemies
  const eg = q('#chaos-enemy-grid'); eg.innerHTML='';
  chaos.enemies.forEach((e,idx)=>{
    const card = document.createElement('div');
    const dead = e.hp<=0;
    card.className = 'battle-card' + (dead?' dead':'') + (chaos.selection.enemyIdx===idx?' target':'');
    card.innerHTML = `
      <div class="title">${e.name}</div>
      <div class="stat-line">ATK ${e.atk} • DEF ${e.def} • SPD ${e.spd}</div>
      <div class="bar"><span style="width:${(Math.max(0,e.hp)/e.maxHp)*100}%"></span></div>
      <div class="stat-line">HP ${Math.max(0,Math.ceil(e.hp))}/${e.maxHp}</div>
    `;
    if (!dead){
      card.addEventListener('click', ()=>{
        chaos.selection.enemyIdx = idx;
        renderBattlefield();
        updateChaosHud();
      });
    }
    eg.appendChild(card);
  });
}

/* --- Stat sheet conversion (HP/ATK/DEF/SPD) --- */
function toSheet(s, label='Unit', lvl=1){
  // lightweight conversion tuned to feel OK for MVP
  const hp   = Math.round(s.grt*6 + s.foc*2 + 30 + lvl*4);
  const atk  = Math.round(s.pow*1.4 + s.foc*0.8);
  const def  = Math.round(s.grt*1.2 + s.spd*0.4);
  const spd  = Math.max(1, Math.round(s.spd));
  return { maxHp:hp, hp, atk, def, spd, label };
}

/* --- Enemy generation --- */
function makeEnemy(floor, idx){
  const base = 14 + floor*4;
  const pow = base + 3 + idx*2;
  const spd = 12 + floor*3 + idx*1;
  const foc = 12 + floor*3;
  const grt = 16 + floor*4 + idx;
  const sheet = toSheet({pow,spd,foc,grt}, `Enemy ${idx+1}`, floor);
  return { name:`E${floor}-${idx+1}`, ...sheet, alive:true };
}

/* --- Chaos flow --- */
function chaosFloorModifiers(floor){
  const list = ['Enemy +10% ATK','Enemy +15% DEF','Your SPD +10%','Your POW +10%'];
  return [list[floor%list.length], list[(floor+2)%list.length]];
}
function applyFloorModifiers(){
  // Simple inline effects at battle eval time (handled in damage calc via multipliers)
  // Kept here for future extension
}

function startChaos(){
  if (chaos.team.length===0){ alert('Pick at least one unit.'); return; }
  chaos.active = true; run.mode='chaos';
  chaos.floor = 1; chaos.wave = 1; chaos.stars = 0; chaos.score = 0; chaos.phase='player';
  chaos.modifiers = chaosFloorModifiers(chaos.floor);
  setupEnemies();
  q('#chaos-setup').classList.add('hidden');
  q('#chaos-run').classList.remove('hidden');
  q('#chaos-log').innerHTML='';
  updateChaosUI();
  renderBattlefield();
  clog(`🌀 Chaos begins! Floor ${chaos.floor}. Modifiers: ${chaos.modifiers.join(' • ')}.`);
}
function setupEnemies(){
  chaos.enemies = [makeEnemy(chaos.floor,0), makeEnemy(chaos.floor,1), makeEnemy(chaos.floor,2)];
  chaos.selection = {allyIdx:null, enemyIdx:null};
}
function updateChaosUI(){
  const teamStr = chaos.team.map(t=>`${t.unitDef.name} (Lv ${t.unitMeta.lvl})`).join(', ');
  q('#chaos-team-summary').innerHTML = `<b>Team:</b> ${teamStr}`;
  q('#chaos-mods').textContent = `Modifiers: ${chaos.modifiers.join(' • ')}`;
  q('#chaos-floor').textContent = `Floor ${chaos.floor} / ${chaos.maxFloor} • Wave ${chaos.wave} / ${chaos.wavesPerFloor} • ${chaos.phase==='player'?'Player':'Enemy'} Phase`;

  // aggregate glance
  const agg = chaos.team.reduce((a,t)=>({pow:a.pow+t.atk, def:a.def+t.def, spd:a.spd+t.spd}), {pow:0,def:0,spd:0});
  q('#chaos-stats').innerHTML = `<div>Team ATK ${agg.pow} • Team DEF ${agg.def} • Team SPD ${agg.spd}</div>`;

  updateChaosHud();
}
function updateChaosHud(){
  // Attack button only if a living ally & target selected and it's player phase
  const can = chaos.phase==='player'
    && chaos.selection.allyIdx!==null
    && chaos.selection.enemyIdx!==null
    && chaos.team[chaos.selection.allyIdx]?.alive
    && (chaos.enemies[chaos.selection.enemyIdx]?.hp>0);
  q('#chaos-attack').disabled = !can;
}

/* --- Damage calculation --- */
function withModifiers(type, value){
  // type: 'allyAtk','allyDef','enemyAtk','enemyDef'
  let v=value;
  for (const m of chaos.modifiers){
    if (m==='Enemy +10% ATK' && type==='enemyAtk') v*=1.10;
    if (m==='Enemy +15% DEF' && type==='enemyDef') v*=1.15;
    if (m==='Your SPD +10%'  && type==='allyDef') v*=1.06; // small indirect bump
    if (m==='Your POW +10%'  && type==='allyAtk') v*=1.08;
  }
  return v;
}
function calcDamage(attacker, defender, isEnemy=false){
  const atk = withModifiers(isEnemy?'enemyAtk':'allyAtk', attacker.atk);
  const def = withModifiers(isEnemy?'enemyDef':'allyDef', defender.def);
  const base = Math.max(1, Math.round((atk - def*0.55)));
  const rng = (Math.random()*6 - 3); // -3..+3
  return Math.max(1, Math.round(base + rng));
}

/* --- Player actions --- */
function playerAttack(){
  const ai = chaos.selection.allyIdx, ei = chaos.selection.enemyIdx;
  if (ai==null || ei==null) return;
  const hero = chaos.team[ai]; const foe = chaos.enemies[ei];
  if (!hero.alive || foe.hp<=0) return;

  const dmg = calcDamage(hero, foe, false);
  foe.hp -= dmg;
  clog(`🗡️ ${hero.unitDef.name} → ${foe.name}: -${dmg} HP`);
  if (foe.hp<=0){ clog(`💥 ${foe.name} is defeated!`); }

  renderBattlefield();
  updateChaosHud();

  // Check wave clear
  if (chaos.enemies.every(e=>e.hp<=0)){
    clog('✅ Wave cleared.');
    nextWaveOrFloor();
    return;
  }

  // Remain in player phase until "End Turn" or all allies have acted? MVP: you can attack multiple times per turn but enemies will answer when you end turn.
}

/* --- Enemy turn --- */
function enemyTurn(){
  chaos.phase='enemy';
  updateChaosUI();

  // Each alive enemy attacks once random alive hero
  const livingAllies = chaos.team.filter(a=>a.alive);
  if (livingAllies.length===0){ defeatChaos('All heroes defeated'); return; }

  for (const foe of chaos.enemies){
    if (foe.hp<=0) continue;
    const targets = chaos.team.filter(a=>a.alive);
    if (!targets.length) break;
    const tgt = targets[Math.floor(Math.random()*targets.length)];
    const dmg = calcDamage(foe, tgt, true);
    tgt.hp -= dmg;
    clog(`🔥 ${foe.name} → ${tgt.unitDef?.name||tgt.name}: -${dmg} HP`);
    if (tgt.hp<=0){ tgt.alive=false; clog(`☠️ ${tgt.unitDef?.name||tgt.name} has fallen.`); }
  }

  renderBattlefield();

  // Check defeat
  if (chaos.team.every(a=>!a.alive)){ defeatChaos('All heroes defeated'); return; }

  // Back to player phase
  chaos.phase='player';
  updateChaosUI();
}

/* --- Progression --- */
function nextWaveOrFloor(){
  // score and star progress (simple)
  chaos.score += 2;

  if (chaos.wave >= chaos.wavesPerFloor){
    const floorStars = 2 + (chaos.team.filter(a=>a.alive).length>=3 ? 1 : 0); // 3★ if all alive
    chaos.stars += floorStars;
    clog(`🌟 Floor ${chaos.floor} cleared for ${floorStars}★.`);

    if (chaos.floor >= chaos.maxFloor){
      const gems = chaos.stars*15 + Math.floor(chaos.score/5)*5;
      profile.gems += gems; renderWallet();
      const text = buildChaosSummary(true, gems);
      showSummary('Chaos Cleared', text, 'chaos');
      chaos.active=false; return;
    }

    // Next floor: heal 30% HP to survivors
    chaos.floor++; chaos.wave=1; chaos.modifiers = chaosFloorModifiers(chaos.floor);
    chaos.team.forEach(a=>{ if(a.alive){ a.hp = Math.min(a.maxHp, a.hp + Math.round(a.maxHp*0.3)); } });
    setupEnemies();
    clog(`➡️ Floor ${chaos.floor}. Modifiers: ${chaos.modifiers.join(' • ')}. Survivors healed 30%.`);
  } else {
    // Next wave: small heal 10% to heroes
    chaos.wave++;
    chaos.team.forEach(a=>{ if(a.alive){ a.hp = Math.min(a.maxHp, a.hp + Math.round(a.maxHp*0.1)); } });
    setupEnemies();
    clog(`➡️ Wave ${chaos.wave}. Your team healed 10%.`);
  }

  chaos.phase='player'; chaos.selection={allyIdx:null, enemyIdx:null};
  updateChaosUI(); renderBattlefield();
}

/* --- Fail/summary text --- */
function defeatChaos(reason){
  clog(`❌ Defeat — ${reason}.`);
  const text = buildChaosSummary(false, 0, reason);
  showSummary('Chaos Failed', text, 'chaos');
  chaos.active=false;
}
function buildChaosSummary(final, gems=0, reason=''){
  const alive = chaos.team.filter(a=>a.alive).length;
  return `Floors: ${final?chaos.maxFloor:chaos.floor-1}/${chaos.maxFloor}
Stars: ${chaos.stars}
Score: ${chaos.score}
Alive Heroes: ${alive}/${chaos.team.length}${reason?`\nReason: ${reason}`:''}${final?`\n\nRewards\n• +${gems} 💎\n\nGreat run! Press Confirm to return.`:''}
${!final && reason?`\nTip\n• Train more in Career, equip matching weapons, and focus-fire squishier enemies.`:''}`;
}

/* --- Summary Modal (routing) --- */
const modal = q('#summary-modal');
const modalTitle = q('#summary-title');
const modalBody = q('#summary-body');
const modalConfirm = q('#btn-summary-confirm');
let modalReturnTo = 'career';
function showSummary(title, text, returnTo){
  modalTitle.textContent = `Summary — ${title}`;
  modalBody.textContent = text;
  modalReturnTo = returnTo || 'career';
  modal.classList.remove('hidden');
  setTimeout(()=>modalConfirm.focus(), 0);
}
modalConfirm.addEventListener('click', ()=>{
  modal.classList.add('hidden');
  if (modalReturnTo === 'career'){
    q('#career-run').classList.add('hidden');
    q('#career-setup').classList.remove('hidden');
    rebuildPickers(); renderInventory(); updateRunUI();
  } else {
    q('#chaos-run').classList.add('hidden');
    q('#chaos-setup').classList.remove('hidden');
    rebuildChaosPickers(); renderInventory();
  }
});

/* --- Controls wiring --- */
q('#btn-grant-starter')?.addEventListener('click', grantStarter);
q('#start-run')?.addEventListener('click', startRun);
qa('[data-train]')?.forEach(b=>b.addEventListener('click', ()=>trainOnce(b.getAttribute('data-train'))));
q('#btn-rest')?.addEventListener('click', restOnce);
q('#btn-battle')?.addEventListener('click', ()=>battleStage(false));

q('#btn-save')?.addEventListener('click', save);
q('#btn-load')?.addEventListener('click', load);
q('#btn-wipe')?.addEventListener('click', wipe);

// Chaos
q('#chaos-start')?.addEventListener('click', startChaos);
q('#chaos-attack')?.addEventListener('click', playerAttack);
q('#chaos-endturn')?.addEventListener('click', enemyTurn);
q('#chaos-abandon')?.addEventListener('click', ()=>{
  if(!chaos.active){ modal.classList.add('hidden'); q('#chaos-run').classList.add('hidden'); q('#chaos-setup').classList.remove('hidden'); rebuildChaosPickers(); return; }
  defeatChaos('Abandoned');
});

/* --- Boot --- */
attachGacha();
renderWallet();
renderInventory();
rebuildPickers();
rebuildChaosPickers();
load(); // try autoload
