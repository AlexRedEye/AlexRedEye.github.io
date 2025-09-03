/* =========================
   PocketFighters — MVP
   v0.5.2
   • Starter roster auto-grant on new/empty saves (Rai, Brick, Kira + basic weapons & supports)
   • Expanded catalogs: more Units, Weapons, Supports (all in gacha pools)
   • Keeps v0.5.1: smarter loss advisor, pity banners, mats regen, condensed results, MoC hands-on
   ========================= */

const RARITY = { R:'R', SR:'SR', SSR:'SSR' };
const ARCH = { BRAWLER:'Brawler', BLADE:'Blade', GUNNER:'Gunner', MAGE:'Mage' };

/* ---------- Tunables ---------- */
const RUN_COST_MATS = 10;
const MATS_CAP = 120;
const MATS_REGEN_EVERY_MS = 5*60*1000;
const GACHA_COST_1 = 30;
const GACHA_COST_10 = 300;
const PITY = {
  char: { SSR: { soft:70, hard:90 }, SR: { soft:8, hard:10 } },
  weap: { SSR: { soft:70, hard:90 }, SR: { soft:8, hard:10 } },
};

/* ---------- Catalogs (expanded) ---------- */
const UNITS = [
  { id:'u_rai',     name:'Rai',       arche:ARCH.BLADE,   rarity:RARITY.SR,  base:{pow:9,  spd:8,  foc:5,  grt:7} },
  { id:'u_nox',     name:'Nox',       arche:ARCH.MAGE,    rarity:RARITY.SSR, base:{pow:7,  spd:7,  foc:12, grt:6} },
  { id:'u_brick',   name:'Brick',     arche:ARCH.BRAWLER, rarity:RARITY.R,   base:{pow:10, spd:5,  foc:3,  grt:10} },
  { id:'u_kira',    name:'Kira',      arche:ARCH.GUNNER,  rarity:RARITY.SR,  base:{pow:8,  spd:11, foc:6,  grt:5} },
  { id:'u_zen',     name:'Zen',       arche:ARCH.BLADE,   rarity:RARITY.SSR, base:{pow:11, spd:10, foc:7,  grt:6} },
  { id:'u_sable',   name:'Sable',     arche:ARCH.MAGE,    rarity:RARITY.SR,  base:{pow:6,  spd:8,  foc:11, grt:6} },
  { id:'u_vex',     name:'Vex',       arche:ARCH.GUNNER,  rarity:RARITY.R,   base:{pow:7,  spd:9,  foc:4,  grt:6} },
  { id:'u_ursa',    name:'Ursa',      arche:ARCH.BRAWLER, rarity:RARITY.SSR, base:{pow:12, spd:6,  foc:5,  grt:11} },
  // New
  { id:'u_ember',   name:'Ember',     arche:ARCH.MAGE,    rarity:RARITY.SR,  base:{pow:6,  spd:9,  foc:10, grt:5} },
  { id:'u_rune',    name:'Rune',      arche:ARCH.BLADE,   rarity:RARITY.R,   base:{pow:8,  spd:8,  foc:4,  grt:6} },
  { id:'u_ivy',     name:'Ivy',       arche:ARCH.GUNNER,  rarity:RARITY.SR,  base:{pow:7,  spd:12, foc:5,  grt:5} },
  { id:'u_goliath', name:'Goliath',   arche:ARCH.BRAWLER, rarity:RARITY.SSR, base:{pow:13, spd:5,  foc:4,  grt:12} },
  { id:'u_aqua',    name:'Aqua',      arche:ARCH.MAGE,    rarity:RARITY.R,   base:{pow:5,  spd:7,  foc:9,  grt:6} },
  { id:'u_nero',    name:'Nero',      arche:ARCH.BLADE,   rarity:RARITY.SR,  base:{pow:10, spd:9,  foc:6,  grt:6} },
  { id:'u_mira',    name:'Mira',      arche:ARCH.GUNNER,  rarity:RARITY.SSR, base:{pow:9,  spd:13, foc:7,  grt:5} },
  { id:'u_bolt',    name:'Bolt',      arche:ARCH.BRAWLER, rarity:RARITY.SR,  base:{pow:11, spd:8,  foc:4,  grt:9} },
];

const WEAPONS = [
  { id:'w_katana',   name:'Storm Katana',      rarity:RARITY.SR,  pref:ARCH.BLADE,  add:{pow:4, spd:2, foc:0, grt:0}, growth:0.07, max:5 },
  { id:'w_staff',    name:'Orbweaver Staff',   rarity:RARITY.SSR, pref:ARCH.MAGE,   add:{pow:1, spd:1, foc:5, grt:1}, growth:0.08, max:5 },
  { id:'w_gaunt',    name:'Titan Gauntlets',   rarity:RARITY.R,   pref:ARCH.BRAWLER,add:{pow:3, spd:0, foc:0, grt:2}, growth:0.05, max:5 },
  { id:'w_pistol',   name:'Silent Pistol',     rarity:RARITY.R,   pref:ARCH.GUNNER, add:{pow:2, spd:2, foc:0, grt:0}, growth:0.05, max:5 },
  { id:'w_odachi',   name:'Mooncut Odachi',    rarity:RARITY.SSR, pref:ARCH.BLADE,  add:{pow:6, spd:1, foc:1, grt:0}, growth:0.08, max:5 },
  { id:'w_tome',     name:'Aether Tome',       rarity:RARITY.SR,  pref:ARCH.MAGE,   add:{pow:0, spd:1, foc:4, grt:0}, growth:0.07, max:5 },
  { id:'w_revolver', name:'Twin Revolvers',    rarity:RARITY.SR,  pref:ARCH.GUNNER, add:{pow:3, spd:3, foc:1, grt:0}, growth:0.07, max:5 },
  { id:'w_maul',     name:'Earthsplit Maul',   rarity:RARITY.SR,  pref:ARCH.BRAWLER,add:{pow:5, spd:0, foc:0, grt:2}, growth:0.06, max:5 },
  // New
  { id:'w_scythe',   name:'Night Scythe',      rarity:RARITY.SSR, pref:ARCH.BLADE,  add:{pow:5, spd:2, foc:2, grt:1}, growth:0.08, max:5 },
  { id:'w_wand',     name:'Glint Wand',        rarity:RARITY.R,   pref:ARCH.MAGE,   add:{pow:0, spd:1, foc:3, grt:0}, growth:0.05, max:5 },
  { id:'w_shotgun',  name:'Boomstick',         rarity:RARITY.SR,  pref:ARCH.GUNNER, add:{pow:5, spd:1, foc:0, grt:0}, growth:0.06, max:5 },
  { id:'w_knuckles', name:'Temple Knuckles',   rarity:RARITY.SR,  pref:ARCH.BRAWLER,add:{pow:4, spd:1, foc:0, grt:3}, growth:0.06, max:5 },
  { id:'w_railgun',  name:'Valkyrie Railgun',  rarity:RARITY.SSR, pref:ARCH.GUNNER, add:{pow:6, spd:2, foc:1, grt:0}, growth:0.08, max:5 },
  { id:'w_staves',   name:'Seer Staves',       rarity:RARITY.SR,  pref:ARCH.MAGE,   add:{pow:1, spd:0, foc:5, grt:1}, growth:0.07, max:5 },
  { id:'w_bladefans',name:'Blade Fans',        rarity:RARITY.R,   pref:ARCH.BLADE,  add:{pow:2, spd:2, foc:0, grt:0}, growth:0.05, max:5 },
  { id:'w_tonfa',    name:'Stone Tonfa',       rarity:RARITY.R,   pref:ARCH.BRAWLER,add:{pow:2, spd:1, foc:0, grt:2}, growth:0.05, max:5 },
];

