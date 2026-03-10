// ─── Accessory registry ───────────────────────────────────────────────────────
export const ACCESSORIES = {
  crown:     { anchor: 'hat_anchor',  path: 'crown.glb',       scale: 1.0, tiltX: -7 },
  chefs_hat: { anchor: 'hat_anchor',  path: 'chef_hat.glb',    scale: 1.0, tiltX: -7,
               color: 0xFFFFFF, roughness: 0.7 },
  beanie:    { anchor: 'hat_anchor',  path: 'knit_beanie.glb', scale: 1.0, tiltX: -15,
               colors: { beanie_body: 0xE63946, beanie_pompom: 0xFFFFFF },
               doubleSided: true, polygonOffsetPart: 'beanie_body' },
  scarf:     { anchor: 'neck_anchor', path: 'scarf_v2.glb',    scale: 1.0, tiltX: 0,
               offset: { x: 0, y: -0.08, z: -0.3 } },
  // glasses: { anchor: 'face_anchor', path: 'glasses.glb', scale: 1.0, tiltX: 0 },
};

// Currently equipped — one accessory id per anchor slot, or null to unequip
export const EQUIPPED = {
  hat_anchor:  'beanie',
  neck_anchor: 'scarf',
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
      { id: 'crown',     label: 'Crown',    icon: '👑' },
      { id: 'beanie',    label: 'Beanie',   icon: '🧢' },
      { id: 'chefs_hat', label: 'Chef Hat', icon: '🍳' },
    ],
  },
  neck: {
    label: 'Neck', icon: '🎀', anchor: 'neck_anchor',
    items: [
      { id: 'scarf', label: 'Scarf', icon: '🧣' },
    ],
  },
};

export const MOVE_SPEED = 2.0;
export const BOUND      = 8;

// Shared mutable state — all modules hold the same object reference
export const gameState = {
  capy:         null,
  mixer:        null,
  groundY:      0,
  modalOpen:    false,
  closetOpen:   false,
  activeTarget: null,
};
