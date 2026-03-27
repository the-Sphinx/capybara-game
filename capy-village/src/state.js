import accessoriesConfig from '../public/config/accessories.json';

function parseColorValue(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return Number.parseInt(value.replace('#', ''), 16);
}

function normalizeAccessoryConfig(config) {
  const normalized = { ...config };

  if (normalized.color !== undefined) {
    normalized.color = parseColorValue(normalized.color);
  }

  if (normalized.colors) {
    normalized.colors = Object.fromEntries(
      Object.entries(normalized.colors).map(([part, color]) => [part, parseColorValue(color)]),
    );
  }

  return normalized;
}

export const ACCESSORIES = Object.fromEntries(
  Object.entries(accessoriesConfig.registry).map(([id, config]) => [id, { id, ...normalizeAccessoryConfig(config) }]),
);


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

export const CLOSET_TABS = accessoriesConfig.closetTabs;

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
