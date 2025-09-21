import { Logger } from './logger.js';
import { Utils } from './utils.js';
import { CARD_TYPES, starterDeck } from './cards.js';
import { generateMission } from './missions.js';
import { saveState, loadState, clearSave } from './storage.js';
import { CHALLENGES, ChallengeManager } from './challenge.js';

// Game Version Information
export const GAME_VERSION = '0.1.0-alpha';
export const VERSION_INFO = {
  version: '0.1.0-alpha',
  date: '2025-09-21',
  build: 'alpha',
  changelog: [
    'Initial alpha release',
    'Basic game mechanics implemented',
    'Challenge mode available',
    'Save/Load functionality'
  ]
};

export default class Game {
  constructor(logEl) {
    this.version = GAME_VERSION;
    this.logger = new Logger(logEl);
    this.state = {
      deck: [],
      discard: [],
      hand: [],
      credits: 0,
      actions: 1,
      shields: 0,
      damage: 0,
      reactorsPlayed: 0,
      thrustersPlayed: 0,
      mission: null,
      challenge: null,
    };

    this.challenge = new ChallengeManager(this.logger);

    // modal refs
    this.modal = {
      root: null, title: null, body: null,
      btnRetry: null, btnNew: null, btnClose: null
    };

    // simple debounce for "End Turn"
    this._endTurnBusy = false;
  }

  // ---------- lifecycle ----------
  init() {
    this._cacheModal();
    this.newGame();
    this._wireUI();
    this._wireShortcuts();
    this.logger.info('Game initialized (Results Modal + sturdier End Turn).');
  }

  newGame() {
    const s = this.state;
    s.deck = Utils.shuffle(starterDeck().map(c => ({ ...c })));
    s.discard = [];
    s.hand = [];
    s.credits = 0;
    s.mission = null;

    this.challenge.cancel();
    s.challenge = this.challenge.serialize();

    this._resetTurnState();
    this._draw(5);
    this.render();
    this.logger.info('New game started. Drew 5 cards. Mission cleared. Challenge (if any) cancelled.');
  }

  _resetTurnState() {
    const s = this.state;
    s.actions = 1;
    s.shields = 0;
    s.damage = 0;
    s.reactorsPlayed = 0;
    s.thrustersPlayed = 0;
  }

  async endTurn() {
    // Debounce to guarantee only one resolution per click/spam
    if (this._endTurnBusy) return;
    this._endTurnBusy = true;
    const btn = document.getElementById('btn-end-turn');
    if (btn) btn.disabled = true;

    try {
      const s = this.state;
      this.logger.info(
        `Turn Summary → Actions: ${s.actions}, Reactors: ${s.reactorsPlayed}, Thrusters: ${s.thrustersPlayed}, Shields: ${s.shields}, Damage: ${s.damage}`
      );

      // Advance to next hand
      this.discardHand();
      this._resetTurnState();
      this._draw(5);

      // Challenge tick AFTER hand refresh
      const res = this.challenge.tickTurn();
      this.state.challenge = this.challenge.serialize();

      // Render first so the UI shows the new hand even if a modal appears
      this.render();

      if (res.status === 'won' || res.status === 'lost') {
        const p = this.challenge.getPreset();
        const title = res.status === 'won' ? 'Challenge Complete 🎉' : 'Challenge Failed ❌';
        const body = res.status === 'won'
          ? `You completed <strong>${p.name}</strong>!`
          : `You ran out of turns on <strong>${p.name}</strong>.`;
        this._showResultModal(title, `${body}<br/><br/>Wins: ${this.challenge.wins}/${p.winsRequired}<br/>Turns: ${this.challenge.turnsUsed}/${p.maxTurns}`);
      } else {
        this.logger.info('End of turn. Drew 5 new cards.');
      }
    } finally {
      if (btn) btn.disabled = false;
      this._endTurnBusy = false;
    }
  }

