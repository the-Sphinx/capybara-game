import { gameState, EQUIPPED, SELECTED, CLOSET_TABS } from './state.js';
import { playerState } from './playerState.js';
import { equipAccessory, equipPreviewAccessory, renderAccessoryIcon, initPreviewScene } from './capy.js';

// ─── Prompt ───────────────────────────────────────────────────────────────────
export const promptEl = document.createElement('div');
promptEl.className = 'ui-prompt';
document.body.appendChild(promptEl);

// ─── Modal ────────────────────────────────────────────────────────────────────
const modalEl = document.createElement('div');
modalEl.className = 'ui-modal';
document.body.appendChild(modalEl);

export function openModal(building) {
  if (building.id === 'capy-store') { openCloset(); return; }
  gameState.modalOpen = true;
  promptEl.classList.remove('ui-prompt--visible');
  modalEl.innerHTML =
    `<h2 class="modal-title">${building.label}</h2>` +
    `<p class="modal-body">${building.message}</p>` +
    `<p class="modal-hint">Press [E] or [Esc] to close</p>`;
  modalEl.classList.add('ui-modal--visible');
}

export function closeModal() {
  gameState.modalOpen = false;
  modalEl.classList.remove('ui-modal--visible');
}

// ─── Closet panel (created once, never destroyed) ─────────────────────────────
const closetPanel = document.createElement('div');
closetPanel.className = 'closet-panel';
document.body.appendChild(closetPanel);

const closetColumns = document.createElement('div');
closetColumns.className = 'closet-columns';
closetPanel.appendChild(closetColumns);

export const closetPreviewCol = document.createElement('div');
closetPreviewCol.className = 'closet-preview-col';
closetColumns.appendChild(closetPreviewCol);

// Frame overlay — sits above the 3D canvas, transparent center lets capy show through
const closetFrame = document.createElement('img');
closetFrame.src = `${import.meta.env.BASE_URL}ui_frame.png`;
closetFrame.className = 'closet-preview-frame';
closetPreviewCol.appendChild(closetFrame);

const border1 = document.createElement('div');
border1.className = 'closet-items-border-out';

const border2 = document.createElement('div');
border2.className = 'closet-items-border-in';

const closetItemCol = document.createElement('div');
closetItemCol.className = 'closet-item-col';

closetColumns.appendChild(border1);
border1.appendChild(border2);
border2.appendChild(closetItemCol);

// ─── Closet tab state ─────────────────────────────────────────────────────────
let closetTab = 'hats';

// ─── Economy helpers ──────────────────────────────────────────────────────────

// Get item definition from current tab
function getTabItem(tabKey, itemId) {
  return CLOSET_TABS[tabKey].items.find(i => i.id === itemId);
}

// Get tab key from anchor name
function anchorToTabKey(anchor) {
  for (const [key, tab] of Object.entries(CLOSET_TABS)) {
    if (tab.anchor === anchor) return key;
  }
  return null;
}

// Status row text + CSS class for a card (always shown)
function getItemStatus(item, isOwned, isEqWorld) {
  if (isEqWorld)                        return { text: '✓ Equipped', cls: 'status--equipped' };
  if (isOwned)                          return { text: '✓ Owned',    cls: 'status--owned' };
  if (playerState.coins >= item.price)  return { text: `${item.price} 🍉`, cls: 'status--price' };
  return { text: '🔒 Locked', cls: 'status--locked' };
}

// Determine action button state based on selected item
function getActionState() {
  const tab        = CLOSET_TABS[closetTab];
  const anchor     = tab.anchor;
  const selectedId = SELECTED[anchor];

  if (!selectedId) {
    return { text: 'EQUIP', disabled: true, mode: 'none' };
  }

  const equippedInCategory = playerState.equipped[closetTab];

  if (selectedId === equippedInCategory) {
    return { text: 'UNEQUIP', disabled: false, mode: 'unequip' };
  }

  if (playerState.ownedItems.includes(selectedId)) {
    return { text: 'EQUIP', disabled: false, mode: 'equip' };
  }

  // Locked — check affordability
  const item = getTabItem(closetTab, selectedId);
  if (playerState.coins >= item.price) {
    return { text: `BUY ${item.price} 🍉`, disabled: false, mode: 'buy' };
  }

  return { text: 'NOT ENOUGH 🍉', disabled: true, mode: 'none' };
}

