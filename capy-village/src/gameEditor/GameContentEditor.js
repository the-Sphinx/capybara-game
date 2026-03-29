import { getAllFields, getFieldById, isFieldVisible } from '../authoring/descriptors/core.js';
import { GameContentService } from './GameContentService.js';

function deepClone(value) {
  return structuredClone(value);
}

function toJson(value) {
  return JSON.stringify(value, null, 2);
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'item';
}

function pathSegments(path) {
  return String(path)
    .split('.')
    .filter(Boolean)
    .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
}

function getAtPath(source, path) {
  return pathSegments(path).reduce((cursor, segment) => cursor?.[segment], source);
}

function setAtPath(target, path, value) {
  const segments = pathSegments(path);
  let cursor = target;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const nextSegment = segments[index + 1];
    if (cursor[segment] == null) {
      cursor[segment] = typeof nextSegment === 'number' ? [] : {};
    }
    cursor = cursor[segment];
  }
  cursor[segments[segments.length - 1]] = value;
}

function deleteAtPath(target, path) {
  const segments = pathSegments(path);
  let cursor = target;
  for (let index = 0; index < segments.length - 1; index += 1) {
    cursor = cursor?.[segments[index]];
    if (cursor == null) return;
  }
  const finalSegment = segments[segments.length - 1];
  if (Array.isArray(cursor) && typeof finalSegment === 'number') {
    cursor.splice(finalSegment, 1);
  } else if (cursor && typeof cursor === 'object') {
    delete cursor[finalSegment];
  }
}

function formatGoal(goal) {
  if (!goal) return 'No goal';
  switch (goal.type) {
    case 'catchCount':
      return `Catch ${goal.value}`;
    case 'correctAnswers':
      return `Answer ${goal.value} correctly`;
    case 'score':
      return `Reach ${goal.value} score`;
    case 'combo':
      return `Reach ${goal.value}x combo`;
    default:
      return `${goal.type}: ${goal.value}`;
  }
}

function formatBonusTiers(tiers) {
  if (!tiers?.length) return 'No bonus tiers';
  return tiers.map((tier) => `${tier.threshold} → +${tier.reward}`).join(' · ');
}

function coerceValue(type, rawValue) {
  if (type === 'number') {
    return rawValue === '' ? null : Number(rawValue);
  }
  if (type === 'boolean') {
    return Boolean(rawValue);
  }
  return rawValue;
}

function createDefaultMatcher() {
  return { type: 'even' };
}

function createDefaultPhase() {
  return {
    switchAfterCaught: 5,
    objective: { rule: { type: 'parity', parity: 'even' } },
    presentation: { prompt: 'Now catch even numbers!' },
  };
}

function createSections(activityDescriptor) {
  const sections = {};
  for (const section of activityDescriptor.sections ?? []) {
    sections[section.id] = {};
    for (const field of section.fields ?? []) {
      const localPath = field.id.replace(`${section.id}.`, '');
      if (field.defaultValue !== undefined && localPath !== field.id) {
        setAtPath(sections[section.id], localPath, deepClone(field.defaultValue));
      }
    }
  }
  return sections;
}

function createDefaultLevel(world, descriptor, slot) {
  const sections = createSections(descriptor);
  const nextLevelNum = Math.max(0, ...(world.levels ?? []).map((entry) => entry.levelNum ?? 0)) + 1;
  return {
    id: `${world.id}_${nextLevelNum}`,
    label: `${descriptor.label} ${nextLevelNum}`,
    levelNum: nextLevelNum,
    slot,
    activityType: descriptor.id,
    schemaVersion: 1,
    ...sections,
  };
}

function firstAvailableSlot(game, world) {
  const used = new Set((world.levels ?? []).map((level) => level.slot));
  return (game.levelSelect?.slots ?? []).find((slot) => !used.has(slot.slot))?.slot
    ?? (game.levelSelect?.slots?.[0]?.slot ?? 1);
}

function buildWorldErrorPrefix(world) {
  return `worlds.${world.id}`;
}

export class GameContentEditor {
  constructor(host, { gameId }) {
    this.host = host;
    this.gameId = gameId;
    this.service = new GameContentService(gameId);
    this.state = {
      game: null,
      worlds: [],
      editorDefinition: null,
      validation: { valid: false, errors: [], normalized: null },
      selectedWorldId: null,
      selectedLevelId: null,
      selectedStarterId: null,
      selectionMode: 'world',
      dirtyGame: false,
      dirtyWorldIds: new Set(),
      saving: false,
      showAdvanced: false,
      status: { tone: 'info', text: 'Loading…' },
    };
    this.boundHandle = (event) => this.handleEvent(event);
  }

  async init() {
    this.host.addEventListener('click', this.boundHandle);
    this.host.addEventListener('change', this.boundHandle);
    this.host.addEventListener('input', this.boundHandle);
    await this.reload();
  }

