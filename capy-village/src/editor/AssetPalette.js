function toCategoryLabel(category) {
  if (category === 'buildings') {
    return 'Buildings';
  }

  if (category === 'props') {
    return 'Props';
  }

  return 'Other';
}

export class AssetPalette {
  constructor({ assets, onSpawn }) {
    this.assets = assets;
    this.onSpawn = onSpawn;
    this.activeCategory = this.getCategories()[0] ?? 'other';
  }

  getCategories() {
    return [...new Set(this.assets.map((asset) => asset.class))];
  }

  render(container) {
    container.innerHTML = '';

    const categories = this.getCategories();
    if (!categories.includes(this.activeCategory)) {
      this.activeCategory = categories[0] ?? 'other';
    }

    const tabs = document.createElement('div');
    tabs.className = 'layout-editor__asset-tabs';

    for (const category of categories) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'layout-editor__asset-tab';
      button.dataset.state = category === this.activeCategory ? 'active' : 'idle';
      button.textContent = toCategoryLabel(category);
      button.addEventListener('click', () => {
        this.activeCategory = category;
        this.render(container);
      });
      tabs.appendChild(button);
    }

    const list = document.createElement('div');
    list.className = 'layout-editor__asset-grid';

    for (const asset of this.assets.filter((entry) => entry.class === this.activeCategory)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'layout-editor__asset-card';
      button.innerHTML = `
        <span class="layout-editor__asset-id">${asset.id}</span>
        <span class="layout-editor__asset-class">${toCategoryLabel(asset.class)}</span>
      `;
      button.addEventListener('click', () => this.onSpawn(asset.id));
      list.appendChild(button);
    }

    container.appendChild(tabs);
    container.appendChild(list);
  }
}