  // ---------- deck/hand ----------
  _draw(n = 1) {
    const s = this.state;
    for (let i = 0; i < n; i++) {
      if (s.deck.length === 0) {
        if (s.discard.length === 0) {
          this.logger.warn('No cards left to draw.');
          break;
        }
        s.deck = Utils.shuffle(s.discard.splice(0, s.discard.length));
        this.logger.info('Shuffled discard into deck.');
      }
      const card = s.deck.pop();
      s.hand.push(card);
    }
  }

  discardHand() {
    const s = this.state;
    if (!s.hand.length) { this.logger.warn('Hand is already empty.'); return; }
    s.discard.push(...s.hand.splice(0, s.hand.length));
    this.logger.info('Discarded hand.');
  }

  shuffleAll() {
    const s = this.state;
    s.deck = Utils.shuffle(s.deck.concat(s.discard.splice(0, s.discard.length)));
    this.logger.info('Shuffled all cards.');
    this.render();
  }

  // ---------- missions ----------
  newMission() {
    this.state.mission = generateMission();
    this.logger.info(`New mission: ${this.state.mission.name}`);
    this.render();
  }

  attemptMission() {
    const s = this.state;
    const m = s.mission;
    if (!m) return this.logger.warn('No mission selected.');

    const req = {
      reactors: m.req.reactors || 0,
      thrusters: m.req.thrusters || 0,
      shields: m.req.shields || 0,
      damage: m.req.damage || 0,
    };

    const ok =
      s.reactorsPlayed >= req.reactors &&
      s.thrustersPlayed >= req.thrusters &&
      s.shields >= req.shields &&
      s.damage >= req.damage;

    if (ok) {
      const reward = m.reward?.credits ?? 0;
      s.credits += reward;
      this.logger.info(`Mission SUCCESS: +${reward} credits.`);
      s.mission = null;

      const res = this.challenge.recordWin();
      this.state.challenge = this.challenge.serialize();

      // If the win completes the challenge, show modal
      if (res.status === 'won') {
        const p = this.challenge.getPreset();
        this.render();
        this._showResultModal(
          'Challenge Complete 🎉',
          `You completed <strong>${p.name}</strong>!<br/><br/>Wins: ${this.challenge.wins}/${p.winsRequired}<br/>Turns: ${this.challenge.turnsUsed}/${p.maxTurns}`
        );
        return;
      }
    } else {
      this.logger.warn(
        `Mission FAILED: need R:${req.reactors} T:${req.thrusters} S:${req.shields} D:${req.damage}. ` +
        `You have R:${s.reactorsPlayed} T:${s.thrustersPlayed} S:${s.shields} D:${s.damage}.`
      );
    }
    this.render();
  }

  // ---------- card play ----------
  playCard(index) {
    const s = this.state;
    if (index < 0 || index >= s.hand.length) return this.logger.warn('Invalid card index.');
    const card = s.hand[index];

    const freePlay = (card.type === CARD_TYPES.REACTOR);
    if (!freePlay && s.actions <= 0) {
      return this.logger.warn('No Actions left. Play a Reactor to gain more.');
    }

    // Spend 1 action (reactor refunds +2)
    s.actions -= 1;

    switch (card.type) {
      case CARD_TYPES.REACTOR:
        s.reactorsPlayed += 1;
        s.actions += 2;
        this.logger.info('Played Reactor: +2 Actions.');
        break;
      case CARD_TYPES.THRUSTERS:
        s.thrustersPlayed += 1;
        this._draw(2);
        this.logger.info('Played Thrusters: +2 Draws.');
        break;
      case CARD_TYPES.SHIELDS:
        s.shields += 1;
        this.logger.info('Played Shields: +1 Shield.');
        break;
      case CARD_TYPES.DAMAGE:
        s.damage += 1;
        this.logger.info('Played Damage: +1 Damage.');
        break;
      case CARD_TYPES.MISS:
        this.logger.warn('Played Miss: no effect.');
        break;
      default:
        this.logger.warn('Unknown card type.');
    }

    s.discard.push(...s.hand.splice(index, 1));
    this.render();
  }