  async reload() {
    const payload = await this.service.load();
    this.state = {
      ...this.state,
      game: payload.game,
      worlds: payload.worlds,
      validation: payload.validation,
      editorDefinition: payload.editorDefinition,
      selectedWorldId: this.state.selectedWorldId ?? payload.worlds[0]?.id ?? null,
      selectedLevelId: null,
      selectedStarterId: payload.editorDefinition.starters?.[0]?.id ?? null,
      selectionMode: 'world',
      dirtyGame: false,
      dirtyWorldIds: new Set(),
      saving: false,
      status: {
        tone: payload.validation.valid ? 'success' : 'warning',
        text: payload.validation.valid ? 'Loaded authoring data.' : 'Loaded with validation issues.',
      },
    };
    this.render();
  }

  get selectedWorld() {
    return this.state.worlds.find((world) => world.id === this.state.selectedWorldId) ?? null;
  }

  get selectedLevel() {
    return this.selectedWorld?.levels?.find((level) => level.id === this.state.selectedLevelId) ?? null;
  }

  get selectedDescriptor() {
    const activityType = this.selectedLevel?.activityType;
    return this.state.editorDefinition?.activityDescriptors?.find((descriptor) => descriptor.id === activityType) ?? null;
  }

  refreshValidation(statusText = null, tone = null) {
    this.state.validation = this.service.validate(this.state.game, this.state.worlds);
    if (statusText) {
      this.state.status = {
        tone: tone ?? (this.state.validation.valid ? 'success' : 'warning'),
        text: statusText,
      };
    } else if (!this.state.validation.valid) {
      this.state.status = { tone: 'warning', text: 'Fix validation issues before saving.' };
    }
  }

  markGameDirty() {
    this.state.dirtyGame = true;
  }

  markWorldDirty(worldId) {
    this.state.dirtyWorldIds.add(worldId);
  }

  withGameMutation(mutator) {
    mutator(this.state.game);
    this.markGameDirty();
    this.refreshValidation();
    this.render();
  }

  withWorldMutation(worldId, mutator) {
    const world = this.state.worlds.find((entry) => entry.id === worldId);
    if (!world) return;
    mutator(world);
    this.markWorldDirty(worldId);
    this.refreshValidation();
    this.render();
  }

  handleEvent(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    if (!action) return;

    if (event.type === 'click') {
      this.handleClick(action, target);
    } else {
      this.handleInput(action, target);
    }
  }

  handleClick(action, target) {
    switch (action) {
      case 'reload-editor':
        void this.reload();
        break;
      case 'toggle-advanced':
        this.state.showAdvanced = !this.state.showAdvanced;
        this.render();
        break;
      case 'select-world':
        this.state.selectedWorldId = target.dataset.worldId;
        this.state.selectedLevelId = null;
        this.state.selectionMode = 'world';
        this.render();
        break;
      case 'select-level':
        this.state.selectedWorldId = target.dataset.worldId;
        this.state.selectedLevelId = target.dataset.levelId;
        this.state.selectionMode = 'level';
        this.render();
        break;
      case 'select-starter':
        this.state.selectedStarterId = target.dataset.starterId;
        this.render();
        break;
      case 'create-level':
        this.createLevel(Number(target.dataset.slot || 0) || null);
        break;
      case 'delete-level':
        this.deleteLevel();
        break;
      case 'duplicate-level':
        this.duplicateLevel();
        break;
      case 'apply-starter':
        this.applyStarter();
        break;
      case 'add-bonus-tier':
        this.addBonusTier();
        break;
      case 'remove-bonus-tier':
        this.removeBonusTier(Number(target.dataset.index));
        break;
      case 'phase-add':
        this.addPhase();
        break;
      case 'phase-remove':
        this.removePhase(Number(target.dataset.index));
        break;
      case 'set-matcher-type':
        this.setCompoundMatcherType(target.dataset.path, target.dataset.matcherType);
        break;
      case 'add-compound-rule':
        this.addCompoundMatcherChild(target.dataset.path);
        break;
      case 'remove-compound-rule':
        this.removePath('level', target.dataset.path);
        break;
      case 'save-world':
        void this.saveSelectedWorld();
        break;
      case 'save-game':
        void this.saveGame();
        break;
      case 'save-all':
        void this.saveAll();
        break;
      default:
        break;
    }
  }

  handleInput(action, target) {
    if (action === 'set-matcher-type') {
      this.setCompoundMatcherType(target.dataset.path, target.value);
      return;
    }
    if (action !== 'set-path') return;

    const entity = target.dataset.entity;
    const path = target.dataset.path;
    const value = target instanceof HTMLInputElement && target.type === 'checkbox'
      ? target.checked
      : coerceValue(target.dataset.valueType ?? 'text', target.value);
    this.setEntityPath(entity, path, value);
  }

