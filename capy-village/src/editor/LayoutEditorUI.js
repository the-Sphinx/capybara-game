export class LayoutEditorUI {
  constructor({ assets, onAction, onFieldChange }) {
    this.assets = assets;
    this.onAction = onAction;
    this.onFieldChange = onFieldChange;
    this.elements = {};
    this.host = null;
  }

  mount(host) {
    this.host = host;
    host.innerHTML = `
      <div class="layout-editor">
        <header class="layout-editor__topbar">
          <div class="layout-editor__title-group">
            <h1>Capy Village Layout Editor</h1>
            <p>Phase 1 manual village composition</p>
          </div>
          <div class="layout-editor__layout-meta">
            <label>
              Layout Name
              <input type="text" data-role="layout-name" value="village_hub_v1" />
            </label>
          </div>
          <div class="layout-editor__actions">
            <button type="button" data-action="new-layout">New Layout</button>
            <button type="button" data-action="load-layout">Load Layout</button>
            <button type="button" data-action="save-layout">Save Layout</button>
            <button type="button" data-action="toggle-snap" data-state="on">Snap: On</button>
            <button type="button" data-action="toggle-grid" data-state="on">Grid: On</button>
            <button type="button" data-action="reset-view">Reset View</button>
          </div>
        </header>

        <div class="layout-editor__body">
          <aside class="layout-editor__panel layout-editor__panel--palette">
            <div class="layout-editor__panel-header">
              <h2>Asset Palette</h2>
              <span>${this.assets.length} assets</span>
            </div>
            <div class="layout-editor__asset-list" data-role="asset-list"></div>
          </aside>

          <main class="layout-editor__viewport-shell">
            <div class="layout-editor__viewport" data-role="viewport"></div>
            <div class="layout-editor__status" data-role="status">Editor ready.</div>
          </main>

          <aside class="layout-editor__panel layout-editor__panel--properties">
            <div class="layout-editor__panel-header">
              <h2>Selected Object</h2>
              <span data-role="selected-label">No selection</span>
            </div>
            <div class="layout-editor__property-grid">
              ${this.renderReadonlyField('Type', 'selected-type')}
              ${this.renderReadonlyField('Asset Name', 'asset-name')}
              ${this.renderTripletInputs('Position', 'position')}
              ${this.renderTripletInputs('Rotation', 'rotation')}
              <div class="layout-editor__scale-wrap" data-role="scale-wrap">
                ${this.renderScalarInput('Scale', 'scale')}
              </div>
            </div>
            <div class="layout-editor__property-actions">
              <button type="button" data-action="duplicate-selected">Duplicate Selected</button>
              <button type="button" data-action="delete-selected">Delete Selected</button>
              <button type="button" data-action="reset-rotation">Reset Rotation</button>
              <button type="button" data-action="reset-scale">Reset Scale</button>
              <button type="button" data-action="move-to-ground">Move To Ground</button>
            </div>
            <div class="layout-editor__help">
              <p>Drag on the ground plane to move.</p>
            </div>
          </aside>
        </div>
      </div>
    `;

    this.elements.viewport = host.querySelector('[data-role="viewport"]');
    this.elements.assetList = host.querySelector('[data-role="asset-list"]');
    this.elements.status = host.querySelector('[data-role="status"]');
    this.elements.selectedLabel = host.querySelector('[data-role="selected-label"]');
    this.elements.layoutName = host.querySelector('[data-role="layout-name"]');
    this.elements.selectedType = host.querySelector('[data-role="selected-type"]');
    this.elements.assetName = host.querySelector('[data-role="asset-name"]');
    this.elements.scaleWrap = host.querySelector('[data-role="scale-wrap"]');

    this.bindActions(host);
    this.bindInputs(host);
  }

  renderReadonlyField(label, role) {
    return `
      <label class="layout-editor__field layout-editor__field--readonly">
        <span>${label}</span>
        <input type="text" data-role="${role}" readonly />
      </label>
    `;
  }

  renderTripletInputs(label, group) {
    return `
      <fieldset class="layout-editor__triplet" data-role="${group}">
        <legend>${label}</legend>
        ${['x', 'y', 'z'].map((axis) => `
          <label class="layout-editor__triplet-field">
            <span class="layout-editor__axis-label">${axis.toUpperCase()}</span>
            <input
              type="number"
              step="0.1"
              aria-label="${label} ${axis.toUpperCase()}"
              data-group="${group}"
              data-axis="${axis}"
            />
          </label>
        `).join('')}
      </fieldset>
    `;
  }

  renderScalarInput(label, group) {
    return `
      <label class="layout-editor__field">
        <span>${label}</span>
        <input type="number" step="0.1" min="0.1" data-group="${group}" data-axis="uniform" />
      </label>
    `;
  }

  bindActions(host) {
    host.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', () => {
        this.onAction(button.dataset.action, button);
      });
    });
  }

  bindInputs(host) {
    this.elements.layoutName.addEventListener('change', () => {
      this.onFieldChange('layoutName', this.elements.layoutName.value);
    });

    host.querySelectorAll('input[data-group]').forEach((input) => {
      input.addEventListener('input', () => {
        this.onFieldChange(input.dataset.group, {
          axis: input.dataset.axis,
          value: Number(input.value),
        });
      });
    });
  }

  getViewportElement() {
    return this.elements.viewport;
  }

  getAssetListElement() {
    return this.elements.assetList;
  }

  getLayoutName() {
    return this.elements.layoutName.value.trim() || 'village_hub_v1';
  }

  setLayoutName(value) {
    this.elements.layoutName.value = value;
  }

  setStatus(message, tone = 'info') {
    this.elements.status.textContent = message;
    this.elements.status.dataset.tone = tone;
  }

  updateSelection(details) {
    const hasSelection = !!details;
    this.elements.selectedLabel.textContent = hasSelection ? details.id : 'No selection';
    this.elements.selectedType.value = hasSelection ? details.typeLabel : '';
    this.elements.assetName.value = hasSelection ? details.assetName : '';

    for (const group of ['position', 'rotation']) {
      for (const axis of ['x', 'y', 'z']) {
        const input = this.host.querySelector(`input[data-group="${group}"][data-axis="${axis}"]`);
        input.disabled = !hasSelection;
        input.value = hasSelection ? details[group][axis] : '';
      }
    }

    const scaleInput = this.host.querySelector('input[data-group="scale"][data-axis="uniform"]');
    this.elements.scaleWrap.hidden = hasSelection ? !details.showScale : false;
    scaleInput.disabled = !(hasSelection && details.scaleEditable);
    scaleInput.value = hasSelection ? details.scale.uniform : '';

    this.setActionEnabled('duplicate-selected', hasSelection && details.canDuplicate);
    this.setActionEnabled('delete-selected', hasSelection && details.canDelete);
    this.setActionEnabled('reset-scale', hasSelection && details.scaleEditable);
  }

  setToggleState(action, enabled) {
    const button = this.host.querySelector(`[data-action="${action}"]`);
    if (!button) {
      return;
    }

    if (action === 'toggle-snap') {
      button.textContent = `Snap: ${enabled ? 'On' : 'Off'}`;
    }

    if (action === 'toggle-grid') {
      button.textContent = `Grid: ${enabled ? 'On' : 'Off'}`;
    }

    button.dataset.state = enabled ? 'on' : 'off';
  }

  setActionEnabled(action, enabled) {
    const button = this.host.querySelector(`[data-action="${action}"]`);
    if (!button) {
      return;
    }

    button.disabled = !enabled;
  }
}
