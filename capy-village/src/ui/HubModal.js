import { gameState } from '../state.js';
import { saveManager } from '../SaveManager.js';
import { gameManager } from '../games/GameManager.js';
import { ARCADE_REWARD_HINT, formatBonusPreview, getBonusTiers, getUnlockRequirementText } from '../games/rewardUtils.js';

const BASE_URL = import.meta.env.BASE_URL;

// ── Module state ─────────────────────────────────────────────────────────────
let _overlay = null;
let _categories = null;          // cached after first fetch

let _screen = 'category';        // 'category' | 'mode' | 'levelmap' | 'arcade' | 'worldselect' | 'worldplaceholder' | 'numbergardenoverlay'
let _selectedCategory = null;
let _selectedMode = null;        // 'adventure' | 'arcade'
let _selectedLevel = null;
let _selectedWorld = null;
let _preferredLevelId = null;
let _lockedPopup = null;
let _lockedPopupTimer = null;
let _selectedOverlayLevel = null;

// ── Overlay singleton ────────────────────────────────────────────────────────
function getOverlay() {
  if (!_overlay) {
    _overlay = document.createElement('div');
    _overlay.id = 'hub-overlay';
    document.body.appendChild(_overlay);
  }
  return _overlay;
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function openHub() {
  gameState.modalOpen = true;
  gameState.hubOpen   = true;

  _screen           = 'category';
  _selectedCategory = null;
  _selectedMode     = null;
  _selectedLevel    = null;
  _selectedWorld    = null;
  _preferredLevelId = null;
  clearLockedPopup();
  _selectedOverlayLevel = null;

  const overlay = getOverlay();
  overlay.style.display = 'flex';

  if (!_categories) {
    renderLoading(overlay);
    try {
      const res = await fetch(BASE_URL + 'config/games/categories.json');
      if (!res.ok) throw new Error(res.status);
      _categories = await res.json();
    } catch (e) {
      renderError(overlay, 'Could not load categories. Try again later.');
      return;
    }
  }

  renderCategorySelect(overlay);
}

// Open the hub directly at a specific screen (used after a game ends)
export async function openHubAt(categoryId, mode, preferLevelId = null) {
  gameState.modalOpen = true;
  gameState.hubOpen   = true;

  const overlay = getOverlay();
  overlay.style.display = 'flex';

  if (!_categories) {
    renderLoading(overlay);
    try {
      const res = await fetch(BASE_URL + 'config/games/categories.json');
      if (!res.ok) throw new Error(res.status);
      _categories = await res.json();
    } catch (e) {
      renderError(overlay, 'Could not load categories. Try again later.');
      return;
    }
  }

  _selectedCategory = _categories.find(c => c.id === categoryId) ?? _categories[0];
  _selectedMode     = mode;
  _selectedLevel    = null;
  _selectedWorld    = null;
  _preferredLevelId = preferLevelId;
  clearLockedPopup();
  _selectedOverlayLevel = null;

  if (!(await ensureSelectedGameConfig(overlay))) {
    return;
  }

  if (mode === 'arcade') {
    _screen = 'arcade';
    renderArcadePanel(overlay);
  } else {
    await loadAndRenderAdventureScreen(overlay);
  }
}

export function closeHub() {
  clearLockedPopup();
  if (_overlay) _overlay.style.display = 'none';
  gameState.hubOpen   = false;
  gameState.modalOpen = false;
}

// ── Render helpers ────────────────────────────────────────────────────────────
function renderLoading(overlay) {
  overlay.innerHTML = `<div class="hub-loading">Loading…</div>`;
}

function renderError(overlay, msg) {
  overlay.innerHTML = `
    <div class="hub-panel">
      <button class="hub-close-btn" id="hub-close">✕</button>
      <p class="hub-error-msg">${msg}</p>
    </div>
  `;
  overlay.querySelector('#hub-close').addEventListener('click', closeHub);
}

async function ensureSelectedGameConfig(overlay) {
  const gameId = _selectedCategory?.gameId;
  if (!gameId) return false;

  try {
    await gameManager.ensureGameConfig(gameId);
    return true;
  } catch (error) {
    console.error(error);
    renderError(overlay, 'Could not load game config. Try again later.');
    return false;
  }
}

// ── Screen: Category Select ──────────────────────────────────────────────────
function renderCategorySelect(overlay) {
  overlay.innerHTML = `
    <div class="hub-panel">
      <button class="hub-close-btn" id="hub-close">✕</button>
      <h2 class="hub-title">🎮 Minigame Hub</h2>
      <div class="hub-categories">
        ${_categories.map(cat => `
          <div class="hub-category-card${cat.comingSoon ? ' hub-category-card--soon' : ''}"
               data-catid="${cat.id}">
            <span class="hub-cat-icon">${cat.icon}</span>
            <div class="hub-cat-info">
              <span class="hub-cat-label">${cat.label}</span>
              <span class="hub-cat-desc">${cat.description}</span>
            </div>
            ${cat.comingSoon ? '<span class="hub-coming-soon">Coming Soon</span>' : '<span class="hub-cat-arrow">›</span>'}
          </div>
        `).join('')}
      </div>
    </div>
  `;

  overlay.querySelector('#hub-close').addEventListener('click', closeHub);

  overlay.querySelectorAll('.hub-category-card:not(.hub-category-card--soon)').forEach(card => {
    card.addEventListener('click', () => {
      const catId = card.dataset.catid;
      _selectedCategory = _categories.find(c => c.id === catId);
      _screen = 'mode';
      renderModeSelect(overlay);
    });
  });
}

// ── Screen: Mode Select ──────────────────────────────────────────────────────
function renderModeSelect(overlay) {
  const cat = _selectedCategory;
  overlay.innerHTML = `
    <div class="hub-panel">
      <button class="hub-back-btn" id="hub-back">← Back</button>
      <button class="hub-close-btn" id="hub-close">✕</button>
      <h2 class="hub-title">${cat.icon} ${cat.label}</h2>
      <div class="hub-modes">
        <button class="hub-mode-btn" data-mode="adventure">
          <span class="hub-mode-icon">⚔️</span>
          <span class="hub-mode-label">Adventure</span>
          <span class="hub-mode-hint">Complete levels to unlock the next</span>
        </button>
        <button class="hub-mode-btn" data-mode="arcade">
          <span class="hub-mode-icon">🎮</span>
          <span class="hub-mode-label">Arcade</span>
          <span class="hub-mode-hint">Free play — no goals or limits</span>
        </button>
      </div>
    </div>
  `;

  overlay.querySelector('#hub-back').addEventListener('click', () => {
    _screen = 'category';
    renderCategorySelect(overlay);
  });
  overlay.querySelector('#hub-close').addEventListener('click', closeHub);

  overlay.querySelectorAll('.hub-mode-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      _selectedMode = btn.dataset.mode;
      _selectedLevel = null;
      _selectedWorld = null;
      _preferredLevelId = null;
      clearLockedPopup();
      _selectedOverlayLevel = null;
      renderLoading(overlay);
      if (!(await ensureSelectedGameConfig(overlay))) {
        return;
      }
      if (_selectedMode === 'adventure') {
        await loadAndRenderAdventureScreen(overlay);
      } else {
        _screen = 'arcade';
        renderArcadePanel(overlay);
      }
    });
  });
}

