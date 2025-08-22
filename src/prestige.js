import { TREE_NODES, TREE_NODE_MAP, TREE_BASE_COST } from './constants.js';
import { gameState } from './state.js';
import { setButtonState } from './utils.js';

export const treeCost = (node) => (TREE_BASE_COST[node]||1) * Math.pow(2, (gameState.tree[node]||0));

function prettyNodeName(key){
  return ({
    workerBoost: 'Stronger Workers',
    truckBoost:  'Bigger Trucks',
    manualBoost: 'Manual Mastery',
    critBoost:   'Lucky Crits',
    managerBoost:'Dispatch Pro'
  })[key] || key;
}

let selectedNodeKey = null;
export const getSelectedOrNull = () => selectedNodeKey;

export function drawPrestigeTree(){
  const svg = document.getElementById('tree-svg');
  if (!svg) return;
  svg.innerHTML = '';

  // edges
  TREE_NODES.forEach(n=>{
    n.deps.forEach(parent=>{
      const p = TREE_NODE_MAP[parent];
      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1',p.x); line.setAttribute('y1',p.y);
      line.setAttribute('x2',n.x); line.setAttribute('y2',n.y);
      line.setAttribute('class','edge');
      svg.appendChild(line);
    });
  });

  // nodes
  TREE_NODES.forEach(n=>{
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class',`node ${n.cat} ${selectedNodeKey===n.key?'selected':''}`);
    g.dataset.key = n.key;

    const r = 56;
    const circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
    circle.setAttribute('cx',n.x); circle.setAttribute('cy',n.y); circle.setAttribute('r',r);
    g.appendChild(circle);

    const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
    txt.setAttribute('x',n.x); txt.setAttribute('y',n.y); txt.setAttribute('font-size','34');
    txt.textContent = n.label;
    g.appendChild(txt);

    const lvl = (gameState.tree[n.key]||0);
    const lvlTxt = document.createElementNS('http://www.w3.org/2000/svg','text');
    lvlTxt.setAttribute('x', n.x + r - 6);
    lvlTxt.setAttribute('y', n.y - r + 20);
    lvlTxt.setAttribute('class','lvl');
    lvlTxt.textContent = `Lv ${lvl}`;
    g.appendChild(lvlTxt);

    g.addEventListener('click',()=>{
      selectedNodeKey = n.key;
      updatePrestigeSide();
      drawPrestigeTree();
    });

    svg.appendChild(g);
  });
}

export function updatePrestigeSide(){
  const t = document.getElementById('node-title');
  const d = document.getElementById('node-desc');
  const l = document.getElementById('node-level');
  const c = document.getElementById('node-cost');
  const buy = document.getElementById('node-buy');

  if (!t) return;
  if (!selectedNodeKey){
    t.textContent = 'Select a node';
    d.textContent = 'Click a circle to see details.';
    l.textContent = 'Level: —'; c.textContent = 'Cost: —';
    if (buy) buy.disabled = true;
    return;
  }

  const n = TREE_NODE_MAP[selectedNodeKey];
  const lvl = gameState.tree[selectedNodeKey] || 0;
  const cost = treeCost(selectedNodeKey);
  const depsMet = (n.deps||[]).every(k => (gameState.tree[k]||0) >= 1);

  t.textContent = `${n.label} — ${prettyNodeName(selectedNodeKey)}`;
  d.textContent = n.desc + (n.deps.length ? ` (Requires: ${n.deps.map(k=>prettyNodeName(k)).join(', ')})` : '');
  l.textContent = `Level: ${lvl}`;
  c.textContent = `Cost: ${cost} token${cost===1?'':'s'}`;

  const canAfford = gameState.tokens >= cost;
  if (buy){
    buy.disabled = !(canAfford && depsMet);
    setButtonState(buy, canAfford && depsMet);
  }
}

export function buyNode(nodeKey){
  const cost = treeCost(nodeKey);
  if (gameState.tokens < cost) return;
  const n = TREE_NODE_MAP[nodeKey];
  const depsMet = (n.deps||[]).every(k => (gameState.tree[k]||0) >= 1);
  if (!depsMet) return;
  gameState.tokens -= cost;
  gameState.tree[nodeKey] += 1;
  updatePrestigeSide();
  drawPrestigeTree();
}
