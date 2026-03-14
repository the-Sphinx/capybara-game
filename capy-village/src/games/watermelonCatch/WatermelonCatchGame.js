import { BaseGame }    from '../BaseGame.js';
import { soundManager } from '../../audio/SoundManager.js';
import { saveManager }  from '../../SaveManager.js';
import arcadeConfig     from './arcade.json';

const BASE_URL = import.meta.env.BASE_URL + 'games/watermelon/';

const GAME_DURATION = 30;   // seconds
const SPAWN_MIN     = 0.8;  // seconds between spawns (min)
const SPAWN_MAX     = 1.4;  // seconds between spawns (max)
const SPEED_MIN     = 80;   // px/s
const SPEED_MAX     = 180;  // px/s
const ITEM_SIZE     = 120;  // px

// Classic mode — read from arcade.json
const CLASSIC_MODE = arcadeConfig.modes[0];

// ── Sprite catalog ───────────────────────────────────────────────────────────
const SPRITES = {
  slices: [
    'slice_a0.png', 'slice_a1.png', 'slice_a2.png',
    'slice_b0.png', 'slice_b1.png', 'slice_b2.png', 'slice_b3.png', 'slice_b4.png',
  ],
  faces: ['face_a0.png', 'face_b0.png'],
  specials: {
    gold:      ['gold_a.png',      'gold_b.png'],
    silver:    ['silver_a.png',    'silver_b.png'],
    bomb:      ['bomb_a.png',      'bomb_b.png'],
    hourglass: ['hourglass_a.png', 'hourglass_b.png'],
    clock:     ['clock_a.png',     'clock_b.png'],
  },
};

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatTime(secs) {
  const s  = Math.ceil(secs);
  const m  = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${String(ss).padStart(2, '0')}`;
}

export class WatermelonCatchGame extends BaseGame {
  constructor(levelConfig = null) {
    super({ gameId: 'watermelon_catch', label: 'Watermelon Catch' });
    this._levelConfig   = levelConfig;
    this._mode          = CLASSIC_MODE;
    this._isArcade      = !levelConfig || levelConfig.mode !== 'adventure';
    this._score         = 0;
    this._missed        = 0;
    this._wrongClicks   = 0;
    this._catchCount    = 0;
    this._combo         = 0;
    this._maxCombo      = 0;
    this._timeLeft      = levelConfig ? (levelConfig.timeLimit ?? GAME_DURATION) : GAME_DURATION;
    this._fallSpeedMult = levelConfig ? (levelConfig.fallSpeedMult ?? 1.0) : 1.0;
    this._spawnRateMult = levelConfig ? (levelConfig.spawnRateMult ?? 1.0) : 1.0;
    this._specialItems  = levelConfig?.specialItems ?? { hourglass: true, clock: true, bomb: true, gold: true, silver: true };
    this._spawnTimer    = 0;
    this._spawnDelay    = SPAWN_MIN;
    this._items         = [];
    this._container     = null;
    this._playArea      = null;
    this._scoreEl       = null;   // arcade: watermelon count
    this._goalEl        = null;   // adventure: goal progress
    this._timerEl       = null;
    this._raf           = null;
    this._lastTs        = null;
    this._finished      = false;
    this._bannerActive  = false;
    this._handlers      = {};
    this._lastSeconds   = false;
  }

  // ── Goal helpers ─────────────────────────────────────────────────────────────

  _goalLabel(type) {
    switch (type) {
      case 'catchCount': return 'Caught';
      case 'combo':      return 'Best Combo';
      default:           return 'Score';
    }
  }

  _goalDesc(goal) {
    switch (goal.type) {
      case 'score':      return `Score ${goal.value}+ points`;
      case 'catchCount': return `Catch ${goal.value} items`;
      case 'combo':      return `Reach a ${goal.value}× combo`;
      default:           return `Goal: ${goal.value}`;
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
        case 'catchCount': val = this._catchCount; break;
        case 'combo':      val = this._maxCombo; break;
        default:           val = this._score; break;
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
    const cfg         = this._levelConfig;
    const isAdventure = !this._isArcade;
    const goalType    = cfg?.goal?.type ?? 'score';
    const goalValue   = cfg?.goal?.value ?? 0;
    const goalLabel   = this._goalLabel(goalType);

    // Left panel content
    const leftContent = isAdventure
      ? `<div class="wmc-hud-score">${goalLabel}: <span id="wmc-goal-val">0</span> / ${goalValue}</div>`
      : `<div class="wmc-hud-score">Watermelons: <span id="wmc-score-val">0</span></div>`;

    // Center panel content (adventure only)
    const centerContent = isAdventure
      ? `<div class="wmc-hud-center-content"><div class="wmc-hud-level-line">Level ${cfg.levelNum} · ${cfg.label}</div></div>`
      : '';

    container.innerHTML = `
      <div class="wmc-root">
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

    container.querySelector('#wmc-play-area').style.backgroundImage =
      `url(${BASE_URL}background.png)`;
    container.querySelector('#wmc-hud-left').style.backgroundImage =
      `url(${BASE_URL}hud_cap_left.png)`;
    container.querySelector('#wmc-hud-center').style.backgroundImage =
      `url(${BASE_URL}hud_center.png)`;
    container.querySelector('#wmc-hud-right').style.backgroundImage =
      `url(${BASE_URL}hud_cap_right.png)`;

    this._scoreEl  = container.querySelector('#wmc-score-val');
    this._goalEl   = container.querySelector('#wmc-goal-val');
    this._timerEl  = container.querySelector('#wmc-time-val');
    this._playArea = container.querySelector('#wmc-play-area');

    const cursorSprite = BASE_URL + 'cursor.png';
    this._playArea.style.cursor = `url('${cursorSprite}') 32 32, crosshair`;

    const onFinish = () => this._quitGame();
    container.querySelector('#wmc-finish-btn').addEventListener('click', onFinish);
    this._handlers.onFinish = onFinish;

    const onItemClick = (e) => {
      const el = e.target.closest('.wmc-item');
      if (!el) return;
      const idx = this._items.findIndex(it => it.el === el);
      if (idx === -1) return;
      this._clickItem(idx, e);
    };
    this._playArea.addEventListener('mousedown', onItemClick);
    this._handlers.onItemClick = onItemClick;

    // Show level start banner for adventure (freezes game loop)
    if (isAdventure) {
      this._showLevelBanner(container, cfg);
    }

    this._spawnDelay = this._randBetween(SPAWN_MIN, SPAWN_MAX) / this._spawnRateMult;
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

      if (this._timeLeft > 10) {
        if (this._lastSeconds) soundManager.stop('ticking_clock');
        this._lastSeconds = false;
      } else {
        if (!this._lastSeconds) {
          soundManager.play('ticking_clock', { loop: true });
          this._lastSeconds = true;
        }
      }
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  _tick(delta) {
    this._timeLeft -= delta;
    if (this._timeLeft <= 0) {
      this._timeLeft = 0;
      this._timerEl.textContent = '0:00';
      this._endGame();
      return;
    }
    this._timerEl.textContent = formatTime(this._timeLeft);

    this._spawnTimer += delta;
    if (this._spawnTimer >= this._spawnDelay) {
      this._spawnItem();
      this._spawnTimer = 0;
      this._spawnDelay = this._randBetween(SPAWN_MIN, SPAWN_MAX) / this._spawnRateMult;
    }

    const areaH = this._playArea.clientHeight;
    for (let i = this._items.length - 1; i >= 0; i--) {
      const it = this._items[i];
      it.y += it.speed * delta;
      it.el.style.top = `${it.y}px`;
      if (it.y > areaH) {
        it.el.remove();
        this._items.splice(i, 1);
        if (it.isCorrect && it.isCorrect()) {
          this._missed++;
          this._combo = 0;
        }
      }
    }
  }

  _spawnItem() {
    const areaW = this._playArea.clientWidth;
    const x     = this._randBetween(8, areaW - ITEM_SIZE - 8);
    const speed = this._randBetween(SPEED_MIN, SPEED_MAX) * this._fallSpeedMult;
    const m     = this._mode;
    const si    = this._specialItems;

    let spriteSrc, value = null, isCorrect, itemKind = 'normal', sound_label = 'pop';
    const roll = Math.random();

    if (si.hourglass && roll < 0.02) {
      itemKind  = 'hourglass';
      spriteSrc = BASE_URL + randFrom(SPRITES.specials.hourglass);
      value     = m.timeBonuses.hourglass;
      isCorrect = () => true;
    } else if (si.clock && roll < 0.05) {
      itemKind  = 'clock';
      spriteSrc = BASE_URL + randFrom(SPRITES.specials.clock);
      value     = m.timeBonuses.clock;
      isCorrect = () => true;
    } else if (si.bomb && roll < 0.20) {
      itemKind  = 'bomb';
      spriteSrc = BASE_URL + randFrom(SPRITES.specials.bomb);
      value     = m.bombPenalty;
      isCorrect = () => false;
    } else {
      if (si.gold && roll < 0.23) {
        itemKind    = 'gold';
        spriteSrc   = BASE_URL + randFrom(SPRITES.specials.gold);
        value       = m.itemValues.gold;
        isCorrect   = () => true;
        sound_label = 'pop2';
      } else if (si.silver && roll < 0.28) {
        itemKind    = 'silver';
        spriteSrc   = BASE_URL + randFrom(SPRITES.specials.silver);
        value       = m.itemValues.silver;
        isCorrect   = () => true;
        sound_label = 'pop2';
      } else {
        const useSlice = Math.random() < 0.65;
        const sprite   = useSlice ? randFrom(SPRITES.slices) : randFrom(SPRITES.faces);
        spriteSrc      = BASE_URL + sprite;
        value          = useSlice ? m.itemValues.slice : m.itemValues.face;
        isCorrect      = () => true;
        sound_label    = useSlice ? 'pop' : 'pop2';
      }
    }

    const el = document.createElement('img');
    el.className  = 'wmc-item';
    el.src        = spriteSrc;
    el.draggable  = false;
    el.style.left = `${x}px`;
    el.style.top  = `-${ITEM_SIZE}px`;
    this._playArea.appendChild(el);

    this._items.push({ el, x, y: 280 - ITEM_SIZE, speed, value, isCorrect, itemKind });
    soundManager.play(sound_label);
  }

  _clickItem(idx, mouseEvent) {
    const it      = this._items[idx];
    const correct = it.isCorrect();
    const m       = this._mode;

    // ── Time-bonus specials ─────────────────────────────────────────────────
    if (it.itemKind === 'hourglass' || it.itemKind === 'clock') {
      const bonus = it.value;
      this._timeLeft += bonus;
      this._timerEl.textContent = formatTime(this._timeLeft);
      it.el.classList.add('wmc-item--pop');
      it.el.addEventListener('animationend', () => it.el.remove(), { once: true });
      this._items.splice(idx, 1);
      this._catchCount++;
      this._combo++;
      this._maxCombo = Math.max(this._maxCombo, this._combo);
      this._showFloatFeedback(mouseEvent, `+${bonus}s ⏳`, 'correct');
      soundManager.play('correct');
      this._refreshGoalDisplay();
      return;
    }

    // ── Bomb ────────────────────────────────────────────────────────────────
    if (it.itemKind === 'bomb') {
      this._wrongClicks++;
      this._combo = 0;
      this._score = Math.max(0, this._score - it.value);
      it.el.classList.add('wmc-item--wrong');
      it.el.addEventListener('animationend', () => it.el.remove(), { once: true });
      this._items.splice(idx, 1);
      this._showFloatFeedback(mouseEvent, '💣 Boom!', 'wrong');
      soundManager.play('failure');
      this._refreshGoalDisplay();
      return;
    }

    if (correct) {
      it.el.classList.add('wmc-item--pop');
      it.el.addEventListener('animationend', () => it.el.remove(), { once: true });
      this._items.splice(idx, 1);
      const pts = it.value ?? 1;
      this._score += pts;
      this._catchCount++;
      this._combo++;
      this._maxCombo = Math.max(this._maxCombo, this._combo);
      this._refreshGoalDisplay();
      const isCountGoal = !this._isArcade && this._levelConfig?.goal?.type === 'catchCount';
      this._showFloatFeedback(mouseEvent, isCountGoal ? '+1' : `+${pts}`, 'correct');
      soundManager.play('bite');
    } else {
      this._wrongClicks++;
      this._combo = 0;
      const penalty = m.wrongPenalty ?? 0;
      if (penalty > 0) {
        this._score = Math.max(0, this._score - penalty);
        this._refreshGoalDisplay();
      }
      it.el.classList.add('wmc-item--wrong');
      it.el.addEventListener('animationend', () => it.el.classList.remove('wmc-item--wrong'), { once: true });
      const feedbackText = penalty > 0
        ? `${m.wrongFeedback ?? 'Wrong!'} -${penalty}`
        : (m.wrongFeedback ?? 'Wrong!');
      this._showFloatFeedback(mouseEvent, feedbackText, 'wrong');
      soundManager.play('wrong');
    }
  }

  _showFloatFeedback(mouseEvent, text, type) {
    const fb = document.createElement('div');
    fb.className   = `wmc-feedback wmc-feedback--${type}`;
    fb.textContent = text;

    const areaRect = this._playArea.getBoundingClientRect();
    fb.style.left  = `${mouseEvent.clientX - areaRect.left}px`;
    fb.style.top   = `${mouseEvent.clientY - areaRect.top - 50}px`;

    this._playArea.appendChild(fb);
    fb.addEventListener('animationend', () => fb.remove(), { once: true });
  }

  // X button — quit immediately, no coins, no result screen
  _quitGame() {
    if (this._finished) return;
    this._finished = true;

    soundManager.stop('ticking_clock');
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._items.forEach(it => it.el.remove());
    this._items = [];

    const catId = this._levelConfig?.category ?? 'watermelonCatch';
    const mode  = this._levelConfig?.mode     ?? 'arcade';

    this.finish({ gameId: 'watermelon_catch', success: false, score: this._score, coinsEarned: 0 });
    import('../../ui/HubModal.js').then(({ openHubAt }) => openHubAt(catId, mode));
  }

  _endGame() {
    if (this._finished) return;
    this._finished = true;

    soundManager.stop('ticking_clock');
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._items.forEach(it => it.el.remove());
    this._items = [];

    const cfg         = this._levelConfig;
    const m           = this._mode;
    const isAdventure = !this._isArcade;
    const catId       = cfg?.category ?? 'watermelonCatch';

    let won         = true;
    let coinsEarned = this._score;  // arcade default
    let goalLabel   = '';
    let goalActual  = 0;
    let goalMax     = 0;

    if (isAdventure) {
      const goal = cfg.goal;
      switch (goal.type) {
        case 'score':
          won        = this._score >= goal.value;
          goalLabel  = 'Score';
          goalActual = this._score;
          goalMax    = goal.value;
          break;
        case 'catchCount':
          won        = this._catchCount >= goal.value;
          goalLabel  = 'Caught';
          goalActual = this._catchCount;
          goalMax    = goal.value;
          break;
        case 'combo':
          won        = this._maxCombo >= goal.value;
          goalLabel  = 'Best Combo';
          goalActual = this._maxCombo;
          goalMax    = goal.value;
          break;
        default:
          won = this._score > 0;
      }
      coinsEarned = won ? (cfg.clearReward ?? 0) : 0;
      if (won) saveManager.completeLevel(cfg.category, cfg.levelNum);
    } else {
      saveManager.recordArcadeScore(catId, m.id, this._score);
    }

    const futureTotal = saveManager.getData().coins + coinsEarned;
    const root = this._container.querySelector('.wmc-root');

    if (isAdventure) {
      root.innerHTML = `
        <div class="wmc-result-bg"></div>
        <div class="wmc-result-screen">
          <div class="wmc-result-card">
            <h1 class="wmc-result-title">${won ? '🎉 Level Complete!' : '💔 Level Failed'}</h1>
            <div class="wmc-result-goal-row">
              <span>${goalLabel}</span>
              <span style="color:${won ? '#7ef7a0' : '#ff8a80'}">${goalActual} / ${goalMax}</span>
            </div>
            <div class="wmc-result-rows">
              <div class="wmc-result-row"><span>Score</span><strong>${this._score}</strong></div>
              <div class="wmc-result-row"><span>Caught</span><strong>${this._catchCount}</strong></div>
              <div class="wmc-result-row"><span>Missed</span><strong>${this._missed}</strong></div>
              <div class="wmc-result-row"><span>Max Combo</span><strong>${this._maxCombo}×</strong></div>
            </div>
            ${coinsEarned > 0 ? `<div class="wmc-result-reward">Level Reward: ${coinsEarned} 🍉</div>` : ''}
            <div class="wmc-result-wallet">Wallet Total: ${futureTotal} 🍉</div>
            <div class="wmc-result-btns">
              <button class="wmc-back-btn" id="wmc-back-btn">← Back</button>
              <button class="wmc-action-btn" id="wmc-action-btn">▶ ${won ? 'Play Next' : 'Try Again'}</button>
            </div>
          </div>
        </div>
      `;
    } else {
      root.innerHTML = `
        <div class="wmc-result-bg"></div>
        <div class="wmc-result-screen">
          <div class="wmc-result-card">
            <h1 class="wmc-result-title">Run Complete</h1>
            <div class="wmc-result-rows">
              <div class="wmc-result-row"><span>Watermelons Collected</span><strong>${this._score}</strong></div>
              <div class="wmc-result-row"><span>Caught</span><strong>${this._catchCount}</strong></div>
              <div class="wmc-result-row"><span>Missed</span><strong>${this._missed}</strong></div>
              <div class="wmc-result-row"><span>Max Combo</span><strong>${this._maxCombo}×</strong></div>
            </div>
            <div class="wmc-result-reward">Coins Earned: +${coinsEarned} 🍉</div>
            <div class="wmc-result-wallet">Wallet Total: ${futureTotal} 🍉</div>
            <div class="wmc-result-btns">
              <button class="wmc-back-btn" id="wmc-back-btn">← Back</button>
              <button class="wmc-action-btn" id="wmc-action-btn">▶ Play Again</button>
            </div>
          </div>
        </div>
      `;
    }

    root.querySelector('.wmc-result-bg').style.backgroundImage =
      `url(${BASE_URL}background.png)`;

    soundManager.play(coinsEarned > 0 ? 'success' : 'failure');

    const result = {
      gameId:      'watermelon_catch',
      success:     won,
      score:       this._score,
      coinsEarned: coinsEarned,
      stats: { caught: this._catchCount, missed: this._missed, wrongClicks: this._wrongClicks, maxCombo: this._maxCombo, mode: m.id },
    };

    root.querySelector('#wmc-back-btn').addEventListener('click', () => {
      this.finish(result);
      import('../../ui/HubModal.js').then(({ openHubAt }) =>
        openHubAt(catId, isAdventure ? 'adventure' : 'arcade')
      );
    });

    root.querySelector('#wmc-action-btn').addEventListener('click', () => {
      this.finish(result);
      if (isAdventure) {
        const nextNum = won ? (cfg.levelNum + 1) : cfg.levelNum;
        import('../../ui/HubModal.js').then(({ openHubAt }) =>
          openHubAt(catId, 'adventure', nextNum)
        );
      } else {
        import('../GameManager.js').then(({ gameManager }) =>
          gameManager.startGame('watermelon_catch', cfg)
        );
      }
    });
  }

  update(_delta) {}

  destroy() {
    this._finished = true;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    if (this._playArea && this._handlers.onItemClick) {
      this._playArea.removeEventListener('mousedown', this._handlers.onItemClick);
    }
    this._items     = [];
    this._handlers  = {};
    this._playArea  = null;
    this._scoreEl   = null;
    this._goalEl    = null;
    this._timerEl   = null;
    this._container = null;
  }

  _randBetween(a, b) {
    return a + Math.random() * (b - a);
  }
}