// ── Screen: Arcade Panel ─────────────────────────────────────────────────────
function renderArcadePanel(overlay) {
  const cat         = _selectedCategory;
  const bestScores  = saveManager.getArcadeBestScores(cat.id);
  const arcadeCfg   = gameManager.getArcadeConfig(cat.gameId) ?? {};
  const arcadeRecipes = arcadeCfg.recipes ?? [];

  // Build a title lookup from bundled arcade config
  const modeTitle = (id) => arcadeRecipes.find(m => m.id === id)?.title ?? id;
  const bestEntries = Object.entries(bestScores);

  const bestScoresHtml = bestEntries.length > 0 ? `
    <div class="hub-arcade-bests">
      <div class="hub-arcade-bests-title">Best Scores</div>
      ${bestEntries.map(([id, score]) =>
        `<div class="hub-arcade-best-row"><span>${modeTitle(id)}</span><strong>${score}</strong></div>`
      ).join('')}
    </div>
  ` : '';

  overlay.innerHTML = `
    <div class="hub-panel">
      <button class="hub-back-btn" id="hub-back">← Back</button>
      <button class="hub-close-btn" id="hub-close">✕</button>
      <h2 class="hub-title">${cat.icon} ${cat.label} — 🎮 Arcade</h2>
      <p class="hub-arcade-desc">${cat.description}</p>
      ${bestScoresHtml}
      <p class="hub-arcade-note">${ARCADE_REWARD_HINT}</p>
      <p class="hub-arcade-note">No goals, no fail state — just play and earn coins.</p>
      <button class="hub-play-btn hub-arcade-start" id="hub-arcade-start">▶ Start Arcade</button>
    </div>
  `;

  overlay.querySelector('#hub-back').addEventListener('click', () => {
    _screen = 'mode';
    renderModeSelect(overlay);
  });
  overlay.querySelector('#hub-close').addEventListener('click', closeHub);
  overlay.querySelector('#hub-arcade-start').addEventListener('click', () => {
    closeHub();
    gameManager.startGame(cat.gameId, { mode: 'arcade' });
  });
}

