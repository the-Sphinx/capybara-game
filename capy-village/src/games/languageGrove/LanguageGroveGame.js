import { BaseGame } from '../BaseGame.js';
import { soundManager } from '../../audio/SoundManager.js';
import { saveManager } from '../../SaveManager.js';
import arcadeConfig from './arcade.json';
import {
  VOWELS, CONSONANTS, ALL_LETTERS,
  CATEGORIES, LETTER_WORDS,
  SENTENCES, OPPOSITES, SYNONYMS, RIDDLES,
} from './content.js';

const WMC_BASE = import.meta.env.BASE_URL + 'games/watermelon/';

const TILE_SIZE  = 72;   // px baseline (lg-tile overrides to auto width)
const SPEED_BASE = 120;  // px/s at fallSpeed=1.0

const TILE_COLORS = ['#e74c3c', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#16a085', '#c0392b', '#1abc9c'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randBetween(a, b) {
  return a + Math.random() * (b - a);
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

// Rotating shuffle-index helpers for content arrays
function makeRotator(arr) {
  let pool = [];
  return () => {
    if (!pool.length) pool = shuffle(arr.map((_, i) => i));
    return arr[pool.pop()];
  };
}

// ── LanguageGroveGame ─────────────────────────────────────────────────────────

export class LanguageGroveGame extends BaseGame {
  constructor(levelConfig = null) {
    super({ gameId: 'language_grove', label: 'Language Grove' });

    this._levelConfig = levelConfig;
    this._isArcade    = !levelConfig || levelConfig.mode === 'arcade';

    // Resolve active mode from arcade config or level config
    if (this._isArcade) {
      const weights    = levelConfig?.arcadeWeights ?? arcadeConfig.arcadeWeights ?? {};
      this._activeMode = weightedPick(arcadeConfig.modes, weights);
    } else {
      // Adventure: find matching arcade mode entry for metadata (title/prompt/pts)
      this._activeMode = arcadeConfig.modes.find(m => m.id === levelConfig.modeId)
        ?? arcadeConfig.modes.find(m => m.modeId === levelConfig.modeId)
        ?? arcadeConfig.modes[0];
    }

    const cfg = levelConfig;
    this._subType    = cfg?.subType ?? this._activeMode.subType;
    this._modeId     = cfg?.modeId ?? this._activeMode.modeId ?? this._activeMode.id;
    this._fallSpeed  = (cfg?.fallSpeed ?? this._activeMode.fallSpeed ?? 1.0) * SPEED_BASE;
    this._answerCount = cfg?.answerCount ?? this._activeMode.answerCount ?? 3;

    // Category / word config
    this._categoryKey = cfg?.category ?? this._activeMode.category ?? null;
    this._targetWord  = cfg?.targetWord ?? null;

    // Stats
    this._timeLeft    = cfg?.timeLimit ?? 60;
    this._score       = 0;
    this._catchCount  = 0;   // stream: correct items caught
    this._correct     = 0;   // choiceRound: rounds answered correctly
    this._missed      = 0;
    this._wrongClicks = 0;
    this._combo       = 0;
    this._maxCombo    = 0;

    // Stream engine state
    this._items       = [];
    this._spawnTimer  = 0;
    this._spawnDelay  = 0;

    // ChoiceRound engine state
    this._tiles       = [];
    this._roundPrompt = null;  // current prompt object
    this._spawning    = false;

    // Content rotators (choiceRound)
    this._nextSentence = makeRotator(SENTENCES);
    this._nextOpposite = makeRotator(OPPOSITES);
    this._nextSynonym  = makeRotator(SYNONYMS);
    this._nextRiddle   = makeRotator(RIDDLES);

    this._finished      = false;
    this._bannerActive  = false;
    this._raf           = null;
    this._lastTs        = null;
    this._container     = null;
    this._playArea      = null;
    this._goalEl        = null;
    this._timerEl       = null;
    this._promptEl      = null;   // center instruction/question span
  }

  // ── Goal helpers ─────────────────────────────────────────────────────────────

  _goalLabel() {
    return this._subType === 'choiceRound' ? 'Correct' : 'Caught';
  }

  _goalValue() {
    return this._subType === 'choiceRound' ? this._correct : this._catchCount;
  }

  _refreshGoalDisplay() {
    if (this._goalEl) this._goalEl.textContent = this._goalValue();
  }

  _levelInstruction() {
    const cfg = this._levelConfig;
    const m   = this._activeMode;
    switch (this._modeId) {
      case 'vowels':             return 'Catch the Vowels!';
      case 'consonants':         return 'Catch the Consonants!';
      case 'categoryCatch':      return `Catch: ${CATEGORIES[this._categoryKey]?.label ?? this._categoryKey}`;
      case 'lettersInWord':      return `Letters in: ${this._targetWord}`;
      case 'sentenceCompletion': return 'Finish the sentence:';
      case 'opposites':          return 'Opposite of:';
      case 'synonyms':           return 'Word similar to:';
      case 'riddle':             return 'Catch the answer!';
      default:                   return m?.prompt ?? 'Play!';
    }
  }

  // ── Level start banner ───────────────────────────────────────────────────────

  _showLevelBanner(container, cfg) {
    this._bannerActive = true;
    const goalType  = cfg.goal?.type;
    const goalValue = cfg.goal?.value ?? 0;
    const goalDesc  = goalType === 'correctAnswers'
      ? `Answer ${goalValue} correctly`
      : `Catch ${goalValue} items`;

    const banner = document.createElement('div');
    banner.className = 'wmc-level-banner';
    banner.innerHTML = `
      <div class="wmc-level-banner-inner">
        <div class="wmc-level-banner-num">Level ${cfg.levelNum}</div>
        <div class="wmc-level-banner-goal-label">Goal:</div>
        <div class="wmc-level-banner-goal">${goalDesc}</div>
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

  // ── start ─────────────────────────────────────────────────────────────────────

  start(container) {
    this._container = container;
    this._finished  = false;

    const cfg         = this._levelConfig;
    const isAdventure = !this._isArcade;
    const goalValue   = cfg?.goal?.value ?? 0;
    const goalLabel   = this._goalLabel();

    // Left panel
    const leftContent = isAdventure
      ? `<div class="wmc-hud-score">${goalLabel}: <span id="lg-goal-val">0</span> / ${goalValue}</div>`
      : `<div class="wmc-hud-score">SCORE: <span id="lg-goal-val">0</span></div>`;

    // Center panel
    let centerContent = '';
    if (isAdventure && cfg) {
      centerContent = `
        <div class="wmc-hud-center-content">
          <div class="wmc-hud-level-line">Level ${cfg.levelNum} · ${cfg.label}</div>
          <div class="wmc-hud-instruction" id="lg-prompt">${this._levelInstruction()}</div>
        </div>
      `;
    } else {
      // Arcade: show mode title + prompt
      centerContent = `
        <div class="wmc-hud-center-content">
          <div class="wmc-hud-level-line">${this._activeMode.title ?? 'Language Grove'}</div>
          <div class="wmc-hud-instruction" id="lg-prompt">${this._activeMode.prompt ?? ''}</div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="wmc-root">
        <div class="wmc-play-area" id="lg-play-area"></div>
        <div class="wmc-hud" id="wmc-hud">
          <div class="wmc-hud-cap-left" id="wmc-hud-left">
            ${leftContent}
          </div>
          <div class="wmc-hud-cap-center" id="wmc-hud-center">${centerContent}</div>
          <div class="wmc-hud-cap-right" id="wmc-hud-right">
            <div class="wmc-hud-time">TIME: <span id="lg-time-val">${formatTime(this._timeLeft)}</span></div>
          </div>
        </div>
        <button class="wmc-exit-btn" id="lg-finish-btn">✕</button>
      </div>
    `;

    // Apply HUD background images
    container.querySelector('#lg-play-area').style.backgroundImage     = `url(${WMC_BASE}background.png)`;
    container.querySelector('#wmc-hud-left').style.backgroundImage     = `url(${WMC_BASE}hud_cap_left.png)`;
    container.querySelector('#wmc-hud-center').style.backgroundImage   = `url(${WMC_BASE}hud_center.png)`;
    container.querySelector('#wmc-hud-right').style.backgroundImage    = `url(${WMC_BASE}hud_cap_right.png)`;

    this._playArea = container.querySelector('#lg-play-area');
    this._goalEl   = container.querySelector('#lg-goal-val');
    this._timerEl  = container.querySelector('#lg-time-val');
    this._promptEl = container.querySelector('#lg-prompt');

    container.querySelector('#lg-finish-btn').addEventListener('click', () => this._quitGame());

    // Wire click handlers
    if (this._subType === 'stream') {
      this._spawnTimer = 0;
      this._spawnDelay = randBetween(0.6, 1.0);

      const onItemClick = (e) => {
        const el = e.target.closest('.lg-item');
        if (!el) return;
        const idx = this._items.findIndex(it => it.el === el);
        if (idx !== -1) this._clickItem(idx, e);
      };
      this._playArea.addEventListener('mousedown', onItemClick);
      this._onItemClick = onItemClick;
    } else {
      const onTileClick = (e) => {
        const el = e.target.closest('.mg-tile');
        if (!el) return;
        const tile = this._tiles.find(t => t.el === el);
        if (tile) this._clickTile(tile, e);
      };
      this._playArea.addEventListener('mousedown', onTileClick);
      this._onTileClick = onTileClick;
    }

    if (isAdventure) this._showLevelBanner(container, cfg);

    this._lastTs = performance.now();
    const loop = (ts) => {
      if (this._finished) return;
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

    // Spawn first choiceRound after banner
    if (this._subType === 'choiceRound') {
      if (isAdventure) {
        const waitForBanner = () => {
          if (!this._bannerActive && !this._finished) {
            this._spawnChoiceRound();
          } else if (!this._finished) {
            setTimeout(waitForBanner, 100);
          }
        };
        setTimeout(waitForBanner, 100);
      } else {
        this._spawnChoiceRound();
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

    if (this._subType === 'stream') {
      this._tickStream(delta);
    } else {
      this._tickChoiceRound(delta);
    }
  }

  // ── Stream engine ───────────────────────────────────────────────────────────

  _tickStream(delta) {
    // Spawn
    this._spawnTimer += delta;
    if (this._spawnTimer >= this._spawnDelay) {
      this._spawnItem();
      this._spawnTimer = 0;
      this._spawnDelay = randBetween(0.7, 1.2);
    }

    // Move items
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

  _buildStreamPool() {
    // Returns { correct: [strings], incorrect: [strings] }
    switch (this._modeId) {
      case 'vowels':
        return { correct: VOWELS, incorrect: CONSONANTS };
      case 'consonants':
        return { correct: CONSONANTS, incorrect: VOWELS };
      case 'categoryCatch': {
        const catWords = CATEGORIES[this._categoryKey]?.words ?? [];
        // Distractors: words from all OTHER categories
        const distractor = [];
        for (const [key, cat] of Object.entries(CATEGORIES)) {
          if (key !== this._categoryKey) distractor.push(...cat.words);
        }
        return { correct: catWords, incorrect: distractor };
      }
      case 'lettersInWord': {
        const word    = this._targetWord ?? 'DOG';
        const letters = [...new Set(word.split(''))];
        const wrong   = ALL_LETTERS.filter(l => !letters.includes(l));
        return { correct: letters, incorrect: wrong };
      }
      default:
        return { correct: VOWELS, incorrect: CONSONANTS };
    }
  }

  _spawnItem() {
    const pool   = this._buildStreamPool();
    const areaW  = this._playArea.clientWidth || 600;
    const speed  = randBetween(this._fallSpeed * 0.85, this._fallSpeed * 1.15);

    // 40% chance correct, 60% incorrect (keeps it challenging but fair)
    const isCorrect = Math.random() < 0.4;
    const label = isCorrect ? randFrom(pool.correct) : randFrom(pool.incorrect);
    const color = isCorrect
      ? randFrom(['#27ae60', '#16a085', '#2980b9'])
      : randFrom(['#e74c3c', '#c0392b', '#8e44ad']);

    const el = document.createElement('div');
    el.className = 'mg-tile lg-item lg-tile';
    el.textContent = label;
    el.style.background = color;

    const x = randBetween(8, Math.max(8, areaW - 100));
    el.style.left = `${x}px`;
    el.style.top  = `-72px`;
    this._playArea.appendChild(el);
    soundManager.play('pop');

    this._items.push({ el, x, y: -72, speed, label, isCorrect });
  }

  _clickItem(idx, e) {
    const it  = this._items[idx];
    const pts = this._activeMode?.pointsPerCorrect ?? 5;

    if (it.isCorrect) {
      it.el.classList.add('mg-tile--pop');
      it.el.addEventListener('animationend', () => it.el.remove(), { once: true });
      this._items.splice(idx, 1);

      this._catchCount++;
      this._score += pts;
      this._combo++;
      this._maxCombo = Math.max(this._maxCombo, this._combo);
      this._refreshGoalDisplay();
      this._showFeedback(e, `+${pts} ✓`, 'correct');
      soundManager.play('correct');

      // Adventure early-finish
      const cfg = this._levelConfig;
      if (!this._isArcade && cfg?.goal?.type === 'catchCount') {
        if (this._catchCount >= cfg.goal.value) {
          this._items.forEach(it2 => it2.el.remove());
          this._items = [];
          this._endGame();
        }
      }
    } else {
      this._wrongClicks++;
      this._combo = 0;
      const penalty = this._activeMode?.wrongPenalty ?? 0;
      if (penalty > 0) {
        this._score = Math.max(0, this._score - penalty * pts);
        this._refreshGoalDisplay();
      }
      it.el.classList.add('mg-tile--wrong');
      it.el.addEventListener('animationend', () => it.el.classList.remove('mg-tile--wrong'), { once: true });
      this._showFeedback(e, 'Wrong!', 'wrong');
      soundManager.play('wrong');
    }
  }

  // ── ChoiceRound engine ─────────────────────────────────────────────────────

  _tickChoiceRound(delta) {
    if (!this._tiles.length) return;

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
      this._spawnChoiceRound();
    }
  }

  _pickPrompt() {
    switch (this._modeId) {
      case 'sentenceCompletion': return this._nextSentence();
      case 'opposites':          return this._nextOpposite();
      case 'synonyms':           return this._nextSynonym();
      case 'riddle':             return this._nextRiddle();
      default:                   return this._nextSentence();
    }
  }

  _buildPromptDisplay(prompt) {
    switch (this._modeId) {
      case 'sentenceCompletion': return prompt.stem;
      case 'opposites':          return `Opposite of: ${prompt.prompt}`;
      case 'synonyms':           return `Similar to: ${prompt.prompt}`;
      case 'riddle':             return prompt.text.replace(/\n/g, ' · ');
      default:                   return '';
    }
  }

  _spawnChoiceRound() {
    if (this._finished || this._spawning) return;
    this._spawning = true;

    this._tiles.forEach(t => t.el.remove());
    this._tiles = [];

    this._roundPrompt = this._pickPrompt();
    const prompt = this._roundPrompt;

    // Update HUD prompt
    if (this._promptEl) {
      this._promptEl.textContent = this._buildPromptDisplay(prompt);
    }

    const correct     = prompt.correct;
    const answerCount = this._answerCount;
    const distractors = shuffle(prompt.distractors).slice(0, answerCount - 1);
    const answers     = shuffle([correct, ...distractors]);

    const areaW = this._playArea.clientWidth || 600;
    const speed = randBetween(this._fallSpeed * 0.85, this._fallSpeed * 1.1);

    answers.forEach((ans, i) => {
      const color = TILE_COLORS[i % TILE_COLORS.length];
      const x     = randBetween(8, Math.max(8, areaW - 120));
      const startY = -TILE_SIZE - i * 30; // stagger vertical start

      const el = document.createElement('div');
      el.className   = 'mg-tile lg-tile';
      el.textContent = ans;
      el.style.left  = `${x}px`;
      el.style.top   = `${startY}px`;
      el.style.background = color;
      this._playArea.appendChild(el);

      this._tiles.push({ el, x, y: startY, speed, value: ans, isCorrect: ans === correct });
    });

    this._spawning = false;
  }

  _clickTile(tile, e) {
    if (this._finished) return;
    const pts = this._activeMode?.pointsPerCorrect ?? 10;

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

      // Remove remaining tiles
      this._tiles.forEach(t => { if (t !== tile) t.el.remove(); });
      this._tiles = [];

      // Adventure early-finish
      const cfg = this._levelConfig;
      if (!this._isArcade && cfg?.goal?.type === 'correctAnswers') {
        if (this._correct >= cfg.goal.value) {
          this._endGame();
          return;
        }
      }

      this._spawnChoiceRound();
    } else {
      this._wrongClicks++;
      this._combo = 0;
      tile.el.classList.add('mg-tile--wrong');
      tile.el.addEventListener('animationend', () => tile.el.classList.remove('mg-tile--wrong'), { once: true });
      this._showFeedback(e, 'Wrong!', 'wrong');
      soundManager.play('wrong');
    }
  }

  // ── Quit (X button) ───────────────────────────────────────────────────────

  _quitGame() {
    if (this._finished) return;
    this._finished = true;

    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._clearAllItems();

    const catId = this._levelConfig?.category ?? 'languageGrove';
    const mode  = this._levelConfig?.mode     ?? 'arcade';

    this.finish({ gameId: 'language_grove', success: false, score: this._score, coinsEarned: 0 });
    import('../../ui/HubModal.js').then(({ openHubAt }) => openHubAt('languageGrove', mode));
  }

  // ── End game ──────────────────────────────────────────────────────────────

  _endGame() {
    if (this._finished) return;
    this._finished = true;

    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._clearAllItems();

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
      if (won) saveManager.completeLevel('languageGrove', cfg.levelNum);
    } else {
      saveManager.recordArcadeScore('languageGrove', m.id, this._score);
    }

    const futureTotal = saveManager.getData().coins + coinsEarned;

    const statRow = this._subType === 'choiceRound'
      ? `<div class="mg-result-row"><span>Correct</span><strong>${this._correct}</strong></div>`
      : `<div class="mg-result-row"><span>Caught</span><strong>${this._catchCount}</strong></div>`;

    const root = this._container.querySelector('.wmc-root');

    if (!this._isArcade && cfg) {
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
              <button class="mg-back-btn" id="lg-back-btn">← Back</button>
              <button class="mg-action-btn" id="lg-action-btn">▶ ${won ? 'Play Next' : 'Try Again'}</button>
            </div>
          </div>
        </div>
      `;
    } else {
      root.innerHTML = `
        <div class="mg-result-screen">
          <div class="mg-result-card">
            <h1 class="mg-result-title">📚 Time's Up!</h1>
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
              <button class="mg-back-btn" id="lg-back-btn">← Back</button>
              <button class="mg-action-btn" id="lg-action-btn">▶ Play Again</button>
            </div>
          </div>
        </div>
      `;
    }

    soundManager.play(coinsEarned > 0 ? 'success' : 'failure');

    const result = {
      gameId:      'language_grove',
      success:     won,
      score:       this._score,
      coinsEarned,
      stats: {
        correct:     this._correct,
        catchCount:  this._catchCount,
        missed:      this._missed,
        wrongClicks: this._wrongClicks,
        maxCombo:    this._maxCombo,
        mode:        m.id,
      },
    };

    root.querySelector('#lg-back-btn').addEventListener('click', () => {
      this.finish(result);
      import('../../ui/HubModal.js').then(({ openHubAt }) =>
        openHubAt('languageGrove', this._isArcade ? 'arcade' : 'adventure')
      );
    });

    root.querySelector('#lg-action-btn').addEventListener('click', () => {
      this.finish(result);
      if (this._isArcade) {
        import('../GameManager.js').then(({ gameManager }) =>
          gameManager.startGame('language_grove', cfg)
        );
      } else {
        const nextNum = won ? (cfg.levelNum + 1) : cfg.levelNum;
        import('../../ui/HubModal.js').then(({ openHubAt }) =>
          openHubAt('languageGrove', 'adventure', nextNum)
        );
      }
    });
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

  _clearAllItems() {
    this._tiles.forEach(t => t.el.remove());
    this._tiles = [];
    this._items.forEach(it => it.el.remove());
    this._items = [];
  }

  // ── BaseGame interface ─────────────────────────────────────────────────────

  update(_delta) {}

  destroy() {
    this._finished = true;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._clearAllItems();
    this._container = null;
    this._playArea  = null;
    this._goalEl    = null;
    this._timerEl   = null;
    this._promptEl  = null;
  }
}
