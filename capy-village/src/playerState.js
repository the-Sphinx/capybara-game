// ─── Player economy state ──────────────────────────────────────────────────────
// coins:      current watermelon coin balance
// ownedItems: accessory ids the player has purchased (or starts with)
// equipped:   currently equipped accessory per tab category (tab keys: hats, neck)
export const playerState = {
  coins: 120,
  ownedItems: ['beanie', 'scarf'],
  equipped: {
    hats: 'beanie',
    neck: 'scarf',
  },
};
