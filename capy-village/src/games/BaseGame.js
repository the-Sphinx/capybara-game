export class BaseGame {
  constructor(config = {}) {
    this.gameId    = config.gameId ?? 'unknown';
    this.label     = config.label  ?? 'Game';
    this._onFinish = null;  // injected by GameManager before start()
  }

  // Override in subclass
  start(container) {}
  update(delta)    {}
  pause()          {}
  resume()         {}
  destroy()        {}

  // Subclass calls this when the player finishes
  finish(result) {
    if (this._onFinish) this._onFinish(result);
  }
}