// ─── buildClosetPanel — only rebuilds closetItemCol ───────────────────────────
export function buildClosetPanel() {
  const tab         = CLOSET_TABS[closetTab];
  const anchor      = tab.anchor;
  const actionState = getActionState();

  closetItemCol.innerHTML = `
    <div class="closet-title">
      <span class="closet-title__text">Capy Closet 🐾</span>
      <span class="closet-coin-display">${playerState.coins} 🍉</span>
    </div>

    <div class="closet-tabs">
      ${Object.entries(CLOSET_TABS).map(([key, t]) =>
        `<button data-tab="${key}" class="closet-tab-btn ${key === closetTab ? 'closet-tab-btn--active' : ''}">
          ${t.icon} ${t.label}
        </button>`
      ).join('')}
    </div>

    <div class="closet-items-scroll">
      <div class="closet-items-grid">
        ${tab.items.map(item => {
          const isSel     = item.id === SELECTED[anchor];
          const isEqWorld = item.id === playerState.equipped[closetTab];
          const isOwned   = playerState.ownedItems.includes(item.id);
          const isLocked  = !isOwned;
          const status    = getItemStatus(item, isOwned, isEqWorld);

          let cardClass = 'closet-item-card';
          if (isLocked)        cardClass += ' closet-item-card--locked';
          else if (isEqWorld)  cardClass += ' closet-item-card--world-equipped';
          else                 cardClass += ' closet-item-card--owned';
          if (isSel)           cardClass += ' closet-item-card--selected';

          return `
            <div data-item="${item.id}" class="${cardClass}">
              <div class="closet-icon-wrap">
                <img data-icon-target="${item.id}" src="" alt="${item.icon}" class="closet-icon-img">
                <span data-icon-fallback="${item.id}" class="closet-icon-fallback">${item.icon}</span>
              </div>
              <div class="closet-item-label">${item.label}</div>
              <div class="closet-item-status ${status.cls}">${status.text}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <button class="closet-equip-btn${actionState.mode === 'buy' ? ' closet-equip-btn--buy' : ''}"
            id="closet-action-btn"
            ${actionState.disabled ? 'disabled' : ''}
            data-mode="${actionState.mode}">
      ${actionState.text}
    </button>
  `;

  // Tab clicks
  closetItemCol.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => { closetTab = btn.dataset.tab; buildClosetPanel(); });
  });

  // Item card clicks — select item + update preview (does NOT equip real capy)
  // Clicking an already-selected item does nothing (only the button triggers actions)
  closetItemCol.querySelectorAll('[data-item]').forEach(card => {
    card.addEventListener('click', () => {
      const accId = card.dataset.item;
      const anch  = CLOSET_TABS[closetTab].anchor;
      if (accId === SELECTED[anch]) return;
      equipPreviewAccessory(anch, accId); // also sets SELECTED[anch]
      buildClosetPanel();
    });
  });

  // Action button
  const actionBtn = document.getElementById('closet-action-btn');
  if (actionBtn && !actionBtn.disabled) {
    actionBtn.addEventListener('click', () => {
      const mode       = actionBtn.dataset.mode;
      const anch       = CLOSET_TABS[closetTab].anchor;
      const selectedId = SELECTED[anch];
      if (mode === 'buy')     handleBuy(closetTab, anch, selectedId);
      if (mode === 'equip')   handleEquip(anch, selectedId);
      if (mode === 'unequip') handleUnequip(anch, closetTab);
    });
  }

  // Render async icons for current tab
  tab.items.forEach(item => {
    renderAccessoryIcon(item.id, (dataURL) => {
      const img      = closetItemCol.querySelector(`[data-icon-target="${item.id}"]`);
      const fallback = closetItemCol.querySelector(`[data-icon-fallback="${item.id}"]`);
      if (img && fallback) {
        img.src = dataURL;
        img.style.display = 'block';
        fallback.style.display = 'none';
      }
    });
  });
}

// ─── Purchase feedback — floating "-price 🍉" near coin counter ───────────────
function showCoinAnimation(price) {
  const titleEl = closetItemCol.querySelector('.closet-title');
  if (!titleEl) return;
  const rect = titleEl.getBoundingClientRect();
  const floater = document.createElement('div');
  floater.className = 'coin-floater';
  floater.textContent = `-${price} 🍉`;
  floater.style.left = `${rect.right - 90}px`;
  floater.style.top  = `${rect.top - 4}px`;
  document.body.appendChild(floater);
  floater.addEventListener('animationend', () => floater.remove());
}

// ─── Buy handler ──────────────────────────────────────────────────────────────
function handleBuy(tabKey, anchor, accId) {
  const item = getTabItem(tabKey, accId);
  showCoinAnimation(item.price);
  playerState.coins -= item.price;
  playerState.ownedItems.push(accId);

  // Auto-equip after purchase
  playerState.equipped[tabKey] = accId;
  EQUIPPED[anchor] = accId;
  equipAccessory(anchor, accId);
  equipPreviewAccessory(anchor, accId); // also sets SELECTED[anchor] = accId

  buildClosetPanel();
}

// ─── Unequip handler ──────────────────────────────────────────────────────────
function handleUnequip(anchor, tabKey) {
  equipAccessory(anchor, null);
  EQUIPPED[anchor] = null;
  playerState.equipped[tabKey] = null;
  buildClosetPanel(); // stay open so player sees the change
}

// ─── Equip handler ────────────────────────────────────────────────────────────
function handleEquip(anchor, accId) {
  const tabKey = anchorToTabKey(anchor);
  equipAccessory(anchor, accId);
  EQUIPPED[anchor] = accId;
  playerState.equipped[tabKey] = accId;
  closeCloset();
}

// ─── Open / close ─────────────────────────────────────────────────────────────
export function openCloset() {
  gameState.closetOpen = true;
  gameState.modalOpen  = true;
  promptEl.classList.remove('ui-prompt--visible');

  // Sync SELECTED to current real equipment so preview starts from real state
  for (const anch of Object.keys(EQUIPPED)) {
    SELECTED[anch] = EQUIPPED[anch];
  }

  closetPanel.classList.add('closet-panel--visible');

  if (gameState.capy) {
    initPreviewScene(closetPreviewCol);
    for (const [anch, accId] of Object.entries(SELECTED)) {
      equipPreviewAccessory(anch, accId);
    }
  }

  buildClosetPanel();
}

export function closeCloset() {
  gameState.closetOpen = false;
  gameState.modalOpen  = false;
  closetPanel.classList.remove('closet-panel--visible');
}
