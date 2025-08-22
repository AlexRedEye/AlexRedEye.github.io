export const nowMs = () => Date.now();
export const pluralize = (n, s, p=null) => `${n} ${n===1 ? s : (p ?? s+'s')}`;
export const randomInt = (min,max)=> Math.floor(Math.random()*(max-min+1))+min;
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function formatDuration(sec){
  sec = Math.max(0, Math.ceil(sec));
  const m = Math.floor(sec/60), s = sec%60;
  return m>0 ? `${m}m ${s}s` : `${s}s`;
}
export function setButtonState(button, affordable){
  if (!button) return;
  button.classList.remove('affordable','unaffordable');
  if (button.disabled) button.classList.add('unaffordable');
  else if (affordable) button.classList.add('affordable');
}