  setEntityPath(entity, path, value) {
    if (entity === 'game') {
      this.withGameMutation((game) => setAtPath(game, path, value));
      return;
    }
    if (entity === 'world' && this.selectedWorld) {
      this.withWorldMutation(this.selectedWorld.id, (world) => setAtPath(world, path, value));
      return;
    }
    if (entity === 'level' && this.selectedWorld && this.selectedLevel) {
      this.withWorldMutation(this.selectedWorld.id, (world) => {
        const level = world.levels.find((entry) => entry.id === this.selectedLevel.id);
        if (path === 'activityType') {
          const descriptor = this.state.editorDefinition.activityDescriptors.find((entry) => entry.id === value);
          const sections = createSections(descriptor);
          level.activityType = value;
          level.objective = sections.objective ?? {};
          level.content = sections.content ?? {};
          level.difficulty = sections.difficulty ?? {};
          level.scoring = {
            clearReward: level.scoring?.clearReward ?? 10,
            bonusTiers: level.scoring?.bonusTiers ?? [],
            ...(sections.scoring ?? {}),
          };
          level.presentation = {
            title: level.label,
            ...(sections.presentation ?? {}),
          };
          return;
        }
        setAtPath(level, path, value);
      });
    }
  }

  removePath(entity, path) {
    if (entity === 'level' && this.selectedWorld && this.selectedLevel) {
      this.withWorldMutation(this.selectedWorld.id, (world) => {
        const level = world.levels.find((entry) => entry.id === this.selectedLevel.id);
        deleteAtPath(level, path);
      });
    }
  }

  setCompoundMatcherType(path, matcherType) {
    const matcher = (() => {
      switch (matcherType) {
        case 'not':
          return { type: 'not', rule: createDefaultMatcher() };
        case 'any_of':
        case 'all_of':
          return { type: matcherType, rules: [createDefaultMatcher(), createDefaultMatcher()] };
        case 'divisible_by':
          return { type: 'divisible_by', divisor: 2, remainder: 0 };
        case 'less_than_or_equal':
        case 'greater_than_or_equal':
          return { type: matcherType, value: 10 };
        default:
          return { type: matcherType };
      }
    })();
    this.setEntityPath('level', path, matcher);
  }

  addCompoundMatcherChild(path) {
    if (!this.selectedWorld || !this.selectedLevel) return;
    this.withWorldMutation(this.selectedWorld.id, (world) => {
      const level = world.levels.find((entry) => entry.id === this.selectedLevel.id);
      const current = getAtPath(level, path) ?? [];
      current.push(createDefaultMatcher());
      setAtPath(level, path, current);
    });
  }

  addPhase() {
    if (!this.selectedWorld || !this.selectedLevel) return;
    this.withWorldMutation(this.selectedWorld.id, (world) => {
      const level = world.levels.find((entry) => entry.id === this.selectedLevel.id);
      const current = level.difficulty?.phases ?? [];
      current.push(createDefaultPhase());
      setAtPath(level, 'difficulty.phases', current);
    });
  }

  removePhase(index) {
    this.removePath('level', `difficulty.phases.${index}`);
  }

  addBonusTier() {
    if (!this.selectedWorld || !this.selectedLevel) return;
    this.withWorldMutation(this.selectedWorld.id, (world) => {
      const level = world.levels.find((entry) => entry.id === this.selectedLevel.id);
      const tiers = level.scoring?.bonusTiers ?? [];
      tiers.push({ threshold: 0, reward: 0 });
      setAtPath(level, 'scoring.bonusTiers', tiers);
    });
  }

  removeBonusTier(index) {
    this.removePath('level', `scoring.bonusTiers.${index}`);
  }

  createLevel(preferredSlot = null) {
    const world = this.selectedWorld;
    const starter = this.state.editorDefinition.starters?.find((entry) => entry.id === this.state.selectedStarterId) ?? null;
    const descriptor = this.state.editorDefinition.activityDescriptors?.find((entry) => entry.id === (starter?.activityType ?? this.state.editorDefinition.activityDescriptors?.[0]?.id));
    if (!world || !descriptor) return;
    const slot = preferredSlot ?? firstAvailableSlot(this.state.game, world);
    const level = createDefaultLevel(world, descriptor, slot);
    if (starter) {
      level.objective = deepClone(starter.objective ?? level.objective);
      level.content = deepClone(starter.content ?? level.content);
      level.scoring = {
        ...level.scoring,
        ...deepClone(starter.scoring ?? {}),
      };
      level.presentation = {
        ...level.presentation,
        ...deepClone(starter.presentation ?? {}),
      };
      if (starter.label) {
        level.label = starter.label;
      }
    }
    this.withWorldMutation(world.id, (authoredWorld) => {
      authoredWorld.levels.push(level);
      this.state.selectedLevelId = level.id;
      this.state.selectionMode = 'level';
    });
  }

