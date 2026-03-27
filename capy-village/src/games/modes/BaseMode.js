export class BaseMode {
  constructor(shell, modeDefinition) {
    this.shell = shell;
    this.mode = modeDefinition;
    this.playArea = null;
  }

  attach(playArea) {
    this.playArea = playArea;
  }

  begin() {}

  tick() {}

  destroy() {
    this.playArea = null;
    this.shell = null;
  }
}