// ── Screen: Level Map ────────────────────────────────────────────────────────
function isWorldSelectCategory(cat) {
  const config = cat ? gameManager.getWorldSelectConfig(cat.gameId) : null;
  return !!config && config.enabled !== false;
}

async function loadAndRenderAdventureScreen(overlay) {
  const cat = _selectedCategory;
  if (!cat) {
    renderError(overlay, 'No category selected.');
    return;
  }

  if (!(await ensureSelectedGameConfig(overlay))) {
    return;
  }

  if (isWorldSelectCategory(cat)) {
    _screen = 'worldselect';
    renderWorldSelect(overlay);
    return;
  }

  _screen = 'levelmap';
  loadAndRenderLevelMap(overlay);
}

function loadAndRenderLevelMap(overlay) {
  const cat    = _selectedCategory;
  const levels = gameManager.getLevels(cat.gameId);
  if (!levels.length) {
    renderError(overlay, 'No levels found for this game.');
    return;
  }
  renderLevelMap(overlay, levels);
}

function buildMathWorldModels(cat, levels) {
  const worldSelectConfig = gameManager.getWorldSelectConfig(cat.gameId);
  const worlds = (worldSelectConfig?.worlds ?? []).map((world) => {
    const worldLevels = levels.filter(level => level.worldId === world.id);
    const levelsTotal = worldLevels.length;
    const levelsCompleted = worldLevels.filter(level => saveManager.isLevelCompleted(cat.id, level)).length;
    const levelsUnlocked = worldLevels.filter(level => saveManager.isLevelUnlocked(cat.id, level)).length;
    const isLocked = levelsTotal > 0 ? levelsUnlocked === 0 : true;
    const isCompleted = levelsTotal > 0 && levelsCompleted === levelsTotal;
    const starsMax = 3;
    const starsEarned = levelsTotal > 0
      ? Math.min(starsMax, Math.ceil((levelsCompleted / levelsTotal) * starsMax))
      : 0;

    return {
      ...world,
      levels: worldLevels,
      levelsTotal,
      levelsCompleted,
      starsMax,
      starsEarned,
      isLocked,
      isCompleted,
      isCurrent: false,
    };
  });

  const currentWorld = worlds.find(world => !world.isLocked && !world.isCompleted);
  if (currentWorld) {
    currentWorld.isCurrent = true;
  }

  return worlds;
}

function getSelectedMathWorld(worlds, levels) {
  if (_selectedWorld) {
    const persisted = worlds.find(world => world.id === _selectedWorld.id);
    if (persisted) return persisted;
  }

  if (_preferredLevelId !== null) {
    const preferredLevel = levels.find(level => level.levelId === _preferredLevelId);
    const preferredWorld = worlds.find(world => world.id === preferredLevel?.worldId);
    if (preferredWorld) return preferredWorld;
  }

  return worlds.find(world => world.isCurrent)
    ?? worlds.find(world => !world.isLocked)
    ?? worlds[0]
    ?? null;
}

function worldStatusLabel(world) {
  if (world.isCompleted) return 'Completed';
  if (world.isLocked) return 'Locked';
  if (world.isCurrent) return 'Current';
  return 'Unlocked';
}

function worldStarsText(world) {
  const filled = '★'.repeat(world.starsEarned);
  const empty = '☆'.repeat(Math.max(0, world.starsMax - world.starsEarned));
  return filled + empty;
}

function boxToStyle(box) {
  return [
    `left:${box.x * 100}%`,
    `top:${box.y * 100}%`,
    `width:${box.w * 100}%`,
    `height:${box.h * 100}%`,
  ].join(';');
}

function clearLockedPopup() {
  if (_lockedPopupTimer) {
    window.clearTimeout(_lockedPopupTimer);
    _lockedPopupTimer = null;
  }
  _lockedPopup = null;
}

