import { soundManager } from '../../audio/SoundManager.js';
import { CollectionModeHandler } from '../modes/collection.js';

const BASE_URL = import.meta.env.BASE_URL + 'games/watermelon/';
const SPAWN_MIN = 0.8;
const SPAWN_MAX = 1.4;
const SPEED_MIN = 80;
const SPEED_MAX = 180;
const ITEM_SIZE = 120;

const SPRITES = {
  slices: [
    'slice_a0.png', 'slice_a1.png', 'slice_a2.png',
    'slice_b0.png', 'slice_b1.png', 'slice_b2.png', 'slice_b3.png', 'slice_b4.png',
  ],
  faces: ['face_a0.png', 'face_b0.png'],
  specials: {
    gold: ['gold_a.png', 'gold_b.png'],
    silver: ['silver_a.png', 'silver_b.png'],
    bomb: ['bomb_a.png', 'bomb_b.png'],
    hourglass: ['hourglass_a.png', 'hourglass_b.png'],
    clock: ['clock_a.png', 'clock_b.png'],
  },
};

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randBetween(a, b) {
  return a + Math.random() * (b - a);
}

export function createWatermelonHandler(shell) {
  const levelConfig = shell.levelConfig;
  const mode = shell.mode;
  const fallSpeedMult = levelConfig?.fallSpeedMult ?? 1.0;
  const spawnRateMult = levelConfig?.spawnRateMult ?? 1.0;
  const specialItems = levelConfig?.specialItems ?? {
    hourglass: true,
    clock: true,
    bomb: true,
    gold: true,
    silver: true,
  };

  return new CollectionModeHandler({
    selector: '.wmc-item',
    getSpawnDelay() {
      return randBetween(SPAWN_MIN, SPAWN_MAX) / spawnRateMult;
    },
    createEntity(handler) {
      const areaWidth = handler.playArea.clientWidth || 600;
      const x = randBetween(8, areaWidth - ITEM_SIZE - 8);
      const speed = randBetween(SPEED_MIN, SPEED_MAX) * fallSpeedMult;
      const roll = Math.random();
      let spriteSrc;
      let value = null;
      let itemKind = 'normal';
      let soundLabel = 'pop';
      let isCorrect = () => true;

      if (specialItems.hourglass && roll < 0.02) {
        itemKind = 'hourglass';
        spriteSrc = BASE_URL + randFrom(SPRITES.specials.hourglass);
        value = mode.timeBonuses.hourglass;
      } else if (specialItems.clock && roll < 0.05) {
        itemKind = 'clock';
        spriteSrc = BASE_URL + randFrom(SPRITES.specials.clock);
        value = mode.timeBonuses.clock;
      } else if (specialItems.bomb && roll < 0.2) {
        itemKind = 'bomb';
        spriteSrc = BASE_URL + randFrom(SPRITES.specials.bomb);
        value = mode.bombPenalty;
        isCorrect = () => false;
      } else if (specialItems.gold && roll < 0.23) {
        itemKind = 'gold';
        spriteSrc = BASE_URL + randFrom(SPRITES.specials.gold);
        value = mode.itemValues.gold;
        soundLabel = 'pop2';
      } else if (specialItems.silver && roll < 0.28) {
        itemKind = 'silver';
        spriteSrc = BASE_URL + randFrom(SPRITES.specials.silver);
        value = mode.itemValues.silver;
        soundLabel = 'pop2';
      } else {
        const useSlice = Math.random() < 0.65;
        const sprite = useSlice ? randFrom(SPRITES.slices) : randFrom(SPRITES.faces);
        spriteSrc = BASE_URL + sprite;
        value = useSlice ? mode.itemValues.slice : mode.itemValues.face;
        soundLabel = useSlice ? 'pop' : 'pop2';
      }

      const el = document.createElement('img');
      el.className = 'wmc-item';
      el.src = spriteSrc;
      el.draggable = false;
      el.style.left = `${x}px`;
      el.style.top = `-${ITEM_SIZE}px`;
      handler.playArea.appendChild(el);
      soundManager.play(soundLabel);
      return {
        el,
        x,
        y: 280 - ITEM_SIZE,
        speed,
        value,
        itemKind,
        isCorrect,
      };
    },
    onEntityClick(item, index, event, handler) {
      if (item.itemKind === 'hourglass' || item.itemKind === 'clock') {
        shell.addTime(item.value);
        item.el.classList.add('wmc-item--pop');
        item.el.addEventListener('animationend', () => item.el.remove(), { once: true });
        handler.items.splice(index, 1);
        shell.addCatch();
        shell.bumpCombo();
        shell.refreshGoalDisplay();
        shell.maybeShowGoalComplete();
        shell.showFeedback(event, `+${item.value}s ⏳`, 'correct');
        soundManager.play('correct');
        return;
      }

      if (item.itemKind === 'bomb') {
        shell.addWrongClick();
        shell.resetCombo();
        shell.subtractScore(item.value);
        item.el.classList.add('wmc-item--wrong');
        item.el.addEventListener('animationend', () => item.el.remove(), { once: true });
        handler.items.splice(index, 1);
        shell.showFeedback(event, '💣 Boom!', 'wrong');
        soundManager.play('failure');
        return;
      }

      item.el.classList.add('wmc-item--pop');
      item.el.addEventListener('animationend', () => item.el.remove(), { once: true });
      handler.items.splice(index, 1);
      const points = item.value ?? 1;
      shell.addScore(points);
      shell.addCatch();
      shell.bumpCombo();
      shell.showFeedback(event, shell.levelConfig?.goal?.type === 'catchCount' ? '+1' : `+${points}`, 'correct');
      soundManager.play('bite');
      shell.maybeShowGoalComplete();
    },
    onEntityMiss(item) {
      if (item.isCorrect()) {
        shell.addMiss();
        shell.resetCombo();
      }
    },
  });
}
