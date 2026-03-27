import { BaseGame } from '../BaseGame.js';
import { gameManager } from '../GameManager.js';
import { saveManager } from '../../SaveManager.js';
import { soundManager } from '../../audio/SoundManager.js';
import { computeAdventureRewards, renderRewardBreakdownHtml } from '../rewardUtils.js';

function formatTime(secs) {
  const s = Math.ceil(Math.max(0, secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function weightedPick(modes, weights) {
  const entries = modes.map((mode) => ({ mode, weight: weights[mode.id] ?? 1 }));
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let pick = Math.random() * total;
  for (const entry of entries) {
    pick -= entry.weight;
    if (pick <= 0) {
      return entry.mode;
    }
  }
  return modes[modes.length - 1] ?? null;
}

function statLabelForFamily(family) {
  switch (family) {
    case 'answer':
    case 'choice_round':
      return 'Correct';
    default:
      return 'Caught';
  }
}

export class EngineGame extends BaseGame {
  constructor({
    gameId,
    label,
    categoryId,
    levelConfig = null,
    assetBase,
    resultPrefix = 'mg',
  }) {
    super({ gameId, label });
    this.categoryId = categoryId;
    this._levelConfig = levelConfig;
    this._isArcade = !levelConfig || levelConfig.mode === 'arcade';
    this._assetBase = assetBase;
    this._resultPrefix = resultPrefix;

    this._gameConfig = gameManager.ensureCachedGameConfig(gameId);
    if (!this._gameConfig) {
      throw new Error(`Game config for ${gameId} must be loaded before game start`);
    }

    this._activeMode = this._resolveMode();
    this._modeFamily = this._activeMode?.family ?? 'collection';

    this._timeLeft = levelConfig?.timeLimit ?? this._activeMode?.timeLimit ?? 60;
    this._score = 0;
    this._correct = 0;
    this._catchCount = 0;
    this._missed = 0;
    this._wrongClicks = 0;
    this._combo = 0;
    this._maxCombo = 0;
    this._goalCompleteShown = false;
    this._bannerActive = false;
    this._finished = false;

    this._raf = null;
    this._lastTs = null;
    this._container = null;
    this._playArea = null;
    this._scoreEl = null;
    this._goalEl = null;
    this._timerEl = null;
    this._centerTextEl = null;
    this._handler = null;
  }

  _resolveMode() {
    if (this._isArcade) {
      const arcadeConfig = this._gameConfig.arcadeConfig ?? {};
      const modes = arcadeConfig.modes ?? [];
      return weightedPick(modes, arcadeConfig.arcadeWeights ?? {});
    }
    return this._levelConfig?.resolvedMode ?? gameManager.resolveModeForLevel(this.gameId, this._levelConfig);
  }

  get mode() {
    return this._activeMode;
  }

  get isArcade() {
    return this._isArcade;
  }

  get playArea() {
    return this._playArea;
  }

  get levelConfig() {
    return this._levelConfig;
  }

  get handler() {
    return this._handler;
  }

  // Subclass hooks
  createHandler() {
    throw new Error('createHandler() must be implemented by subclass');
  }

  buildCenterContent() {
    if (this._isArcade) {
      return {
        line: this._activeMode?.title ?? this.label,
        text: this._activeMode?.prompt ?? '',
      };
    }
    return {
      line: `Level ${this._levelConfig.levelNum} · ${this._levelConfig.label}`,
      text: this._activeMode?.prompt ?? '',
    };
  }

  getAdventureGoalText() {
    const goal = this._levelConfig?.goal;
    if (!goal) return 'Goal';
    switch (goal.type) {
      case 'score':
        return `Score ${goal.value}+ points`;
      case 'catchCount':
        return `Catch ${goal.value} items`;
      case 'combo':
        return `Reach a ${goal.value}× combo`;
      case 'correctAnswers':
        return `Answer ${goal.value} correctly`;
      default:
        return `Goal: ${goal.value}`;
    }
  }

  getStatRows() {
    const primaryLabel = statLabelForFamily(this._modeFamily);
    const primaryValue = primaryLabel === 'Correct' ? this._correct : this._catchCount;
    return [
      { label: 'Score', value: this._score },
      { label: primaryLabel, value: primaryValue },
      { label: 'Missed', value: this._missed },
      { label: 'Wrong clicks', value: this._wrongClicks },
      { label: 'Max Combo', value: `${this._maxCombo}×` },
    ];
  }

  getResultStats() {
    return {
      score: this._score,
      catchCount: this._catchCount,
      correct: this._correct,
      missed: this._missed,
      wrongClicks: this._wrongClicks,
      maxCombo: this._maxCombo,
      mode: this._activeMode?.id ?? null,
    };
  }

  getRewardStats() {
    return {
      score: this._score,
      catchCount: this._catchCount,
      correct: this._correct,
      maxCombo: this._maxCombo,
    };
  }

  start(container) {
    this._container = container;
    this._finished = false;
    const isAdventure = !this._isArcade;
    const center = this.buildCenterContent();
    const goal = this._levelConfig?.goal ?? {};
    const goalLabel = statLabelForFamily(this._modeFamily);
    const goalValue = goal.value ?? 0;
    const leftContent = isAdventure
      ? `<div class="wmc-hud-score">${goalLabel}: <span id="game-goal-val">0</span> / ${goalValue}</div>`
      : `<div class="wmc-hud-score">SCORE: <span id="game-score-val">0</span></div>`;

    const centerContent = `
      <div class="wmc-hud-center-content">
        <div class="wmc-hud-level-line">${center.line ?? ''}</div>
        <div class="wmc-hud-instruction" id="game-center-text">${center.text ?? ''}</div>
      </div>
    `;

    container.innerHTML = `
      <div class="wmc-root">
        <div class="wmc-play-area" id="game-play-area"></div>
        <div class="wmc-hud">
          <div class="wmc-hud-cap-left" id="game-hud-left">${leftContent}</div>
          <div class="wmc-hud-cap-center" id="game-hud-center">${centerContent}</div>
          <div class="wmc-hud-cap-right" id="game-hud-right">
            <div class="wmc-hud-time">TIME: <span id="game-time-val">${formatTime(this._timeLeft)}</span></div>
          </div>
        </div>
        <button class="wmc-exit-btn" id="game-finish-btn">✕</button>
      </div>
    `;

    container.querySelector('#game-play-area').style.backgroundImage = `url(${this._assetBase}background.png)`;
    container.querySelector('#game-hud-left').style.backgroundImage = `url(${this._assetBase}hud_cap_left.png)`;
    container.querySelector('#game-hud-center').style.backgroundImage = `url(${this._assetBase}hud_center.png)`;
    container.querySelector('#game-hud-right').style.backgroundImage = `url(${this._assetBase}hud_cap_right.png)`;

    this._playArea = container.querySelector('#game-play-area');
    this._scoreEl = container.querySelector('#game-score-val');
    this._goalEl = container.querySelector('#game-goal-val');
    this._timerEl = container.querySelector('#game-time-val');
    this._centerTextEl = container.querySelector('#game-center-text');

    container.querySelector('#game-finish-btn').addEventListener('click', () => this.quitGame());

    this._handler = this.createHandler();
    this._handler.attach(this._playArea);

    if (isAdventure) {
      this._showLevelBanner();
    } else {
      this._handler.begin?.();
    }

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
      this.tick(delta);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  tick(delta) {
    this._timeLeft -= delta;
    if (this._timeLeft <= 0) {
      this._timeLeft = 0;
      this._timerEl.textContent = '0:00';
      this.endGame();
      return;
    }
    if (this._timerEl) {
      this._timerEl.textContent = formatTime(this._timeLeft);
    }
    this._handler.tick?.(delta);
  }

  setCenterText(text) {
    if (this._centerTextEl) {
      this._centerTextEl.textContent = text;
    }
  }

  addScore(points) {
    this._score += points;
    this.refreshGoalDisplay();
  }

  subtractScore(points) {
    this._score = Math.max(0, this._score - points);
    this.refreshGoalDisplay();
  }

  addCatch(count = 1) {
    this._catchCount += count;
    this.refreshGoalDisplay();
  }

  addCorrect(count = 1) {
    this._correct += count;
    this.refreshGoalDisplay();
  }

  addMiss(count = 1) {
    this._missed += count;
  }

  addWrongClick(count = 1) {
    this._wrongClicks += count;
  }

  addTime(seconds) {
    this._timeLeft += seconds;
    if (this._timerEl) {
      this._timerEl.textContent = formatTime(this._timeLeft);
    }
  }

  resetCombo() {
    this._combo = 0;
  }

  bumpCombo() {
    this._combo += 1;
    this._maxCombo = Math.max(this._maxCombo, this._combo);
  }

  refreshGoalDisplay() {
    if (this._scoreEl) {
      this._scoreEl.textContent = this._score;
    }
    if (this._goalEl) {
      const goalType = this._levelConfig?.goal?.type;
      let value = this._score;
      if (goalType === 'catchCount') {
        value = this._catchCount;
      } else if (goalType === 'correctAnswers') {
        value = this._correct;
      } else if (goalType === 'combo') {
        value = this._maxCombo;
      }
      this._goalEl.textContent = value;
    }
  }

  maybeShowGoalComplete() {
    if (this._isArcade || this._goalCompleteShown || !this._levelConfig?.goal) {
      return;
    }

    const rewardSummary = computeAdventureRewards(this._levelConfig, this.getRewardStats());
    if (!rewardSummary.cleared) {
      return;
    }

    this._goalCompleteShown = true;
    const root = this._container?.querySelector('.wmc-root');
    if (!root) {
      return;
    }

    root.querySelector('.game-goal-toast')?.remove();
    const toast = document.createElement('div');
    toast.className = 'game-goal-toast';
    toast.textContent = 'Goal Complete! Keep going for bonus coins!';
    root.appendChild(toast);
    window.setTimeout(() => {
      toast.classList.add('game-goal-toast--fade');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, 1400);
  }

  showFeedback(mouseEvent, text, type) {
    const feedback = document.createElement('div');
    feedback.className = `${this._resultPrefix === 'wmc' ? 'wmc' : 'mg'}-feedback ${this._resultPrefix === 'wmc' ? 'wmc' : 'mg'}-feedback--${type}`;
    feedback.textContent = text;

    const rect = this._playArea.getBoundingClientRect();
    feedback.style.left = `${mouseEvent.clientX - rect.left}px`;
    feedback.style.top = `${mouseEvent.clientY - rect.top - 40}px`;

    this._playArea.appendChild(feedback);
    feedback.addEventListener('animationend', () => feedback.remove(), { once: true });
  }

  _showLevelBanner() {
    if (!this._levelConfig) return;
    this._bannerActive = true;
    const banner = document.createElement('div');
    banner.className = 'wmc-level-banner';
    banner.innerHTML = `
      <div class="wmc-level-banner-inner">
        <div class="wmc-level-banner-num">Level ${this._levelConfig.levelNum}</div>
        <div class="wmc-level-banner-goal-label">Goal:</div>
        <div class="wmc-level-banner-goal">${this.getAdventureGoalText()}</div>
      </div>
    `;
    this._container.querySelector('.wmc-root').appendChild(banner);
    window.setTimeout(() => {
      banner.classList.add('wmc-level-banner--fade');
      banner.addEventListener('animationend', () => {
        banner.remove();
        this._bannerActive = false;
        this._handler.begin?.();
      }, { once: true });
    }, 1500);
  }

  quitGame() {
    if (this._finished) return;
    this._finished = true;
    this._cleanupRuntime();
    this.finish({ gameId: this.gameId, success: false, score: this._score, coinsEarned: 0 });
    import('../../ui/HubModal.js').then(({ openHubAt }) => {
      openHubAt(this.categoryId, this._isArcade ? 'arcade' : 'adventure', this._levelConfig?.levelId ?? null);
    });
  }

  endGame() {
    if (this._finished) return;
    this._finished = true;
    this._cleanupRuntime();

    const result = this._buildResult();
    this._renderResult(result);
  }

  _cleanupRuntime() {
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
    this._handler?.destroy?.();
  }

  _buildResult() {
    const cfg = this._levelConfig;
    let won = true;
    let coinsEarned = this._score;
    let rewardSummary = null;

    if (!this._isArcade && cfg) {
      rewardSummary = computeAdventureRewards(cfg, this.getRewardStats());
      won = rewardSummary.cleared;
      coinsEarned = rewardSummary.coinsEarned;
      const nextLevel = won ? gameManager.getNextAdventureLevel(this.gameId, cfg.levelId) : null;
      if (won) {
        saveManager.completeLevel(this.categoryId, cfg.levelId, nextLevel?.levelId ?? null);
      }
    } else {
      saveManager.recordArcadeScore(this.categoryId, this._activeMode.id, this._score);
    }

    return {
      won,
      coinsEarned,
      rewardSummary,
      stats: this.getResultStats(),
      nextLevel: cfg ? gameManager.getNextAdventureLevel(this.gameId, cfg.levelId) : null,
      currentLevel: cfg ?? null,
      futureTotal: saveManager.getData().coins + coinsEarned,
    };
  }

  _renderResult(result) {
    const root = this._container.querySelector('.wmc-root');
    const prefix = this._resultPrefix;
    const rowsHtml = this.getStatRows().map((row) => `
      <div class="${prefix}-result-row"><span>${row.label}</span><strong>${row.value}</strong></div>
    `).join('');
    const isAdventure = !this._isArcade && this._levelConfig;
    const goalRow = result.rewardSummary ? `
      <div class="${prefix}-result-goal-row">
        <span>${result.rewardSummary.metricLabel}</span>
        <span style="color:${result.won ? '#7ef7a0' : '#ff8a80'}">${result.rewardSummary.metricValue} / ${result.rewardSummary.goalValue}</span>
      </div>
    ` : '';
    const rewardHtml = isAdventure
      ? (result.rewardSummary ? renderRewardBreakdownHtml(result.rewardSummary) : '')
      : `${result.coinsEarned > 0 ? `<div class="${prefix}-result-reward">Coins Earned: +${result.coinsEarned} 🍉</div>` : ''}`;
    const actionLabel = this._isArcade
      ? 'Play Again'
      : (result.won ? 'Play Next' : 'Try Again');

    root.innerHTML = `
      ${prefix === 'wmc' ? `<div class="wmc-result-bg"></div>` : ''}
      <div class="${prefix}-result-screen">
        <div class="${prefix}-result-card">
          <h1 class="${prefix}-result-title">${isAdventure ? (result.won ? '🎉 Level Complete!' : '💔 Level Failed') : 'ARCADE COMPLETE!'}</h1>
          ${goalRow}
          <div class="${prefix}-result-rows">${rowsHtml}</div>
          ${rewardHtml}
          <div class="${prefix}-result-wallet">Wallet Total: ${result.futureTotal} 🍉</div>
          <div class="${prefix}-result-btns">
            <button class="${prefix}-back-btn" id="game-result-back">← Back</button>
            <button class="${prefix}-action-btn" id="game-result-action">▶ ${actionLabel}</button>
          </div>
        </div>
      </div>
    `;

    if (prefix === 'wmc') {
      const bg = root.querySelector('.wmc-result-bg');
      if (bg) {
        bg.style.backgroundImage = `url(${this._assetBase}background.png)`;
      }
    }

    soundManager.play(result.coinsEarned > 0 ? 'success' : 'failure');

    const finishPayload = {
      gameId: this.gameId,
      success: result.won,
      score: this._score,
      coinsEarned: result.coinsEarned,
      stats: result.stats,
    };

    root.querySelector('#game-result-back').addEventListener('click', () => {
      this.finish(finishPayload);
      import('../../ui/HubModal.js').then(({ openHubAt }) => {
        openHubAt(this.categoryId, this._isArcade ? 'arcade' : 'adventure', this._levelConfig?.levelId ?? null);
      });
    });

    root.querySelector('#game-result-action').addEventListener('click', () => {
      this.finish(finishPayload);
      if (this._isArcade) {
        gameManager.startGame(this.gameId, { mode: 'arcade' });
        return;
      }

      const targetLevelId = result.won
        ? (result.nextLevel?.levelId ?? this._levelConfig?.levelId ?? null)
        : (this._levelConfig?.levelId ?? null);
      import('../../ui/HubModal.js').then(({ openHubAt }) => {
        openHubAt(this.categoryId, 'adventure', targetLevelId);
      });
    });
  }

  update() {}

  destroy() {
    this._finished = true;
    this._cleanupRuntime();
    this._container = null;
    this._playArea = null;
    this._scoreEl = null;
    this._goalEl = null;
    this._timerEl = null;
    this._centerTextEl = null;
    this._handler = null;
  }
}
