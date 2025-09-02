/* =========================
   MVP Data + Systems (no libs)
   v0.2.0:
   • Memories of Chaos mode (team of 3, floors, stars, gem rewards)
   • Keeps Career deadline & Summary modal
   • Modal now returns to the right mode (career/chaos)
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
  log('📂 Loaded.', true);
  return true;
}
function wipe() {
  localStorage.removeItem('pf_save');
  Object.assign(profile, {gold:0,gems:0,mats:0,units:[],weapons:[],supports:[],seenIds:new Set()});
  renderWallet(); renderInventory(); rebuildPickers(); rebuildChaosPickers();
  log('🧹 Save wiped.', true);
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
  log('🎁 Starter pack: +1000 gold, +600 gems, +50 mats, +starter items.', true);
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

// Logger
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
  renderInventory(); renderWallet(); rebuildChaosPickers();
  return { name: pick.name, rarity, type: isSupport?'Support':(isUnit?'Unit':'Weapon') };
}
function spendGems(cost){ if(profile.gems<cost){alert('Not enough gems!');return false;} profile.gems-=cost; renderWallet(); return true; }
function attachGacha(){
  const c1=q('[data-pull="char-1"]'); if(c1) c1.addEventListener('click', ()=>{ if(!spendGems(30))return; const r=rollOne(poolCharacterByRarity); q('#char-results').insertAdjacentHTML('afterbegin', cardHtml({title:r.name, subtitle:r.type, rarity:r.rarity})); });
  const c10=q('[data-pull="char-10"]'); if(c10) c10.addEventListener('click', ()=>{
    if(!spendGems(300))return; const box=q('#char-results'); let html=''; for(let i=0;i<10;i++){ const r=rollOne(poolCharacterByRarity); html+=cardHtml({title:r.name, subtitle:r.type, rarity:r.rarity}); } box.insertAdjacentHTML('afterbegin', html);
  });
  const w1=q('[data-pull="weap-1"]'); if(w1) w1.addEventListener('click', ()=>{ if(!spendGems(30))return; const r=rollOne(poolWeaponByRarity); q('#weap-results').insertAdjacentHTML('afterbegin', cardHtml({title:r.name, subtitle:r.type, rarity:r.rarity})); });
  const w10=q('[data-pull="weap-10"]'); if(w10) w10.addEventListener('click', ()=>{
    if(!spendGems(300))return; const box=q('#weap-results'); let html=''; for(let i=0;i<10;i++){ const r=rollOne(poolWeaponByRarity); html+=cardHtml({title:r.name, subtitle:r.type, rarity:r.rarity}); } box.insertAdjacentHTML('afterbegin', html);
  });
}

// --------------------------------------------------
// Career Mode with Deadline
const run = {
  mode: 'career', // or 'chaos' for modal routing
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
  const weaponScale = 1 + w.growth*(wlvl-1);
  run.stats = {
    pow: Math.round((u.base.pow + w.add.pow*weaponScale) * (1 + 0.05*(ulvl-1))),
    spd: Math.round((u.base.spd + w.add.spd*weaponScale) * (1 + 0.05*(ulvl-1))),
    foc: Math.round((u.base.foc + w.add.foc*weaponScale) * (1 + 0.05*(ulvl-1))),
    grt: Math.round((u.base.grt + w.add.grt*weaponScale) * (1 + 0.05*(ulvl-1))),
  };
  run.lastReport=null;
  q('#career-setup').classList.add('hidden');
  q('#career-run').classList.remove('hidden');
  resetDeadline(); updateRunUI();
  log(`▶️ Run started with ${u.name} (Lv ${ulvl}) + ${w.name} (Lv ${wlvl}).`);
  log(`Stats → POW ${run.stats.pow} | SPD ${run.stats.spd} | FOC ${run.stats.foc} | GRT ${run.stats.grt}`);
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
function spendTime(cost,label){ run.deadline -= cost; updateDeadlineUI(); log(`⏳ Time spent: -${cost} (${label}). Time Left: ${Math.max(0, run.deadline)}.`); if(run.deadline<=0){ log('⏰ Deadline reached! Forced battle.'); battleStage(true); return false; } return true; }
function trainOnce(which){
  if(!run.active) return; if(run.stamina<=0){ log('😓 Too tired to train. Rest or Battle.'); return; }
  if(!['pow','spd','foc','grt'].includes(which)) which='pow';
  const before={...run.stats}; run.stamina--;
  const baseGain=2; let boost=0, pieces=[];
  for(const s of run.supports||[]){ const t=s.def.train; const part=(which==='pow'?t.pow:which==='spd'?t.spd:which==='foc'?t.foc:t.grt)*(1+0.02*(s.meta.lvl-1)); if(part>0) pieces.push(`${s.def.name}+${Math.round(part*100)}%`); boost+=part; s.meta.exp+=1; if(tryLevelSupport(s.meta)) log(`⬆️ Support ${s.def.name} leveled to Lv ${s.meta.lvl}.`); }
  const gain=Math.round(baseGain*(1+boost)); run.stats[which]+=gain; updateRunUI();
  log(`💪 Training ${which.toUpperCase()}: base +${baseGain}${boost>0?` with +${Math.round(boost*100)}%`:""} → +${gain}${pieces.length?` (boosts: ${pieces.join(', ')})`:''}.`);
  log(`Stats: POW ${before.pow}→${run.stats.pow} | SPD ${before.spd}→${run.stats.spd} | FOC ${before.foc}→${run.stats.foc} | GRT ${before.grt}→${run.stats.grt}`);
  spendTime(run.costTrain, `Training ${which.toUpperCase()}`);
}
function restOnce(){
  if(!run.active) return; if(run.deadline<run.costRest){ log('⛔ Not enough time left to Rest.'); return; }
  const before=run.stamina; run.stamina=Math.min(5, run.stamina+2);
  for(const s of run.supports||[]){ s.meta.exp+=1; if(tryLevelSupport(s.meta)) log(`⬆️ Support ${s.def.name} leveled to Lv ${s.meta.lvl}.`); }
  updateRunUI(); log(`🛌 Rested: Stamina ${before}→${run.stamina}.`);
  spendTime(run.costRest,'Rest');
}
function battleStage(forced=false){
  if(!run.active && !forced) return;
  const d=run.stage;
  const enemy={ pow:6+d*2, spd:5+d*2, foc:5+Math.floor(d*1.8), grt:7+Math.floor(d*2.2) };
  let supDmg=0, dmgPieces=[]; for(const s of run.supports||[]){ const part=s.def.dmg*(1+0.02*(s.meta.lvl-1)); if(part>0) dmgPieces.push(`${s.def.name}+${Math.round(part*100)}%`); supDmg+=part; s.meta.exp+=1; if(tryLevelSupport(s.meta)) log(`⬆️ Support ${s.def.name} leveled to Lv ${s.meta.lvl}.`); }
  const atk=run.stats.pow*1 + run.stats.spd*0.6 + run.stats.foc*0.8;
  const eDef=enemy.grt*1 + enemy.spd*0.4;
  const pScore=atk*(1+supDmg);
  const eScore=enemy.pow*1 + enemy.spd*0.6 + enemy.foc*0.8;
  const pDef=(run.stats.grt*1 + run.stats.spd*0.4);
  const pEff=pScore - eDef; const eEff=eScore - pDef; const rng=(Math.random()*10-5); const margin=pEff - eEff + rng;
  log(`⚔️ ${forced?'Forced ':''}Battle — Stage ${run.stage}`);
  if(forced) log('• Reason: Time Left reached 0.');
  log(`• Enemy Stats → POW ${enemy.pow} | SPD ${enemy.spd} | FOC ${enemy.foc} | GRT ${enemy.grt}`);
  log(`• Player Scores → ATK ${pScore.toFixed(1)} (DMG +${Math.round(supDmg*100)}%${dmgPieces.length?`; ${dmgPieces.join(', ')}`:''}) vs Enemy DEF ${eDef.toFixed(1)}`);
  log(`• Enemy Score → ${eScore.toFixed(1)} vs Player DEF ${pDef.toFixed(1)}`);
  log(`• Effective → You ${pEff.toFixed(1)} | Enemy ${eEff.toFixed(1)} | RNG ${rng.toFixed(1)} | Margin ${margin.toFixed(1)}`);
  const report={stage:run.stage,victory:margin>=0,margin:+margin.toFixed(1),rng:+rng.toFixed(1),forced,player:{stats:{...run.stats},atkScore:+(atk.toFixed(1)),defScore:+(pDef.toFixed(1)),supDmgPct:Math.round(supDmg*100),supBreakdown:dmgPieces},enemy:{stats:enemy,atkScore:+(eScore.toFixed(1)),defScore:+(eDef.toFixed(1))}};
  run.lastReport=report;

  if(report.victory){
    const goldGain=80+run.stage*20, matGain=3+Math.floor(run.stage/2);
    profile.gold+=goldGain; profile.mats+=matGain;
    run.unit.meta.exp+=2; run.weapon.meta.exp+=2; const uu=tryLevelUnit(run.unit.meta), ww=tryLevelWeapon(run.weapon.meta);
    renderWallet(); renderInventory(); rebuildChaosPickers();
    log(`✅ Victory! Rewards → +${goldGain} gold, +${matGain} mats.`); if(uu) log(`⬆️ ${run.unit.def.name} Lv ${run.unit.meta.lvl}.`); if(ww) log(`⬆️ ${run.weapon.def.name} Lv ${run.weapon.meta.lvl}.`);
    if(run.stage>=run.maxStage){ showSummary('Victory', buildCareerSummary(report,{gold:goldGain,mats:matGain,final:true}), 'career'); run.active=false; return; }
    run.stage++; const old=run.stamina; run.stamina=Math.min(5, run.stamina+1); resetDeadline(); updateRunUI(); log(`➡️ Stage ${run.stage}. Stamina ${old}→${run.stamina}. Time reset.`);
  } else {
    showSummary('Defeat', buildCareerSummary(report,{gold:0,mats:0,final:false}), 'career'); run.active=false;
  }
}
function buildCareerSummary(report, rewards){
  const p=report.player, e=report.enemy;
  const sup=(p.supBreakdown&&p.supBreakdown.length)?`\n• Support DMG: +${p.supDmgPct}% (${p.supBreakdown.join(', ')})`:`\n• Support DMG: +${p.supDmgPct}%`;
  const forced=report.forced?`\n• Forced Battle: Time Left reached 0`:'';
  const base=
`Stage ${report.stage} — ${report.victory?'VICTORY':'DEFEAT'}
Margin: ${report.margin} (RNG ${report.rng})${forced}

Player
• Stats: POW ${p.stats.pow} | SPD ${p.stats.spd} | FOC ${p.stats.foc} | GRT ${p.stats.grt}
• ATK Score: ${p.atkScore}  | DEF Score: ${p.defScore}${sup}

Enemy
• Stats: POW ${e.stats.pow} | SPD ${e.stats.spd} | FOC ${e.stats.foc} | GRT ${e.stats.grt}
• ATK Score: ${e.atkScore}  | DEF Score: ${e.defScore}`;
  const rewardLine=(rewards&&(rewards.gold>0||rewards.mats>0))?`\n\nRewards\n• +${rewards.gold} gold, +${rewards.mats} mats`:''; 
  const hint=report.victory?(rewards.final?`\n\nRun complete! Press Confirm to return.`:'')
    :`\n\nWhy you lost
• Your effective ${p.atkScore - e.defScore >= 0 ? 'defense was lower than enemy attack' : 'attack was lower than enemy defense'}.
• Consider training ${p.atkScore - e.defScore < e.atkScore - p.defScore ? 'POW/FOC' : 'GRT/SPD'} next time, or slot supports that boost those.
${report.forced ? '• You ran out of Time. Try battling earlier or spending fewer Rests.' : ''}`;
  return base+rewardLine+hint;
}

// --------------------------------------------------
// Memories of Chaos
const CHAOS_FLOORS = 8;
const chaos = {
  active:false, floor:1, maxFloor:CHAOS_FLOORS, wave:1, wavesPerFloor:2,
  stars:0, score:0, // simple star system: 3,2,1 stars depending on margin & waves cleared quickly
  team:[], // [{unitMeta, unitDef, weaponMeta, weaponDef, stats}]
  modifiers:[], // strings
  lastReport:null
};

function bestWeaponFor(arche){
  // pick highest level weapon preferring matching archetype
  const pool = profile.weapons.slice().sort((a,b)=>b.lvl-a.lvl);
  let best = null;
  for(const meta of pool){
    const def = byId(WEAPONS, meta.id);
    if (!best || (def.pref===arche && (meta.lvl >= best.meta.lvl))) best = {meta, def};
    if (def.pref===arche) return best; // prefer immediate match
  }
  return best; // may be null
}

function unitEffectiveStats(unitDef, unitMeta, weapon){
  const ul=unitMeta.lvl;
  let pow=unitDef.base.pow, spd=unitDef.base.spd, foc=unitDef.base.foc, grt=unitDef.base.grt;
  if (weapon){
    const ws=1 + weapon.def.growth*(weapon.meta.lvl-1);
    pow += Math.round(weapon.def.add.pow*ws);
    spd += Math.round(weapon.def.add.spd*ws);
    foc += Math.round(weapon.def.add.foc*ws);
    grt += Math.round(weapon.def.add.grt*ws);
  }
  const scale=1 + 0.05*(ul-1);
  return { pow:Math.round(pow*scale), spd:Math.round(spd*scale), foc:Math.round(foc*scale), grt:Math.round(grt*scale) };
}

function chaosFloorModifiers(floor){
  // lightweight rotating modifiers
  const list = [
    'Enemy +10% ATK',
    'Enemy +15% DEF',
    'Your SPD +10%',
    'Your FOC +10%',
    'First wave gets +5 RNG swing',
    'Your POW +10%',
  ];
  // choose two deterministically by floor
  return [list[floor%list.length], list[(floor+2)%list.length]];
}

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
      // toggle add/remove, limit 3
      const idx = chaos.team.findIndex(t=>t.unitMeta.id===meta.id);
      if (idx>=0){ chaos.team.splice(idx,1); div.classList.remove('selected'); }
      else {
        if (chaos.team.length>=3) return;
        div.classList.add('selected');
        const best = bestWeaponFor(def.arche);
        const stats = unitEffectiveStats(def, meta, best);
        chaos.team.push({unitMeta:meta, unitDef:def, weaponMeta: best?.meta||null, weaponDef: best?.def||null, stats});
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
  const btn = q('#chaos-start'); if (btn) btn.disabled = chaos.team.length===0;
}

function startChaos(){
  if (chaos.team.length===0){ alert('Pick at least one unit.'); return; }
  chaos.active = true; run.mode='chaos';
  chaos.floor = 1; chaos.wave = 1; chaos.stars = 0; chaos.score = 0;
  chaos.modifiers = chaosFloorModifiers(chaos.floor);
  q('#chaos-setup').classList.add('hidden');
  q('#chaos-run').classList.remove('hidden');
  q('#chaos-log').innerHTML='';
  updateChaosUI();
  clog(`🌀 Chaos begins! Floor ${chaos.floor}. Modifiers: ${chaos.modifiers.join(' • ')}.`);
}

function updateChaosUI(){
  const teamStr = chaos.team.map(t=>`${t.unitDef.name} (Lv ${t.unitMeta.lvl})`).join(', ');
  q('#chaos-team-summary').innerHTML = `<b>Team:</b> ${teamStr}`;
  q('#chaos-mods').textContent = `Modifiers: ${chaos.modifiers.join(' • ')}`;
  q('#chaos-floor').textContent = `Floor ${chaos.floor} / ${chaos.maxFloor} • Wave ${chaos.wave} / ${chaos.wavesPerFloor}`;

  // Aggregate team stats for quick glance
  const agg = chaos.team.reduce((a,t)=>({pow:a.pow+t.stats.pow, spd:a.spd+t.stats.spd, foc:a.foc+t.stats.foc, grt:a.grt+t.stats.grt}), {pow:0,spd:0,foc:0,grt:0});
  q('#chaos-stats').innerHTML = `<div>TPOW ${agg.pow} • TSPD ${agg.spd} • TFOC ${agg.foc} • TGRT ${agg.grt}</div>`;
}

function chaosEnemyFor(floor, wave){
  const scale = floor + (wave-1)*0.5;
  return {
    pow: 16 + Math.floor(scale*5),
    spd: 14 + Math.floor(scale*4.5),
    foc: 14 + Math.floor(scale*4.2),
    grt: 18 + Math.floor(scale*5.2),
  };
}

function applyChaosModifiers(base, floor, wave){
  let {teamAtk, teamDef, enemyAtk, enemyDef, rngSwing} = base;
  const mods = chaos.modifiers;
  for (const m of mods){
    if (m==='Enemy +10% ATK') enemyAtk *= 1.10;
    if (m==='Enemy +15% DEF') enemyDef *= 1.15;
    if (m==='Your SPD +10%') teamDef += (teamDef*0.10*0.3); // SPD influences defense a bit in our math
    if (m==='Your FOC +10%') teamAtk += (teamAtk*0.10*0.3); // FOC influences attack part
    if (m==='Your POW +10%') teamAtk += (teamAtk*0.10*0.5);
    if (m==='First wave gets +5 RNG swing' && wave===1) rngSwing += (Math.random()<0.5?-5:+5);
  }
  return {teamAtk, teamDef, enemyAtk, enemyDef, rngSwing};
}

function chaosBattle(){
  if (!chaos.active) return;
  const floor = chaos.floor, wave = chaos.wave;
  const enemy = chaosEnemyFor(floor, wave);

  // Team aggregate scores (reuse career coefficients roughly)
  const agg = chaos.team.reduce((a,t)=>({pow:a.pow+t.stats.pow, spd:a.spd+t.stats.spd, foc:a.foc+t.stats.foc, grt:a.grt+t.stats.grt}), {pow:0,spd:0,foc:0,grt:0});
  let teamAtk = agg.pow*1.0 + agg.spd*0.6 + agg.foc*0.8;
  let teamDef = agg.grt*1.0 + agg.spd*0.4;

  let enemyAtk = enemy.pow*1.0 + enemy.spd*0.6 + enemy.foc*0.8;
  let enemyDef = enemy.grt*1.0 + enemy.spd*0.4;

  let rng = (Math.random()*10 - 5);
  ({teamAtk, teamDef, enemyAtk, enemyDef, rngSwing:rng} = applyChaosModifiers({teamAtk, teamDef, enemyAtk, enemyDef, rngSwing:rng}, floor, wave));

  const teamEff = (teamAtk - enemyDef);
  const enemyEff = (enemyAtk - teamDef);
  const margin = teamEff - enemyEff + rng;

  clog(`⚔️ Chaos Battle — Floor ${floor} • Wave ${wave}`);
  clog(`• Team ATK ${teamAtk.toFixed(1)} vs Enemy DEF ${enemyDef.toFixed(1)} | Enemy ATK ${enemyAtk.toFixed(1)} vs Team DEF ${teamDef.toFixed(1)}`);
  clog(`• Effective → Team ${teamEff.toFixed(1)} | Enemy ${enemyEff.toFixed(1)} | RNG ${rng.toFixed(1)} | Margin ${margin.toFixed(1)}`);

  const win = margin >= 0;
  chaos.lastReport = {floor, wave, enemy, win, margin:+margin.toFixed(1), rng:+rng.toFixed(1), teamEff:+teamEff.toFixed(1), enemyEff:+enemyEff.toFixed(1)};

  if (win){
    clog(`✅ Wave ${wave} cleared.`);
    chaos.score += Math.max(1, Math.floor(margin/5)+1); // simple score
    if (wave >= chaos.wavesPerFloor){
      // compute stars by how strong the win was
      const floorStars = margin>=10 ? 3 : margin>=5 ? 2 : 1;
      chaos.stars += floorStars;
      clog(`🌟 Floor ${floor} cleared for ${floorStars}★.`);
      if (floor >= chaos.maxFloor){
        const gems = chaos.stars*15 + Math.floor(chaos.score/5)*5; // modest rewards
        profile.gems += gems;
        renderWallet();
        const text = buildChaosSummary({final:true, gems});
        showSummary('Chaos Cleared', text, 'chaos');
        chaos.active = false;
        return;
      }
      // next floor
      chaos.floor++; chaos.wave = 1; chaos.modifiers = chaosFloorModifiers(chaos.floor);
      updateChaosUI();
      clog(`➡️ Proceed to Floor ${chaos.floor}. New Modifiers: ${chaos.modifiers.join(' • ')}.`);
    } else {
      // next wave
      chaos.wave++;
      updateChaosUI();
    }
  } else {
    clog(`❌ Defeat on Floor ${floor}, Wave ${wave}.`);
    const text = buildChaosSummary({final:false, gems:0});
    showSummary('Chaos Failed', text, 'chaos');
    chaos.active = false;
  }
}

function buildChaosSummary({final, gems}){
  const r = chaos.lastReport;
  const summary =
`Floor ${r.floor} • Wave ${r.wave} — ${r.win?'VICTORY':'DEFEAT'}
Margin: ${r.margin} (RNG ${r.rng})
Team Eff: ${r.teamEff} | Enemy Eff: ${r.enemyEff}

Progress
• Floors Cleared: ${final?chaos.maxFloor:chaos.floor-1}/${chaos.maxFloor}
• Waves Cleared this floor: ${r.win?chaos.wavesPerFloor:Math.max(0, r.wave-1)}/${chaos.wavesPerFloor}
• Stars Total: ${chaos.stars}
• Score: ${chaos.score}` + (final?`\n\nRewards\n• +${gems} 💎`:'') + (!r.win?`\n\nTip\n• Train units more in Career or acquire matching weapons.\n• Consider archetype balance (one Brawler/Blade/Mage mix boosts ATK/DEF spread).`:'') + (final?`\n\nGreat run! Press Confirm to return.`:'');

  return summary;
}

// --------------------------------------------------
// Summary Modal (supports routing back to Career or Chaos)
const modal = q('#summary-modal');
const modalTitle = q('#summary-title');
const modalBody = q('#summary-body');
const modalConfirm = q('#btn-summary-confirm');
let modalReturnTo = 'career'; // 'career' or 'chaos'

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

// --------------------------------------------------
// Manual abandon for both modes
const abandonCareerBtn = q('#btn-abandon');
if (abandonCareerBtn) abandonCareerBtn.addEventListener('click', ()=>{
  if(!run.active){ modal.classList.add('hidden'); q('#career-run').classList.add('hidden'); q('#career-setup').classList.remove('hidden'); rebuildPickers(); renderInventory(); updateRunUI(); return; }
  const report={stage:run.stage,victory:false,margin:0,rng:0,forced:false,player:{stats:{...run.stats},atkScore:0,defScore:0,supDmgPct:0,supBreakdown:[]},enemy:{stats:{pow:0,spd:0,foc:0,grt:0},atkScore:0,defScore:0}};
  showSummary('Abandoned', buildCareerSummary(report,{gold:0,mats:0}), 'career'); run.active=false;
});
const abandonChaosBtn = q('#chaos-abandon');
if (abandonChaosBtn) abandonChaosBtn.addEventListener('click', ()=>{
  if(!chaos.active){ modal.classList.add('hidden'); q('#chaos-run').classList.add('hidden'); q('#chaos-setup').classList.remove('hidden'); rebuildChaosPickers(); return; }
  const text = buildChaosSummary({final:false,gems:0});
  showSummary('Chaos Abandoned', text, 'chaos'); chaos.active=false;
});

// --------------------------------------------------
// Wires
q('#btn-grant-starter')?.addEventListener('click', grantStarter);
q('#start-run')?.addEventListener('click', startRun);
qa('[data-train]')?.forEach(b=>b.addEventListener('click', ()=>trainOnce(b.getAttribute('data-train'))));
q('#btn-rest')?.addEventListener('click', restOnce);
q('#btn-battle')?.addEventListener('click', ()=>battleStage(false));

q('#btn-save')?.addEventListener('click', save);
q('#btn-load')?.addEventListener('click', load);
q('#btn-wipe')?.addEventListener('click', wipe);

// Chaos wires
q('#chaos-start')?.addEventListener('click', startChaos);
q('#chaos-battle')?.addEventListener('click', chaosBattle);

// Boot
attachGacha();
renderWallet();
renderInventory();
rebuildPickers();
rebuildChaosPickers();
load(); // auto-load if present
