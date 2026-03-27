import { soundManager } from '../../audio/SoundManager.js';
import { CollectionModeHandler } from '../modes/collection.js';
import { AnswerModeHandler } from '../modes/answer.js';

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

function resolveIsCorrect(spec) {
  if (!spec) return () => true;
  if (spec.type === 'mod_equals') {
    return (value) => value % spec.mod === spec.result;
  }
  return () => false;
}

function levelOrModeValue(levelConfig, mode, key, fallback) {
  return levelConfig?.[key] ?? mode?.[key] ?? fallback;
}

function generateEquation(levelConfig, mode) {
  const operation = levelOrModeValue(levelConfig, mode, 'operation', 'mixed');
  const ops = operation === 'addition'
    ? ['+']
    : operation === 'subtraction'
      ? ['-']
      : ['+', '-'];
  const op = randFrom(ops);
  const [min, max] = levelOrModeValue(levelConfig, mode, 'numberRange', [1, 10]);
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
    if (b < min) {
      b = min;
    }
    answer = a - b;
  }

  return { answer, display: `${a} ${op} ${b} = ?` };
}

function generateAnswers(levelConfig, mode, equation) {
  const answerCount = levelOrModeValue(levelConfig, mode, 'answerCount', 3);
  const wrongs = new Set();
  for (const offset of [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6]) {
    const candidate = equation.answer + offset;
    if (candidate >= 0 && candidate !== equation.answer) {
      wrongs.add(candidate);
      if (wrongs.size === answerCount - 1) {
        break;
      }
    }
  }
  return shuffle([equation.answer, ...wrongs]);
}

export function createMathHandler(shell) {
  const levelConfig = shell.levelConfig;
  const mode = shell.mode;

  if (mode.family === 'answer') {
    return new AnswerModeHandler({
      createRound(handler) {
        const equation = generateEquation(levelConfig, mode);
        const answers = generateAnswers(levelConfig, mode, equation);
        const areaWidth = shell.playArea.clientWidth || 600;
        const entities = answers.map((answer, index) => {
          const el = document.createElement('div');
          el.className = 'mg-tile';
          el.textContent = answer;
          el.style.left = `${randBetween(8, areaWidth - TILE_SIZE - 8)}px`;
          el.style.top = `-${TILE_SIZE}px`;
          el.style.background = TILE_COLORS[index % TILE_COLORS.length];
          handler.playArea.appendChild(el);
          return {
            el,
            value: answer,
            isCorrect: answer === equation.answer,
            y: -TILE_SIZE,
            speed: randBetween(SPEED_MIN, SPEED_MAX),
          };
        });
        return {
          promptText: equation.display,
          entities,
        };
      },
      onCorrect(tile, event, handler) {
        const points = mode.pointsPerCorrect ?? 10;
        tile.el.classList.add('mg-tile--pop');
        tile.el.addEventListener('animationend', () => tile.el.remove(), { once: true });
        shell.addCorrect();
        shell.addScore(points);
        shell.bumpCombo();
        shell.maybeShowGoalComplete();
        shell.showFeedback(event, `+${points} ✓`, 'correct');
        soundManager.play('correct');
        handler.tiles.forEach((item) => {
          if (item !== tile) {
            item.el.remove();
          }
        });
        handler.tiles = [];
        handler.spawnRound();
      },
      onWrong(tile, event) {
        shell.addWrongClick();
        shell.resetCombo();
        tile.el.classList.add('mg-tile--wrong');
        tile.el.addEventListener('animationend', () => tile.el.classList.remove('mg-tile--wrong'), { once: true });
        shell.showFeedback(event, mode.wrongFeedback ?? 'Wrong!', 'wrong');
        soundManager.play('wrong');
      },
      onCorrectMiss() {
        shell.addMiss();
        shell.resetCombo();
      },
    });
  }

  const isCorrect = resolveIsCorrect(mode.isCorrect);
  return new CollectionModeHandler({
    selector: '.wmc-item',
    getSpawnDelay() {
      return randBetween(0.8, 1.4);
    },
    createEntity(handler) {
      const areaWidth = handler.playArea.clientWidth || 600;
      const [min, max] = levelOrModeValue(levelConfig, mode, 'numberRange', [1, 20]);
      const value = Math.floor(randBetween(min, max + 1));
      const variants = NUMBER_SPRITES[value] ?? NUMBER_SPRITES[1];
      const el = document.createElement('img');
      el.className = 'wmc-item';
      el.src = WMC_BASE + randFrom(variants);
      el.draggable = false;
      el.style.left = `${randBetween(8, areaWidth - ITEM_SIZE - 8)}px`;
      el.style.top = `-${ITEM_SIZE}px`;
      handler.playArea.appendChild(el);
      soundManager.play('pop');
      return {
        el,
        value,
        isCorrect: isCorrect(value),
        y: -ITEM_SIZE,
        speed: randBetween(COL_SPD_MIN, COL_SPD_MAX),
      };
    },
    onEntityClick(item, index, event, handler) {
      const points = mode.pointsPerCorrect ?? 2;
      if (item.isCorrect) {
        item.el.classList.add('wmc-item--pop');
        item.el.addEventListener('animationend', () => item.el.remove(), { once: true });
        handler.items.splice(index, 1);
        shell.addCatch();
        shell.addScore(points);
        shell.bumpCombo();
        shell.maybeShowGoalComplete();
        shell.showFeedback(event, `+${points}`, 'correct');
        soundManager.play('correct');
      } else {
        shell.addWrongClick();
        shell.resetCombo();
        const penalty = mode.wrongPenalty ?? 0;
        if (penalty > 0) {
          shell.subtractScore(penalty * points);
        }
        item.el.classList.add('wmc-item--wrong');
        item.el.addEventListener('animationend', () => item.el.classList.remove('wmc-item--wrong'), { once: true });
        const text = penalty > 0
          ? `${mode.wrongFeedback ?? 'Wrong!'} -${penalty * points}`
          : (mode.wrongFeedback ?? 'Wrong!');
        shell.showFeedback(event, text, 'wrong');
        soundManager.play('wrong');
      }
    },
    onEntityMiss(item) {
      if (item.isCorrect) {
        shell.addMiss();
        shell.resetCombo();
      }
    },
  });
}