function hideLockedPopup(overlay) {
  if (_lockedPopupTimer) {
    window.clearTimeout(_lockedPopupTimer);
    _lockedPopupTimer = null;
  }
  _lockedPopup = null;

  if (!overlay) return;

  const popupEl = overlay.querySelector('.hub-world-locked-popup');
  if (popupEl) {
    popupEl.classList.add('hub-world-locked-popup--closing');
    window.setTimeout(() => {
      popupEl.remove();
    }, 120);
  }

  overlay.querySelectorAll('.hub-world-hotspot--bump').forEach((node) => {
    node.classList.remove('hub-world-hotspot--bump');
  });
}

function lockedPopupPosition(box) {
  const desiredX = box.x + (box.w / 2);
  const desiredY = box.y - 0.05;
  const width = 0.2;
  const height = 0.08;
  const minX = width / 2 + 0.015;
  const maxX = 1 - width / 2 - 0.015;
  const minY = 0.09;
  const x = Math.min(maxX, Math.max(minX, desiredX));
  const y = desiredY < minY ? Math.min(0.14, box.y + box.h + 0.03) : desiredY;

  return { x, y, width, height };
}

function unlockRequirementShortText(world) {
  return world.unlockRequirementText || 'Complete the previous world first';
}

function expandedHitBox(signBox) {
  const growX = 0.038;
  const growY = 0.07;
  return {
    x: Math.max(0, signBox.x - growX),
    y: Math.max(0, signBox.y - growY),
    w: Math.min(1 - Math.max(0, signBox.x - growX), signBox.w + growX * 2),
    h: Math.min(1 - Math.max(0, signBox.y - growY), signBox.h + growY * 2),
  };
}

function flowerProgressIcons(world) {
  const totalIcons = 5;
  const fullIcons = Math.floor(world.levelsCompleted / 2);
  const hasHalf = world.levelsCompleted % 2 === 1;

  return Array.from({ length: totalIcons }, (_, index) => {
    let cls = 'hub-world-sign__flower';
    if (index < fullIcons) {
      cls += ' hub-world-sign__flower--full';
    } else if (index === fullIcons && hasHalf) {
      cls += ' hub-world-sign__flower--half';
    } else {
      cls += ' hub-world-sign__flower--empty';
    }
    return `<span class="${cls}" aria-hidden="true">✿</span>`;
  }).join('');
}

function worldOverlayHtml(world) {
  const stateClass = world.isLocked
    ? 'hub-world-hotspot--locked'
    : world.isCompleted
      ? 'hub-world-hotspot--completed'
      : world.isCurrent
        ? 'hub-world-hotspot--current'
        : 'hub-world-hotspot--unlocked';
  const hitBox = world.clickBox ?? expandedHitBox(world.signBox);
  const signOffsetX = ((world.signBox.x - hitBox.x) / hitBox.w) * 100;
  const signOffsetY = ((world.signBox.y - hitBox.y) / hitBox.h) * 100;
  const signWidth = (world.signBox.w / hitBox.w) * 100;
  const signHeight = (world.signBox.h / hitBox.h) * 100;

  return `
    <button
      class="hub-world-hotspot ${stateClass}${_selectedWorld?.id === world.id ? ' hub-world-hotspot--selected' : ''}${_lockedPopup?.worldId === world.id ? ' hub-world-hotspot--bump' : ''}"
      data-worldid="${world.id}"
      data-locked="${world.isLocked ? 'true' : 'false'}"
      style="${boxToStyle(hitBox)}"
      title="${world.title}"
      aria-label="${world.title}"
      type="button"
    >
      <span
        class="hub-world-sign"
        style="left:${signOffsetX}%;top:${signOffsetY}%;width:${signWidth}%;height:${signHeight}%"
      >
        <span class="hub-world-sign__content">
          <span class="hub-world-sign__title">${world.title}</span>
          ${world.isLocked
            ? '<span class="hub-world-sign__lock" aria-hidden="true">🔒</span>'
            : `<span class="hub-world-sign__flowers">${flowerProgressIcons(world)}</span>`}
        </span>
      </span>
    </button>
  `;
}

function lockedPopupHtml() {
  if (!_lockedPopup) return '';

  const { x, y } = _lockedPopup.position;
  return `
    <div
      class="hub-world-locked-popup"
      style="left:${x * 100}%;top:${y * 100}%"
      role="status"
      aria-live="polite"
    >
      <div class="hub-world-locked-popup__title"><span aria-hidden="true">🔒</span> Locked</div>
      <div class="hub-world-locked-popup__text">${_lockedPopup.message}</div>
    </div>
  `;
}

