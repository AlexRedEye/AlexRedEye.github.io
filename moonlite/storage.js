// Local persistence with basic schema/versioning + validation.
// Errors are returned (not thrown) so the game can continue.

const STORAGE_KEY = 'moonrakers-lite/save';
const SCHEMA_VERSION = 2; // bumped for challenge support

export function saveState(s) {
  try {
    const payload = {
      v: SCHEMA_VERSION,
      t: Date.now(),
      state: {
        deck: s.deck,
        discard: s.discard,
        hand: s.hand,
        credits: s.credits,
        actions: s.actions,
        shields: s.shields,
        damage: s.damage,
        reactorsPlayed: s.reactorsPlayed,
        thrustersPlayed: s.thrustersPlayed,
        mission: s.mission,
        challenge: s.challenge ? { ...s.challenge } : null, // serialized by game
      }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ok: false, error: 'No save found.' };
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.state) return { ok: false, error: 'Save is corrupted.' };

    // Back-compat: accept v1 saves without challenge field
    if (parsed.v !== 1 && parsed.v !== SCHEMA_VERSION) {
      return { ok: false, error: 'Save is incompatible or from a newer version.' };
    }

    const s = parsed.state;
    if (!Array.isArray(s.deck) || !Array.isArray(s.discard) || !Array.isArray(s.hand)) {
      return { ok: false, error: 'Save lacks card piles.' };
    }
    return { ok: true, data: s, savedAt: parsed.t, version: parsed.v };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}
