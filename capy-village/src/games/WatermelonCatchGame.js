import { BaseGame } from './BaseGame.js';
import { WATERMELON_CATCH_MODES } from './configs/watermelonCatchModes.js';

const GAME_DURATION = 20;   // seconds
const SPAWN_MIN     = 0.8;  // seconds between spawns (min)
const SPAWN_MAX     = 1.2;  // seconds between spawns (max)
const SPEED_MIN     = 120;  // px/s
const SPEED_MAX     = 280;  // px/s
const ITEM_SIZE     = 56;   // px

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
    this._items       = [];   // { el, x, y, speed, value }
    this._container   = null;
    this._playArea    = null;
    this._scoreEl     = null;
    this._timerEl     = null;
    this._timerBarEl  = null;
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
      <div class="wmc-panel">
        <h1 class="wmc-title">${m.title}</h1>
        <p class="wmc-prompt">${m.prompt}</p>
        <div class="wmc-topbar">
          <span class="wmc-score-display">Score: <span id="wmc-score-val">0</span></span>
          <span class="wmc-timer-display">Time: <span id="wmc-time-val">${GAME_DURATION}s</span></span>
        </div>
        <div class="wmc-timer-bar-wrap">
          <div class="wmc-timer-bar" id="wmc-timer-bar"></div>
        </div>
        <div class="wmc-play-area" id="wmc-play-area"></div>
        <button class="wmc-finish-btn" id="wmc-finish-btn">Exit</button>
      </div>
    `;

    this._scoreEl    = container.querySelector('#wmc-score-val');
    this._timerEl    = container.querySelector('#wmc-time-val');
    this._timerBarEl = container.querySelector('#wmc-timer-bar');
    this._playArea   = container.querySelector('#wmc-play-area');

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
    this._playArea.addEventListener('click', onItemClick);
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
      this._timerEl.textContent = '0s';
      this._updateTimerBar(0);
      this._endGame();
      return;
    }
    this._timerEl.textContent = `${Math.ceil(this._timeLeft)}s`;
    this._updateTimerBar(this._timeLeft / GAME_DURATION);

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

  _updateTimerBar(ratio) {
    if (!this._timerBarEl) return;
    this._timerBarEl.style.width = `${ratio * 100}%`;
    this._timerBarEl.classList.toggle('wmc-timer-bar--urgent', ratio < 0.25);
  }

  _spawnItem() {
    const areaW = this._playArea.clientWidth;
    const x     = this._randBetween(8, areaW - ITEM_SIZE - 8);
    const speed = this._randBetween(SPEED_MIN, SPEED_MAX);
    const mode  = this._mode;

    let value, content, extraClass;
    if (mode.itemType === 'emoji') {
      value      = null;
      content    = mode.emoji;
      extraClass = 'wmc-item--emoji';
    } else {
      // numberRange [min, max] inclusive
      value      = Math.floor(this._randBetween(mode.numberRange[0], mode.numberRange[1] + 1));
      content    = String(value);
      extraClass = 'wmc-item--number';
    }

    const el = document.createElement('div');
    el.className   = `wmc-item ${extraClass}`;
    el.textContent = content;
    el.style.left  = `${x}px`;
    el.style.top   = `-${ITEM_SIZE}px`;
    this._playArea.appendChild(el);

    this._items.push({ el, x, y: -ITEM_SIZE, speed, value });
  }

  _clickItem(idx, mouseEvent) {
    const it      = this._items[idx];
    const correct = this._mode.isCorrect(it.value);

    if (correct) {
      it.el.classList.add('wmc-item--pop');
      it.el.addEventListener('animationend', () => it.el.remove(), { once: true });
      this._items.splice(idx, 1);
      this._score++;
      this._scoreEl.textContent = this._score;
      this._showFloatFeedback(mouseEvent, '+1', 'correct');
    } else {
      this._wrongClicks++;
      it.el.classList.add('wmc-item--wrong');
      it.el.addEventListener('animationend', () => it.el.classList.remove('wmc-item--wrong'), { once: true });
      this._showFloatFeedback(mouseEvent, this._mode.wrongFeedback || 'Wrong!', 'wrong');
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

    const coins  = Math.floor(this._score / 2);
    const m      = this._mode;
    const panel  = this._container.querySelector('.wmc-panel');
    const wrongRow = m.itemType !== 'emoji'
      ? `<p class="wmc-results-row">Wrong Clicks: <strong>${this._wrongClicks}</strong></p>`
      : '';

    panel.innerHTML = `
      <h1 class="wmc-title">${m.title}</h1>
      <p class="wmc-mode-tag">Mode: ${m.id === 'classic' ? 'Classic' : 'Catch Even Numbers'}</p>
      <div class="wmc-results">
        <p class="wmc-results-row">Score: <strong>${this._score}</strong></p>
        <p class="wmc-results-row">Caught: <strong>${this._score}</strong></p>
        <p class="wmc-results-row">Missed: <strong>${this._missed}</strong></p>
        ${wrongRow}
        <p class="wmc-results-coins">Coins Earned: <strong>${coins}</strong> 🍉</p>
      </div>
      <button class="wmc-return-btn" id="wmc-return-btn">Return to Village</button>
    `;
    panel.querySelector('#wmc-return-btn').addEventListener('click', () => {
      this.finish({
        gameId:       'watermelon_catch',
        success:      this._score > 0,
        score:        this._score,
        coinsEarned:  coins,
        stats:        { caught: this._score, missed: this._missed, wrongClicks: this._wrongClicks, mode: m.id },
      });
    });
  }

  update(_delta) {}

  destroy() {
    this._finished = true;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    if (this._playArea && this._handlers.onItemClick) {
      this._playArea.removeEventListener('click', this._handlers.onItemClick);
    }
    this._items      = [];
    this._handlers   = {};
    this._playArea   = null;
    this._scoreEl    = null;
    this._timerEl    = null;
    this._timerBarEl = null;
    this._container  = null;
  }

  _randBetween(a, b) {
    return a + Math.random() * (b - a);
  }
}