const SUPPORTS = [
  { id:'s_cardio',  name:'Cardio Coach',     rarity:RARITY.R,   train:{pow:0.00,spd:0.12,foc:0.00,grt:0.00}, dmg:0.00 },
  { id:'s_brutal',  name:'Brutal Sparring',  rarity:RARITY.SR,  train:{pow:0.15,spd:0.00,foc:0.00,grt:0.05}, dmg:0.05 },
  { id:'s_mind',    name:'Mind Palace',      rarity:RARITY.SR,  train:{pow:0.00,spd:0.00,foc:0.18,grt:0.00}, dmg:0.06 },
  { id:'s_guard',   name:'Guard Drills',     rarity:RARITY.R,   train:{pow:0.00,spd:0.00,foc:0.00,grt:0.15}, dmg:0.02 },
  { id:'s_aegis',   name:'Aegis Mentor',     rarity:RARITY.SSR, train:{pow:0.05,spd:0.05,foc:0.05,grt:0.10}, dmg:0.10 },
  { id:'s_split',   name:'Split Focus',      rarity:RARITY.R,   train:{pow:0.05,spd:0.05,foc:0.05,grt:0.05}, dmg:0.00 },
  { id:'s_blitz',   name:'Blitz Tactics',    rarity:RARITY.SR,  train:{pow:0.05,spd:0.18,foc:0.00,grt:0.00}, dmg:0.03 },
  { id:'s_zenith',  name:'Zenith Study',     rarity:RARITY.SSR, train:{pow:0.00,spd:0.05,foc:0.20,grt:0.00}, dmg:0.08 },
  { id:'s_iron',    name:'Iron Will',        rarity:RARITY.R,   train:{pow:0.00,spd:0.00,foc:0.05,grt:0.12}, dmg:0.02 },
  { id:'s_duelist', name:'Duelist Footwork', rarity:RARITY.SR,  train:{pow:0.08,spd:0.15,foc:0.00,grt:0.00}, dmg:0.04 },
  // New
  { id:'s_focus2',  name:'Sharp Mind',       rarity:RARITY.SR,  train:{pow:0.00,spd:0.00,foc:0.16,grt:0.04}, dmg:0.05 },
  { id:'s_speed2',  name:'Sprint Coach',     rarity:RARITY.R,   train:{pow:0.00,spd:0.15,foc:0.00,grt:0.00}, dmg:0.01 },
  { id:'s_power2',  name:'Powerlifting',     rarity:RARITY.SR,  train:{pow:0.16,spd:0.00,foc:0.00,grt:0.04}, dmg:0.05 },
  { id:'s_guard2',  name:'Bulwark',          rarity:RARITY.SR,  train:{pow:0.00,spd:0.00,foc:0.00,grt:0.18}, dmg:0.04 },
  { id:'s_overdrv', name:'Overdrive',        rarity:RARITY.SSR, train:{pow:0.10,spd:0.00,foc:0.10,grt:0.00}, dmg:0.12 },
  { id:'s_fleet',   name:'Fleet Footed',     rarity:RARITY.SSR, train:{pow:0.00,spd:0.22,foc:0.00,grt:0.00}, dmg:0.06 },
  { id:'s_stoic',   name:'Stoic Focus',      rarity:RARITY.R,   train:{pow:0.00,spd:0.00,foc:0.05,grt:0.12}, dmg:0.01 },
  { id:'s_balance', name:'Balanced Regimen', rarity:RARITY.SR,  train:{pow:0.08,spd:0.08,foc:0.08,grt:0.08}, dmg:0.03 },
];

/* ---------- Profile ---------- */
const profile = {
  gold: 0,
  gems: 0,
  mats: 120,
  units: [],
  weapons: [],
  supports: [],
  pity: { char: { ssr: 0, sr: 0 }, weap: { ssr: 0, sr: 0 } },
  matsLastTs: Date.now(),
  seenIds: new Set(),
  starterGranted: false,   // NEW
};

/* ---------- Helpers ---------- */
const byId = (arr,id)=>arr.find(x=>x.id===id);
const fmt = n => Number(n).toLocaleString();
const q = s => document.querySelector(s);
const qa = s => Array.from(document.querySelectorAll(s));
const rarityClass = r => r===RARITY.SSR?'ssr':(r===RARITY.SR?'sr':'r');
const clamp = (v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function softCap(x, pivot=22, eff=0.6){ return x <= pivot ? x : pivot + (x - pivot) * eff; }

/* ---------- Save/Load ---------- */
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
  regenMatsNow();
  renderWallet(); renderInventory(); rebuildPickers(); rebuildChaosPickers(); updatePityUI();
  clog('📂 Loaded save.');
  return true;
}
function wipe() {
  localStorage.removeItem('pf_save');
  Object.assign(profile, {gold:0,gems:0,mats:10,units:[],weapons:[],supports:[],pity:{char:{ssr:0,sr:0},weap:{ssr:0,sr:0}},matsLastTs:Date.now(),seenIds:new Set(),starterGranted:false});
  ensureStarterRoster();                // give starters on fresh wipe
  renderWallet(); renderInventory(); rebuildPickers(); rebuildChaosPickers(); updatePityUI();
  clog('🧹 Save wiped. Starter roster granted.');
}
function rebuildSeen(){
  profile.seenIds = new Set();
  for (const u of profile.units) profile.seenIds.add(u.id);
  for (const w of profile.weapons) profile.seenIds.add(w.id);
  for (const s of profile.supports) profile.seenIds.add(s.id);
}