  // ---------- Save/Load ----------
  save() {
    this.state.challenge = this.challenge.serialize();
    const res = saveState(this.state);
    if (res.ok) this.logger.info('Game saved (with challenge state).');
    else this.logger.error(`Save failed: ${res.error}`);
  }

  load() {
    const res = loadState();
    if (!res.ok) { this.logger.warn(res.error); return; }

    const d = res.data;
    const s = this.state;

    s.deck = Array.isArray(d.deck) ? d.deck : [];
    s.discard = Array.isArray(d.discard) ? d.discard : [];
    s.hand = Array.isArray(d.hand) ? d.hand : [];
    s.credits = Number.isFinite(d.credits) ? d.credits : 0;
    s.actions = Number.isFinite(d.actions) ? d.actions : 1;
    s.shields = Number.isFinite(d.shields) ? d.shields : 0;
    s.damage = Number.isFinite(d.damage) ? d.damage : 0;
    s.reactorsPlayed = Number.isFinite(d.reactorsPlayed) ? d.reactorsPlayed : 0;
    s.thrustersPlayed = Number.isFinite(d.thrustersPlayed) ? d.thrustersPlayed : 0;
    s.mission = (d.mission && typeof d.mission === 'object') ? d.mission : null;

    if (d.challenge) {
      this.challenge = ChallengeManager.deserialize(d.challenge, this.logger);
      s.challenge = this.challenge.serialize();
    } else {
      this.challenge.cancel();
      s.challenge = this.challenge.serialize();
    }

    this.render();
    this.logger.info('Game loaded from save.');
  }

  clearSave() {
    const res = clearSave();
    if (res.ok) this.logger.info('Saved game cleared.');
    else this.logger.error(`Could not clear save: ${res.error}`);
  }

  // ---------- UI wiring ----------
  _wireUI() {
    const $ = (sel) => document.querySelector(sel);
    const hh = (fn) => Utils.safeHandler(this.logger, fn);

    $('#btn-new').addEventListener('click', hh(() => this.newGame()));
    $('#btn-shuffle').addEventListener('click', hh(() => this.shuffleAll()));
    $('#btn-discard-hand').addEventListener('click', hh(() => { this.discardHand(); this.render(); }));
    $('#btn-end-turn').addEventListener('click', hh(() => this.endTurn()));
    $('#btn-new-mission').addEventListener('click', hh(() => { this.newMission(); this.endTurn(); }));
    $('#btn-attempt').addEventListener('click', hh(() => this.attemptMission()));

    // Save/Load
    document.getElementById('btn-save').addEventListener('click', hh(() => this.save()));
    document.getElementById('btn-load').addEventListener('click', hh(() => this.load()));
    document.getElementById('btn-clear-save').addEventListener('click', hh(() => this.clearSave()));

    // Challenge UI
    const startBtn = document.getElementById('btn-challenge-start');
    const cancelBtn = document.getElementById('btn-challenge-cancel');
    startBtn.addEventListener('click', hh(() => {
      const sel = document.getElementById('challenge-select').value;
      this.challenge.start(sel);
      this.state.challenge = this.challenge.serialize();
      this.render();
    }));
    cancelBtn.addEventListener('click', hh(() => {
      this.challenge.cancel();
      this.state.challenge = this.challenge.serialize();
      this.render();
    }));
  }