function findNumberGardenOverlayLevels(levels) {
  const levelSelectConfig = gameManager.getLevelSelectConfig(_selectedCategory?.gameId);
  const slots = [...(levelSelectConfig?.slots ?? [])].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  const slotMap = new Map(slots.map((slot) => [slot.slot, slot]));
  const worldLevels = levels
    .filter(level => level.worldId === _selectedWorld?.id)
    .sort((a, b) => a.levelNum - b.levelNum);

  return worldLevels
    .map((level) => ({
      ...level,
      node: slotMap.get(level.slot) ?? null,
    }))
    .filter((level) => !!level.node);
}

function hasSharedLevelSelectOverlay(cat, world) {
  if (!cat || !world) return false;

  const levelSelectConfig = gameManager.getLevelSelectConfig(cat.gameId);
  if (levelSelectConfig?.enabled === false) return false;

  const slots = levelSelectConfig?.slots ?? [];
  if (!slots.length) return false;

  const levels = gameManager.getLevels(cat.gameId);
  return levels.some((level) => level.worldId === world.id);
}

function getOverlayLevelStatus(cat, level, levelsInWorld) {
  const isCompleted = saveManager.isLevelCompleted(cat.id, level);
  const isUnlocked = saveManager.isLevelUnlocked(cat.id, level);
  const firstUnlockedIncomplete = levelsInWorld.find(item =>
    saveManager.isLevelUnlocked(cat.id, item) && !saveManager.isLevelCompleted(cat.id, item)
  );
  const isCurrent = firstUnlockedIncomplete?.levelId === level.levelId;
  const levelIndex = levelsInWorld.findIndex((item) => item.levelId === level.levelId);
  const previous = levelIndex > 0 ? levelsInWorld[levelIndex - 1] : null;

  return {
    isCompleted,
    isUnlocked,
    isCurrent,
    isLocked: !isUnlocked,
    unlockCondition: previous ? `Complete Level ${previous.levelNum}` : getUnlockRequirementText(level.levelNum).replace(' to unlock', ''),
  };
}

function getLevelNodeStyle(node) {
  return [
    `left:${node.x * 100}%`,
    `top:${node.y * 100}%`,
  ].join(';');
}

function getLevelBubblePosition(node) {
  const width = 0.24;
  const offsetX = node.bubbleOffsetX ?? 0;
  const offsetY = node.bubbleOffsetY ?? -0.08;
  const x = Math.min(1 - width / 2 - 0.02, Math.max(width / 2 + 0.02, node.x + offsetX));
  const y = Math.max(0.14, node.y + offsetY);
  return { x, y };
}

function levelNodeHtml(cat, level, levelsInWorld) {
  const status = getOverlayLevelStatus(cat, level, levelsInWorld);
  const classes = [
    'hub-overlay-node',
    status.isCompleted && 'hub-overlay-node--completed',
    status.isCurrent && 'hub-overlay-node--current',
    status.isLocked && 'hub-overlay-node--locked',
    _selectedOverlayLevel?.levelId === level.levelId && 'hub-overlay-node--selected',
  ].filter(Boolean).join(' ');

  return `
    <button
      class="${classes}"
      data-levelid="${level.levelId}"
      style="${getLevelNodeStyle(level.node)}"
      type="button"
      aria-label="Level ${level.levelNum}"
    >
      <span class="hub-overlay-node__stone"></span>
      <span class="hub-overlay-node__number">${level.levelNum}</span>
      ${status.isLocked ? '<span class="hub-overlay-node__lock" aria-hidden="true">🔒</span>' : ''}
      ${status.isCurrent ? '<span class="hub-overlay-node__glow" aria-hidden="true"></span>' : ''}
    </button>
  `;
}

function renderLevelInfoBubble(cat, level, levelsInWorld) {
  if (!_selectedOverlayLevel || _selectedOverlayLevel.levelId !== level.levelId) {
    return '';
  }

  const status = getOverlayLevelStatus(cat, level, levelsInWorld);
  const position = getLevelBubblePosition(level.node);
  const bonusTiers = getBonusTiers({ ...level, category: cat.id });
  const bonusText = bonusTiers.length
    ? bonusTiers.map((tier) => `+${tier.reward}`).join(' / ')
    : 'No bonus';

  return `
    <div class="hub-level-overlay-bubble" style="left:${position.x * 100}%;top:${position.y * 100}%">
      <div class="hub-level-overlay-bubble__headline">Level ${level.levelNum} — ${level.label}</div>
      <div class="hub-level-overlay-bubble__desc">${goalText(level)}</div>
      <div class="hub-level-overlay-bubble__meta">💰 ${level.clearReward ?? 0} coins</div>
      <div class="hub-level-overlay-bubble__meta">⭐ Bonus: ${bonusText}</div>
      ${status.isLocked
        ? '<button class="hub-play-btn hub-level-overlay-bubble__play" type="button" disabled>🔒 Locked</button>'
        : '<button class="hub-play-btn hub-level-overlay-bubble__play" id="hub-level-overlay-play" type="button">▶ Play</button>'}
    </div>
  `;
}