/* ---------- Starter roster (auto, one-time) ---------- */
function ensureStarterRoster(){
  const needGrant = !profile.starterGranted || profile.units.length===0;
  if (!needGrant) return;

  const addUnit   = id => { if(!profile.units.find(x=>x.id===id)) profile.units.push({id, lvl:1, exp:0}); profile.seenIds.add(id); };
  const addWeapon = id => { if(!profile.weapons.find(x=>x.id===id)) profile.weapons.push({id, lvl:1, exp:0}); profile.seenIds.add(id); };
  const addSupport= id => { if(!profile.supports.find(x=>x.id===id)) profile.supports.push({id, lvl:1, exp:0, expNext:5}); profile.seenIds.add(id); };

  const STARTER_UNITS   = ['u_rai','u_brick','u_kira'];          // 2×SR, 1×R
  const STARTER_WEAPONS = ['w_katana','w_gaunt','w_pistol'];     // basic matching
  const STARTER_SUPPORTS= ['s_split','s_guard','s_brutal'];      // balanced

  STARTER_UNITS.forEach(addUnit);
  STARTER_WEAPONS.forEach(addWeapon);
  STARTER_SUPPORTS.forEach(addSupport);

  profile.starterGranted = true;

  renderInventory(); rebuildPickers(); rebuildChaosPickers(); renderWallet();
  log('🎁 Starter roster granted: Rai, Brick, Kira • Storm Katana, Titan Gauntlets, Silent Pistol • Split Focus, Guard Drills, Brutal Sparring.');
}

/* ---------- Regen (Mats) ---------- */
function regenMatsNow(){
  const now = Date.now();
  let mats = profile.mats;
  if (mats >= MATS_CAP){ profile.matsLastTs = now; return; }
  const elapsed = now - (profile.matsLastTs || now);
  if (elapsed < MATS_REGEN_EVERY_MS) return;
  const gained = Math.floor(elapsed / MATS_REGEN_EVERY_MS);
  if (gained > 0){
    profile.mats = Math.min(MATS_CAP, mats + gained);
    profile.matsLastTs = now - (elapsed % MATS_REGEN_EVERY_MS);
  }
}
function matsNextTickMs(){
  const now = Date.now();
  const base = profile.matsLastTs || now;
  const next = base + MATS_REGEN_EVERY_MS;
  return Math.max(0, next - now);
}
function matsCountdownText(){
  regenMatsNow();
  if (profile.mats >= MATS_CAP) return `Mats full (${MATS_CAP})`;
  const ms = matsNextTickMs();
  const s = Math.ceil(ms/1000);
  const mm = Math.floor(s/60), ss = s%60;
  return `+1 in ${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')} (cap ${MATS_CAP})`;
}

/* ---------- Inventory Level helpers ---------- */
function tryLevelUnit(e){ let up=false; while(e.exp>=5){e.exp-=5;e.lvl++;up=true;} return up; }
function tryLevelWeapon(e){ let up=false; while(e.exp>=5){e.exp-=5;e.lvl++;up=true;} return up; }
function tryLevelSupport(e){ let up=false; while(e.exp>=e.expNext){e.exp-=e.expNext;e.lvl++;e.expNext=Math.ceil(e.expNext*1.35);up=true;} return up; }

/* ---------- Duplicate compensation (gems) ---------- */
const DUP_GEM = { [RARITY.R]:10, [RARITY.SR]:30, [RARITY.SSR]:90 };

function acquireUnit(id, rarity){
  let e = profile.units.find(x=>x.id===id);
  if (!e){ profile.units.push({id, lvl:1, exp:0}); profile.seenIds.add(id); return {added:true, gems:0}; }
  const g = DUP_GEM[rarity]||10; profile.gems += g; return {added:false, gems:g};
}
function acquireWeapon(id, rarity){
  let e = profile.weapons.find(x=>x.id===id);
  if (!e){ profile.weapons.push({id, lvl:1, exp:0}); profile.seenIds.add(id); return {added:true, gems:0}; }
  const g = DUP_GEM[rarity]||10; profile.gems += g; return {added:false, gems:g};
}
function acquireSupport(id, rarity){
  let e = profile.supports.find(x=>x.id===id);
  if (!e){ profile.supports.push({id, lvl:1, exp:0, expNext:5}); profile.seenIds.add(id); return {added:true, gems:0}; }
  const g = DUP_GEM[rarity]||10; profile.gems += g; return {added:false, gems:g};
}

