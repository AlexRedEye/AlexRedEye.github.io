export const CARD_TYPES = {
  REACTOR: 'Reactor',     // +2 Actions (no draws)
  THRUSTERS: 'Thrusters', // +2 Draws
  SHIELDS: 'Shields',     // +1 Shield
  DAMAGE: 'Damage',       // +1 Damage
  MISS: 'Miss',           // No effect (dead card)
  CREW: 'Crew'            // +1 Action (placeholder) — not in starter deck
};

export function starterDeck() {
  // 10-card Starting Deck:
  // 3x Reactor, 2x Thrusters, 2x Shields, 2x Damage, 1x Miss
  return [
    { id: 'R1', type: CARD_TYPES.REACTOR },
    { id: 'R2', type: CARD_TYPES.REACTOR },
    { id: 'R3', type: CARD_TYPES.REACTOR },

    { id: 'T1', type: CARD_TYPES.THRUSTERS },
    { id: 'T2', type: CARD_TYPES.THRUSTERS },

    { id: 'S1', type: CARD_TYPES.SHIELDS },
    { id: 'S2', type: CARD_TYPES.SHIELDS },

    { id: 'D1', type: CARD_TYPES.DAMAGE },
    { id: 'D2', type: CARD_TYPES.DAMAGE },

    { id: 'M1', type: CARD_TYPES.MISS },
  ];
}
