// ─── Player economy state ──────────────────────────────────────────────────────
// coins:      current watermelon coin balance
// ownedItems: accessory ids the player has purchased (or starts with)
// equipped:   currently equipped accessory per tab category (tab keys: hats, neck)
export const playerState = {
  coins: 30,
  ownedItems: [],
  equipped: {
    hats: null,
    neck: null,
  },
};