/* ---------- Rendering ---------- */
function cardHtml({title, subtitle, rarity, body='', badge=''}){
  return `<div class="card ${rarityClass(rarity)}">
    <div class="title">${title}${badge?` <span class="chip badge">${badge}</span>`:''}</div>
    <div class="tiny">${subtitle||''}</div>
    ${body?`<div class="chips">${body}</div>`:''}
  </div>`;
}
function renderWallet(){
  regenMatsNow();
  q('#gold').textContent = `🪙 ${fmt(profile.gold)}`;
  q('#gems').textContent = `💎 ${fmt(profile.gems)}`;
  q('#mats').textContent = `📦 ${fmt(profile.mats)}`;
  const reg = q('#mats-regen'); if (reg) reg.textContent = matsCountdownText();
  const cost = q('#career-cost'); if (cost) cost.textContent = RUN_COST_MATS;
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

/* ---------- Tabs ---------- */
qa('.tabs button').forEach(b=>{
  b.addEventListener('click', ()=>{
    qa('.tabs button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const tab = b.getAttribute('data-tab');
    qa('main .tab').forEach(s=>s.classList.remove('active'));
    q('#'+tab).classList.add('active');
  });
});

/* ---------- Loggers ---------- */
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

/* ==================================================
   Gacha — pity banners
   ================================================== */
function updatePityUI(){
  const P = profile.pity;
  q('#pity-char-ssr')?.replaceChildren(document.createTextNode(P.char.ssr));
  q('#pity-char-sr')?.replaceChildren(document.createTextNode(P.char.sr));
  q('#pity-weap-ssr')?.replaceChildren(document.createTextNode(P.weap.ssr));
  q('#pity-weap-sr')?.replaceChildren(document.createTextNode(P.weap.sr));
}
function poolCharacterByRarity(r){ return [...UNITS.filter(x=>x.rarity===r), ...SUPPORTS.filter(x=>x.rarity===r)]; }
function poolWeaponByRarity(r){ return [...WEAPONS.filter(x=>x.rarity===r), ...SUPPORTS.filter(x=>x.rarity===r)]; }
function spendGems(cost){ if(profile.gems<cost){alert('Not enough gems!');return false;} profile.gems-=cost; renderWallet(); return true; }

function pickWithPity(whichBanner){
  const pity = profile.pity[whichBanner];
  const cfg = PITY[whichBanner];
  const prob = (counter, base, soft, hard)=>{
    if (counter < soft) return base;
    if (counter >= hard-1) return 1.0;
    const t = (counter - soft + 1) / (hard - soft);
    return base + t * (1.0 - base);
  };
  const roll = Math.random();
  const ssrChance = prob(pity.ssr, 0.03, cfg.SSR.soft, cfg.SSR.hard);
  const srBase = 0.17;
  const srChance = Math.max(srBase, prob(pity.sr, srBase, cfg.SR.soft, cfg.SR.hard));

  let rarity;
  if (roll < ssrChance){
    rarity = RARITY.SSR;
    pity.ssr = 0; pity.sr = 0;
  } else if (Math.random() < srChance){
    rarity = RARITY.SR;
    pity.sr = 0; pity.ssr++;
  } else {
    rarity = RARITY.R;
    pity.sr++; pity.ssr++;
  }
  updatePityUI();
  return rarity;
}

function rollOne(whichBanner){
  const rarity = pickWithPity(whichBanner);
  const pool = whichBanner==='char' ? poolCharacterByRarity(rarity) : poolWeaponByRarity(rarity);
  const pick = pool[Math.floor(Math.random()*pool.length)];

  const isSupport = SUPPORTS.some(s=>s.id===pick.id);
  const isUnit = UNITS.some(u=>u.id===pick.id);
  const isWeapon = WEAPONS.some(w=>w.id===pick.id);

  let converted = false, gems = 0;
  if (isSupport){
    const res = acquireSupport(pick.id, rarity); converted = !res.added; gems = res.gems;
  } else if (isUnit){
    const res = acquireUnit(pick.id, rarity); converted = !res.added; gems = res.gems;
  } else if (isWeapon){
    const res = acquireWeapon(pick.id, rarity); converted = !res.added; gems = res.gems;
  }

  renderInventory(); renderWallet(); rebuildChaosPickers(); rebuildPickers();
  return { id: pick.id, name: pick.name, rarity, type: isSupport?'Support':(isUnit?'Unit':'Weapon'), converted, gems };
}

function renderPullResults(containerSel, results){
  const box = q(containerSel);
  box.innerHTML = '';
  const counts = new Map();
  for (const r of results){
    if (!counts.has(r.id)) counts.set(r.id, { item:r, count:1, gems:r.converted?r.gems:0 });
    else { const v = counts.get(r.id); v.count++; v.gems += r.converted ? r.gems : 0; }
  }
  let html = '';
  for (const {item,count,gems} of counts.values()){
    const badge = count>1 ? `×${count}` : '';
    const body = gems>0 ? `<span class="chip">+${gems} 💎 (dupes)</span>` : '';
    html += cardHtml({title:item.name, subtitle:item.type, rarity:item.rarity, badge, body});
  }
  box.insertAdjacentHTML('afterbegin', html);
}

function attachGacha(){
  q('[data-pull="char-1"]')?.addEventListener('click', ()=>{
    if(!spendGems(GACHA_COST_1))return;
    const r=rollOne('char');
    renderPullResults('#char-results',[r]);
  });
  q('[data-pull="char-10"]')?.addEventListener('click', ()=>{
    if(!spendGems(GACHA_COST_10))return;
    const results=[]; for(let i=0;i<10;i++) results.push(rollOne('char'));
    renderPullResults('#char-results',results);
  });
  q('[data-pull="weap-1"]')?.addEventListener('click', ()=>{
    if(!spendGems(GACHA_COST_1))return;
    const r=rollOne('weap');
    renderPullResults('#weap-results',[r]);
  });
  q('[data-pull="weap-10"]')?.addEventListener('click', ()=>{
    if(!spendGems(GACHA_COST_10))return;
    const results=[]; for(let i=0;i<10;i++) results.push(rollOne('weap'));
    renderPullResults('#weap-results',results);
  });
}

/* ==================================================
   Career Mode (with indicators, timer)
   ================================================== */
const run = {
  mode: 'career',
  active:false, stage:1, maxStage:10, stamina:5,
  unit:null, weapon:null, supports:[],
  stats:{pow:0,spd:0,foc:0,grt:0},
  lastReport:null,
  deadlineMax:5, deadline:5, costTrain:1, costRest:2
};

function enemyPreviewForStage(d){
  return {
    pow: 6 + d*2 + Math.floor(d*d*0.3),
    spd: 5 + d*2,
    foc: 5 + Math.floor(d*1.8),
    grt: 7 + Math.floor(d*1.5 + d*d*0.2),
  };
}
function statGrade(r){
  if (r < 0.80) return {label:'Weak', cls:'weak', emoji:'🔴'};
  if (r < 1.00) return {label:'OK',   cls:'ok',   emoji:'🟡'};
  if (r < 1.30) return {label:'Good', cls:'good', emoji:'🟢'};
  return {label:'Excellent', cls:'excel', emoji:'🔷'};
}

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
  regenMatsNow(); renderWallet();
  if (profile.mats < RUN_COST_MATS){ alert(`Not enough mats (${profile.mats}/${RUN_COST_MATS}). They regenerate over time.`); return; }
  if (!run.unit || !run.weapon){ alert('Pick a unit and weapon.'); return; }
  profile.mats -= RUN_COST_MATS; profile.matsLastTs = Date.now(); renderWallet();

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
  log(`▶️ Career started with ${u.name} (Lv ${ulvl}) + ${w.name} (Lv ${wlvl}). Spent ${RUN_COST_MATS} mats.`);
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
  q('#run-stage').textContent = `Stage ${run.stage} / ${run.maxStage} • Stamina ${run.stamina}`;

  const e = enemyPreviewForStage(run.stage);
  const targets = { powTarget:e.grt, spdTarget:e.spd, focTarget:e.foc, grtTarget:e.pow };
  const powG = statGrade(s.pow / Math.max(1, targets.powTarget));
  const spdG = statGrade(s.spd / Math.max(1, targets.spdTarget));
  const focG = statGrade(s.foc / Math.max(1, targets.focTarget));
  const grtG = statGrade(s.grt / Math.max(1, targets.grtTarget));
  const tip = (self, tgt) => `title="Your ${self} vs target ${tgt}"`;

  q('#run-stats').innerHTML = `
    <div class="statline">POW ${s.pow}
      <span class="pill ${powG.cls}" ${tip(s.pow, targets.powTarget)}>${powG.emoji} ${powG.label}</span>
      <span class="tiny dim">vs DEF≈${targets.powTarget}</span>
    </div>
    <div class="statline">SPD ${s.spd}
      <span class="pill ${spdG.cls}" ${tip(s.spd, targets.spdTarget)}>${spdG.emoji} ${spdG.label}</span>
      <span class="tiny dim">vs SPD ${targets.spdTarget}</span>
    </div>
    <div class="statline">FOC ${s.foc}
      <span class="pill ${focG.cls}" ${tip(s.foc, targets.focTarget)}>${focG.emoji} ${focG.label}</span>
      <span class="tiny dim">vs FOC ${targets.focTarget}</span>
    </div>
    <div class="statline">GRT ${s.grt}
      <span class="pill ${grtG.cls}" ${tip(s.grt, targets.grtTarget)}>${grtG.emoji} ${grtG.label}</span>
      <span class="tiny dim">vs POW ${targets.grtTarget}</span>
    </div>
    <div class="legend tiny dim">Legend: 🔴 Weak • 🟡 OK • 🟢 Good • 🔷 Excellent</div>
  `;

  updateDeadlineUI();
}

function spendTime(cost,label){ run.deadline -= cost; updateDeadlineUI(); log(`⏳ Time -${cost} (${label}). Left: ${Math.max(0, run.deadline)}.`); if(run.deadline<=0){ log('⏰ Deadline reached! Forced battle.'); battleStage(true); return false; } return true; }
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
  if (!run.active) return;
  if (run.deadline < run.costRest){ log('⛔ Not enough time left to Rest.'); return; }
  const before = run.stamina;
  run.stamina = Math.min(5, run.stamina + 2);
  for (const s of run.supports || []){
    s.meta.exp += 1;
    if (tryLevelSupport(s.meta)) log(`⬆️ Support ${s.def.name} leveled to Lv ${s.meta.lvl}.`);
  }
  updateRunUI();
  log(`🛌 Rested: Stamina ${before}→${run.stamina}.`);
  spendTime(run.costRest, 'Rest');
}

