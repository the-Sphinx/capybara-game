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
            <button type="button" data-action="save-footprints">Save Footprints</button>
            <button type="button" data-action="toggle-snap" data-state="on">Snap: On</button>
            <button type="button" data-action="toggle-grid" data-state="on">Grid: On</button>
            <button type="button" data-action="toggle-footprints" data-state="off">Footprints: Off</button>
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
            <div class="layout-editor__properties-main" data-role="properties-main">
              <div class="layout-editor__property-grid">
                ${this.renderReadonlyField('Type', 'selected-type')}
                ${this.renderReadonlyField('Asset Name', 'asset-name')}
                ${this.renderTripletInputs('Position', 'position')}
                ${this.renderTripletInputs('Rotation', 'rotation')}
                <div class="layout-editor__scale-wrap" data-role="scale-wrap">
                  ${this.renderScaleInputs()}
                </div>
              </div>
              <div class="layout-editor__property-actions">
                <button type="button" data-action="duplicate-selected">Duplicate Selected</button>
                <button type="button" data-action="delete-selected">Delete Selected</button>
                <button type="button" data-action="reset-rotation">Reset Rotation</button>
                <button type="button" data-action="reset-scale">Reset Scale</button>
                <button type="button" data-action="move-to-ground">Move To Ground</button>
                <button type="button" data-action="open-footprint-editor">Update Footprint</button>
              </div>
              <div class="layout-editor__help">
                <p>Drag on the ground plane to move.</p>
              </div>
            </div>
            <div class="layout-editor__footprint-panel" data-role="footprint-panel" hidden>
              <div class="layout-editor__footprint-header">
                <button type="button" class="layout-editor__back-button" data-action="close-footprint-editor">← Back</button>
                <span>Footprint Settings</span>
              </div>
              <div class="layout-editor__property-grid">
                <label class="layout-editor__field">
                  <span>Shape</span>
                  <select data-group="footprint" data-field="type">
                    <option value="circle">Circle</option>
                    <option value="rect">Rect</option>
                  </select>
                </label>
                <label class="layout-editor__field" data-role="footprint-radius-row">
                  <span>Radius</span>
                  <input type="number" step="0.05" min="0.05" data-group="footprint" data-field="radius" />
                </label>
                <label class="layout-editor__field" data-role="footprint-width-row">
                  <span>Width</span>
                  <input type="number" step="0.05" min="0.05" data-group="footprint" data-field="width" />
                </label>
                <label class="layout-editor__field" data-role="footprint-depth-row">
                  <span>Depth</span>
                  <input type="number" step="0.05" min="0.05" data-group="footprint" data-field="depth" />
                </label>
                <label class="layout-editor__field">
                  <span>Offset X</span>
                  <input type="number" step="0.05" data-group="footprint" data-field="offsetX" />
                </label>
                <label class="layout-editor__field">
                  <span>Offset Z</span>
                  <input type="number" step="0.05" data-group="footprint" data-field="offsetZ" />
                </label>
                <label class="layout-editor__field">
                  <span>Rotation Offset (deg)</span>
                  <input type="number" step="1" data-group="footprint" data-field="rotationOffset" />
                </label>
              </div>
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
    this.elements.propertiesMain = host.querySelector('[data-role="properties-main"]');
    this.elements.footprintPanel = host.querySelector('[data-role="footprint-panel"]');
    this.elements.footprintRadiusRow = host.querySelector('[data-role="footprint-radius-row"]');
    this.elements.footprintWidthRow = host.querySelector('[data-role="footprint-width-row"]');
    this.elements.footprintDepthRow = host.querySelector('[data-role="footprint-depth-row"]');

    this.bindActions(host);
    this.bindInputs(host);
    this.setPropertyPanelMode('main');
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
    const step = group === 'rotation' ? '1' : '0.1';
    return `
      <fieldset class="layout-editor__triplet" data-role="${group}">
        <legend>${label}</legend>
        ${['x', 'y', 'z'].map((axis) => `
          <label class="layout-editor__triplet-field">
            <span class="layout-editor__axis-label">${axis.toUpperCase()}</span>
            <input
              type="number"
              step="${step}"
              aria-label="${label} ${axis.toUpperCase()}"
              data-group="${group}"
              data-axis="${axis}"
            />
          </label>
        `).join('')}
      </fieldset>
    `;
  }

  renderScaleInputs() {
    return `
              <fieldset class="layout-editor__triplet" data-role="scale">
        <legend class="layout-editor__scale-legend">
          <span class="layout-editor__scale-label">Scale</span>
          <button
            type="button"
            class="layout-editor__lock-button"
            data-action="toggle-scale-lock"
            data-state="on"
            aria-label="Toggle uniform scale lock"
            title="Toggle uniform scale lock"
          >🔒</button>
        </legend>
        ${['x', 'y', 'z'].map((axis) => `
          <label class="layout-editor__triplet-field">
            <span class="layout-editor__axis-label">${axis.toUpperCase()}</span>
            <input
              type="number"
              step="0.1"
              min="0.1"
              aria-label="Scale ${axis.toUpperCase()}"
              data-group="scale"
              data-axis="${axis}"
            />
          </label>
        `).join('')}
      </fieldset>
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

    host.querySelectorAll('[data-group]').forEach((input) => {
      const eventName = input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(eventName, () => {
        if (input.dataset.group === 'footprint') {
          this.onFieldChange('footprint', {
            field: input.dataset.field,
            value: input.dataset.field === 'type' ? input.value : Number(input.value),
          });
          return;
        }

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

    this.elements.scaleWrap.hidden = hasSelection ? !details.showScale : false;
    for (const axis of ['x', 'y', 'z']) {
      const scaleInput = this.host.querySelector(`input[data-group="scale"][data-axis="${axis}"]`);
      scaleInput.disabled = !(hasSelection && details.scaleEditable);
      scaleInput.value = hasSelection ? details.scale[axis] : '';
    }

    const lockButton = this.host.querySelector('[data-action="toggle-scale-lock"]');
    lockButton.disabled = !(hasSelection && details.scaleEditable);
    lockButton.textContent = details?.scaleLocked ? '🔒' : '🔓';
    lockButton.dataset.state = details?.scaleLocked ? 'on' : 'off';

    this.setActionEnabled('duplicate-selected', hasSelection && details.canDuplicate);
    this.setActionEnabled('delete-selected', hasSelection && details.canDelete);
    this.setActionEnabled('reset-scale', hasSelection && details.scaleEditable);
    this.setActionEnabled('open-footprint-editor', hasSelection && details.canEditFootprint);
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

    if (action === 'toggle-footprints') {
      button.textContent = `Footprints: ${enabled ? 'On' : 'Off'}`;
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

  setPropertyPanelMode(mode) {
    const footprintMode = mode === 'footprint';
    this.elements.propertiesMain.hidden = footprintMode;
    this.elements.footprintPanel.hidden = !footprintMode;
  }

  updateFootprintEditor(details) {
    const typeInput = this.host.querySelector('[data-group="footprint"][data-field="type"]');
    const radiusInput = this.host.querySelector('[data-group="footprint"][data-field="radius"]');
    const widthInput = this.host.querySelector('[data-group="footprint"][data-field="width"]');
    const depthInput = this.host.querySelector('[data-group="footprint"][data-field="depth"]');
    const offsetXInput = this.host.querySelector('[data-group="footprint"][data-field="offsetX"]');
    const offsetZInput = this.host.querySelector('[data-group="footprint"][data-field="offsetZ"]');
    const rotationOffsetInput = this.host.querySelector('[data-group="footprint"][data-field="rotationOffset"]');

    const editable = !!details?.footprintEditable;
    const footprint = details?.footprint ?? null;

    for (const element of [typeInput, radiusInput, widthInput, depthInput, offsetXInput, offsetZInput, rotationOffsetInput]) {
      element.disabled = !editable;
    }

    typeInput.value = footprint?.type ?? 'circle';
    radiusInput.value = footprint?.radius ?? '';
    widthInput.value = footprint?.width ?? '';
    depthInput.value = footprint?.depth ?? '';
    offsetXInput.value = footprint?.offsetX ?? 0;
    offsetZInput.value = footprint?.offsetZ ?? 0;
    rotationOffsetInput.value = footprint?.rotationOffset ?? 0;

    const isCircle = typeInput.value === 'circle';
    this.elements.footprintRadiusRow.hidden = !isCircle;
    this.elements.footprintWidthRow.hidden = isCircle;
    this.elements.footprintDepthRow.hidden = isCircle;
  }
}
