import { contractState, settings } from './state.js';

export function showToast(text, type, originElement){
  if (!settings.toasts) return; // respect toggle

  const container = document.getElementById('toast-container');
  if (!container) return;
  const div = document.createElement('div');
  div.className = `toast ${type}`;

  // Reduced motion → shorter animation
  if (settings.reducedMotion) div.style.animationDuration = '0.45s';

  const rect = originElement ? originElement.getBoundingClientRect()
                             : { left: window.innerWidth/2, top: 0, width: 0 };
  div.style.left = rect.left + rect.width/2 + 'px';
  div.style.top = rect.top + window.scrollY + 'px';
  div.textContent = text;
  container.appendChild(div);
  setTimeout(()=>div.remove(), settings.reducedMotion ? 600 : 1000);
}

export function playChime(){
  if (!settings.sound) return; // respect toggle
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type='triangle';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime+0.15);
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+(settings.reducedMotion?0.25:0.4));
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+(settings.reducedMotion?0.27:0.42));
  }catch{}
}

const RARITY_CONFETTI = {
  common:    ['#bdbdbd', '#9e9e9e', '#eeeeee', '#b0bec5'],
  rare:      ['#90caf9', '#64b5f6', '#42a5f5', '#40c4ff'],
  epic:      ['#ce93d8', '#ba68c8', '#ab47bc', '#b388ff'],
  legendary: ['#ffd54f', '#ffca28', '#ffb300', '#ffab40']
};
export const rarityPalette = (r) => RARITY_CONFETTI[r] || RARITY_CONFETTI.common;

export function celebrateContract(){
  // Status
  const cStatus = document.getElementById('contract-status');
  if (cStatus){ cStatus.textContent = 'Contract Complete!'; cStatus.classList.add('success'); }

  // Tab pulse
  const tabContracts = document.getElementById('tab-contracts');
  if (tabContracts){
    tabContracts.classList.add('pulse');
    setTimeout(()=>tabContracts.classList.remove('pulse'), 2400);
  }

  // Confetti (respect toggles)
  if (settings.confetti){
    const container = document.getElementById('contract-burst');
    if (container){
      const palette = rarityPalette(contractState.rarity);
      let pieces = (contractState.rarity==='legendary') ? 80 : (contractState.rarity==='epic') ? 60 : 40;
      if (settings.reducedMotion) pieces = Math.ceil(pieces/2);
      for (let i=0;i<pieces;i++){
        const el = document.createElement('div');
        el.className='confetti';
        if (settings.reducedMotion) el.style.animationDuration = '0.6s';
        el.style.background = palette[i%palette.length];
        const startX = 50 + (Math.random()*20-10);
        const startY = 10 + Math.random()*10;
        el.style.left = `${startX}%`;
        el.style.top  = `${startY}%`;
        const dx = (Math.random()*240-120);
        const dy = 180 + Math.random()*140;
        el.style.setProperty('--dx', `${dx}px`);
        el.style.setProperty('--dy', `${dy}px`);
        container.appendChild(el);
        setTimeout(()=>el.remove(), settings.reducedMotion?700:1200);
      }
    }
  }

  playChime();
}