function renderWorldSelect(overlay) {
  const cat = _selectedCategory;
  const levels = gameManager.getLevels(cat.gameId);
  const worldSelectConfig = gameManager.getWorldSelectConfig(cat.gameId);
  if (!levels.length) {
    renderError(overlay, 'No levels found for this game.');
    return;
  }
  if (!worldSelectConfig?.worlds?.length) {
    renderError(overlay, 'No world map found for this game.');
    return;
  }

  const worlds = buildMathWorldModels(cat, levels);
  _selectedWorld = getSelectedMathWorld(worlds, levels);

  overlay.innerHTML = `
    <div class="hub-panel hub-panel--worldselect hub-panel--worldselect-fullscreen">
      <div class="hub-world-map-shell hub-world-map-shell--fullscreen">
        <div class="hub-world-map hub-world-map--fullscreen" style="background-image:url('${BASE_URL + worldSelectConfig.backgroundPath}')">
          ${worlds.map(worldOverlayHtml).join('')}
          ${lockedPopupHtml()}
          <button class="hub-world-back-btn" id="hub-back" type="button">← Back</button>
        </div>
      </div>
    </div>
  `;

  overlay.querySelector('#hub-back').addEventListener('click', () => {
    _screen = 'mode';
    _selectedWorld = null;
    hideLockedPopup(overlay);
    renderModeSelect(overlay);
  });

  overlay.querySelectorAll('.hub-world-hotspot').forEach((button) => {
    const applySelection = ({ clearPopup = false } = {}) => {
      _selectedWorld = worlds.find(world => world.id === button.dataset.worldid) ?? _selectedWorld;
      if (clearPopup) {
        hideLockedPopup(overlay);
      }
      overlay.querySelectorAll('.hub-world-hotspot').forEach(node => node.classList.remove('hub-world-hotspot--selected'));
      button.classList.add('hub-world-hotspot--selected');
    };

    button.addEventListener('mouseenter', applySelection);
    button.addEventListener('focus', applySelection);
    button.addEventListener('click', () => {
      applySelection({ clearPopup: true });
      if (_selectedWorld?.isLocked) {
        _lockedPopup = {
          worldId: _selectedWorld.id,
          message: `${unlockRequirementShortText(_selectedWorld)} first`,
          position: lockedPopupPosition(_selectedWorld.signBox),
        };
        if (_lockedPopupTimer) {
          window.clearTimeout(_lockedPopupTimer);
        }
        _lockedPopupTimer = window.setTimeout(() => {
          hideLockedPopup(overlay);
        }, 2000);
        renderWorldSelect(overlay);
        return;
      }

      if (hasSharedLevelSelectOverlay(cat, _selectedWorld)) {
        _selectedOverlayLevel = null;
        renderNumberGardenLevelOverlay(overlay, cat, levels);
        return;
      }

      _screen = 'worldplaceholder';
      renderWorldPlaceholder(overlay);
    });
  });
}

function renderWorldPlaceholder(overlay) {
  const cat = _selectedCategory;
  const world = _selectedWorld;
  const levels = gameManager.getLevels(cat.gameId);

  if (hasSharedLevelSelectOverlay(cat, world)) {
    renderNumberGardenLevelOverlay(overlay, cat, levels);
    return;
  }

  overlay.innerHTML = `
    <div class="hub-panel">
      <button class="hub-back-btn" id="hub-back">← Back</button>
      <button class="hub-close-btn" id="hub-close">✕</button>
      <h2 class="hub-title">${cat.icon} ${world?.title ?? 'World'} </h2>
      <div class="hub-world-placeholder">
        <div class="hub-world-placeholder__badge">Adventure World</div>
        <h3 class="hub-world-placeholder__title">${world?.title ?? 'World'} is ready for the next step</h3>
        <p class="hub-world-placeholder__text">The new world-select flow is now connected. The inside-of-world level map will plug into this screen next.</p>
        <button class="hub-play-btn" id="hub-world-placeholder-back">← Back to Worlds</button>
      </div>
    </div>
  `;

  overlay.querySelector('#hub-back').addEventListener('click', () => {
    _screen = 'worldselect';
    hideLockedPopup(overlay);
    renderWorldSelect(overlay);
  });
  overlay.querySelector('#hub-close').addEventListener('click', closeHub);
  overlay.querySelector('#hub-world-placeholder-back').addEventListener('click', () => {
    _screen = 'worldselect';
    hideLockedPopup(overlay);
    renderWorldSelect(overlay);
  });
}

