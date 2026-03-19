export class AssetPalette {
  constructor({ assets, onSpawn }) {
    this.assets = assets;
    this.onSpawn = onSpawn;
  }

  render(container) {
    container.innerHTML = '';

    for (const asset of this.assets) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'layout-editor__asset-card';
      button.innerHTML = `
        <span class="layout-editor__asset-id">${asset.id}</span>
        <span class="layout-editor__asset-class">${asset.class}</span>
      `;
      button.addEventListener('click', () => this.onSpawn(asset.id));
      container.appendChild(button);
    }
  }
}