  duplicateLevel() {
    if (!this.selectedWorld || !this.selectedLevel) return;
    const slot = firstAvailableSlot(this.state.game, this.selectedWorld);
    const nextLevelNum = Math.max(0, ...(this.selectedWorld.levels ?? []).map((entry) => entry.levelNum ?? 0)) + 1;
    const duplicate = deepClone(this.selectedLevel);
    duplicate.id = `${this.selectedWorld.id}_${nextLevelNum}`;
    duplicate.levelNum = nextLevelNum;
    duplicate.slot = slot;
    duplicate.label = `${duplicate.label} Copy`;
    this.withWorldMutation(this.selectedWorld.id, (world) => {
      world.levels.push(duplicate);
      this.state.selectedLevelId = duplicate.id;
      this.state.selectionMode = 'level';
    });
  }

  deleteLevel() {
    if (!this.selectedWorld || !this.selectedLevel) return;
    this.withWorldMutation(this.selectedWorld.id, (world) => {
      world.levels = world.levels.filter((entry) => entry.id !== this.selectedLevel.id);
      this.state.selectedLevelId = world.levels[0]?.id ?? null;
      this.state.selectionMode = this.state.selectedLevelId ? 'level' : 'world';
    });
  }

  applyStarter() {
    const starter = this.state.editorDefinition.starters?.find((entry) => entry.id === this.state.selectedStarterId);
    if (!starter || !this.selectedWorld || !this.selectedLevel) return;
    this.withWorldMutation(this.selectedWorld.id, (world) => {
      const level = world.levels.find((entry) => entry.id === this.selectedLevel.id);
      level.activityType = starter.activityType;
      level.objective = deepClone(starter.objective ?? {});
      level.content = deepClone(starter.content ?? {});
      level.scoring = {
        ...level.scoring,
        ...deepClone(starter.scoring ?? {}),
      };
      level.presentation = {
        ...level.presentation,
        ...deepClone(starter.presentation ?? {}),
      };
      if (starter.label) {
        level.label = starter.label;
      }
    });
  }

  async saveGame() {
    this.refreshValidation();
    if (!this.state.validation.valid) {
      this.render();
      return;
    }
    this.state.saving = true;
    this.render();
    try {
      await this.service.saveGame(this.state.game);
      this.state.dirtyGame = false;
      this.state.status = { tone: 'success', text: 'Shared game config saved.' };
    } catch (error) {
      this.state.status = { tone: 'error', text: error instanceof Error ? error.message : String(error) };
    } finally {
      this.state.saving = false;
      this.render();
    }
  }

  async saveSelectedWorld() {
    if (!this.selectedWorld) return;
    this.refreshValidation();
    if (!this.state.validation.valid) {
      this.render();
      return;
    }
    this.state.saving = true;
    this.render();
    try {
      await this.service.saveWorld(this.selectedWorld);
      this.state.dirtyWorldIds.delete(this.selectedWorld.id);
      this.state.status = { tone: 'success', text: `Saved world "${this.selectedWorld.title}".` };
    } catch (error) {
      this.state.status = { tone: 'error', text: error instanceof Error ? error.message : String(error) };
    } finally {
      this.state.saving = false;
      this.render();
    }
  }

  async saveAll() {
    this.refreshValidation();
    if (!this.state.validation.valid) {
      this.render();
      return;
    }
    this.state.saving = true;
    this.render();
    try {
      if (this.state.dirtyGame) {
        await this.service.saveGame(this.state.game);
      }
      for (const worldId of [...this.state.dirtyWorldIds]) {
        const world = this.state.worlds.find((entry) => entry.id === worldId);
        if (world) {
          await this.service.saveWorld(world);
        }
      }
      this.state.dirtyGame = false;
      this.state.dirtyWorldIds.clear();
      this.state.status = { tone: 'success', text: 'All changes saved.' };
    } catch (error) {
      this.state.status = { tone: 'error', text: error instanceof Error ? error.message : String(error) };
    } finally {
      this.state.saving = false;
      this.render();
    }
  }

  renderTopBar() {
    return `
      <header class="game-editor__topbar">
        <div class="game-editor__title-group">
          <h1>Math Garden Authoring Editor</h1>
          <p>Descriptor-driven world and level authoring</p>
        </div>
        <div class="game-editor__actions">
          <button type="button" data-action="toggle-advanced">${this.state.showAdvanced ? 'Basic Fields' : 'Advanced Fields'}</button>
          <button type="button" data-action="reload-editor">Reload</button>
          <button type="button" data-action="save-world" ${!this.selectedWorld || !this.state.dirtyWorldIds.has(this.selectedWorld.id) ? 'disabled' : ''}>Save World</button>
          <button type="button" data-action="save-game" ${!this.state.dirtyGame ? 'disabled' : ''}>Save Game</button>
          <button type="button" data-action="save-all" ${(!this.state.dirtyGame && this.state.dirtyWorldIds.size === 0) ? 'disabled' : ''}>Save All</button>
        </div>
        <div class="game-editor__status game-editor__status--${this.state.status.tone}">
          ${this.state.saving ? 'Saving… ' : ''}${this.state.status.text}
        </div>
      </header>
    `;
  }