function renderNumberGardenLevelOverlay(overlay, cat, levels) {
  const isFirstEntry = _screen !== 'numbergardenoverlay-initialized';
  _screen = 'numbergardenoverlay';
  const levelSelectConfig = gameManager.getLevelSelectConfig(cat.gameId);
  const levelEntries = findNumberGardenOverlayLevels(levels);
  if (!levelSelectConfig?.backgroundPath || !levelEntries.length) {
    renderError(overlay, 'No world level map found.');
    return;
  }

  if (_preferredLevelId !== null) {
    _selectedOverlayLevel = levelEntries.find(level => level.levelId === _preferredLevelId) ?? _selectedOverlayLevel;
  }

  if (!_selectedOverlayLevel && isFirstEntry) {
    _selectedOverlayLevel = levelEntries.find(level => getOverlayLevelStatus(cat, level, levelEntries).isCurrent)
      ?? levelEntries.find(level => getOverlayLevelStatus(cat, level, levelEntries).isUnlocked)
      ?? levelEntries[0];
  }

  const selectedLevel = levelEntries.find(level => level.levelId === _selectedOverlayLevel?.levelId) ?? null;
  _screen = 'numbergardenoverlay-initialized';

  overlay.innerHTML = `
    <div class="hub-panel hub-panel--worldselect hub-panel--worldselect-fullscreen">
      <div class="hub-world-map-shell hub-world-map-shell--fullscreen">
        <div class="hub-world-map hub-world-map--fullscreen" style="background-image:url('${BASE_URL + levelSelectConfig.backgroundPath}')">
          ${levelEntries.map(level => levelNodeHtml(cat, level, levelEntries)).join('')}
          ${selectedLevel ? renderLevelInfoBubble(cat, selectedLevel, levelEntries) : ''}
          <button class="hub-world-back-btn" id="hub-back" type="button">← Back</button>
        </div>
      </div>
    </div>
  `;

  overlay.querySelector('#hub-back').addEventListener('click', () => {
    _screen = 'worldselect';
    _selectedOverlayLevel = null;
    renderWorldSelect(overlay);
  });

  overlay.querySelectorAll('.hub-overlay-node').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const levelId = button.dataset.levelid;
      _selectedOverlayLevel = levelEntries.find(level => level.levelId === levelId) ?? _selectedOverlayLevel;
      renderNumberGardenLevelOverlay(overlay, cat, levels);
    });
  });

  overlay.querySelector('.hub-world-map').addEventListener('click', (event) => {
    if (
      event.target.closest('.hub-overlay-node') ||
      event.target.closest('.hub-level-overlay-bubble') ||
      event.target.closest('.hub-world-back-btn')
    ) {
      return;
    }
    _selectedOverlayLevel = null;
    _screen = 'numbergardenoverlay-initialized';
    renderNumberGardenLevelOverlay(overlay, cat, levels);
  });

  const playButton = overlay.querySelector('#hub-level-overlay-play');
  if (playButton && selectedLevel) {
    playButton.addEventListener('click', () => {
      const levelConfig = {
        ...selectedLevel,
        mode: 'adventure',
        category: cat.id,
        totalLevels: levels.length,
      };
      _preferredLevelId = selectedLevel.levelId;
      closeHub();
      gameManager.startGame(cat.gameId, levelConfig);
    });
  }
}

