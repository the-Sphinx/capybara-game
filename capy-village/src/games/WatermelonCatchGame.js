import { BaseGame } from './BaseGame.js';

const GAME_DURATION = 20;      // seconds
const SPAWN_MIN     = 0.8;     // seconds between spawns (min)
const SPAWN_MAX     = 1.2;     // seconds between spawns (max)
const SPEED_MIN     = 120;     // px/s
const SPEED_MAX     = 280;     // px/s
const MELON_SIZE    = 52;      // px

export class WatermelonCatchGame extends BaseGame {
  constructor() {
    super({ gameId: 'watermelon_catch', label: 'Watermelon Catch' });
    this._score      = 0;
    this._missed     = 0;
    this._timeLeft   = GAME_DURATION;
    this._spawnTimer = 0;
    this._spawnDelay = SPAWN_MIN;
    this._melons     = [];   // { el, x, y, speed }
    this._container  = null;
    this._playArea   = null;
    this._scoreEl    = null;
    this._timerEl    = null;
    this._raf        = null;
    this._lastTs     = null;
    this._finished   = false;
    this._handlers   = {};
  }

  start(container) {
    this._container = container;
    this._finished  = false;

    container.innerHTML = `
      <div class="wmc-panel">
        <h1 class="wmc-title">Watermelon Catch 🍉</h1>
        <div class="wmc-topbar">
          <span class="wmc-score-display">Score: <span id="wmc-score-val">0</span></span>
          <span class="wmc-timer-display">Time: <span id="wmc-time-val">${GAME_DURATION}s</span></span>
        </div>
        <div class="wmc-play-area" id="wmc-play-area"></div>
        <button class="wmc-finish-btn" id="wmc-finish-btn">Exit</button>
      </div>
    `;

    this._scoreEl  = container.querySelector('#wmc-score-val');
    this._timerEl  = container.querySelector('#wmc-time-val');
    this._playArea = container.querySelector('#wmc-play-area');

    const onFinish = () => this._endGame();
    container.querySelector('#wmc-finish-btn').addEventListener('click', onFinish);
    this._handlers.onFinish = onFinish;

    // Melon click handled via delegation on play area
    const onMelonClick = (e) => {
      const el = e.target.closest('.wmc-melon');
      if (!el) return;
      this._catchMelon(el);
    };
    this._playArea.addEventListener('click', onMelonClick);
    this._handlers.onMelonClick = onMelonClick;

    // Start loop
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
    // Timer
    this._timeLeft -= delta;
    if (this._timeLeft <= 0) {
      this._timeLeft = 0;
      this._timerEl.textContent = '0s';
      this._endGame();
      return;
    }
    this._timerEl.textContent = `${Math.ceil(this._timeLeft)}s`;

    // Spawn
    this._spawnTimer += delta;
    if (this._spawnTimer >= this._spawnDelay) {
      this._spawnMelon();
      this._spawnTimer = 0;
      this._spawnDelay = this._randBetween(SPAWN_MIN, SPAWN_MAX);
    }

    // Move melons
    const areaH = this._playArea.clientHeight;
    for (let i = this._melons.length - 1; i >= 0; i--) {
      const m = this._melons[i];
      m.y += m.speed * delta;
      m.el.style.top = `${m.y}px`;

      if (m.y > areaH) {
        m.el.remove();
        this._melons.splice(i, 1);
        this._missed++;
      }
    }
  }

  _spawnMelon() {
    const areaW  = this._playArea.clientWidth;
    const x      = this._randBetween(8, areaW - MELON_SIZE - 8);
    const speed  = this._randBetween(SPEED_MIN, SPEED_MAX);

    const el = document.createElement('div');
    el.className = 'wmc-melon';
    el.textContent = '🍉';
    el.style.left = `${x}px`;
    el.style.top  = `-${MELON_SIZE}px`;
    this._playArea.appendChild(el);

    this._melons.push({ el, x, y: -MELON_SIZE, speed });
  }

  _catchMelon(el) {
    const idx = this._melons.findIndex(m => m.el === el);
    if (idx === -1) return;

    // Pop animation then remove
    el.classList.add('wmc-melon--pop');
    el.addEventListener('animationend', () => el.remove(), { once: true });
    this._melons.splice(idx, 1);

    this._score++;
    this._scoreEl.textContent = this._score;
  }

  _endGame() {
    if (this._finished) return;
    this._finished = true;

    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }

    // Remove all melons
    this._melons.forEach(m => m.el.remove());
    this._melons = [];

    const coins = Math.floor(this._score / 2);
    const panel = this._container.querySelector('.wmc-panel');
    panel.innerHTML = `
      <h1 class="wmc-title">Watermelon Catch 🍉</h1>
      <div class="wmc-results">
        <p class="wmc-results-row">Score: <strong>${this._score}</strong></p>
        <p class="wmc-results-row">Caught: <strong>${this._score}</strong></p>
        <p class="wmc-results-row">Missed: <strong>${this._missed}</strong></p>
        <p class="wmc-results-coins">Coins Earned: <strong>+${coins}</strong> 🍉</p>
      </div>
      <button class="wmc-return-btn" id="wmc-return-btn">Return to Village</button>
    `;
    panel.querySelector('#wmc-return-btn').addEventListener('click', () => {
      this.finish({
        gameId:      'watermelon_catch',
        success:     this._score > 0,
        score:       this._score,
        coinsEarned: coins,
        stats:       { caught: this._score, missed: this._missed },
      });
    });
  }

  update(_delta) {}

  destroy() {
    this._finished = true;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    if (this._playArea && this._handlers.onMelonClick) {
      this._playArea.removeEventListener('click', this._handlers.onMelonClick);
    }
    this._melons    = [];
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
