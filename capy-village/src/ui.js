import { gameState, EQUIPPED, SELECTED, CLOSET_TABS } from './state.js';
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

// Decorative stars (sit above canvas via z-index)
const closetStars = document.createElement('div');
closetStars.className = 'closet-stars';
closetStars.innerHTML = `
  <span style="position:absolute;top:10px;left:12px;font-size:18px;opacity:0.7;">⭐</span>
  <span style="position:absolute;top:10px;right:12px;font-size:14px;opacity:0.6;">✨</span>
  <span style="position:absolute;bottom:10px;left:10px;font-size:12px;opacity:0.5;">⭐</span>
  <span style="position:absolute;bottom:8px;right:14px;font-size:16px;opacity:0.6;">✨</span>
`;
closetPreviewCol.appendChild(closetStars);

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

// ─── buildClosetPanel — only rebuilds closetItemCol ───────────────────────────
export function buildClosetPanel() {
  const tab      = CLOSET_TABS[closetTab];
  const anchor   = tab.anchor;
  const equipped = EQUIPPED[anchor];
  const selected = SELECTED[anchor];

  closetItemCol.innerHTML = `
    <div class="closet-title">
      <span class="closet-title__text">Capy Closet 🐾</span>
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
          const isSel = item.id === selected;
          const isEq  = item.id === equipped;
          return `
            <div data-item="${item.id}" class="closet-item-card ${isSel ? 'closet-item-card--selected' : ''}">
              ${isEq ? `<div class="closet-equipped-badge">✓</div>` : ''}
              <div class="closet-icon-wrap">
                <img data-icon-target="${item.id}" src="" alt="${item.icon}" class="closet-icon-img">
                <span data-icon-fallback="${item.id}" class="closet-icon-fallback">${item.icon}</span>
              </div>
              <div class="closet-item-label">${item.label}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <button class="closet-equip-btn" id="closet-equip-btn">EQUIP 🐾</button>
  `;

  // Tab clicks
  closetItemCol.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => { closetTab = btn.dataset.tab; buildClosetPanel(); });
  });

  // Item card clicks — update SELECTED + preview (does NOT equip real capy)
  closetItemCol.querySelectorAll('[data-item]').forEach(card => {
    card.addEventListener('click', () => {
      const accId = card.dataset.item;
      const anch  = CLOSET_TABS[closetTab].anchor;
      const newId = accId === SELECTED[anch] ? null : accId;
      equipPreviewAccessory(anch, newId);
      buildClosetPanel();
    });
  });

  // EQUIP button — apply SELECTED → real capy
  document.getElementById('closet-equip-btn').addEventListener('click', () => {
    for (const [anch, accId] of Object.entries(SELECTED)) {
      if (accId !== EQUIPPED[anch]) equipAccessory(anch, accId);
    }
    closeCloset();
  });

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