  _wireShortcuts() {
    window.addEventListener('keydown', (e) => {
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (document.activeElement && document.activeElement.isContentEditable)) return;

      const k = e.key.toLowerCase();
      if (k === 'n') { e.preventDefault(); this.newMission(); this.endTurn(); }
      else if (k === 'a') { e.preventDefault(); this.attemptMission(); }
      else if (k === 'e') { e.preventDefault(); this.endTurn(); }
      else if (k === 's' && e.shiftKey) { e.preventDefault(); this.shuffleAll(); }
      else if (k === 's') { e.preventDefault(); this.save(); }
      else if (k === 'l') { e.preventDefault(); this.load(); }
    });
  }

  // ---------- rendering ----------
  _renderChecklist() {
    const reqsEl = document.getElementById('mission-reqs');
    const rewardEl = document.getElementById('mission-reward');
    const m = this.state.mission;

    if (!m) {
      reqsEl.innerHTML = '';
      rewardEl.textContent = '';
      document.querySelector('.mission-title').textContent = 'No mission yet';
      return;
    }

    document.querySelector('.mission-title').textContent = m.name;
    rewardEl.textContent = `Reward: ${m.reward.credits} credits`;

    const req = { reactors: 0, thrusters: 0, shields: 0, damage: 0, ...m.req };
    const have = {
      reactors: this.state.reactorsPlayed,
      thrusters: this.state.thrustersPlayed,
      shields: this.state.shields,
      damage: this.state.damage
    };

    const row = (label, key) => {
      const need = req[key];
      if (!need) return '';
      const ok = have[key] >= need;
      return `
        <li class="check ${ok ? 'ok' : ''}">
          <span class="chip">${ok ? '✓' : '•'}</span>
          <span class="want">${label}: <span class="have">${have[key]}</span> / ${need}</span>
        </li>
      `;
    };

    reqsEl.innerHTML =
      row('Reactors', 'reactors') +
      row('Thrusters', 'thrusters') +
      row('Shields', 'shields') +
      row('Damage', 'damage');
  }

  _renderTodo() {
    const todoEl = document.getElementById('todo');
    const m = this.state.mission;
    const s = this.state;

    const items = [];

    if (!m) {
      items.push(`<li>Click <strong>New Mission</strong> to get an objective.</li>`);
    } else {
      const r = { reactors: 0, thrusters: 0, shields: 0, damage: 0, ...m.req };
      if (s.reactorsPlayed < r.reactors) items.push(`<li>Play <strong>Reactors</strong> (+2 Actions each) to reach ${r.reactors}.</li>`);
      if (s.thrustersPlayed < r.thrusters) items.push(`<li>Play <strong>Thrusters</strong> (+2 Draws) to reach ${r.thrusters}.</li>`);
      if (s.shields < r.shields) items.push(`<li>Play <strong>Shields</strong> to reach ${r.shields}.</li>`);
      if (s.damage < r.damage) items.push(`<li>Play <strong>Damage</strong> to reach ${r.damage}.</li>`);
      if (!items.length) items.push(`<li>Press <strong>Attempt Mission</strong>!</li>`);
    }

    if (s.actions <= 0) {
      items.unshift(`<li>You have <strong>0 Actions</strong>. Play a <strong>Reactor</strong> to gain Actions.</li>`);
    }

    todoEl.innerHTML = items.join('');
  }

  _renderChallenge() {
    const statusEl = document.getElementById('challenge-status');
    const progEl = document.getElementById('challenge-progress');

    const p = this.challenge.getPreset();
    if (!this.challenge.active) {
      statusEl.textContent = p ? `${p.name}: ${p.desc}` : 'Inactive';
      progEl.innerHTML = '';
      return;
    }

    const wins = this.challenge.wins;
    const turns = this.challenge.turnsUsed;
    const req = p.winsRequired;
    const maxT = p.maxTurns;

    const winPct = Math.min(100, Math.round((wins / req) * 100));
    const turnPct = Math.min(100, Math.round((turns / maxT) * 100));

    statusEl.textContent = `${p.name} — ${wins}/${req} wins, ${turns}/${maxT} turns`;

    progEl.innerHTML = `
      <div class="meta"><span>Wins</span><span>${wins}/${req}</span></div>
      <div class="bar"><div class="fill" style="width:${winPct}%"></div></div>
      <div class="meta"><span>Turns Used</span><span>${turns}/${maxT}</span></div>
      <div class="bar"><div class="fill" style="width:${turnPct}%"></div></div>
    `;
  }

  _renderHand() {
    const handEl = document.getElementById('hand');
    handEl.innerHTML = '';

    const s = this.state;
    this.state.hand.forEach((card, idx) => {
      const cardEl = document.createElement('div');
      const needsAction = !(card.type === CARD_TYPES.REACTOR);
      const canPlay = needsAction ? (s.actions > 0) : true;

      cardEl.className = 'card' + (canPlay ? '' : ' disabled');

      const effectText = (() => {
        switch (card.type) {
          case CARD_TYPES.REACTOR: return '+2 Actions';
          case CARD_TYPES.THRUSTERS: return '+2 Draws';
          case CARD_TYPES.SHIELDS: return '+1 Shield';
          case CARD_TYPES.DAMAGE: return '+1 Damage';
          case CARD_TYPES.MISS: return 'No effect';
          default: return '';
        }
      })();

      cardEl.innerHTML = `
        <div class="title">${card.type}</div>
        <div class="meta">
          <span class="badge">Effect: ${effectText}</span>
          <span class="badge">ID: ${card.id}</span>
        </div>
        <div class="cta">
          <button class="play" ${canPlay ? '' : 'disabled'} title="Play ${card.type}">
            <span>Play</span>
            <span class="cost-pill">Cost: 1 Action</span>
          </button>
        </div>
      `;

      cardEl.querySelector('.play')?.addEventListener('click',
        Utils.safeHandler(this.logger, () => this.playCard(idx)));

      handEl.appendChild(cardEl);
    });
  }

  render() {
    const $ = (sel) => document.querySelector(sel);
    $('#deck-count').textContent = this.state.deck.length;
    $('#discard-count').textContent = this.state.discard.length;
    $('#hand-count').textContent = this.state.hand.length;
    $('#credits').textContent = this.state.credits;

    $('#actions').textContent = this.state.actions;
    $('#shields').textContent = this.state.shields;
    $('#damage').textContent = this.state.damage;
    $('#reactorsPlayed').textContent = this.state.reactorsPlayed;
    $('#thrustersPlayed').textContent = this.state.thrustersPlayed;

    document.getElementById('btn-attempt').disabled = !this.state.mission;

    this._renderChecklist();
    this._renderTodo();
    this._renderChallenge();
    this._renderHand();
  }

  // ---------- modal helpers ----------
  _cacheModal() {
    this.modal.root = document.getElementById('modal');
    this.modal.title = document.getElementById('modal-title');
    this.modal.body = document.getElementById('modal-body');
    this.modal.btnRetry = document.getElementById('btn-modal-retry');
    this.modal.btnNew = document.getElementById('btn-modal-new');
    this.modal.btnClose = document.getElementById('btn-modal-close');

    const closeElems = this.modal.root?.querySelectorAll('[data-close]');
    closeElems?.forEach(el => el.addEventListener('click', () => this._hideModal()));

    // actions
    this.modal.btnRetry?.addEventListener('click', () => {
      const p = this.challenge.getPreset();
      if (!p) { this._hideModal(); return; }
      // fresh game + restart same challenge
      const id = p.id;
      this.newGame();
      this.challenge.start(id);
      this.state.challenge = this.challenge.serialize();
      this.render();
      this._hideModal();
    });

    this.modal.btnNew?.addEventListener('click', () => {
      this.newGame();
      this._hideModal();
    });

    this.modal.btnClose?.addEventListener('click', () => this._hideModal());
  }

  _showResultModal(title, htmlBody) {
    if (!this.modal.root) return;
    this.modal.title.textContent = title;
    this.modal.body.innerHTML = htmlBody;
    this.modal.root.classList.remove('hidden');
    this.modal.root.setAttribute('aria-hidden', 'false');
  }

  _hideModal() {
    if (!this.modal.root) return;
    this.modal.root.classList.add('hidden');
    this.modal.root.setAttribute('aria-hidden', 'true');
  }
}