  renderSidebar() {
    const world = this.selectedWorld;
    return `
      <aside class="game-editor__sidebar">
        <section class="game-editor__sidebar-section">
          <div class="game-editor__section-header"><h2>Worlds</h2></div>
          ${this.state.worlds.map((entry) => `
            <button type="button" class="game-editor__list-item ${entry.id === this.state.selectedWorldId && this.state.selectionMode === 'world' ? 'is-selected' : ''}" data-action="select-world" data-world-id="${entry.id}">
              <span>${entry.title}</span>
              ${this.state.dirtyWorldIds.has(entry.id) ? '<em>Dirty</em>' : ''}
            </button>
          `).join('')}
        </section>
        <section class="game-editor__sidebar-section">
          <div class="game-editor__section-header">
            <h2>Levels</h2>
            <button type="button" data-action="create-level">New</button>
          </div>
          ${(world?.levels ?? []).slice().sort((a, b) => a.levelNum - b.levelNum).map((level) => `
            <button type="button" class="game-editor__list-item ${level.id === this.state.selectedLevelId && this.state.selectionMode === 'level' ? 'is-selected' : ''}" data-action="select-level" data-world-id="${world.id}" data-level-id="${level.id}">
              <span>${level.levelNum}. ${level.label}</span>
              <small>${level.activityType}</small>
            </button>
          `).join('')}
        </section>
        <section class="game-editor__sidebar-section">
          <div class="game-editor__section-header"><h2>Starters</h2></div>
          ${(this.state.editorDefinition?.starters ?? []).map((starter) => `
            <button type="button" class="game-editor__list-item ${starter.id === this.state.selectedStarterId ? 'is-selected' : ''}" data-action="select-starter" data-starter-id="${starter.id}">
              <span>${starter.label}</span>
              <small>${starter.activityType}</small>
            </button>
          `).join('')}
        </section>
      </aside>
    `;
  }

  renderCenterPanel() {
    const world = this.selectedWorld;
    const resolvedLevel = this.selectedLevel ? this.service.getResolvedLevel(this.state.validation, this.selectedLevel.id) : null;
    const preview = resolvedLevel ? this.service.getPreview(this.state.editorDefinition, resolvedLevel) : null;
    const slotMap = new Map((world?.levels ?? []).map((level) => [level.slot, level]));
    return `
      <section class="game-editor__center-column">
        <div class="game-editor__map-card">
          <div class="game-editor__map-header">
            <h2>${world?.title ?? 'Level Map'}</h2>
            <span>${world?.levels?.length ?? 0} levels</span>
          </div>
          <div class="game-editor__slot-map" style="background-image:url(${this.state.game.levelSelect?.backgroundPath ?? ''})">
            ${(this.state.game.levelSelect?.slots ?? []).map((slot) => {
              const level = slotMap.get(slot.slot);
              return `
                <button
                  type="button"
                  class="game-editor__slot ${level ? 'game-editor__slot--filled' : 'game-editor__slot--empty'} ${level?.id === this.state.selectedLevelId ? 'game-editor__slot--selected' : ''}"
                  data-action="${level ? 'select-level' : 'create-level'}"
                  data-world-id="${world?.id ?? ''}"
                  data-level-id="${level?.id ?? ''}"
                  data-slot="${slot.slot}"
                  style="left:${slot.x * 100}%;top:${slot.y * 100}%"
                >
                  ${level ? level.levelNum : '+'}
                </button>
              `;
            }).join('')}
          </div>
        </div>
        <div class="game-editor__preview-stack">
          <div class="game-editor__preview-card">
            <h3>Level Summary</h3>
            ${resolvedLevel ? `
              <p><strong>${resolvedLevel.label}</strong></p>
              <p>${formatGoal(resolvedLevel.goal)}</p>
              <p>Reward: ${resolvedLevel.clearReward ?? 0} coins</p>
              <p>Bonuses: ${formatBonusTiers(resolvedLevel.bonusTiers)}</p>
              <p>Activity: ${resolvedLevel.activityType}</p>
            ` : '<p>Select a level to preview it.</p>'}
          </div>
          ${this.renderPreview(preview)}
        </div>
      </section>
    `;
  }

