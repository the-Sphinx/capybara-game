export class AnswerModeHandler {
  constructor({
    selector = '.mg-tile',
    createRound,
    onCorrect,
    onWrong,
    onCorrectMiss,
  }) {
    this.selector = selector;
    this.createRound = createRound;
    this.onCorrect = onCorrect;
    this.onWrong = onWrong;
    this.onCorrectMiss = onCorrectMiss;

    this.shell = null;
    this.playArea = null;
    this.tiles = [];
    this.onClick = null;
  }

  attach(playArea, shell) {
    this.playArea = playArea;
    this.shell = shell;
    this.onClick = (event) => {
      const element = event.target.closest(this.selector);
      if (!element) return;
      const tile = this.tiles.find((item) => item.el === element);
      if (!tile) return;
      if (tile.isCorrect) {
        this.onCorrect(tile, event, this);
      } else {
        this.onWrong(tile, event, this);
      }
    };
    this.playArea.addEventListener('mousedown', this.onClick);
  }

  begin() {
    this.spawnRound();
  }

  spawnRound() {
    this.clear();
    const round = this.createRound(this);
    if (!round) return;
    this.shell.setCenterText(round.promptText ?? '');
    this.tiles = round.entities ?? [];
  }

  clear() {
    this.tiles.forEach((tile) => tile.el.remove());
    this.tiles = [];
  }

  tick(delta) {
    const areaHeight = this.playArea.clientHeight;
    let correctFell = false;

    for (let index = this.tiles.length - 1; index >= 0; index -= 1) {
      const tile = this.tiles[index];
      tile.y += tile.speed * delta;
      tile.el.style.top = `${tile.y}px`;
      if (tile.y > areaHeight) {
        this.tiles.splice(index, 1);
        tile.el.remove();
        if (tile.isCorrect) {
          correctFell = true;
        }
      }
    }

    if (correctFell) {
      this.onCorrectMiss?.(this);
      this.spawnRound();
    }
  }

  destroy() {
    if (this.playArea && this.onClick) {
      this.playArea.removeEventListener('mousedown', this.onClick);
    }
    this.clear();
    this.playArea = null;
    this.shell = null;
    this.onClick = null;
  }
}
