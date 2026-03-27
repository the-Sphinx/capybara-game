export class CollectionModeHandler {
  constructor({
    selector = '.wmc-item',
    getSpawnDelay,
    createEntity,
    onEntityClick,
    onEntityMiss,
  }) {
    this.selector = selector;
    this.getSpawnDelay = getSpawnDelay;
    this.createEntity = createEntity;
    this.onEntityClick = onEntityClick;
    this.onEntityMiss = onEntityMiss;

    this.shell = null;
    this.playArea = null;
    this.items = [];
    this.spawnTimer = 0;
    this.spawnDelay = 1;
    this.onClick = null;
  }

  attach(playArea, shell) {
    this.playArea = playArea;
    this.shell = shell;
    this.onClick = (event) => {
      const element = event.target.closest(this.selector);
      if (!element) return;
      const index = this.items.findIndex((item) => item.el === element);
      if (index === -1) return;
      this.onEntityClick(this.items[index], index, event, this);
    };
    this.playArea.addEventListener('mousedown', this.onClick);
  }

  begin() {
    this.spawnTimer = 0;
    this.spawnDelay = this.getSpawnDelay();
  }

  addEntity(entity) {
    this.items.push(entity);
  }

  removeEntity(entityOrIndex) {
    const index = typeof entityOrIndex === 'number'
      ? entityOrIndex
      : this.items.findIndex((item) => item === entityOrIndex);
    if (index === -1) return null;
    const [removed] = this.items.splice(index, 1);
    removed?.el?.remove();
    return removed;
  }

  tick(delta) {
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnDelay) {
      const entity = this.createEntity(this);
      if (entity) {
        this.addEntity(entity);
      }
      this.spawnTimer = 0;
      this.spawnDelay = this.getSpawnDelay();
    }

    const areaHeight = this.playArea.clientHeight;
    for (let index = this.items.length - 1; index >= 0; index -= 1) {
      const item = this.items[index];
      item.y += item.speed * delta;
      item.el.style.top = `${item.y}px`;
      if (item.y > areaHeight) {
        this.items.splice(index, 1);
        item.el.remove();
        this.onEntityMiss?.(item, this);
      }
    }
  }

  clear() {
    this.items.forEach((item) => item.el.remove());
    this.items = [];
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