  renderPreview(preview) {
    if (!preview) {
      return '<div class="game-editor__preview-card"><h3>Preview</h3><p>Select a level to see example gameplay.</p></div>';
    }
    if (preview.type === 'collection') {
      return `
        <div class="game-editor__preview-card">
          <h3>Sample Stream</h3>
          ${preview.phases.map((phase) => `
            <div class="game-editor__preview-phase">
              <strong>${phase.label}</strong>
              ${phase.switchAfterCaught != null ? `<span>Switch after ${phase.switchAfterCaught} catches</span>` : ''}
              <div class="game-editor__sample-grid">
                ${phase.samples.map((sample) => `<span class="game-editor__sample-pill ${sample.match ? 'game-editor__sample-pill--good' : 'game-editor__sample-pill--bad'}">${sample.value}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
    return `
      <div class="game-editor__preview-card">
        <h3>Example Questions</h3>
        ${preview.rounds.map((round) => `
          <div class="game-editor__preview-round">
            <strong>${round.equation}</strong>
            <div>Correct: ${round.answer}</div>
            <div>Choices: ${round.options.join(', ')}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderWorldPanel() {
    const world = this.selectedWorld;
    if (!world) return '<div class="game-editor__empty">Select a world.</div>';
    return `
      <section class="game-editor__detail-section">
        <div class="game-editor__detail-header"><h2>World Settings</h2></div>
        ${this.renderErrors(buildWorldErrorPrefix(world))}
        ${this.renderTextField('world', 'title', 'Title', world.title)}
        ${this.renderTextField('world', 'subtitle', 'Subtitle', world.subtitle ?? '')}
        ${this.renderTextField('world', 'theme', 'Theme', world.theme ?? '')}
        ${this.renderTextField('world', 'learningObjective', 'Learning Objective', world.learningObjective ?? '')}
        ${this.renderTextField('world', 'unlockRequirementText', 'Unlock Requirement Text', world.unlockRequirementText ?? '')}
        ${this.renderCheckboxField('world', 'startsUnlocked', 'Starts Unlocked', world.startsUnlocked === true)}
        ${this.renderSelectField('world', 'unlockAfterWorldId', 'Unlock After World', world.unlockAfterWorldId ?? '', [
          { value: '', label: 'None' },
          ...this.state.worlds.filter((entry) => entry.id !== world.id).map((entry) => ({ value: entry.id, label: entry.title })),
        ])}
        ${this.renderBoxEditor('signBox', 'Sign Box', world.signBox)}
        ${this.renderBoxEditor('clickBox', 'Click Box', world.clickBox)}
      </section>
    `;
  }

  renderLevelPanel() {
    const level = this.selectedLevel;
    const descriptor = this.selectedDescriptor;
    if (!level || !descriptor) return '<div class="game-editor__empty">Select a level.</div>';
    return `
      <section class="game-editor__detail-section">
        <div class="game-editor__detail-header">
          <h2>${level.label}</h2>
          <div class="game-editor__inline-actions">
            <button type="button" data-action="duplicate-level">Duplicate</button>
            <button type="button" data-action="delete-level" class="danger">Delete</button>
          </div>
        </div>
        ${this.renderTextField('level', 'id', 'Level ID', level.id)}
        ${this.renderTextField('level', 'label', 'Label', level.label)}
        ${this.renderNumberField('level', 'levelNum', 'Level Number', level.levelNum)}
        ${this.renderSelectField('level', 'slot', 'Slot', level.slot, (this.state.game.levelSelect?.slots ?? []).map((slot) => ({ value: slot.slot, label: `Slot ${slot.slot}` })), 'number')}
        ${this.renderSelectField('level', 'activityType', 'Activity Type', level.activityType, this.state.editorDefinition.activityDescriptors.map((entry) => ({ value: entry.id, label: entry.label })))}
        <div class="game-editor__panel-note">
          <strong>Starter Template:</strong> ${this.state.selectedStarterId ?? 'None selected'}
          <button type="button" data-action="apply-starter" ${!this.state.selectedStarterId ? 'disabled' : ''}>Apply Selected Starter</button>
        </div>
        ${descriptor.sections.map((section) => this.renderSection(level, descriptor, section)).join('')}
        <div class="game-editor__resolved-preview">
          <h3>Resolved Runtime Config</h3>
          <pre>${toJson(this.service.getResolvedLevel(this.state.validation, level.id) ?? {})}</pre>
        </div>
      </section>
    `;
  }

  renderSection(level, descriptor, section) {
    const visibleFields = (section.fields ?? []).filter((field) => {
      if (!this.state.showAdvanced && field.authoringTier === 'advanced') {
        return false;
      }
      return isFieldVisible(field, level);
    });

    return `
      <div class="game-editor__field-group">
        <h3>${section.label}</h3>
        ${visibleFields.map((field) => this.renderField(level, descriptor, field)).join('')}
      </div>
    `;
  }

  renderField(level, descriptor, field) {
    const localPath = field.id;
    const value = getAtPath(level, localPath);
    switch (field.editorControl) {
      case 'select':
        return this.renderSelectField('level', localPath, field.label, value ?? field.defaultValue ?? '', field.options ?? []);
      case 'number':
      case 'slider':
        return this.renderNumberField('level', localPath, field.label, value ?? field.defaultValue ?? '');
      case 'range_pair':
        return this.renderRangeField('level', localPath, field.label, value ?? field.defaultValue ?? ['', '']);
      case 'text':
        return this.renderTextField('level', localPath, field.label, value ?? field.defaultValue ?? '');
      case 'textarea':
        return this.renderTextAreaField('level', localPath, field.label, value ?? field.defaultValue ?? '');
      case 'bonus_tiers':
        return this.renderBonusTierEditor(value ?? []);
      case 'matcher_builder':
        return this.renderMatcherBuilder(localPath, value);
      case 'phase_builder':
        return this.renderPhaseBuilder(value ?? []);
      default:
        return '';
    }
  }

  renderTextField(entity, path, label, value) {
    return `
      <label class="game-editor__field">
        <span>${label}</span>
        <input type="text" data-action="set-path" data-entity="${entity}" data-path="${path}" value="${value ?? ''}" />
      </label>
    `;
  }

  renderTextAreaField(entity, path, label, value) {
    return `
      <label class="game-editor__field">
        <span>${label}</span>
        <textarea data-action="set-path" data-entity="${entity}" data-path="${path}">${value ?? ''}</textarea>
      </label>
    `;
  }

  renderNumberField(entity, path, label, value) {
    return `
      <label class="game-editor__field">
        <span>${label}</span>
        <input type="number" data-action="set-path" data-entity="${entity}" data-path="${path}" data-value-type="number" value="${value ?? ''}" />
      </label>
    `;
  }

  renderCheckboxField(entity, path, label, value) {
    return `
      <label class="game-editor__field game-editor__field--checkbox">
        <input type="checkbox" data-action="set-path" data-entity="${entity}" data-path="${path}" data-value-type="boolean" ${value ? 'checked' : ''} />
        <span>${label}</span>
      </label>
    `;
  }

  renderSelectField(entity, path, label, value, options, valueType = 'text') {
    return `
      <label class="game-editor__field">
        <span>${label}</span>
        <select data-action="set-path" data-entity="${entity}" data-path="${path}" data-value-type="${valueType}">
          ${options.map((option) => `<option value="${option.value}" ${String(option.value) === String(value) ? 'selected' : ''}>${option.label}</option>`).join('')}
        </select>
      </label>
    `;
  }

  renderRangeField(entity, path, label, value) {
    const [minValue, maxValue] = Array.isArray(value) ? value : ['', ''];
    return `
      <label class="game-editor__field">
        <span>${label}</span>
        <div class="game-editor__range-inputs">
          <input type="number" data-action="set-path" data-entity="${entity}" data-path="${path}.0" data-value-type="number" value="${minValue ?? ''}" />
          <span>to</span>
          <input type="number" data-action="set-path" data-entity="${entity}" data-path="${path}.1" data-value-type="number" value="${maxValue ?? ''}" />
        </div>
      </label>
    `;
  }

  renderBonusTierEditor(tiers) {
    return `
      <div class="game-editor__field-group">
        <h4>Bonus Tiers</h4>
        ${tiers.map((tier, index) => `
          <div class="game-editor__bonus-row">
            <input type="number" data-action="set-path" data-entity="level" data-path="scoring.bonusTiers.${index}.threshold" data-value-type="number" value="${tier.threshold ?? ''}" />
            <input type="number" data-action="set-path" data-entity="level" data-path="scoring.bonusTiers.${index}.reward" data-value-type="number" value="${tier.reward ?? ''}" />
            <button type="button" data-action="remove-bonus-tier" data-index="${index}">Remove</button>
          </div>
        `).join('')}
        <button type="button" data-action="add-bonus-tier">Add Bonus Tier</button>
      </div>
    `;
  }

  renderMatcherBuilder(path, matcher) {
    const value = matcher ?? { type: 'even' };
    return `
      <div class="game-editor__matcher">
        <div class="game-editor__detail-header">
          <strong>Rule</strong>
          <span>${value.type ?? 'even'}</span>
        </div>
        ${this.renderSelectField('level', `${path}.type`, 'Rule Type', value.type ?? 'even', [
          { value: 'parity', label: 'Parity' },
          { value: 'modulo', label: 'Modulo' },
          { value: 'prime', label: 'Prime' },
          { value: 'comparison', label: 'Comparison' },
          { value: 'compound', label: 'Compound' },
        ])}
        ${value.type === 'parity' ? this.renderSelectField('level', `${path}.parity`, 'Parity', value.parity ?? 'even', [
          { value: 'even', label: 'Even' },
          { value: 'odd', label: 'Odd' },
        ]) : ''}
        ${value.type === 'modulo' ? `${this.renderNumberField('level', `${path}.mod`, 'Modulo Base', value.mod ?? 2)}${this.renderNumberField('level', `${path}.remainder`, 'Remainder', value.remainder ?? 0)}` : ''}
        ${value.type === 'comparison' ? `${this.renderSelectField('level', `${path}.comparison`, 'Comparison', value.comparison ?? 'less_than_or_equal', [
          { value: 'less_than_or_equal', label: 'Less Than Or Equal' },
          { value: 'greater_than_or_equal', label: 'Greater Than Or Equal' },
        ])}${this.renderNumberField('level', `${path}.value`, 'Value', value.value ?? 10)}` : ''}
        ${value.type === 'compound' ? this.renderCompoundMatcher(`${path}.matcher`, value.matcher ?? { type: 'even' }) : ''}
      </div>
    `;
  }

  renderCompoundMatcher(path, matcher) {
    const value = matcher ?? createDefaultMatcher();
    return `
      <div class="game-editor__matcher">
        <div class="game-editor__detail-header">
          <strong>Compound Matcher</strong>
          <select data-action="set-matcher-type" data-path="${path}" data-matcher-type="${value.type ?? 'even'}">
            ${['even', 'odd', 'prime', 'divisible_by', 'less_than_or_equal', 'greater_than_or_equal', 'not', 'any_of', 'all_of'].map((type) => `<option value="${type}" ${type === value.type ? 'selected' : ''}>${type}</option>`).join('')}
          </select>
        </div>
        ${value.type === 'divisible_by' ? `${this.renderNumberField('level', `${path}.divisor`, 'Divisor', value.divisor ?? 2)}${this.renderNumberField('level', `${path}.remainder`, 'Remainder', value.remainder ?? 0)}` : ''}
        ${(value.type === 'less_than_or_equal' || value.type === 'greater_than_or_equal') ? this.renderNumberField('level', `${path}.value`, 'Value', value.value ?? 10) : ''}
        ${value.type === 'not' ? this.renderCompoundMatcher(`${path}.rule`, value.rule ?? createDefaultMatcher()) : ''}
        ${(value.type === 'any_of' || value.type === 'all_of') ? `
          <div class="game-editor__nested-list">
            ${(value.rules ?? []).map((rule, index) => `
              <div class="game-editor__nested-item">
                ${this.renderCompoundMatcher(`${path}.rules.${index}`, rule)}
                <button type="button" data-action="remove-compound-rule" data-path="${path}.rules.${index}">Remove Rule</button>
              </div>
            `).join('')}
            <button type="button" data-action="add-compound-rule" data-path="${path}.rules">Add Rule</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderPhaseBuilder(phases) {
    return `
      <div class="game-editor__field-group">
        <div class="game-editor__detail-header">
          <h4>Phases</h4>
          <button type="button" data-action="phase-add">Add Phase</button>
        </div>
        ${phases.map((phase, index) => `
          <div class="game-editor__phase-card">
            <div class="game-editor__detail-header">
              <strong>Phase ${index + 1}</strong>
              <button type="button" data-action="phase-remove" data-index="${index}">Delete</button>
            </div>
            ${this.renderNumberField('level', `difficulty.phases.${index}.switchAfterCaught`, 'Switch After Caught', phase.switchAfterCaught ?? '')}
            ${this.renderTextField('level', `difficulty.phases.${index}.presentation.prompt`, 'Phase Prompt', phase.presentation?.prompt ?? '')}
            ${this.renderMatcherBuilder(`difficulty.phases.${index}.objective.rule`, phase.objective?.rule ?? { type: 'parity', parity: 'even' })}
            ${this.renderRangeField('level', `difficulty.phases.${index}.content.domain.range`, 'Phase Range', phase.content?.domain?.range ?? ['', ''])}
          </div>
        `).join('')}
      </div>
    `;
  }

  renderBoxEditor(basePath, label, box) {
    const value = box ?? { x: '', y: '', w: '', h: '' };
    return `
      <div class="game-editor__field-group">
        <h3>${label}</h3>
        <div class="game-editor__range-inputs">
          <input type="number" data-action="set-path" data-entity="world" data-path="${basePath}.x" data-value-type="number" value="${value.x ?? ''}" placeholder="x" />
          <input type="number" data-action="set-path" data-entity="world" data-path="${basePath}.y" data-value-type="number" value="${value.y ?? ''}" placeholder="y" />
          <input type="number" data-action="set-path" data-entity="world" data-path="${basePath}.w" data-value-type="number" value="${value.w ?? ''}" placeholder="w" />
          <input type="number" data-action="set-path" data-entity="world" data-path="${basePath}.h" data-value-type="number" value="${value.h ?? ''}" placeholder="h" />
        </div>
      </div>
    `;
  }

  renderErrors(prefix) {
    const errors = this.state.validation.errors.filter((entry) => entry.path === prefix || entry.path.startsWith(`${prefix}.`) || entry.path.startsWith(`${prefix}[`));
    if (!errors.length) return '';
    return `
      <div class="game-editor__error-list">
        ${errors.map((entry) => `<div class="game-editor__error-item">${entry.message}</div>`).join('')}
      </div>
    `;
  }

  renderDetails() {
    const validationSummary = this.state.validation.errors.length
      ? `<div class="game-editor__validation-summary">${this.state.validation.errors.length} validation issue(s)</div>`
      : '<div class="game-editor__validation-summary game-editor__validation-summary--ok">Validation clean</div>';
    return `
      <aside class="game-editor__details">
        ${validationSummary}
        ${this.state.selectionMode === 'level' ? this.renderLevelPanel() : this.renderWorldPanel()}
      </aside>
    `;
  }

  render() {
    this.host.innerHTML = `
      <div class="game-editor">
        ${this.renderTopBar()}
        <div class="game-editor__body">
          ${this.renderSidebar()}
          ${this.renderCenterPanel()}
          ${this.renderDetails()}
        </div>
      </div>
    `;
  }
}