/* Battle & smarter summary (from v0.5.1) */
function battleStage(forced=false){
  if(!run.unit || !run.weapon) return;
  const d=run.stage;

  const enemy = {
    pow: 6 + d*2 + Math.floor(d*d*0.3),
    spd: 5 + d*2,
    foc: 5 + Math.floor(d*1.8),
    grt: 7 + Math.floor(d*1.5 + d*d*0.2),
  };

  const pPOW = softCap(run.stats.pow, 22, 0.6);
  const pFOC = softCap(run.stats.foc, 22, 0.6);
  const pSPD = softCap(run.stats.spd, 22, 0.7);

  const pAtkBase = pPOW*1.15 + pFOC*0.95 + pSPD*0.55;
  const pDefBase = run.stats.grt*1.05 + pSPD*0.55;

  let supDmg=0, dmgPieces=[];
  for(const s of run.supports||[]){
    const part=s.def.dmg*(1+0.02*(s.meta.lvl-1));
    if(part>0) dmgPieces.push(`${s.def.name}+${Math.round(part*100)}%`);
    supDmg+=part; s.meta.exp+=1;
    if(tryLevelSupport(s.meta)) log(`⬆️ Support ${s.def.name} leveled to Lv ${s.meta.lvl}.`);
  }
  const pScore = pAtkBase * (1 + supDmg);
  const pDef2  = pDefBase;

  const ePOW = softCap(enemy.pow, 22, 0.6);
  const eFOC = softCap(enemy.foc, 22, 0.6);
  const eAtk  = ePOW*1.15 + eFOC*0.95 + enemy.spd*0.80;
  const eDef  = enemy.grt*1.00 + enemy.spd*0.80;

  const spdDiff = (run.stats.spd - enemy.spd);
  const tempo = clamp(spdDiff * 0.30, -6, 6);
  const guard = clamp((run.stats.grt - enemy.pow) * 0.25, -4, 4);
  const offVsDef = (run.stats.pow + run.stats.foc) - (run.stats.grt + run.stats.spd);
  const imbalancePenalty = clamp(offVsDef * 0.10, 0, 6);

  const pEff = pScore - eDef;
  const eEff = eAtk   - pDef2;

  const rng=(Math.random()*10-5);
  const margin=pEff - eEff + rng + tempo + guard - imbalancePenalty;

  log(`⚔️ ${forced?'Forced ':''}Battle — Stage ${run.stage}`);
  if(forced) log('• Reason: Time Left reached 0.');
  log(`• Player ATKbase ${pAtkBase.toFixed(1)} (POW ${pPOW}, FOC ${pFOC}, SPD ${pSPD}) • DEFbase ${pDefBase.toFixed(1)} (GRT ${run.stats.grt}, SPD ${pSPD})`);
  log(`• Enemy  ATKbase ${eAtk.toFixed(1)} • DEFbase ${eDef.toFixed(1)}`);
  log(`• Tempo (SPD Δ ${spdDiff>=0?'+':''}${spdDiff}): ${tempo.toFixed(1)}  • Guard (GRT vs POW): ${guard.toFixed(1)}  • Off-imbalance: -${imbalancePenalty.toFixed(1)}`);
  log(`• Effective → You ${(pEff+tempo+guard-imbalancePenalty).toFixed(1)} | Enemy ${eEff.toFixed(1)} | RNG ${rng.toFixed(1)} | Margin ${margin.toFixed(1)}`);

  const report={
    stage:run.stage, victory:margin>=0, margin:+margin.toFixed(1), rng:+rng.toFixed(1), forced,
    player:{stats:{...run.stats}, atkScore:+(pAtkBase.toFixed(1)), defScore:+(pDef2.toFixed(1)), supDmgPct:Math.round(supDmg*100), supBreakdown:dmgPieces},
    enemy:{stats:enemy, atkScore:+(eAtk.toFixed(1)), defScore:+(eDef.toFixed(1))}
  };
  run.lastReport=report;

  if(report.victory){
    const goldGain=80+run.stage*20, matGain=3+Math.floor(run.stage/2), gemGain=5+run.stage*2;
    profile.gold+=goldGain; profile.mats=Math.min(MATS_CAP, profile.mats+matGain); profile.gems+=gemGain;
    run.unit.meta.exp+=2; run.weapon.meta.exp+=2; const uu=tryLevelUnit(run.unit.meta), ww=tryLevelWeapon(run.weapon.meta);
    renderWallet(); renderInventory(); rebuildChaosPickers();
    log(`✅ Victory! Rewards → +${goldGain} gold, +${matGain} mats, +${gemGain} gems.`); if(uu) log(`⬆️ ${run.unit.def.name} Lv ${run.unit.meta.lvl}.`); if(ww) log(`⬆️ ${run.weapon.def.name} Lv ${run.weapon.meta.lvl}.`);
    if(run.stage>=run.maxStage){ showSummary('Victory', buildCareerSummary(report,{gold:goldGain,mats:matGain,gems:gemGain,final:true}), 'career'); run.active=false; return; }
    run.stage++; const old=run.stamina; run.stamina=Math.min(5, run.stamina+1); resetDeadline(); updateRunUI(); log(`➡️ Stage ${run.stage}. Stamina ${old}→${run.stamina}. Time reset.`);
  } else {
    showSummary('Defeat', buildCareerSummary(report,{gold:0,mats:0,gems:0,final:false}), 'career'); run.active=false;
  }
}

