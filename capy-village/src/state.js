// ─── Accessory registry ───────────────────────────────────────────────────────
const BASE_ACCESSORIES = {
  crown: { anchor: 'hat_anchor', path: 'models/accessories/crown.glb', scale: 1.0, tiltX: -7 },
  chef_hat: { anchor: 'hat_anchor', path: 'models/accessories/chef_hat.glb', scale: 1.0, tiltX: -7, color: 0xFFFFFF, roughness: 0.7 },
  beanie: { anchor: 'hat_anchor',  path: 'models/accessories/knit_beanie.glb', scale: 1.0, tiltX: -15, doubleSided: true, polygonOffsetPart: 'beanie_body' },
  scarf: { anchor: 'neck_anchor', path: 'models/accessories/scarf_v2.glb', scale: 1.0, tiltX: 0, offset: { x: 0, y: -0.08, z: -0.3 } },
  // glasses: { anchor: 'face_anchor', path: 'glasses.glb', scale: 1.0, tiltX: 0 },
};

// Create and export ACCESSORIES by copying BASE_ACCESSORIES and adding any derived variants (e.g. recolors)
export const ACCESSORIES = {};
for (const [id, config] of Object.entries(BASE_ACCESSORIES)) {
  ACCESSORIES[id] = { id, ...config };
}
// Add derived variants
ACCESSORIES.beanie_red = { ...BASE_ACCESSORIES.beanie, colors: { beanie_body: 0xE63946, beanie_pompom: 0xFFFFFF } };
ACCESSORIES.beanie_blue = { ...BASE_ACCESSORIES.beanie, colors: { beanie_body: 0x2B62E3, beanie_pompom: 0xFFFFFF } };
ACCESSORIES.scarf_red = { ...BASE_ACCESSORIES.scarf, color: 0xFF0000 };
ACCESSORIES.scarf_blue = { ...BASE_ACCESSORIES.scarf, color: 0x0000FF };
ACCESSORIES.scarf_yellow = { ...BASE_ACCESSORIES.scarf, color: 0xF9E90C };
ACCESSORIES.scarf_orange = { ...BASE_ACCESSORIES.scarf, color: 0xFF930F };
ACCESSORIES.scarf_black = { ...BASE_ACCESSORIES.scarf, color: 0x000000 };


// Currently equipped — one accessory id per anchor slot, or null to unequip
export const EQUIPPED = {
  hat_anchor:  null,
  neck_anchor: null,
};

// Currently previewed in closet (not yet on real capy). Synced from EQUIPPED on open.
export const SELECTED = {
  hat_anchor:  null,
  neck_anchor: null,
};

export const CLOSET_TABS = {
  hats: {
    label: 'Hats', icon: '🎩', anchor: 'hat_anchor',
    items: [
      { id: 'crown',     label: 'Crown',    icon: '👑', price: 120, locked: true  },
      { id: 'chef_hat', label: 'Chef Hat', icon: '🍳', price: 8,   locked: false },
      { id: 'beanie_red',    label: 'Beanie',   icon: '🧢', price: 40,   locked: false },
      { id: 'beanie_blue',    label: 'Beanie',   icon: '🧢', price: 40,   locked: false },
    ],
  },
  neck: {
    label: 'Neck', icon: '🎀', anchor: 'neck_anchor',
    items: [
      { id: 'scarf', label: 'Scarf', icon: '🧣', price: 6, locked: false },
      { id: 'scarf_red', label: 'Scarf', icon: '🧣', price: 6, locked: false },
      { id: 'scarf_blue', label: 'Scarf', icon: '🧣', price: 6, locked: false },
      { id: 'scarf_yellow', label: 'Scarf', icon: '🧣', price: 6, locked: false },
      { id: 'scarf_orange', label: 'Scarf', icon: '🧣', price: 6, locked: false },
      { id: 'scarf_black', label: 'Scarf', icon: '🧣', price: 6, locked: false },
    ],
  },
};

export const MOVE_SPEED = 2.0;
export const BOUND      = 12;

// Shared mutable state — all modules hold the same object reference
export const gameState = {
  capy:         null,
  mixer:        null,
  groundY:      0,
  modalOpen:    false,
  closetOpen:   false,
  hubOpen:      false,
  activeTarget: null,
};
