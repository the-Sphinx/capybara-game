import { soundManager } from '../../audio/SoundManager.js';
import { StreamMode } from '../modes/StreamMode.js';
import { ChoiceRoundMode } from '../modes/ChoiceRoundMode.js';
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

class LanguageBaseStreamMode extends StreamMode {
  getSpawnDelay() {
    return randBetween(0.7, 1.2);
  }

  getFallSpeed() {
    return (this.mode.params.fallSpeed ?? 1.0) * SPEED_BASE;
  }

  buildPool() {
    return { correct: VOWELS, incorrect: CONSONANTS };
  }

  createEntity() {
    const pool = this.buildPool();
    const isCorrect = Math.random() < 0.4;
    const label = isCorrect ? randFrom(pool.correct) : randFrom(pool.incorrect);
    const color = isCorrect
      ? randFrom(['#27ae60', '#16a085', '#2980b9'])
      : randFrom(['#e74c3c', '#c0392b', '#8e44ad']);
    const el = document.createElement('div');
    el.className = 'mg-tile lg-item lg-tile';
    el.textContent = label;
    el.style.background = color;
    const areaWidth = this.playArea.clientWidth || 600;
    el.style.left = `${randBetween(8, Math.max(8, areaWidth - 100))}px`;
    el.style.top = '-72px';
    this.playArea.appendChild(el);
    soundManager.play('pop');
    return {
      el,
      label,
      isCorrect,
      y: -72,
      speed: randBetween(this.getFallSpeed() * 0.85, this.getFallSpeed() * 1.15),
    };
  }

  onEntityClick(item, index, event) {
    const points = this.mode.params.pointsPerCorrect ?? 5;
    if (item.isCorrect) {
      item.el.classList.add('mg-tile--pop');
      item.el.addEventListener('animationend', () => item.el.remove(), { once: true });
      this.items.splice(index, 1);
      this.shell.addCatch();
      this.shell.addScore(points);
      this.shell.bumpCombo();
      this.shell.maybeShowGoalComplete();
      this.shell.showFeedback(event, `+${points} ✓`, 'correct');
      soundManager.play('correct');
      return;
    }

    this.shell.addWrongClick();
    this.shell.resetCombo();
    const penalty = this.mode.params.wrongPenalty ?? 0;
    if (penalty > 0) {
      this.shell.subtractScore(penalty * points);
    }
    item.el.classList.add('mg-tile--wrong');
    item.el.addEventListener('animationend', () => item.el.classList.remove('mg-tile--wrong'), { once: true });
    this.shell.showFeedback(event, 'Wrong!', 'wrong');
    soundManager.play('wrong');
  }

  onEntityMiss(item) {
    if (item.isCorrect) {
      this.shell.addMiss();
      this.shell.resetCombo();
    }
  }
}

export class LanguageLettersStreamMode extends LanguageBaseStreamMode {
  buildPool() {
    if (this.mode.params.letterSet === 'vowels') {
      return { correct: VOWELS, incorrect: CONSONANTS };
    }
    if (this.mode.params.letterSet === 'consonants') {
      return { correct: CONSONANTS, incorrect: VOWELS };
    }
    const word = this.mode.params.targetWord ?? 'DOG';
    const correct = [...new Set(word.split(''))];
    const incorrect = ALL_LETTERS.filter((letter) => !correct.includes(letter));
    return { correct, incorrect };
  }
}

export class LanguageCategoryStreamMode extends LanguageBaseStreamMode {
  buildPool() {
    const categoryKey = this.mode.params.category;
    const correct = CATEGORIES[categoryKey]?.words ?? [];
    const incorrect = [];
    for (const [key, category] of Object.entries(CATEGORIES)) {
      if (key !== categoryKey) {
        incorrect.push(...category.words);
      }
    }
    return { correct, incorrect };
  }
}

class LanguageBaseChoiceMode extends ChoiceRoundMode {
  getFallSpeed() {
    return (this.mode.params.fallSpeed ?? 1.0) * SPEED_BASE;
  }

  pickPrompt() {
    return nextSentence();
  }

  buildPromptDisplay(prompt) {
    return prompt.stem ?? '';
  }

  createRound() {
    const prompt = this.pickPrompt();
    const answerCount = this.mode.params.answerCount ?? 3;
    const answers = shuffle([prompt.correct, ...shuffle(prompt.distractors).slice(0, answerCount - 1)]);
    const areaWidth = this.playArea.clientWidth || 600;
    const entities = answers.map((answer, index) => {
      const el = document.createElement('div');
      el.className = 'mg-tile lg-tile';
      el.textContent = answer;
      el.style.left = `${randBetween(8, Math.max(8, areaWidth - 120))}px`;
      el.style.top = `${-TILE_SIZE - index * 30}px`;
      el.style.background = TILE_COLORS[index % TILE_COLORS.length];
      this.playArea.appendChild(el);
      return {
        el,
        value: answer,
        isCorrect: answer === prompt.correct,
        y: -TILE_SIZE - index * 30,
        speed: randBetween(this.getFallSpeed() * 0.85, this.getFallSpeed() * 1.1),
      };
    });
    return {
      promptText: this.buildPromptDisplay(prompt),
      entities,
    };
  }

  onCorrect(tile, event) {
    const points = this.mode.params.pointsPerCorrect ?? 10;
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
    this.shell.showFeedback(event, 'Wrong!', 'wrong');
    soundManager.play('wrong');
  }

  onCorrectMiss() {
    this.shell.addMiss();
    this.shell.resetCombo();
  }
}

export class LanguageSentenceChoiceMode extends LanguageBaseChoiceMode {
  pickPrompt() {
    return nextSentence();
  }
}

export class LanguageOppositesChoiceMode extends LanguageBaseChoiceMode {
  pickPrompt() {
    return nextOpposite();
  }

  buildPromptDisplay(prompt) {
    return `Opposite of: ${prompt.prompt}`;
  }
}

export class LanguageSynonymsChoiceMode extends LanguageBaseChoiceMode {
  pickPrompt() {
    return nextSynonym();
  }

  buildPromptDisplay(prompt) {
    return `Similar to: ${prompt.prompt}`;
  }
}

export class LanguageRiddleChoiceMode extends LanguageBaseChoiceMode {
  pickPrompt() {
    return nextRiddle();
  }

  buildPromptDisplay(prompt) {
    return prompt.text.replace(/\n/g, ' · ');
  }
}
