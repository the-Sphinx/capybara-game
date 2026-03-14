import { gameState } from '../state.js';
import { saveManager } from '../SaveManager.js';
import { gameManager } from '../games/GameManager.js';

const BASE_URL = import.meta.env.BASE_URL;

// ── Module state ─────────────────────────────────────────────────────────────
let _overlay = null;
let _categories = null;          // cached after first fetch

let _screen = 'category';        // 'category' | 'mode' | 'levelmap' | 'arcade'
let _selectedCategory = null;
let _selectedMode = null;        // 'adventure' | 'arcade'
let _selectedLevel = null;
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

  if (mode === 'arcade') {
    _screen = 'arcade';
    renderArcadePanel(overlay);
  } else {
    _screen = 'levelmap';
    // preferLevelNum lets us pre-select a specific level (e.g. the next one)
    if (preferLevelNum !== null) {
      const levels = gameManager.getLevels(_selectedCategory.gameId);
      _selectedLevel = levels.find(l => l.levelNum === preferLevelNum) ?? null;
    }
    renderLevelMap(overlay, gameManager.getLevels(_selectedCategory.gameId));
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
      if (_selectedMode === 'adventure') {
        _screen = 'levelmap';
        loadAndRenderLevelMap(overlay);
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
function loadAndRenderLevelMap(overlay) {
  const cat    = _selectedCategory;
  const levels = gameManager.getLevels(cat.gameId);
  if (!levels.length) {
    renderError(overlay, 'No levels found for this game.');
    return;
  }
  renderLevelMap(overlay, levels);
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
    return `<div class="${cls}" data-levelnum="${lvl.levelNum}" ${!unlocked ? 'aria-disabled="true"' : ''}>${label}</div>`;
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

  overlay.querySelectorAll('.hub-level-node:not([aria-disabled])').forEach(node => {
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
  return `
    <h3 class="hub-lvl-title">Level ${lvl.levelNum}: ${lvl.label}</h3>
    <div class="hub-lvl-details">
      <span>⏱ ${lvl.timeLimit}s</span>
      <span>🎯 ${goalText(lvl)}</span>
      ${completed ? '<span class="hub-lvl-done">✓ Completed</span>' : ''}
    </div>
    <button class="hub-play-btn" id="hub-play-btn">▶ Play Level ${lvl.levelNum}</button>
  `;
}

function attachPlayButton(overlay, cat, isAdventure, levels) {
  const btn = overlay.querySelector('#hub-play-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (!_selectedLevel) return;
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