/* === Smarter loss advisor (with icons) === */
function lossAdvice(report){
  const p = report.player, e = report.enemy;
  const ps = p.stats, es = e.stats;
  const bullets = [];

  const atkGap = p.atkScore - e.defScore;
  const defGap = e.atkScore - p.defScore;
  const tempoDiff = (ps.spd - es.spd);
  const guardDiff = (ps.grt - es.pow);
  const scaleDiff = (ps.foc - es.foc);
  const powerDiff = (ps.pow - es.grt);
  const offSum = ps.pow + ps.foc;
  const defSum = ps.grt + ps.spd;

  if (atkGap < -2) bullets.push(`🗡 Offense check failed (ATK ${p.atkScore} vs enemy DEF ${e.defScore}). Train **POW** / **🧠 FOC** or use dmg supports (Brutal/Zenith/Aegis).`);
  else if (atkGap < 1) bullets.push(`🗡 Offense barely broke through (ATK ${p.atkScore} vs DEF ${e.defScore}). A few **POW/🧠 FOC** trainings or a dmg support will tip it.`);

  if (defGap > 2) bullets.push(`🛡 Too squishy (enemy ATK ${e.atkScore} vs your DEF ${p.defScore}). Add **GRT**, some **🌀 SPD**, or guard supports (Guard/Iron/Aegis).`);
  else if (defGap > 0.5) bullets.push(`🛡 Slightly fragile. Sprinkle **GRT/🌀 SPD**.`);

  if (tempoDiff < -3) bullets.push(`🌀 Tempo disadvantage (SPD ${ps.spd} vs ${es.spd}). Add **SPD** or footwork supports (Blitz/Duelist).`);
  if (guardDiff < -2) bullets.push(`🛡 Guard low vs POW (GRT ${ps.grt} vs enemy POW ${es.pow}). Train **GRT** or use **Guard/Iron/Aegis**.`);

  if (scaleDiff < -3 && atkGap <= 0) bullets.push(`🧠 Scaling behind (FOC ${ps.foc} vs ${es.foc}). Boost **FOC** or use **Mind/Zenith** supports.`);
  if (offSum - defSum >= 10) bullets.push(`🎯 Over-offense (Off ${offSum} vs Def ${defSum}). Add **🛡 GRT** and **🌀 SPD**.`);
  else if (defSum - offSum >= 10 && atkGap <= 0) bullets.push(`🎯 Over-tanky (Def ${defSum} vs Off ${offSum}). Add **🗡 POW** / **🧠 FOC**.`);
  if (powerDiff < 0 && atkGap <= 0) bullets.push(`🗡 POW didn’t beat their toughness (enemy GRT ${es.grt}). Add **POW** or POW-lean weapon/support.`);

  if (report.forced) bullets.push(`⏳ Forced battle by deadline. Battle earlier, rest less, or target **🌀 SPD / 🗡 POW** this stage.`);

  if (!bullets.length) bullets.push(`🎯 Margins were close. Nudge **🌀 SPD**, **🛡 GRT**, and whichever of **🗡 POW / 🧠 FOC** fits your build.`);
  return [...new Set(bullets)].join('\n');
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
• ATK (base): ${p.atkScore}  | DEF: ${p.defScore}${sup}

Enemy
• Stats: POW ${e.stats.pow} | SPD ${e.stats.spd} | FOC ${e.stats.foc} | GRT ${e.stats.grt}
• ATK: ${e.atkScore}  | DEF: ${e.defScore}`;

  const rewardLine=(rewards&&(rewards.gold>0||rewards.mats>0||rewards?.gems>0))?
    `\n\nRewards\n• +${rewards.gold||0} gold, +${rewards.mats||0} mats, +${rewards.gems||0} gems`:'';

  let tail='';
  if (!report.victory){
    const advice = lossAdvice(report);
    tail = `\n\nWhy you lost\n${advice}`;
  } else if (rewards?.final){
    tail = `\n\nRun complete! Press Confirm to return.`;
  }
  return base + rewardLine + tail;
}

/* ---------- Career abandon ---------- */
const abandonCareerBtn = q('#btn-abandon');
if (abandonCareerBtn) abandonCareerBtn.addEventListener('click', ()=>{
  if(!run.active){ q('#career-run').classList.add('hidden'); q('#career-setup').classList.remove('hidden'); rebuildPickers(); renderInventory(); updateRunUI(); return; }
  const report={stage:run.stage,victory:false,margin:0,rng:0,forced:false,player:{stats:{...run.stats},atkScore:0,defScore:0,supDmgPct:0,supBreakdown:[]},enemy:{stats:{pow:0,spd:0,foc:0,grt:0},atkScore:0,defScore:0}};
  showSummary('Abandoned', buildCareerSummary(report,{gold:0,mats:0,gems:0}), 'career'); run.active=false;
});

/* ==================================================
   Memories of Chaos (hands-on)
   ================================================== */
const CHAOS_FLOORS = 8;
const chaos = {
  active:false, floor:1, maxFloor:CHAOS_FLOORS, wave:1, wavesPerFloor:2,
  stars:0, score:0,
  team:[], enemies:[],
  phase:'player',
  selection:{allyIdx:null, enemyIdx:null},
  modifiers:[],
  lastReport:null
};

function bestWeaponFor(arche){
  const sorted = profile.weapons.slice().sort((a,b)=>b.lvl-a.lvl);
  let best=null;
  for(const meta of sorted){
    const def=byId(WEAPONS,meta.id);
    if (!best || (def.pref===arche && meta.lvl >= (best.meta?.lvl||0))) best={meta,def};
    if (def.pref===arche) return best;
  }
  return best;
}
function unitEffectiveStats(def, meta, w){
  const ul = meta.lvl;
  let pow = def.base.pow, spd = def.base.spd, foc = def.base.foc, grt = def.base.grt;
  if (w && w.meta && w.def){
    const ws = 1 + (w.def.growth || 0) * ((w.meta.lvl || 1) - 1);
    pow += Math.round((w.def.add?.pow || 0) * ws);
    spd += Math.round((w.def.add?.spd || 0) * ws);
    foc += Math.round((w.def.add?.foc || 0) * ws);
    grt += Math.round((w.def.add?.grt || 0) * ws);
  }
  const s = 1 + 0.05 * (ul - 1);
  pow = Math.round(pow * s);
  spd = Math.round(spd * s);
  foc = Math.round(foc * s);
  grt = Math.round(grt * s);
  return { pow, spd, foc, grt };
}

/* Chaos pickers */
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
      const already = chaos.team.find(t=>t.unitMeta.id===meta.id);
      if (already) {
        chaos.team = chaos.team.filter(t=>t.unitMeta.id!==meta.id);
        div.classList.remove('selected');
      } else {
        if (chaos.team.length >= 3) return;
        div.classList.add('selected');
        const best = bestWeaponFor(def.arche);
        const s = unitEffectiveStats(def, meta, best);
        const sheet = toSheet(s, def.name, meta.lvl);
        chaos.team.push({
          unitMeta: meta, unitDef: def,
          weaponMeta: best?.meta || null, weaponDef: best?.def || null,
          stats: s, ...sheet,
          alive: true, acted: false
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

/* Battlefield UI */
function renderBattlefield(){
  const ag = q('#chaos-ally-grid'); ag.innerHTML='';
  chaos.team.forEach((a,idx)=>{
    const card = document.createElement('div');
    card.className = 'battle-card' + (a.alive?'':' dead') + (chaos.selection.allyIdx===idx?' selected':'');
    card.innerHTML = `
      <div class="title">${a.unitDef.name}${a.acted?' <span class="tiny">(Acted)</span>':''}</div>
      <div class="stat-line">ATK ${a.atk} • DEF ${a.def} • SPD ${a.spd} <span class="tiny">(acc/eva)</span></div>
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

/* Stat sheet → MoC */
function toSheet(s, label='Unit', lvl=1){
  const POW = Number.isFinite(s.pow) ? s.pow : 0;
  const SPD = Number.isFinite(s.spd) ? s.spd : 0;
  const FOC = Number.isFinite(s.foc) ? s.foc : 0;
  const GRT = Number.isFinite(s.grt) ? s.grt : 0;

  const hp   = Math.round(GRT*4 + FOC*3 + 30 + lvl*4);
  const atk  = Math.round(POW*1.4 + FOC*1.0);
  const def  = Math.round(GRT*0.9 + SPD*0.6);
  const spd  = Math.max(1, Math.round(SPD));
  return { maxHp:hp, hp, atk, def, spd, label };
}

/* Enemies */
function makeEnemy(floor, idx){
  const f = floor, i = idx;
  const pow = Math.round(18 + f*5 + f*f*0.6 + i*2);
  const spd = Math.round(12 + f*3 + f*f*0.2 + i*1);
  const foc = Math.round(12 + f*3 + f*f*0.25);
  const grt = Math.round(14 + f*3 + f*f*0.25 + i*1);
  const sheet = toSheet({pow,spd,foc,grt}, `Enemy ${idx+1}`, f);
  return { name:`E${floor}-${idx+1}`, ...sheet, alive:true, raw:{pow,spd,foc,grt} };
}

/* Modifiers */
function chaosFloorModifiers(floor){
  const list = ['Enemy +10% ATK','Enemy +15% DEF','Your SPD +10%','Your POW +10%'];
  return [list[floor%list.length], list[(floor+2)%list.length]];
}
function livingAllies(){ return chaos.team.filter(a=>a.alive); }
function allLivingAlliesActed(){ return livingAllies().every(a=>a.acted); }
function resetActs(){ chaos.team.forEach(a=>{ if (a.alive) a.acted = false; }); }

function withModifiers(type, value){
  let v=value;
  for (const m of chaos.modifiers){
    if (m==='Enemy +10% ATK' && type==='enemyAtk') v*=1.10;
    if (m==='Enemy +15% DEF' && type==='enemyDef') v*=1.15;
    if (m==='Your SPD +10%'  && type==='allyDef') v*=1.06;
    if (m==='Your POW +10%'  && type==='allyAtk') v*=1.08;
  }
  return Math.round(v);
}

/* Flow */
function startChaos(){
  if (chaos.team.length===0){ alert('Pick at least one unit.'); return; }
  chaos.active = true; run.mode='chaos';
  chaos.floor = 1; chaos.wave = 1; chaos.stars = 0; chaos.score = 0; chaos.phase='player';
  chaos.modifiers = chaosFloorModifiers(chaos.floor);
  setupEnemies();
  resetActs();
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

  const agg = chaos.team.reduce((a,t)=>({pow:a.pow+t.atk, def:a.def+t.def, spd:a.spd+t.spd}), {pow:0,def:0,spd:0});
  q('#chaos-stats').innerHTML = `<div>Team ATK ${agg.pow} • Team DEF ${agg.def} • Team SPD ${agg.spd}</div>`;

  updateChaosHud();
}
function updateChaosHud(){
  const ai = chaos.selection.allyIdx, ei = chaos.selection.enemyIdx;
  const ally = ai!=null ? chaos.team[ai] : null;
  const enemy = ei!=null ? chaos.enemies[ei] : null;
  const can = chaos.phase==='player' && ally && enemy && ally.alive && !ally.acted && enemy.hp>0;
  q('#chaos-attack').disabled = !can;
}

/* Combat */
const clampf = clamp;
function calcDamage(attacker, defender, isEnemy=false){
  const spdDiff = (attacker.spd || 0) - (defender.spd || 0);
  const baseHit = 0.82 + spdDiff * 0.002;
  const hit = clampf(baseHit, 0.65, 0.95);
  if (Math.random() > hit){ return { dmg:0, miss:true, crit:false }; }

  const atk = withModifiers(isEnemy?'enemyAtk':'allyAtk', attacker.atk);
  const def = withModifiers(isEnemy?'enemyDef':'allyDef', defender.def);
  const base = Math.max(1, Math.round((atk - def*0.55)));
  const rng  = (Math.random()*6 - 3);
  let dmg = Math.max(1, Math.round(base + rng));

  const focLike = (attacker.stats?.foc) ?? (attacker.raw?.foc) ?? (attacker.spd || 0);
  const critChance = clampf(0.08 + (focLike * 0.004), 0.08, 0.30);
  const crit = Math.random() < critChance;
  if (crit) dmg = Math.round(dmg * 1.5);

  return { dmg, miss:false, crit };
}

function playerAttack(){
  const ai = chaos.selection.allyIdx, ei = chaos.selection.enemyIdx;
  if (ai==null || ei==null) return;
  const hero = chaos.team[ai]; const foe = chaos.enemies[ei];
  if (!hero.alive || hero.acted || foe.hp<=0 || chaos.phase!=='player') return;

  const res = calcDamage(hero, foe, false);
  if (res.miss){
    clog(`💨 ${hero.unitDef.name} → ${foe.name}: MISS (SPD diff ${hero.spd - foe.spd >= 0 ? '+' : ''}${hero.spd - foe.spd})`);
  } else {
    clog(`${res.crit?'💥 CRIT! ':'🗡️ '}${hero.unitDef.name} → ${foe.name}: -${res.dmg} HP`);
    foe.hp -= res.dmg;
    if (foe.hp<=0){ clog(`☠️ ${foe.name} is defeated!`); }
  }

  hero.acted = true;
  renderBattlefield();
  updateChaosHud();

  if (chaos.enemies.every(e=>e.hp<=0)){
    clog('✅ Wave cleared.');
    nextWaveOrFloor();
    return;
  }
  if (allLivingAlliesActed()){
    clog('↩️ All allies have acted. Enemy Phase.');
    enemyTurn();
    return;
  }
  chaos.selection.enemyIdx = null;
  updateChaosHud();
}

function enemyTurn(){
  chaos.phase='enemy';
  updateChaosUI();

  const living = chaos.team.filter(a=>a.alive);
  if (living.length===0){ defeatChaos('All heroes defeated'); return; }

  for (const foe of chaos.enemies){
    if (foe.hp<=0) continue;
    const targets = chaos.team.filter(a=>a.alive);
    if (!targets.length) break;
    const tgt = targets[Math.floor(Math.random()*targets.length)];
    const res = calcDamage(foe, tgt, true);
    if (res.miss){
      clog(`💨 ${foe.name} → ${tgt.unitDef?.name||tgt.name}: MISS`);
    } else {
      tgt.hp -= res.dmg;
      clog(`${res.crit?'💥 CRIT! ':'🔥 '}${foe.name} → ${tgt.unitDef?.name||tgt.name}: -${res.dmg} HP`);
      if (tgt.hp<=0){ tgt.alive=false; clog(`☠️ ${tgt.unitDef?.name||tgt.name} has fallen.`); }
    }
  }

  renderBattlefield();
  if (chaos.team.every(a=>!a.alive)){ defeatChaos('All heroes defeated'); return; }

  resetActs();
  chaos.phase='player';
  updateChaosUI();
}

function nextWaveOrFloor(){
  chaos.score += 2;

  if (chaos.wave >= chaos.wavesPerFloor){
    const floorStars = 2 + (chaos.team.filter(a=>a.alive).length>=3 ? 1 : 0);
    chaos.stars += floorStars;
    clog(`🌟 Floor ${chaos.floor} cleared for ${floorStars}★.`);

    if (chaos.floor >= chaos.maxFloor){
      const gems = chaos.stars*15 + Math.floor(chaos.score/5)*5;
      profile.gems += gems; renderWallet();
      const text = buildChaosSummary(true, gems);
      showSummary('Chaos Cleared', text, 'chaos');
      chaos.active=false; return;
    }

    chaos.floor++; chaos.wave=1; chaos.modifiers = chaosFloorModifiers(chaos.floor);
    chaos.team.forEach(a=>{ if(a.alive){ a.hp = Math.min(a.maxHp, a.hp + Math.round(a.maxHp*0.3)); } });
    setupEnemies();
    resetActs();
    clog(`➡️ Floor ${chaos.floor}. Modifiers: ${chaos.modifiers.join(' • ')}. Survivors healed 30%.`);
  } else {
    chaos.wave++;
    chaos.team.forEach(a=>{ if(a.alive){ a.hp = Math.min(a.maxHp, a.hp + Math.round(a.maxHp*0.1)); } });
    setupEnemies();
    resetActs();
    clog(`➡️ Wave ${chaos.wave}. Your team healed 10%.`);
  }

  chaos.phase='player'; chaos.selection={allyIdx:null, enemyIdx:null};
  updateChaosUI(); renderBattlefield();
}

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
${!final && reason?`\nTip\n• Train more in Career, equip matching weapons, and balance offense (POW/FOC) with defense/tempo (GRT/SPD).` : ''}`;
}

/* ---------- Summary Modal ---------- */
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

/* ---------- Wires ---------- */
q('#start-run')?.addEventListener('click', startRun);
qa('[data-train]')?.forEach(b=>b.addEventListener('click', ()=>trainOnce(b.getAttribute('data-train'))));
q('#btn-rest')?.addEventListener('click', restOnce);
q('#btn-battle')?.addEventListener('click', ()=>battleStage(false));
q('#btn-save')?.addEventListener('click', save);
q('#btn-load')?.addEventListener('click', load);
q('#btn-wipe')?.addEventListener('click', wipe);

q('#chaos-start')?.addEventListener('click', startChaos);
q('#chaos-attack')?.addEventListener('click', playerAttack);
q('#chaos-endturn')?.addEventListener('click', enemyTurn);
q('#chaos-abandon')?.addEventListener('click', ()=>{
  if(!chaos.active){ modal.classList.add('hidden'); q('#chaos-run').classList.add('hidden'); q('#chaos-setup').classList.remove('hidden'); rebuildChaosPickers(); return; }
  defeatChaos('Abandoned');
});

attachGacha();

/* Regen tick & boot */
setInterval(()=>{ renderWallet(); }, 1000);
renderWallet(); renderInventory(); rebuildPickers(); rebuildChaosPickers(); updatePityUI();
const hadSave = load();        // try to load
ensureStarterRoster();         // then grant starters if needed (new/empty)