function renderLevelMap(overlay, levels) {
  const cat         = _selectedCategory;
  const isAdventure = _selectedMode === 'adventure';

  // Auto-select: first unlocked (adventure) or first level (arcade)
  if (!_selectedLevel) {
    _selectedLevel = isAdventure
      ? (levels.find(l => saveManager.isLevelUnlocked(cat.id, l)) ?? levels[0])
      : levels[0];
  }

  const nodesHtml = levels.map(lvl => {
    const completed = saveManager.isLevelCompleted(cat.id, lvl);
    const unlocked  = !isAdventure || saveManager.isLevelUnlocked(cat.id, lvl);
    const selected  = _selectedLevel?.levelId === lvl.levelId;

    let cls = 'hub-level-node';
    if (completed)      cls += ' hub-level-node--completed';
    else if (unlocked)  cls += ' hub-level-node--unlocked';
    else                cls += ' hub-level-node--locked';
    if (selected)       cls += ' hub-level-node--selected';

    const label = completed ? '✓' : !unlocked ? '🔒' : lvl.levelNum;
    return `<div class="${cls}" data-levelid="${lvl.levelId}" data-locked="${unlocked ? 'false' : 'true'}">${label}</div>`;
  }).join('');

  overlay.innerHTML = `
    <div class="hub-panel hub-panel--wide">
      <button class="hub-back-btn" id="hub-back">← Back</button>
      <button class="hub-close-btn" id="hub-close">✕</button>
      <h2 class="hub-title">${cat.icon} ${cat.label} — ${isAdventure ? '⚔️ Adventure' : '🎮 Arcade'}</h2>
      <div class="hub-level-track">${nodesHtml}</div>
      <div class="hub-level-info" id="hub-level-info">
        ${_selectedLevel ? levelInfoHtml(_selectedLevel, cat) : '<p style="color:#aaa">Select a level</p>'}
      </div>
    </div>
  `;

  overlay.querySelector('#hub-back').addEventListener('click', () => {
    _screen = 'mode';
    renderModeSelect(overlay);
  });
  overlay.querySelector('#hub-close').addEventListener('click', closeHub);

  overlay.querySelectorAll('.hub-level-node').forEach(node => {
    node.addEventListener('click', () => {
      const levelId = node.dataset.levelid;
      _selectedLevel = levels.find(l => l.levelId === levelId);

      // Update selection highlight
      overlay.querySelectorAll('.hub-level-node').forEach(n => n.classList.remove('hub-level-node--selected'));
      node.classList.add('hub-level-node--selected');

      // Re-render info panel
      const infoEl = overlay.querySelector('#hub-level-info');
      infoEl.innerHTML = levelInfoHtml(_selectedLevel, cat);
      attachPlayButton(overlay, cat, isAdventure, levels);
    });
  });

  attachPlayButton(overlay, cat, isAdventure, levels);
}

function goalText(lvl) {
  const g = lvl.goal;
  switch (g.type) {
    case 'score':          return `Score ${g.value}+ points`;
    case 'catchCount':     return `Catch ${g.value} items`;
    case 'combo':          return `Reach a ${g.value}× combo`;
    case 'correctAnswers': return `Answer ${g.value} correctly`;
    default:               return `Goal: ${g.value}`;
  }
}

function levelInfoHtml(lvl, cat) {
  const completed = saveManager.isLevelCompleted(cat.id, lvl);
  const unlocked = saveManager.isLevelUnlocked(cat.id, lvl);
  const levelWithCategory = { ...lvl, category: cat.id };
  const bonusText = formatBonusPreview(levelWithCategory);
  const hasBonuses = getBonusTiers(levelWithCategory).length > 0;
  return `
    <h3 class="hub-lvl-title">Level ${lvl.levelNum}: ${lvl.label}</h3>
    <div class="hub-lvl-details">
      <span>⏱ ${lvl.timeLimit}s</span>
      <span>🎯 ${goalText(lvl)}</span>
      <span>🏆 Clear Reward: ${lvl.clearReward ?? 0} coins</span>
      ${completed ? '<span class="hub-lvl-done">✓ Completed</span>' : ''}
    </div>
    <div class="hub-lvl-reward-block">
      <div><strong>Bonus:</strong> ${bonusText}</div>
      ${!unlocked ? `<div class="hub-lvl-unlock">Unlock: ${getUnlockRequirementText(lvl.levelNum)}</div>` : ''}
      ${unlocked ? `<div class="hub-lvl-unlock">Status: Ready to play</div>` : ''}
    </div>
    <button class="hub-play-btn" id="hub-play-btn" ${!unlocked ? 'disabled' : ''}>${unlocked ? `▶ Play Level ${lvl.levelNum}` : `🔒 Locked`}</button>
    ${!hasBonuses ? '<div class="hub-lvl-bonus-note">Bonus tiers are not configured for this level yet.</div>' : ''}
  `;
}

function attachPlayButton(overlay, cat, isAdventure, levels) {
  const btn = overlay.querySelector('#hub-play-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (!_selectedLevel) return;
    if (isAdventure && !saveManager.isLevelUnlocked(cat.id, _selectedLevel)) {
      return;
    }
    const levelConfig = {
      ..._selectedLevel,
      mode:     isAdventure ? 'adventure' : 'arcade',
      category: cat.id,
      totalLevels: levels.length,
    };
    closeHub();
    gameManager.startGame(cat.gameId, levelConfig);
  });
}
