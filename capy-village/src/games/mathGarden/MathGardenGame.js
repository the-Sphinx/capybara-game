import { BaseGame } from '../BaseGame.js';
import { soundManager } from '../../audio/SoundManager.js';
import { saveManager } from '../../SaveManager.js';
import arcadeConfig from './arcade.json';

function resolveIsCorrect(spec) {
  if (!spec) return () => true;
  if (spec.type === 'mod_equals') return (v) => v % spec.mod === spec.result;
  return () => false;
}

const MATH_MODES = arcadeConfig.modes.map(m => ({ ...m, isCorrect: resolveIsCorrect(m.isCorrect) }));

const WMC_BASE = import.meta.env.BASE_URL + 'games/watermelon/';

const TILE_SIZE   = 72;   // px — answer tiles
const ITEM_SIZE   = 120;  // px — number sprites (collection mode)
const SPEED_MIN   = 60;   // px/s — answer tiles
const SPEED_MAX   = 110;  // px/s — answer tiles
const COL_SPD_MIN = 80;   // px/s — number sprites
const COL_SPD_MAX = 180;

const TILE_COLORS = ['#e74c3c', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#16a085'];

const NUMBER_SPRITES = {
   0: ['num_0_a.png', 'num_0_b.png'],
   1: ['num_1_a.png', 'num_1_b.png'],
   2: ['num_2_a.png', 'num_2_b.png'],
   3: ['num_3_a.png', 'num_3_b.png'],
   4: ['num_4_a.png', 'num_4_b.png'],
   5: ['num_5_a.png', 'num_5_b.png', 'num_5_b2.png'],
   6: ['num_6_b.png', 'num_6_b2.png'],
   7: ['num_7_a.png', 'num_7_b.png'],
   8: ['num_8_a.png', 'num_8_b.png'],
   9: ['num_9_a.png'],
  10: ['num_10_a.png', 'num_10_b.png'],
  11: ['num_11_b.png'],
  12: ['num_12_b.png'],
  13: ['num_13_a.png', 'num_13_b.png', 'num_13_b2.png'],
  14: ['num_14_a.png', 'num_14_b.png'],
  15: ['num_15_a.png'],
  16: ['num_16_a.png', 'num_16_b.png'],
  17: ['num_17_b.png'],
  18: ['num_18_a.png', 'num_18_b.png'],
  19: ['num_19_a.png', 'num_19_b.png'],
  20: ['num_20_a.png', 'num_20_b.png'],
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatTime(secs) {
  const s = Math.ceil(Math.max(0, secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function weightedPick(modes, weights) {
  const entries = modes.map(m => ({ m, w: weights[m.id] ?? 1 }));
  const total   = entries.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total;
  for (const { m, w } of entries) {
    r -= w;
    if (r <= 0) return m;
  }
  return modes[modes.length - 1];
}

export class MathGardenGame extends BaseGame {
  constructor(levelConfig = null) {
    super({ gameId: 'math_garden', label: 'Math Garden' });
    this._levelConfig = levelConfig;
    this._isArcade    = !levelConfig || levelConfig.mode === 'arcade';

    // Determine active mode
    if (levelConfig?.subType && levelConfig?.modeId) {
      this._activeMode = MATH_MODES.find(m => m.id === levelConfig.modeId) ?? MATH_MODES[0];
    } else {
      const weights    = levelConfig?.arcadeWeights ?? arcadeConfig.arcadeWeights ?? {};
      this._activeMode = weightedPick(MATH_MODES, weights);
    }
    this._subType = this._activeMode.subType;

    this._timeLeft    = levelConfig?.timeLimit ?? 60;
    this._score       = 0;
    this._correct     = 0;   // answer mode: equations answered
    this._catchCount  = 0;   // collection mode: items caught
    this._missed      = 0;
    this._wrongClicks = 0;
    this._combo       = 0;
    this._maxCombo    = 0;

    // Answer mode state
    this._equation  = null;
    this._tiles     = [];
    this._spawning  = false;

    // Collection mode state
    this._items      = [];
    this._spawnTimer = 0;
    this._spawnDelay = 0.8;

    this._finished    = false;
    this._bannerActive = false;
    this._raf         = null;
    this._lastTs      = null;
    this._container   = null;
    this._playArea    = null;
    this._scoreEl     = null;
    this._goalEl      = null;
    this._timerEl     = null;
    this._equationEl  = null;
  }

  // ── Goal helpers ─────────────────────────────────────────────────────────────

  _goalLabel(type) {
    switch (type) {
      case 'correctAnswers': return 'Correct';
      case 'catchCount':     return 'Caught';
      default:               return 'Score';
    }
  }

  _goalDesc(goal) {
    switch (goal.type) {
      case 'correctAnswers': return `Answer ${goal.value} correctly`;
      case 'catchCount':     return `Catch ${goal.value} items`;
      default:               return `Goal: ${goal.value}`;
    }
  }

  _refreshGoalDisplay() {
    if (this._scoreEl) {
      this._scoreEl.textContent = this._score;
    }
    if (this._goalEl) {
      const goalType = this._levelConfig?.goal?.type ?? 'score';
      let val;
      switch (goalType) {
        case 'correctAnswers': val = this._correct; break;
        case 'catchCount':     val = this._catchCount; break;
        default:               val = this._score; break;
      }
      this._goalEl.textContent = val;
    }
  }

  // ── Level start banner ───────────────────────────────────────────────────────

  _showLevelBanner(container, cfg) {
    this._bannerActive = true;
    const banner = document.createElement('div');
    banner.className = 'wmc-level-banner';
    banner.innerHTML = `
      <div class="wmc-level-banner-inner">
        <div class="wmc-level-banner-num">Level ${cfg.levelNum}</div>
        <div class="wmc-level-banner-goal-label">Goal:</div>
        <div class="wmc-level-banner-goal">${this._goalDesc(cfg.goal)}</div>
      </div>
    `;
    container.querySelector('.wmc-root').appendChild(banner);
    setTimeout(() => {
      banner.classList.add('wmc-level-banner--fade');
      banner.addEventListener('animationend', () => {
        banner.remove();
        this._bannerActive = false;
      }, { once: true });
    }, 1500);
  }

  // ── start ────────────────────────────────────────────────────────────────────

  start(container) {
    this._container = container;
    this._finished  = false;
    const m         = this._activeMode;
    const cfg       = this._levelConfig;
    const isAdventure = !this._isArcade;

    const goalType  = cfg?.goal?.type ?? 'score';
    const goalValue = cfg?.goal?.value ?? 0;
    const goalLabel = this._goalLabel(goalType);

    // Left panel
    const leftContent = isAdventure
      ? `<div class="wmc-hud-score">${goalLabel}: <span id="wmc-goal-val">0</span> / ${goalValue}</div>`
      : `<div class="wmc-hud-score">SCORE: <span id="wmc-score-val">0</span></div>`;

    // Center panel (adventure only)
    let centerContent = '';
    if (isAdventure && cfg) {
      const opLabel = cfg.operation === 'addition'    ? 'Addition'
                    : cfg.operation === 'subtraction' ? 'Subtraction'
                    : cfg.operation === 'mixed'       ? 'Mixed Math'
                    : '';
      const levelLine = opLabel
        ? `Level ${cfg.levelNum} · ${cfg.label} · ${opLabel}`
        : `Level ${cfg.levelNum} · ${cfg.label}`;
      const innerContent = this._subType === 'answer'
        ? `<div class="wmc-hud-equation" id="mg-equation-banner">…</div>`
        : `<div class="wmc-hud-instruction">${m.prompt}</div>`;
      centerContent = `
        <div class="wmc-hud-center-content">
          <div class="wmc-hud-level-line">${levelLine}</div>
          ${innerContent}
        </div>
      `;
    }

    // Arcade answer mode still needs floating equation banner
    const arcadeEquationHtml = (this._isArcade && this._subType === 'answer')
      ? `<div class="mg-equation-banner" id="mg-equation-banner">…</div>`
      : '';

    container.innerHTML = `
      <div class="wmc-root">
        ${arcadeEquationHtml}
        <div class="wmc-play-area" id="wmc-play-area"></div>
        <div class="wmc-hud" id="wmc-hud">
          <div class="wmc-hud-cap-left" id="wmc-hud-left">
            ${leftContent}
          </div>
          <div class="wmc-hud-cap-center" id="wmc-hud-center">${centerContent}</div>
          <div class="wmc-hud-cap-right" id="wmc-hud-right">
            <div class="wmc-hud-time">TIME: <span id="wmc-time-val">${formatTime(this._timeLeft)}</span></div>
          </div>
        </div>
        <button class="wmc-exit-btn" id="wmc-finish-btn">✕</button>
      </div>
    `;

    // Apply background images via JS (BASE_URL safe)
    container.querySelector('#wmc-play-area').style.backgroundImage =
      `url(${WMC_BASE}background.png)`;
    container.querySelector('#wmc-hud-left').style.backgroundImage =
      `url(${WMC_BASE}hud_cap_left.png)`;
    container.querySelector('#wmc-hud-center').style.backgroundImage =
      `url(${WMC_BASE}hud_center.png)`;
    container.querySelector('#wmc-hud-right').style.backgroundImage =
      `url(${WMC_BASE}hud_cap_right.png)`;

    this._playArea   = container.querySelector('#wmc-play-area');
    this._scoreEl    = container.querySelector('#wmc-score-val');
    this._goalEl     = container.querySelector('#wmc-goal-val');
    this._timerEl    = container.querySelector('#wmc-time-val');
    this._equationEl = container.querySelector('#mg-equation-banner');

    container.querySelector('#wmc-finish-btn').addEventListener('click', () => this._quitGame());

    if (this._subType === 'answer') {
      const onTileClick = (e) => {
        const el = e.target.closest('.mg-tile');
        if (!el) return;
        const tile = this._tiles.find(t => t.el === el);
        if (tile) this._clickTile(tile, e);
      };
      this._playArea.addEventListener('mousedown', onTileClick);
      this._onTileClick = onTileClick;
    } else {
      const onItemClick = (e) => {
        const el = e.target.closest('.wmc-item');
        if (!el) return;
        const idx = this._items.findIndex(it => it.el === el);
        if (idx !== -1) this._clickItem(idx, e);
      };
      this._playArea.addEventListener('mousedown', onItemClick);
      this._onItemClick = onItemClick;
      this._spawnTimer = 0;
      this._spawnDelay = this._randBetween(0.8, 1.4);
    }

    // Show level start banner for adventure
    if (isAdventure) {
      this._showLevelBanner(container, cfg);
    }

    this._lastTs = performance.now();
    const loop = (ts) => {
      if (this._finished) return;
      // Pause ticking while banner is showing
      if (this._bannerActive) {
        this._lastTs = ts;
        this._raf = requestAnimationFrame(loop);
        return;
      }
      const delta = Math.min((ts - this._lastTs) / 1000, 0.1);
      this._lastTs = ts;
      this._tick(delta);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);

    // Spawn first equation only after banner for adventure answer mode
    if (this._subType === 'answer') {
      if (isAdventure) {
        const waitForBanner = () => {
          if (!this._bannerActive && !this._finished) {
            this._spawnEquation();
          } else if (!this._finished) {
            setTimeout(waitForBanner, 100);
          }
        };
        setTimeout(waitForBanner, 100);
      } else {
        this._spawnEquation();
      }
    }
  }

  // ── Main tick ──────────────────────────────────────────────────────────────

  _tick(delta) {
    this._timeLeft -= delta;
    if (this._timeLeft <= 0) {
      this._timeLeft = 0;
      this._timerEl.textContent = '0:00';
      this._endGame();
      return;
    }
    this._timerEl.textContent = formatTime(this._timeLeft);

    if (this._subType === 'answer') {
      this._tickAnswer(delta);
    } else {
      this._tickCollection(delta);
    }
  }

  // ── Answer engine ──────────────────────────────────────────────────────────

  _tickAnswer(delta) {
    const areaH = this._playArea.clientHeight;
    let correctFell = false;

    for (let i = this._tiles.length - 1; i >= 0; i--) {
      const tile = this._tiles[i];
      tile.y += tile.speed * delta;
      tile.el.style.top = `${tile.y}px`;
      if (tile.y > areaH) {
        tile.el.remove();
        this._tiles.splice(i, 1);
        if (tile.isCorrect) correctFell = true;
      }
    }

    if (correctFell) {
      this._missed++;
      this._combo = 0;
      this._tiles.forEach(t => t.el.remove());
      this._tiles = [];
      this._spawnEquation();
    }
  }

  _generateEquation() {
    const m   = this._activeMode;
    const cfg = this._levelConfig;
    const operation = cfg?.operation ?? m.operation ?? 'mixed';
    const ops = operation === 'addition'    ? ['+']
              : operation === 'subtraction' ? ['-']
              :                               ['+', '-'];
    const op = randFrom(ops);

    const [min, max] = cfg?.numberRange ?? m.numberRange ?? [1, 10];
    let a, b, answer;

    if (op === '+') {
      a = randInt(min, max);
      b = randInt(min, max);
      answer = a + b;
    } else {
      a = randInt(min, max);
      b = randInt(min, a);
      if (b < min) b = min;
      answer = a - b;
    }

    return { a, b, op, answer, display: `${a} ${op} ${b} = ?` };
  }

  _generateAnswers(equation) {
    const m   = this._activeMode;
    const cfg = this._levelConfig;
    const count   = cfg?.answerCount ?? m.answerCount ?? 3;
    const correct = equation.answer;
    const wrongs  = new Set();

    for (const off of [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6]) {
      const w = correct + off;
      if (w >= 0 && w !== correct && !wrongs.has(w)) {
        wrongs.add(w);
        if (wrongs.size === count - 1) break;
      }
    }

    return shuffle([correct, ...wrongs]);
  }

  _spawnEquation() {
    if (this._finished || this._spawning) return;
    this._spawning = true;

    this._tiles.forEach(t => t.el.remove());
    this._tiles = [];

    this._equation = this._generateEquation();
    if (this._equationEl) this._equationEl.textContent = this._equation.display;

    const answers = this._generateAnswers(this._equation);
    const correct = this._equation.answer;
    const areaW   = this._playArea.clientWidth || 600;

    answers.forEach((ans, i) => {
      const color = TILE_COLORS[i % TILE_COLORS.length];
      const x     = this._randBetween(8, areaW - TILE_SIZE - 8);
      const speed = this._randBetween(SPEED_MIN, SPEED_MAX);

      const el = document.createElement('div');
      el.className   = 'mg-tile';
      el.textContent = ans;
      el.style.left  = `${x}px`;
      el.style.top   = `-${TILE_SIZE}px`;
      el.style.background = color;
      this._playArea.appendChild(el);

      this._tiles.push({ el, x, y: -TILE_SIZE, speed, value: ans, isCorrect: ans === correct });
    });

    this._spawning = false;
  }

  _clickTile(tile, e) {
    if (this._finished) return;
    const m = this._activeMode;
    const pts = m.pointsPerCorrect ?? 10;

    if (tile.isCorrect) {
      tile.el.classList.add('mg-tile--pop');
      tile.el.addEventListener('animationend', () => tile.el.remove(), { once: true });

      this._correct++;
      this._score += pts;
      this._combo++;
      this._maxCombo = Math.max(this._maxCombo, this._combo);
      this._refreshGoalDisplay();
      this._showFeedback(e, `+${pts} ✓`, 'correct');
      soundManager.play('correct');

      // Check adventure early-finish
      const cfg = this._levelConfig;
      if (!this._isArcade && cfg?.goal?.type === 'correctAnswers') {
        if (this._correct >= cfg.goal.value) {
          this._tiles.forEach(t => { if (t !== tile) t.el.remove(); });
          this._tiles = [];
          this._endGame();
          return;
        }
      }

      this._tiles.forEach(t => { if (t !== tile) t.el.remove(); });
      this._tiles = [];
      this._spawnEquation();
    } else {
      this._wrongClicks++;
      this._combo = 0;
      tile.el.classList.add('mg-tile--wrong');
      tile.el.addEventListener('animationend', () => tile.el.classList.remove('mg-tile--wrong'), { once: true });
      this._showFeedback(e, 'Wrong!', 'wrong');
      soundManager.play('wrong');
    }
  }

  // ── Collection engine ──────────────────────────────────────────────────────

  _tickCollection(delta) {
    this._spawnTimer += delta;
    if (this._spawnTimer >= this._spawnDelay) {
      this._spawnNumber();
      this._spawnTimer = 0;
      this._spawnDelay = this._randBetween(0.8, 1.4);
    }

    const areaH = this._playArea.clientHeight;
    for (let i = this._items.length - 1; i >= 0; i--) {
      const it = this._items[i];
      it.y += it.speed * delta;
      it.el.style.top = `${it.y}px`;
      if (it.y > areaH) {
        it.el.remove();
        this._items.splice(i, 1);
        if (it.isCorrect) {
          this._missed++;
          this._combo = 0;
        }
      }
    }
  }

  _spawnNumber() {
    const m    = this._activeMode;
    const cfg  = this._levelConfig;
    const areaW = this._playArea.clientWidth;
    const x     = this._randBetween(8, areaW - ITEM_SIZE - 8);
    const speed = this._randBetween(COL_SPD_MIN, COL_SPD_MAX);

    const [min, max] = cfg?.numberRange ?? m.numberRange ?? [1, 20];
    const value    = Math.floor(this._randBetween(min, max + 1));
    const variants = NUMBER_SPRITES[value];
    const src      = WMC_BASE + (variants ? randFrom(variants) : 'num_1_a.png');

    const el = document.createElement('img');
    el.className = 'wmc-item';
    el.src       = src;
    el.draggable = false;
    el.style.left = `${x}px`;
    el.style.top  = `-${ITEM_SIZE}px`;
    this._playArea.appendChild(el);
    soundManager.play('pop');

    this._items.push({ el, x, y: -ITEM_SIZE, speed, value, isCorrect: m.isCorrect(value) });
  }

  _clickItem(idx, e) {
    const it  = this._items[idx];
    const m   = this._activeMode;
    const cfg = this._levelConfig;
    const pts = m.pointsPerCorrect ?? 10;

    if (it.isCorrect) {
      it.el.classList.add('wmc-item--pop');
      it.el.addEventListener('animationend', () => it.el.remove(), { once: true });
      this._items.splice(idx, 1);

      this._catchCount++;
      this._score += pts;
      this._combo++;
      this._maxCombo = Math.max(this._maxCombo, this._combo);
      this._refreshGoalDisplay();
      this._showFeedback(e, `+${pts}`, 'correct');
      soundManager.play('correct');

      // Check adventure early-finish
      if (!this._isArcade && cfg?.goal?.type === 'catchCount') {
        if (this._catchCount >= cfg.goal.value) {
          this._items.forEach(it2 => it2.el.remove());
          this._items = [];
          this._endGame();
          return;
        }
      }
    } else {
      this._wrongClicks++;
      this._combo = 0;
      const penalty = m.wrongPenalty ?? 0;
      if (penalty > 0) {
        this._score = Math.max(0, this._score - penalty * pts);
        this._refreshGoalDisplay();
      }
      it.el.classList.add('wmc-item--wrong');
      it.el.addEventListener('animationend', () => it.el.classList.remove('wmc-item--wrong'), { once: true });
      const feedbackText = penalty > 0
        ? `${m.wrongFeedback ?? 'Wrong!'} -${penalty * pts}`
        : (m.wrongFeedback ?? 'Wrong!');
      this._showFeedback(e, feedbackText, 'wrong');
      soundManager.play('wrong');
    }
  }

  // ── Quit (X button) ───────────────────────────────────────────────────────

  _quitGame() {
    if (this._finished) return;
    this._finished = true;

    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._tiles.forEach(t => t.el.remove());
    this._tiles = [];
    this._items.forEach(it => it.el.remove());
    this._items = [];

    const catId = this._levelConfig?.category ?? 'mathGarden';
    const mode  = this._levelConfig?.mode     ?? 'arcade';

    this.finish({ gameId: 'math_garden', success: false, score: this._score, coinsEarned: 0 });
    import('../../ui/HubModal.js').then(({ openHubAt }) => openHubAt(catId, mode));
  }

  // ── Shared helpers ─────────────────────────────────────────────────────────

  _showFeedback(mouseEvent, text, type) {
    const fb = document.createElement('div');
    fb.className   = `mg-feedback mg-feedback--${type}`;
    fb.textContent = text;

    const rect = this._playArea.getBoundingClientRect();
    fb.style.left = `${mouseEvent.clientX - rect.left}px`;
    fb.style.top  = `${mouseEvent.clientY - rect.top - 40}px`;

    this._playArea.appendChild(fb);
    fb.addEventListener('animationend', () => fb.remove(), { once: true });
  }

  _endGame() {
    if (this._finished) return;
    this._finished = true;

    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._tiles.forEach(t => t.el.remove());
    this._tiles = [];
    this._items.forEach(it => it.el.remove());
    this._items = [];

    const cfg = this._levelConfig;
    const m   = this._activeMode;
    let won         = true;
    let coinsEarned = Math.floor(this._score / 2);  // arcade default
    let goalLabel   = '';
    let goalActual  = 0;
    let goalMax     = 0;

    if (!this._isArcade && cfg) {
      const goal = cfg.goal;
      switch (goal.type) {
        case 'correctAnswers':
          won        = this._correct >= goal.value;
          goalLabel  = 'Correct';
          goalActual = this._correct;
          goalMax    = goal.value;
          break;
        case 'catchCount':
          won        = this._catchCount >= goal.value;
          goalLabel  = 'Caught';
          goalActual = this._catchCount;
          goalMax    = goal.value;
          break;
        default:
          won = this._score > 0;
      }
      coinsEarned = won ? (cfg.clearReward ?? 0) : 0;
      if (won) saveManager.completeLevel(cfg.category, cfg.levelNum);
    } else {
      saveManager.recordArcadeScore('mathGarden', m.id, this._score);
    }

    const futureTotal = saveManager.getData().coins + coinsEarned;
    const catId       = cfg?.category ?? 'mathGarden';

    const statRow = this._subType === 'answer'
      ? `<div class="mg-result-row"><span>Correct</span><strong>${this._correct}</strong></div>`
      : `<div class="mg-result-row"><span>Caught</span><strong>${this._catchCount}</strong></div>`;

    const root = this._container.querySelector('.wmc-root');

    if (!this._isArcade && cfg) {
      // Adventure result
      root.innerHTML = `
        <div class="mg-result-screen">
          <div class="mg-result-card">
            <h1 class="mg-result-title">${won ? '🎉 Level Complete!' : '💔 Level Failed'}</h1>
            <div class="mg-result-goal-row">
              <span>${goalLabel}</span>
              <span style="color:${won ? '#7ef7a0' : '#ff8a80'}">${goalActual} / ${goalMax}</span>
            </div>
            <div class="mg-result-rows">
              <div class="mg-result-row"><span>Score</span><strong>${this._score}</strong></div>
              ${statRow}
              <div class="mg-result-row"><span>Missed</span><strong>${this._missed}</strong></div>
              <div class="mg-result-row"><span>Wrong clicks</span><strong>${this._wrongClicks}</strong></div>
              <div class="mg-result-row"><span>Max Combo</span><strong>${this._maxCombo}×</strong></div>
            </div>
            ${coinsEarned > 0 ? `<div class="mg-result-reward">Level Reward: ${coinsEarned} 🍉</div>` : ''}
            <div class="mg-result-wallet">Wallet Total: ${futureTotal} 🍉</div>
            <div class="mg-result-btns">
              <button class="mg-back-btn" id="mg-back-btn">← Back</button>
              <button class="mg-action-btn" id="mg-action-btn">▶ ${won ? 'Play Next' : 'Try Again'}</button>
            </div>
          </div>
        </div>
      `;
    } else {
      // Arcade result
      root.innerHTML = `
        <div class="mg-result-screen">
          <div class="mg-result-card">
            <h1 class="mg-result-title">🌱 Time's Up!</h1>
            <div class="mg-result-rows">
              <div class="mg-result-row"><span>Score</span><strong>${this._score}</strong></div>
              ${statRow}
              <div class="mg-result-row"><span>Missed</span><strong>${this._missed}</strong></div>
              <div class="mg-result-row"><span>Wrong clicks</span><strong>${this._wrongClicks}</strong></div>
              <div class="mg-result-row"><span>Max Combo</span><strong>${this._maxCombo}×</strong></div>
            </div>
            ${coinsEarned > 0 ? `<div class="mg-result-reward">Coins Earned: +${coinsEarned} 🍉</div>` : ''}
            <div class="mg-result-wallet">Wallet Total: ${futureTotal} 🍉</div>
            <div class="mg-result-btns">
              <button class="mg-back-btn" id="mg-back-btn">← Back</button>
              <button class="mg-action-btn" id="mg-action-btn">▶ Play Again</button>
            </div>
          </div>
        </div>
      `;
    }

    soundManager.play(coinsEarned > 0 ? 'success' : 'failure');

    const result = {
      gameId:      'math_garden',
      success:     won,
      score:       this._score,
      coinsEarned: coinsEarned,
      stats: { correct: this._correct, catchCount: this._catchCount, missed: this._missed, wrongClicks: this._wrongClicks, maxCombo: this._maxCombo, mode: m.id },
    };

    // ← Back: award coins, return to hub
    root.querySelector('#mg-back-btn').addEventListener('click', () => {
      this.finish(result);
      import('../../ui/HubModal.js').then(({ openHubAt }) =>
        openHubAt(catId, this._isArcade ? 'arcade' : 'adventure')
      );
    });

    // Action button
    root.querySelector('#mg-action-btn').addEventListener('click', () => {
      this.finish(result);
      if (this._isArcade) {
        // Play Again: restart with same (arcade) config
        import('../GameManager.js').then(({ gameManager }) =>
          gameManager.startGame('math_garden', cfg)
        );
      } else {
        // Play Next / Try Again: open level map
        const nextNum = won ? (cfg.levelNum + 1) : cfg.levelNum;
        import('../../ui/HubModal.js').then(({ openHubAt }) =>
          openHubAt(catId, 'adventure', nextNum)
        );
      }
    });
  }

  update(_delta) {}

  destroy() {
    this._finished = true;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._tiles.forEach(t => t.el.remove());
    this._items.forEach(it => it.el.remove());
    this._tiles     = [];
    this._items     = [];
    this._container = null;
    this._playArea  = null;
    this._scoreEl   = null;
    this._goalEl    = null;
    this._equationEl = null;
  }

  _randBetween(a, b) {
    return a + Math.random() * (b - a);
  }
}
