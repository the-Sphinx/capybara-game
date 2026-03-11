import { BaseGame } from './BaseGame.js';
import { WATERMELON_CATCH_MODES } from './configs/watermelonCatchModes.js';

const BASE_URL = import.meta.env.BASE_URL + 'games/watermelon/';

const GAME_DURATION = 20;   // seconds
const SPAWN_MIN     = 0.8;  // seconds between spawns (min)
const SPAWN_MAX     = 1.4;  // seconds between spawns (max)
const SPEED_MIN     = 80;   // px/s
const SPEED_MAX     = 180;  // px/s
const ITEM_SIZE     = 120;  // px

// ── Sprite catalog ──────────────────────────────────────────────────────────
const SPRITES = {
  slices: [
    'slice_a0.png', 'slice_a1.png', 'slice_a2.png',
    'slice_b0.png', 'slice_b1.png', 'slice_b2.png', 'slice_b3.png', 'slice_b4.png',
  ],
  faces: ['face_a0.png', 'face_b0.png'],
  numbers: {
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
  },
};

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatTime(secs) {
  const s = Math.ceil(secs);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${String(ss).padStart(2, '0')}`;
}

export class WatermelonCatchGame extends BaseGame {
  constructor() {
    super({ gameId: 'watermelon_catch', label: 'Watermelon Catch' });
    this._mode        = WATERMELON_CATCH_MODES[Math.floor(Math.random() * WATERMELON_CATCH_MODES.length)];
    this._score       = 0;
    this._missed      = 0;
    this._wrongClicks = 0;
    this._timeLeft    = GAME_DURATION;
    this._spawnTimer  = 0;
    this._spawnDelay  = SPAWN_MIN;
    this._items       = [];
    this._container   = null;
    this._playArea    = null;
    this._scoreEl     = null;
    this._timerEl     = null;
    this._raf         = null;
    this._lastTs      = null;
    this._finished    = false;
    this._handlers    = {};
  }

  start(container) {
    this._container = container;
    this._finished  = false;
    const m = this._mode;

    container.innerHTML = `
      <div class="wmc-root">
        <div class="wmc-play-area" id="wmc-play-area"></div>
        <div class="wmc-hud" id="wmc-hud">
          <div class="wmc-hud-cap-left"   id="wmc-hud-left"></div>
          <div class="wmc-hud-cap-center" id="wmc-hud-center"></div>
          <div class="wmc-hud-cap-right"  id="wmc-hud-right"></div>
          <div class="wmc-hud-score">SCORE: <span id="wmc-score-val">0</span></div>
          <div class="wmc-hud-time">TIME: <span id="wmc-time-val">${formatTime(GAME_DURATION)}</span></div>
        </div>
        <div class="wmc-mode-badge">${m.prompt}</div>
        <button class="wmc-exit-btn" id="wmc-finish-btn">✕</button>
      </div>
    `;

    // Set background images via JS so BASE_URL is applied correctly
    container.querySelector('#wmc-play-area').style.backgroundImage =
      `url(${BASE_URL}background.png)`;
    container.querySelector('#wmc-hud-left').style.backgroundImage =
      `url(${BASE_URL}hud_cap_left.png)`;
    container.querySelector('#wmc-hud-center').style.backgroundImage =
      `url(${BASE_URL}hud_center.png)`;
    container.querySelector('#wmc-hud-right').style.backgroundImage =
      `url(${BASE_URL}hud_cap_right.png)`;

    this._scoreEl  = container.querySelector('#wmc-score-val');
    this._timerEl  = container.querySelector('#wmc-time-val');
    this._playArea = container.querySelector('#wmc-play-area');

    const onFinish = () => this._endGame();
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

    this._spawnDelay = this._randBetween(SPAWN_MIN, SPAWN_MAX);
    this._lastTs = performance.now();
    const loop = (ts) => {
      if (this._finished) return;
      const delta = Math.min((ts - this._lastTs) / 1000, 0.1);
      this._lastTs = ts;
      this._tick(delta);
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
      this._spawnDelay = this._randBetween(SPAWN_MIN, SPAWN_MAX);
    }

    const areaH = this._playArea.clientHeight;
    for (let i = this._items.length - 1; i >= 0; i--) {
      const it = this._items[i];
      it.y += it.speed * delta;
      it.el.style.top = `${it.y}px`;
      if (it.y > areaH) {
        it.el.remove();
        this._items.splice(i, 1);
        this._missed++;
      }
    }
  }

  _spawnItem() {
    const areaW = this._playArea.clientWidth;
    const x     = this._randBetween(8, areaW - ITEM_SIZE - 8);
    const speed = this._randBetween(SPEED_MIN, SPEED_MAX);
    const mode  = this._mode;

    let spriteSrc, value = null, isCorrect;

    if (mode.itemType === 'emoji') {
      // Classic mode: random mix of cute slices and faces (all catchable)
      const useSlice = Math.random() < 0.65;
      spriteSrc = BASE_URL + (useSlice ? randFrom(SPRITES.slices) : randFrom(SPRITES.faces));
      isCorrect = () => true;
    } else {
      // Number mode: pick a number, pick a random visual variant
      value = Math.floor(this._randBetween(mode.numberRange[0], mode.numberRange[1] + 1));
      const variants = SPRITES.numbers[value];
      spriteSrc = BASE_URL + (variants ? randFrom(variants) : 'num_1_a.png');
      const v = value;
      isCorrect = () => mode.isCorrect(v);
    }

    const el = document.createElement('img');
    el.className  = 'wmc-item';
    el.src        = spriteSrc;
    el.draggable  = false;
    el.style.left = `${x}px`;
    el.style.top  = `-${ITEM_SIZE}px`;
    this._playArea.appendChild(el);

    this._items.push({ el, x, y: -ITEM_SIZE, speed, value, isCorrect });
  }

  _clickItem(idx, mouseEvent) {
    const it      = this._items[idx];
    const correct = it.isCorrect();

    if (correct) {
      it.el.classList.add('wmc-item--pop');
      it.el.addEventListener('animationend', () => it.el.remove(), { once: true });
      this._items.splice(idx, 1);
      this._score++;
      this._scoreEl.textContent = this._score;
      this._showFloatFeedback(mouseEvent, '+1', 'correct');
    } else {
      this._wrongClicks++;
      const penalty = this._mode.wrongPenalty || 0;
      if (penalty > 0) {
        this._score = Math.max(0, this._score - penalty);
        this._scoreEl.textContent = this._score;
      }
      it.el.classList.add('wmc-item--wrong');
      it.el.addEventListener('animationend', () => it.el.classList.remove('wmc-item--wrong'), { once: true });
      const feedbackText = penalty > 0
        ? `${this._mode.wrongFeedback || 'Wrong!'} -${penalty}`
        : (this._mode.wrongFeedback || 'Wrong!');
      this._showFloatFeedback(mouseEvent, feedbackText, 'wrong');
    }
  }

  _showFloatFeedback(mouseEvent, text, type) {
    const fb = document.createElement('div');
    fb.className   = `wmc-feedback wmc-feedback--${type}`;
    fb.textContent = text;

    const areaRect = this._playArea.getBoundingClientRect();
    fb.style.left  = `${mouseEvent.clientX - areaRect.left}px`;
    fb.style.top   = `${mouseEvent.clientY - areaRect.top - 10}px`;

    this._playArea.appendChild(fb);
    fb.addEventListener('animationend', () => fb.remove(), { once: true });
  }

  _endGame() {
    if (this._finished) return;
    this._finished = true;

    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }

    this._items.forEach(it => it.el.remove());
    this._items = [];

    const coins = this._score;
    const m     = this._mode;
    const root  = this._container.querySelector('.wmc-root');

    root.innerHTML = `
      <div class="wmc-result-bg"></div>
      <div class="wmc-result-screen">
        <div class="wmc-result-card">
          <h1 class="wmc-result-title">${m.title}</h1>
          <div class="wmc-result-rows">
            <div class="wmc-result-row"><span>Score</span><strong>${this._score}</strong></div>
            <div class="wmc-result-row"><span>Caught</span><strong>${this._score}</strong></div>
            <div class="wmc-result-row"><span>Missed</span><strong>${this._missed}</strong></div>
            ${m.itemType !== 'emoji' ? `<div class="wmc-result-row"><span>Wrong clicks</span><strong>${this._wrongClicks}</strong></div>` : ''}
          </div>
          <div class="wmc-result-coins">🍉 ${coins} coin${coins !== 1 ? 's' : ''} earned!</div>
          <button class="wmc-return-btn" id="wmc-return-btn">Return to Village</button>
        </div>
      </div>
    `;

    root.querySelector('.wmc-result-bg').style.backgroundImage =
      `url(${BASE_URL}background.png)`;

    root.querySelector('#wmc-return-btn').addEventListener('click', () => {
      this.finish({
        gameId:      'watermelon_catch',
        success:     this._score > 0,
        score:       this._score,
        coinsEarned: coins,
        stats:       { caught: this._score, missed: this._missed, wrongClicks: this._wrongClicks, mode: m.id },
      });
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
    this._timerEl   = null;
    this._container = null;
  }

  _randBetween(a, b) {
    return a + Math.random() * (b - a);
  }
}
