// Solo Challenge Mode
// Defines challenge presets and a manager to track progress.
// Handles start/stop, turn ticks, mission wins, and win/lose detection.

export const CHALLENGES = {
  rookie:   { id: 'rookie',   name: 'Rookie',   winsRequired: 2, maxTurns: 5, desc: 'Win 2 missions within 5 turns.' },
  pilot:    { id: 'pilot',    name: 'Pilot',    winsRequired: 3, maxTurns: 6, desc: 'Win 3 missions within 6 turns.' },
  captain:  { id: 'captain',  name: 'Captain',  winsRequired: 4, maxTurns: 7, desc: 'Win 4 missions within 7 turns.' },
};

export class ChallengeManager {
  constructor(logger) {
    this.logger = logger;
    this.active = false;
    this.presetId = null;
    this.turnsUsed = 0;
    this.wins = 0;
  }

  start(presetId) {
    const preset = CHALLENGES[presetId];
    if (!preset) {
      this.logger?.error('Cannot start challenge: invalid preset.');
      return { ok: false, error: 'Invalid challenge preset.' };
    }
    this.active = true;
    this.presetId = presetId;
    this.turnsUsed = 0;
    this.wins = 0;
    this.logger?.info(`Challenge started: ${preset.name} — ${preset.desc}`);
    return { ok: true };
  }

  cancel() {
    if (!this.active) return { ok: true };
    const p = this.getPreset();
    this.active = false;
    this.logger?.warn(`Challenge cancelled${p ? ` (${p.name})` : ''}.`);
    return { ok: true };
  }

  getPreset() {
    return this.presetId ? CHALLENGES[this.presetId] : null;
  }

  // Called at end of each turn
  tickTurn() {
    if (!this.active) return { status: 'idle' };
    this.turnsUsed += 1;
    return this._evaluate();
  }

  // Called on each mission success
  recordWin() {
    if (!this.active) return { status: 'idle' };
    this.wins += 1;
    return this._evaluate(true);
  }

  _evaluate(fromWin = false) {
    const p = this.getPreset();
    if (!p) return { status: 'idle' };

    if (this.wins >= p.winsRequired) {
      this.active = false;
      this.logger?.info(`🎉 Challenge complete: ${p.name}! You won ${this.wins}/${p.winsRequired} in ${this.turnsUsed}/${p.maxTurns} turns.`);
      return { status: 'won' };
    }

    if (this.turnsUsed >= p.maxTurns) {
      // Ran out of turns without meeting wins
      this.active = false;
      this.logger?.warn(`❌ Challenge failed: ${p.name}. You achieved ${this.wins}/${p.winsRequired} in ${this.turnsUsed}/${p.maxTurns} turns.`);
      return { status: 'lost' };
    }

    // Still running
    if (fromWin) {
      this.logger?.info(`Challenge progress: ${this.wins}/${p.winsRequired} wins, ${this.turnsUsed}/${p.maxTurns} turns used.`);
    }
    return { status: 'running' };
  }

  // ----- serialization -----
  serialize() {
    return {
      active: this.active,
      presetId: this.presetId,
      turnsUsed: this.turnsUsed,
      wins: this.wins,
    };
  }
  static deserialize(obj, logger) {
    const m = new ChallengeManager(logger);
    if (!obj || typeof obj !== 'object') return m;
    m.active = !!obj.active;
    m.presetId = obj.presetId || null;
    m.turnsUsed = Number.isFinite(obj.turnsUsed) ? obj.turnsUsed : 0;
    m.wins = Number.isFinite(obj.wins) ? obj.wins : 0;
    return m;
  }
}
