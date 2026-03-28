import { soundManager } from '../../audio/SoundManager.js';
import { CollectionMode } from '../modes/CollectionMode.js';
import { AnswerMode } from '../modes/AnswerMode.js';

const WMC_BASE = import.meta.env.BASE_URL + 'games/watermelon/';

const TILE_SIZE = 72;
const ITEM_SIZE = 120;
const SPEED_MIN = 60;
const SPEED_MAX = 110;
const COL_SPD_MIN = 80;
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

function randBetween(a, b) {
  return a + Math.random() * (b - a);
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isPrime(value) {
  if (value < 2) return false;
  for (let divisor = 2; divisor * divisor <= value; divisor += 1) {
    if (value % divisor === 0) return false;
  }
  return true;
}

export class MathEquationAnswerMode extends AnswerMode {
  createRound() {
    const rules = this.mode.rules;
    const operation = rules.operation ?? 'mixed';
    const operations = operation === 'addition'
      ? ['+']
      : operation === 'subtraction'
        ? ['-']
        : ['+', '-'];
    const op = randFrom(operations);
    const [min, max] = rules.numberRange ?? [1, 10];

    let a;
    let b;
    let answer;
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

    const equationText = `${a} ${op} ${b} = ?`;
    const answers = this.#generateAnswers(answer, rules.answerCount ?? 3);
    const areaWidth = this.playArea.clientWidth || 600;
    const entities = answers.map((value, index) => {
      const el = document.createElement('div');
      el.className = 'mg-tile';
      el.textContent = value;
      el.style.left = `${randBetween(8, areaWidth - TILE_SIZE - 8)}px`;
      el.style.top = `-${TILE_SIZE}px`;
      el.style.background = TILE_COLORS[index % TILE_COLORS.length];
      this.playArea.appendChild(el);
      return {
        el,
        value,
        isCorrect: value === answer,
        y: -TILE_SIZE,
        speed: randBetween(SPEED_MIN, SPEED_MAX),
      };
    });
    return {
      promptText: equationText,
      entities,
    };
  }

  #generateAnswers(answer, answerCount) {
    const wrongs = new Set();
    for (const offset of [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6]) {
      const candidate = answer + offset;
      if (candidate >= 0 && candidate !== answer) {
        wrongs.add(candidate);
        if (wrongs.size === answerCount - 1) break;
      }
    }
    return shuffle([answer, ...wrongs]);
  }

  onCorrect(tile, event) {
    const points = this.mode.scoring.pointsPerCorrect ?? 10;
    tile.el.classList.add('mg-tile--pop');
    tile.el.addEventListener('animationend', () => tile.el.remove(), { once: true });
    this.shell.addCorrect();
    this.shell.addScore(points);
    this.shell.bumpCombo();
    this.shell.maybeShowGoalComplete();
    this.shell.showFeedback(event, `+${points} ✓`, 'correct');
    soundManager.play('correct');
    this.tiles.forEach((item) => {
      if (item !== tile) item.el.remove();
    });
    this.tiles = [];
    this.spawnRound();
  }

  onWrong(tile, event) {
    this.shell.addWrongClick();
    this.shell.resetCombo();
    tile.el.classList.add('mg-tile--wrong');
    tile.el.addEventListener('animationend', () => tile.el.classList.remove('mg-tile--wrong'), { once: true });
    this.shell.showFeedback(event, this.mode.scoring.wrongFeedback ?? 'Wrong!', 'wrong');
    soundManager.play('wrong');
  }

  onCorrectMiss() {
    this.shell.addMiss();
    this.shell.resetCombo();
  }
}

export class MathNumberCollectMode extends CollectionMode {
  getSpawnDelay() {
    return randBetween(0.8, 1.4);
  }

  createEntity() {
    const areaWidth = this.playArea.clientWidth || 600;
    const [min, max] = this.mode.rules.numberRange ?? [1, 20];
    const value = Math.floor(randBetween(min, max + 1));
    const variants = NUMBER_SPRITES[value] ?? NUMBER_SPRITES[1];
    const el = document.createElement('img');
    el.className = 'wmc-item';
    el.src = WMC_BASE + randFrom(variants);
    el.draggable = false;
    el.style.left = `${randBetween(8, areaWidth - ITEM_SIZE - 8)}px`;
    el.style.top = `-${ITEM_SIZE}px`;
    this.playArea.appendChild(el);
    soundManager.play('pop');
    return {
      el,
      value,
      isCorrect: this.#matches(value),
      y: -ITEM_SIZE,
      speed: randBetween(COL_SPD_MIN, COL_SPD_MAX),
    };
  }

  #matches(value) {
    const rules = this.mode.rules;
    switch (rules.matcher) {
      case 'odd':
        return value % 2 === 1;
      case 'even':
        return value % 2 === 0;
      case 'prime':
        return isPrime(value);
      case 'divisible_by':
        return value % rules.divisor === (rules.remainder ?? 0);
      default:
        return false;
    }
  }

  onEntityClick(item, index, event) {
    const points = this.mode.scoring.pointsPerCorrect ?? 2;
    if (item.isCorrect) {
      item.el.classList.add('wmc-item--pop');
      item.el.addEventListener('animationend', () => item.el.remove(), { once: true });
      this.items.splice(index, 1);
      this.shell.addCatch();
      this.shell.addScore(points);
      this.shell.bumpCombo();
      this.shell.maybeShowGoalComplete();
      this.shell.showFeedback(event, `+${points}`, 'correct');
      soundManager.play('correct');
      return;
    }

    this.shell.addWrongClick();
    this.shell.resetCombo();
    const penalty = this.mode.scoring.wrongPenalty ?? 0;
    if (penalty > 0) {
      this.shell.subtractScore(penalty * points);
    }
    item.el.classList.add('wmc-item--wrong');
    item.el.addEventListener('animationend', () => item.el.classList.remove('wmc-item--wrong'), { once: true });
    const text = penalty > 0
      ? `${this.mode.scoring.wrongFeedback ?? 'Wrong!'} -${penalty * points}`
      : (this.mode.scoring.wrongFeedback ?? 'Wrong!');
    this.shell.showFeedback(event, text, 'wrong');
    soundManager.play('wrong');
  }

  onEntityMiss(item) {
    if (item.isCorrect) {
      this.shell.addMiss();
      this.shell.resetCombo();
    }
  }
}
