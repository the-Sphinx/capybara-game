import { gameState } from '../state.js';
import { saveManager } from '../SaveManager.js';
import { gameManager } from '../games/GameManager.js';
import { ARCADE_REWARD_HINT, formatBonusPreview, getBonusTiers, getUnlockRequirementText } from '../games/rewardUtils.js';
import { MATH_WORLD_SELECT_CONFIG } from '../games/mathGarden/worlds.js';

const BASE_URL = import.meta.env.BASE_URL;

// ── Module state ─────────────────────────────────────────────────────────────
let _overlay = null;
let _categories = null;          // cached after first fetch

let _screen = 'category';        // 'category' | 'mode' | 'levelmap' | 'arcade' | 'worldselect' | 'worldplaceholder'
let _selectedCategory = null;
let _selectedMode = null;        // 'adventure' | 'arcade'
let _selectedLevel = null;
let _selectedWorld = null;
let _preferredLevelNum = null;
let _worldMessage = '';
// _levelCache removed — levels are now bundled via gameManager.getLevels()

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
  _preferredLevelNum = null;
  _worldMessage = '';

  const overlay = getOverlay();
  overlay.style.display = 'flex';

  if (!_categories) {
    renderLoading(overlay);
    try {
      const res = await fetch(BASE_URL + 'data/categories.json');
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
export async function openHubAt(categoryId, mode, preferLevelNum = null) {
  gameState.modalOpen = true;
  gameState.hubOpen   = true;

  const overlay = getOverlay();
  overlay.style.display = 'flex';

  if (!_categories) {
    renderLoading(overlay);
    try {
      const res = await fetch(BASE_URL + 'data/categories.json');
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
  _preferredLevelNum = preferLevelNum;
  _worldMessage = '';

  if (mode === 'arcade') {
    _screen = 'arcade';
    renderArcadePanel(overlay);
  } else {
    loadAndRenderAdventureScreen(overlay);
  }
}

export function closeHub() {
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
    btn.addEventListener('click', () => {
      _selectedMode = btn.dataset.mode;
      _selectedLevel = null;
      _selectedWorld = null;
      _preferredLevelNum = null;
      _worldMessage = '';
      if (_selectedMode === 'adventure') {
        loadAndRenderAdventureScreen(overlay);
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
  const arcadeModes = arcadeCfg.modes ?? [];

  // Build a title lookup from bundled arcade config
  const modeTitle = (id) => arcadeModes.find(m => m.id === id)?.title ?? id;
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
    const arcadeWeights = arcadeCfg.arcadeWeights ?? {};
    closeHub();
    gameManager.startGame(cat.gameId, { mode: 'arcade', arcadeWeights });
  });
}

// ── Screen: Level Map ────────────────────────────────────────────────────────
function isWorldSelectCategory(cat) {
  return cat?.gameId === 'math_garden';
}

function loadAndRenderAdventureScreen(overlay) {
  const cat = _selectedCategory;
  if (!cat) {
    renderError(overlay, 'No category selected.');
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
  const worlds = MATH_WORLD_SELECT_CONFIG.worlds.map((world) => {
    const worldLevels = levels.filter(level => level.worldId === world.id);
    const levelsTotal = worldLevels.length;
    const levelsCompleted = worldLevels.filter(level => saveManager.isLevelCompleted(cat.id, level.levelNum)).length;
    const levelsUnlocked = worldLevels.filter(level => saveManager.isLevelUnlocked(cat.id, level.levelNum)).length;
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

  if (_preferredLevelNum !== null) {
    const preferredLevel = levels.find(level => level.levelNum === _preferredLevelNum);
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
  const hitBox = expandedHitBox(world.signBox);
  const signOffsetX = ((world.signBox.x - hitBox.x) / hitBox.w) * 100;
  const signOffsetY = ((world.signBox.y - hitBox.y) / hitBox.h) * 100;
  const signWidth = (world.signBox.w / hitBox.w) * 100;
  const signHeight = (world.signBox.h / hitBox.h) * 100;

  return `
    <button
      class="hub-world-hotspot ${stateClass}${_selectedWorld?.id === world.id ? ' hub-world-hotspot--selected' : ''}"
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
        <span class="hub-world-sign__title">${world.title}</span>
        ${world.isLocked
          ? '<span class="hub-world-sign__lock" aria-hidden="true">🔒</span>'
          : `<span class="hub-world-sign__flowers">${flowerProgressIcons(world)}</span>`}
      </span>
    </button>
  `;
}

function renderWorldSelect(overlay) {
  const cat = _selectedCategory;
  const levels = gameManager.getLevels(cat.gameId);
  if (!levels.length) {
    renderError(overlay, 'No levels found for this game.');
    return;
  }

  const worlds = buildMathWorldModels(cat, levels);
  _selectedWorld = getSelectedMathWorld(worlds, levels);

  overlay.innerHTML = `
    <div class="hub-panel hub-panel--worldselect hub-panel--worldselect-fullscreen">
      <button class="hub-back-btn" id="hub-back">← Back</button>
      <button class="hub-close-btn" id="hub-close">✕</button>
      <div class="hub-worldscreen-head">
        <h2 class="hub-title">${cat.icon} ${cat.label}</h2>
        <p class="hub-worldscreen-subtitle">Choose a patch to explore.</p>
      </div>
      ${_worldMessage ? `<div class="hub-world-message" id="hub-world-message">${_worldMessage}</div>` : ''}
      <div class="hub-world-map-shell hub-world-map-shell--fullscreen">
        <div class="hub-world-map hub-world-map--fullscreen" style="background-image:url('${BASE_URL + MATH_WORLD_SELECT_CONFIG.backgroundPath}')">
          ${worlds.map(worldOverlayHtml).join('')}
        </div>
      </div>
    </div>
  `;

  overlay.querySelector('#hub-back').addEventListener('click', () => {
    _screen = 'mode';
    _selectedWorld = null;
    _worldMessage = '';
    renderModeSelect(overlay);
  });
  overlay.querySelector('#hub-close').addEventListener('click', closeHub);

  overlay.querySelectorAll('.hub-world-hotspot').forEach((button) => {
    const applySelection = () => {
      _selectedWorld = worlds.find(world => world.id === button.dataset.worldid) ?? _selectedWorld;
      _worldMessage = '';
      overlay.querySelectorAll('.hub-world-hotspot').forEach(node => node.classList.remove('hub-world-hotspot--selected'));
      button.classList.add('hub-world-hotspot--selected');
    };

    button.addEventListener('mouseenter', applySelection);
    button.addEventListener('focus', applySelection);
    button.addEventListener('click', () => {
      applySelection();
      if (_selectedWorld?.isLocked) {
        _worldMessage = `${_selectedWorld.title} is locked. ${_selectedWorld.unlockRequirementText}`;
        renderWorldSelect(overlay);
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
    _worldMessage = '';
    renderWorldSelect(overlay);
  });
  overlay.querySelector('#hub-close').addEventListener('click', closeHub);
  overlay.querySelector('#hub-world-placeholder-back').addEventListener('click', () => {
    _screen = 'worldselect';
    _worldMessage = '';
    renderWorldSelect(overlay);
  });
}

function renderLevelMap(overlay, levels) {
  const cat         = _selectedCategory;
  const isAdventure = _selectedMode === 'adventure';

  // Auto-select: first unlocked (adventure) or first level (arcade)
  if (!_selectedLevel) {
    _selectedLevel = isAdventure
      ? (levels.find(l => saveManager.isLevelUnlocked(cat.id, l.levelNum)) ?? levels[0])
      : levels[0];
  }

  const nodesHtml = levels.map(lvl => {
    const completed = saveManager.isLevelCompleted(cat.id, lvl.levelNum);
    const unlocked  = !isAdventure || saveManager.isLevelUnlocked(cat.id, lvl.levelNum);
    const selected  = _selectedLevel?.levelNum === lvl.levelNum;

    let cls = 'hub-level-node';
    if (completed)      cls += ' hub-level-node--completed';
    else if (unlocked)  cls += ' hub-level-node--unlocked';
    else                cls += ' hub-level-node--locked';
    if (selected)       cls += ' hub-level-node--selected';

    const label = completed ? '✓' : !unlocked ? '🔒' : lvl.levelNum;
    return `<div class="${cls}" data-levelnum="${lvl.levelNum}" data-locked="${unlocked ? 'false' : 'true'}">${label}</div>`;
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
      const levelNum = parseInt(node.dataset.levelnum);
      _selectedLevel = levels.find(l => l.levelNum === levelNum);

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
  const completed = saveManager.isLevelCompleted(cat.id, lvl.levelNum);
  const unlocked = saveManager.isLevelUnlocked(cat.id, lvl.levelNum);
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
    if (isAdventure && !saveManager.isLevelUnlocked(cat.id, _selectedLevel.levelNum)) {
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
