import { soundManager } from '../../audio/SoundManager.js';
import { StreamModeHandler } from '../modes/stream.js';
import { ChoiceRoundModeHandler } from '../modes/choice_round.js';
import {
  VOWELS, CONSONANTS, ALL_LETTERS,
  CATEGORIES,
  SENTENCES, OPPOSITES, SYNONYMS, RIDDLES,
} from './content.js';

const TILE_COLORS = ['#e74c3c', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#16a085', '#c0392b', '#1abc9c'];
const SPEED_BASE = 120;
const TILE_SIZE = 72;

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randBetween(a, b) {
  return a + Math.random() * (b - a);
}

function makeRotator(arr) {
  let pool = [];
  return () => {
    if (!pool.length) {
      pool = shuffle(arr.map((_, index) => index));
    }
    return arr[pool.pop()];
  };
}

const nextSentence = makeRotator(SENTENCES);
const nextOpposite = makeRotator(OPPOSITES);
const nextSynonym = makeRotator(SYNONYMS);
const nextRiddle = makeRotator(RIDDLES);

function buildStreamPool(mode, levelConfig) {
  switch (mode.id) {
    case 'vowels':
      return { correct: VOWELS, incorrect: CONSONANTS };
    case 'consonants':
      return { correct: CONSONANTS, incorrect: VOWELS };
    case 'categoryCatch_animals':
    case 'categoryCatch_foods':
    case 'categoryCatch': {
      const categoryKey = levelConfig?.category ?? mode.category;
      const correct = CATEGORIES[categoryKey]?.words ?? [];
      const incorrect = [];
      for (const [key, category] of Object.entries(CATEGORIES)) {
        if (key !== categoryKey) {
          incorrect.push(...category.words);
        }
      }
      return { correct, incorrect };
    }
    case 'lettersInWord': {
      const word = levelConfig?.targetWord ?? mode.targetWord ?? 'DOG';
      const correct = [...new Set(word.split(''))];
      const incorrect = ALL_LETTERS.filter((letter) => !correct.includes(letter));
      return { correct, incorrect };
    }
    default:
      return { correct: VOWELS, incorrect: CONSONANTS };
  }
}

function pickPrompt(mode) {
  switch (mode.id) {
    case 'sentenceCompletion':
      return nextSentence();
    case 'opposites':
      return nextOpposite();
    case 'synonyms':
      return nextSynonym();
    case 'riddle':
      return nextRiddle();
    default:
      return nextSentence();
  }
}

function buildPromptDisplay(mode, prompt) {
  switch (mode.id) {
    case 'sentenceCompletion':
      return prompt.stem;
    case 'opposites':
      return `Opposite of: ${prompt.prompt}`;
    case 'synonyms':
      return `Similar to: ${prompt.prompt}`;
    case 'riddle':
      return prompt.text.replace(/\n/g, ' · ');
    default:
      return mode.prompt ?? '';
  }
}

export function createLanguageHandler(shell) {
  const levelConfig = shell.levelConfig;
  const mode = shell.mode;
  const fallSpeed = (levelConfig?.fallSpeed ?? mode.fallSpeed ?? 1.0) * SPEED_BASE;

  if (mode.family === 'choice_round') {
    return new ChoiceRoundModeHandler({
      createRound(handler) {
        const prompt = pickPrompt(mode);
        const answerCount = levelConfig?.answerCount ?? mode.answerCount ?? 3;
        const answers = shuffle([prompt.correct, ...shuffle(prompt.distractors).slice(0, answerCount - 1)]);
        const areaWidth = handler.playArea.clientWidth || 600;
        const entities = answers.map((answer, index) => {
          const el = document.createElement('div');
          el.className = 'mg-tile lg-tile';
          el.textContent = answer;
          el.style.left = `${randBetween(8, Math.max(8, areaWidth - 120))}px`;
          el.style.top = `${-TILE_SIZE - index * 30}px`;
          el.style.background = TILE_COLORS[index % TILE_COLORS.length];
          handler.playArea.appendChild(el);
          return {
            el,
            value: answer,
            isCorrect: answer === prompt.correct,
            y: -TILE_SIZE - index * 30,
            speed: randBetween(fallSpeed * 0.85, fallSpeed * 1.1),
          };
        });
        return {
          promptText: buildPromptDisplay(mode, prompt),
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
        shell.showFeedback(event, 'Wrong!', 'wrong');
        soundManager.play('wrong');
      },
      onCorrectMiss() {
        shell.addMiss();
        shell.resetCombo();
      },
    });
  }

  return new StreamModeHandler({
    selector: '.lg-item',
    getSpawnDelay() {
      return randBetween(0.7, 1.2);
    },
    createEntity(handler) {
      const pool = buildStreamPool(mode, levelConfig);
      const isCorrect = Math.random() < 0.4;
      const label = isCorrect ? randFrom(pool.correct) : randFrom(pool.incorrect);
      const color = isCorrect
        ? randFrom(['#27ae60', '#16a085', '#2980b9'])
        : randFrom(['#e74c3c', '#c0392b', '#8e44ad']);
      const el = document.createElement('div');
      el.className = 'mg-tile lg-item lg-tile';
      el.textContent = label;
      el.style.background = color;
      const areaWidth = handler.playArea.clientWidth || 600;
      el.style.left = `${randBetween(8, Math.max(8, areaWidth - 100))}px`;
      el.style.top = '-72px';
      handler.playArea.appendChild(el);
      soundManager.play('pop');
      return {
        el,
        label,
        isCorrect,
        y: -72,
        speed: randBetween(fallSpeed * 0.85, fallSpeed * 1.15),
      };
    },
    onEntityClick(item, index, event, handler) {
      const points = mode.pointsPerCorrect ?? 5;
      if (item.isCorrect) {
        item.el.classList.add('mg-tile--pop');
        item.el.addEventListener('animationend', () => item.el.remove(), { once: true });
        handler.items.splice(index, 1);
        shell.addCatch();
        shell.addScore(points);
        shell.bumpCombo();
        shell.maybeShowGoalComplete();
        shell.showFeedback(event, `+${points} ✓`, 'correct');
        soundManager.play('correct');
      } else {
        shell.addWrongClick();
        shell.resetCombo();
        const penalty = mode.wrongPenalty ?? 0;
        if (penalty > 0) {
          shell.subtractScore(penalty * points);
        }
        item.el.classList.add('mg-tile--wrong');
        item.el.addEventListener('animationend', () => item.el.classList.remove('mg-tile--wrong'), { once: true });
        shell.showFeedback(event, 'Wrong!', 'wrong');
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
