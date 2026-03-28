import { GameContentService } from './GameContentService.js';

function deepClone(value) {
  return structuredClone(value);
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'item';
}

function toDisplayJson(value) {
  return JSON.stringify(value, null, 2);
}

function pathSegments(path) {
  return String(path)
    .split('.')
    .filter(Boolean)
    .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
}

function getAtPath(target, path) {
  return pathSegments(path).reduce((current, segment) => current?.[segment], target);
}

function setAtPath(target, path, value) {
  const segments = pathSegments(path);
  let current = target;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    const nextSegment = segments[i + 1];
    if (current[segment] == null) {
      current[segment] = typeof nextSegment === 'number' ? [] : {};
    }
    current = current[segment];
  }
  current[segments[segments.length - 1]] = value;
}

function deleteAtPath(target, path) {
  const segments = pathSegments(path);
  let current = target;
  for (let i = 0; i < segments.length - 1; i += 1) {
    current = current?.[segments[i]];
    if (current == null) {
      return;
    }
  }
  const last = segments[segments.length - 1];
  if (Array.isArray(current) && typeof last === 'number') {
    current.splice(last, 1);
  } else if (current && typeof current === 'object') {
    delete current[last];
  }
}

function formatGoal(goal) {
  if (!goal) return 'No goal set';
  switch (goal.type) {
    case 'catchCount':
      return `Catch ${goal.value} correct items`;
    case 'correctAnswers':
      return `Answer ${goal.value} correctly`;
    case 'score':
      return `Score ${goal.value}+ points`;
    case 'combo':
      return `Reach a ${goal.value}x combo`;
    default:
      return `${goal.type}: ${goal.value}`;
  }
}

function formatBonusTiers(bonusTiers) {
  if (!bonusTiers?.length) return 'No bonus tiers';
  return bonusTiers.map((tier) => `${tier.threshold} → +${tier.reward}`).join(' · ');
}

function matcherSummary(matcher) {
  if (!matcher) return 'No matcher';
  if (typeof matcher === 'string') {
    return matcher.replaceAll('_', ' ');
  }
  switch (matcher.type) {
    case 'odd':
    case 'even':
    case 'prime':
      return matcher.type;
    case 'divisible_by':
      return `divisible by ${matcher.divisor}${matcher.remainder ? ` (remainder ${matcher.remainder})` : ''}`;
    case 'less_than_or_equal':
      return `≤ ${matcher.value}`;
    case 'greater_than_or_equal':
      return `≥ ${matcher.value}`;
    case 'not':
      return `not (${matcherSummary(matcher.rule)})`;
    case 'any_of':
      return `any of: ${(matcher.rules ?? []).map(matcherSummary).join(', ')}`;
    case 'all_of':
      return `all of: ${(matcher.rules ?? []).map(matcherSummary).join(', ')}`;
    default:
      return matcher.type ?? 'Custom matcher';
  }
}

function recipeKindLabel(descriptor) {
  return descriptor?.editor?.label ?? descriptor?.kind ?? 'Recipe';
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
    prompt: 'New phase',
    switchAfterCaught: 5,
    matcher: createDefaultMatcher(),
  };
}

function createDefaultRecipe(descriptor, idBase = 'new_recipe') {
  const example = descriptor.docs?.exampleRecipe ?? {};
  return {
    kind: descriptor.kind,
    title: example.title ?? 'New Recipe',
    prompt: example.prompt ?? 'Follow the prompt!',
    rules: deepClone(example.rules ?? descriptor.rules.defaults ?? {}),
    scoring: deepClone(example.scoring ?? descriptor.scoring.defaults ?? {}),
    _suggestedId: slugify(idBase),
  };
}

function createDefaultLevel(worldId, nextLevelNum, slot, recipeId, family = 'collection') {
  return {
    levelId: `${worldId}_${nextLevelNum}`,
    levelNum: nextLevelNum,
    slot,
    label: `Level ${nextLevelNum}`,
    recipeId,
    timeLimit: 60,
    goal: {
      type: family === 'answer' ? 'correctAnswers' : 'catchCount',
      value: family === 'answer' ? 6 : 10,
    },
    clearReward: 10,
    bonusTiers: [
      { threshold: family === 'answer' ? 8 : 13, reward: 4 },
      { threshold: family === 'answer' ? 10 : 16, reward: 6 },
    ],
    overrides: {
      rules: {},
      scoring: {},
    },
  };
}

function nextAvailableLevelNum(world) {
  const used = new Set((world.levels ?? []).map((level) => level.levelNum));
  let candidate = 1;
  while (used.has(candidate)) candidate += 1;
  return candidate;
}

function nextAvailableSlot(world, slots) {
  const used = new Set((world.levels ?? []).map((level) => level.slot));
  return slots.find((slot) => !used.has(slot.slot))?.slot ?? slots[0]?.slot ?? 1;
}

function renderRangeInputs(label, path, range = [], options = {}) {
  const [minValue, maxValue] = Array.isArray(range) ? range : ['', ''];
  return `
    <label class="game-editor__field">
      <span>${label}</span>
      <div class="game-editor__range-inputs">
        <input type="number" data-action="set-path" data-path="${path}.0" data-value-type="number" min="${options.min ?? ''}" max="${options.max ?? ''}" step="${options.step ?? '1'}" value="${minValue ?? ''}" />
        <span>to</span>
        <input type="number" data-action="set-path" data-path="${path}.1" data-value-type="number" min="${options.min ?? ''}" max="${options.max ?? ''}" step="${options.step ?? '1'}" value="${maxValue ?? ''}" />
      </div>
    </label>
  `;
}

export class GameContentEditor {
  constructor(host, { gameId }) {
    this.host = host;
    this.gameId = gameId;
    this.service = new GameContentService(gameId);
    this.state = {
      loading: true,
      game: null,
      worlds: [],
      validation: { valid: false, errors: [], normalized: null },
      editorDefinition: null,
      selectedWorldId: null,
      selectedLevelId: null,
      selectedRecipeId: null,
      selectionMode: 'world',
      dirtyGame: false,
      dirtyWorldIds: new Set(),
      status: { tone: 'info', text: 'Loading…' },
      saving: false,
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
    const firstWorldId = payload.worlds[0]?.id ?? null;
    this.state = {
      ...this.state,
      loading: false,
      game: payload.game,
      worlds: payload.worlds,
      validation: payload.validation,
      editorDefinition: payload.editorDefinition,
      selectedWorldId: this.state.selectedWorldId ?? firstWorldId,
      selectedLevelId: null,
      selectedRecipeId: this.state.selectedRecipeId ?? Object.keys(payload.game.recipes ?? {})[0] ?? null,
      selectionMode: 'world',
      dirtyGame: false,
      dirtyWorldIds: new Set(),
      status: { tone: payload.validation.valid ? 'success' : 'warning', text: payload.validation.valid ? 'Loaded Math Garden authoring data.' : 'Loaded with validation issues.' },
      saving: false,
    };
    this.render();
  }

  get selectedWorld() {
    return this.state.worlds.find((world) => world.id === this.state.selectedWorldId) ?? null;
  }

  get selectedLevel() {
    return this.selectedWorld?.levels?.find((level) => level.levelId === this.state.selectedLevelId) ?? null;
  }

  get selectedRecipe() {
    return this.state.selectedRecipeId ? this.state.game.recipes?.[this.state.selectedRecipeId] ?? null : null;
  }

  get currentRecipeId() {
    if (this.state.selectionMode === 'recipe') {
      return this.state.selectedRecipeId;
    }
    if (this.selectedLevel) {
      return this.selectedLevel.recipeId;
    }
    return this.state.selectedRecipeId;
  }

  get currentRecipe() {
    const recipeId = this.currentRecipeId;
    return recipeId ? this.state.game.recipes?.[recipeId] ?? null : null;
  }

  get currentDescriptor() {
    const recipe = this.currentRecipe;
    return this.state.editorDefinition?.modeDescriptors?.find((descriptor) => descriptor.kind === recipe?.kind) ?? null;
  }

  refreshValidation(statusText = null, tone = null) {
    const validation = this.service.validate(this.state.game, this.state.worlds);
    this.state.validation = validation;
    if (statusText) {
      this.state.status = {
        tone: tone ?? (validation.valid ? 'success' : 'warning'),
        text: statusText,
      };
    } else if (!validation.valid) {
      this.state.status = { tone: 'warning', text: 'There are validation issues to fix before saving.' };
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
      return;
    }

    if (event.type === 'input' || event.type === 'change') {
      this.handleInput(action, target);
    }
  }

  handleClick(action, target) {
    switch (action) {
      case 'reload-editor':
        void this.reload();
        break;
      case 'select-world':
        this.state.selectedWorldId = target.dataset.worldId;
        this.state.selectionMode = 'world';
        this.state.selectedLevelId = null;
        this.render();
        break;
      case 'select-level':
        this.state.selectedWorldId = target.dataset.worldId;
        this.state.selectedLevelId = target.dataset.levelId;
        this.state.selectionMode = 'level';
        this.render();
        break;
      case 'select-recipe':
        this.state.selectedRecipeId = target.dataset.recipeId;
        this.state.selectionMode = 'recipe';
        this.render();
        break;
      case 'jump-to-recipe':
        this.state.selectedRecipeId = target.dataset.recipeId;
        this.state.selectionMode = 'recipe';
        this.render();
        break;
      case 'create-level':
        this.createLevel(target.dataset.slot ? Number(target.dataset.slot) : null);
        break;
      case 'duplicate-level':
        this.duplicateLevel();
        break;
      case 'delete-level':
        this.deleteLevel();
        break;
      case 'create-recipe':
        this.createRecipe();
        break;
      case 'duplicate-recipe':
        this.duplicateRecipe();
        break;
      case 'delete-recipe':
        this.deleteRecipe();
        break;
      case 'save-world':
        void this.saveSelectedWorld();
        break;
      case 'save-recipes':
        void this.saveRecipes();
        break;
      case 'save-all':
        void this.saveAll();
        break;
      case 'matcher-set-type':
        this.setMatcherType(target.dataset.path, target.dataset.matcherType);
        break;
      case 'matcher-add-child':
        this.addMatcherChild(target.dataset.path);
        break;
      case 'matcher-remove-child':
        this.removeAtTargetPath(target.dataset.path);
        break;
      case 'phase-add':
        this.addPhase(target.dataset.path);
        break;
      case 'phase-delete':
        this.removeAtTargetPath(target.dataset.path);
        break;
      case 'clear-path':
        this.clearPath(target.dataset.entity, target.dataset.path);
        break;
      default:
        break;
    }
  }

  handleInput(action, target) {
    if (action !== 'set-path') {
      return;
    }

    const path = target.dataset.path;
    const valueType = target.dataset.valueType ?? 'text';
    const entity = target.dataset.entity;
    const value = target instanceof HTMLInputElement && target.type === 'checkbox'
      ? target.checked
      : coerceValue(valueType, target.value);
    this.setEntityPath(entity, path, value);
  }

  setEntityPath(entity, path, value) {
    if (entity === 'game') {
      this.withGameMutation((game) => {
        if (value === null && path.endsWith('.1') === false && path.endsWith('.0') === false) {
          setAtPath(game, path, null);
        } else {
          setAtPath(game, path, value);
        }
      });
      return;
    }

    if (entity === 'recipe') {
      const recipeId = this.currentRecipeId;
      if (!recipeId) return;
      this.withGameMutation((game) => {
        if (path === 'kind') {
          const nextDescriptor = this.state.editorDefinition.modeDescriptors.find((descriptor) => descriptor.kind === value);
          if (nextDescriptor) {
            const nextRecipe = createDefaultRecipe(nextDescriptor, recipeId);
            delete nextRecipe._suggestedId;
            nextRecipe.title = game.recipes[recipeId].title;
            nextRecipe.prompt = game.recipes[recipeId].prompt;
            game.recipes[recipeId] = nextRecipe;
          }
          return;
        }
        setAtPath(game.recipes[recipeId], path, value);
      });
      return;
    }

    if (entity === 'world') {
      if (!this.selectedWorld) return;
      this.withWorldMutation(this.selectedWorld.id, (world) => {
        setAtPath(world, path, value);
      });
      return;
    }

    if (entity === 'level') {
      const level = this.selectedLevel;
      if (!level || !this.selectedWorld) return;
      this.withWorldMutation(this.selectedWorld.id, (world) => {
        const authoredLevel = world.levels.find((entry) => entry.levelId === level.levelId);
        setAtPath(authoredLevel, path, value);
      });
    }
  }

  clearPath(entity, path) {
    if (entity === 'recipe') {
      const recipeId = this.currentRecipeId;
      if (!recipeId) return;
      this.withGameMutation((game) => deleteAtPath(game.recipes[recipeId], path));
      return;
    }
    if (entity === 'world' && this.selectedWorld) {
      this.withWorldMutation(this.selectedWorld.id, (world) => deleteAtPath(world, path));
      return;
    }
    if (entity === 'level' && this.selectedWorld && this.selectedLevel) {
      this.withWorldMutation(this.selectedWorld.id, (world) => {
        const authoredLevel = world.levels.find((entry) => entry.levelId === this.selectedLevel.levelId);
        deleteAtPath(authoredLevel, path);
      });
    }
  }

  removeAtTargetPath(path) {
    const entity = path.startsWith('rules') || path.startsWith('scoring') ? 'recipe' : 'level';
    this.clearPath(entity, path);
  }

  setMatcherType(path, matcherType) {
    const next = (() => {
      switch (matcherType) {
        case 'divisible_by':
          return { type: matcherType, divisor: 2, remainder: 0 };
        case 'less_than_or_equal':
        case 'greater_than_or_equal':
          return { type: matcherType, value: 10 };
        case 'not':
          return { type: matcherType, rule: createDefaultMatcher() };
        case 'any_of':
        case 'all_of':
          return { type: matcherType, rules: [createDefaultMatcher(), createDefaultMatcher()] };
        case 'odd':
        case 'even':
        case 'prime':
        default:
          return { type: matcherType };
      }
    })();
    const entity = this.state.selectionMode === 'recipe' ? 'recipe' : 'level';
    if (entity === 'recipe') {
      this.withGameMutation((game) => setAtPath(game.recipes[this.currentRecipeId], path, next));
    } else if (this.selectedWorld && this.selectedLevel) {
      this.withWorldMutation(this.selectedWorld.id, (world) => {
        const authoredLevel = world.levels.find((entry) => entry.levelId === this.selectedLevel.levelId);
        setAtPath(authoredLevel, path, next);
      });
    }
  }

  addMatcherChild(path) {
    const entity = this.state.selectionMode === 'recipe' ? 'recipe' : 'level';
    const mutator = (target) => {
      const current = getAtPath(target, path) ?? [];
      current.push(createDefaultMatcher());
      setAtPath(target, path, current);
    };
    if (entity === 'recipe') {
      this.withGameMutation((game) => mutator(game.recipes[this.currentRecipeId]));
    } else if (this.selectedWorld && this.selectedLevel) {
      this.withWorldMutation(this.selectedWorld.id, (world) => {
        const authoredLevel = world.levels.find((entry) => entry.levelId === this.selectedLevel.levelId);
        mutator(authoredLevel);
      });
    }
  }

  addPhase(path) {
    const entity = this.state.selectionMode === 'recipe' ? 'recipe' : 'level';
    const mutator = (target) => {
      const current = getAtPath(target, path) ?? [];
      current.push(createDefaultPhase());
      setAtPath(target, path, current);
    };
    if (entity === 'recipe') {
      this.withGameMutation((game) => mutator(game.recipes[this.currentRecipeId]));
    } else if (this.selectedWorld && this.selectedLevel) {
      this.withWorldMutation(this.selectedWorld.id, (world) => {
        const authoredLevel = world.levels.find((entry) => entry.levelId === this.selectedLevel.levelId);
        mutator(authoredLevel);
      });
    }
  }

  createRecipe() {
    const descriptor = this.state.editorDefinition.modeDescriptors[0];
    if (!descriptor) return;
    const id = `${slugify(descriptor.kind)}_${Object.keys(this.state.game.recipes).length + 1}`;
    const defaultRecipe = createDefaultRecipe(descriptor, id);
    delete defaultRecipe._suggestedId;
    this.withGameMutation((game) => {
      game.recipes[id] = defaultRecipe;
      this.state.selectedRecipeId = id;
      this.state.selectionMode = 'recipe';
    });
  }

  duplicateRecipe() {
    const recipeId = this.currentRecipeId;
    const recipe = this.currentRecipe;
    if (!recipeId || !recipe) return;
    let nextId = `${recipeId}_copy`;
    while (this.state.game.recipes[nextId]) {
      nextId = `${nextId}_copy`;
    }
    this.withGameMutation((game) => {
      game.recipes[nextId] = deepClone(recipe);
      game.recipes[nextId].title = `${recipe.title} Copy`;
      this.state.selectedRecipeId = nextId;
      this.state.selectionMode = 'recipe';
    });
  }

  deleteRecipe() {
    const recipeId = this.currentRecipeId;
    if (!recipeId) return;
    const usedBy = this.service.getUsedBy(this.state.worlds, recipeId);
    if (usedBy.length > 0) {
      this.state.status = { tone: 'warning', text: `Recipe "${recipeId}" is still used by levels and cannot be deleted.` };
      this.render();
      return;
    }
    this.withGameMutation((game) => {
      delete game.recipes[recipeId];
      this.state.selectedRecipeId = Object.keys(game.recipes)[0] ?? null;
      this.state.selectionMode = this.state.selectedRecipeId ? 'recipe' : 'world';
    });
  }

  createLevel(forcedSlot = null) {
    const world = this.selectedWorld;
    const recipeId = this.currentRecipeId ?? Object.keys(this.state.game.recipes ?? {})[0];
    const resolvedRecipe = recipeId ? this.service.getResolvedRecipe(this.state.validation, recipeId) : null;
    if (!world || !recipeId) return;
    const slot = forcedSlot ?? nextAvailableSlot(world, this.state.game.levelSelect?.slots ?? []);
    const levelNum = nextAvailableLevelNum(world);
    const level = createDefaultLevel(world.id, levelNum, slot, recipeId, resolvedRecipe?.family);
    this.withWorldMutation(world.id, (authoredWorld) => {
      authoredWorld.levels.push(level);
      this.state.selectedLevelId = level.levelId;
      this.state.selectionMode = 'level';
    });
  }

  duplicateLevel() {
    const world = this.selectedWorld;
    const level = this.selectedLevel;
    if (!world || !level) return;
    const nextLevelNum = nextAvailableLevelNum(world);
    const slot = nextAvailableSlot(world, this.state.game.levelSelect?.slots ?? []);
    const copy = deepClone(level);
    copy.levelNum = nextLevelNum;
    copy.slot = slot;
    copy.levelId = `${world.id}_${nextLevelNum}`;
    copy.label = `${level.label} Copy`;
    this.withWorldMutation(world.id, (authoredWorld) => {
      authoredWorld.levels.push(copy);
      this.state.selectedLevelId = copy.levelId;
      this.state.selectionMode = 'level';
    });
  }

  deleteLevel() {
    const world = this.selectedWorld;
    const level = this.selectedLevel;
    if (!world || !level) return;
    this.withWorldMutation(world.id, (authoredWorld) => {
      authoredWorld.levels = authoredWorld.levels.filter((entry) => entry.levelId !== level.levelId);
      this.state.selectedLevelId = authoredWorld.levels[0]?.levelId ?? null;
      this.state.selectionMode = this.state.selectedLevelId ? 'level' : 'world';
    });
  }

  renameCurrentRecipeId(nextIdRaw) {
    const currentId = this.currentRecipeId;
    const recipe = this.currentRecipe;
    const nextId = slugify(nextIdRaw);
    if (!currentId || !recipe || !nextId || nextId === currentId) {
      return;
    }
    if (this.state.game.recipes[nextId]) {
      this.state.status = { tone: 'warning', text: `Recipe id "${nextId}" already exists.` };
      this.render();
      return;
    }
    this.withGameMutation((game) => {
      game.recipes[nextId] = game.recipes[currentId];
      delete game.recipes[currentId];
      this.state.worlds.forEach((world) => {
        world.levels.forEach((level) => {
          if (level.recipeId === currentId) {
            level.recipeId = nextId;
            this.markWorldDirty(world.id);
          }
        });
      });
      this.state.selectedRecipeId = nextId;
    });
  }

  async saveRecipes() {
    this.refreshValidation();
    if (!this.state.validation.valid) {
      this.state.status = { tone: 'warning', text: 'Fix validation issues before saving recipes.' };
      this.render();
      return;
    }
    this.state.saving = true;
    this.render();
    try {
      await this.service.saveGame(this.state.game);
      this.state.dirtyGame = false;
      this.state.status = { tone: 'success', text: 'Recipes and shared game settings saved.' };
    } catch (error) {
      this.state.status = { tone: 'error', text: error instanceof Error ? error.message : String(error) };
    } finally {
      this.state.saving = false;
      this.render();
    }
  }

  async saveSelectedWorld() {
    const world = this.selectedWorld;
    if (!world) return;
    this.refreshValidation();
    if (!this.state.validation.valid) {
      this.state.status = { tone: 'warning', text: 'Fix validation issues before saving this world.' };
      this.render();
      return;
    }
    this.state.saving = true;
    this.render();
    try {
      await this.service.saveWorld(world);
      this.state.dirtyWorldIds.delete(world.id);
      this.state.status = { tone: 'success', text: `Saved world "${world.title}".` };
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
      this.state.status = { tone: 'warning', text: 'Fix validation issues before saving all changes.' };
      this.render();
      return;
    }
    this.state.saving = true;
    this.render();
    try {
      if (this.state.dirtyGame) {
        await this.service.saveGame(this.state.game);
        this.state.dirtyGame = false;
      }
      for (const worldId of [...this.state.dirtyWorldIds]) {
        const world = this.state.worlds.find((entry) => entry.id === worldId);
        if (world) {
          await this.service.saveWorld(world);
        }
      }
      this.state.dirtyWorldIds.clear();
      this.state.status = { tone: 'success', text: 'Saved all game and world changes.' };
    } catch (error) {
      this.state.status = { tone: 'error', text: error instanceof Error ? error.message : String(error) };
    } finally {
      this.state.saving = false;
      this.render();
    }
  }

  errorsFor(prefix) {
    return this.state.validation.errors.filter((entry) => entry.path === prefix || entry.path.startsWith(`${prefix}.`) || entry.path.startsWith(`${prefix}[`));
  }

  renderRightPanel() {
    if (this.state.selectionMode === 'recipe' && this.currentRecipe) {
      return this.renderRecipePanel();
    }
    if (this.state.selectionMode === 'level' && this.selectedLevel) {
      return this.renderLevelPanel();
    }
    return this.renderWorldPanel();
  }

  renderWorldPanel() {
    const world = this.selectedWorld;
    if (!world) return '<div class="game-editor__empty">Select a world.</div>';
    const errors = this.errorsFor(`worlds.${world.id}`);
    return `
      <section class="game-editor__detail-section">
        <div class="game-editor__detail-header">
          <h2>World Settings</h2>
          <p>${world.id}</p>
        </div>
        ${this.renderErrorBlock(errors)}
        <label class="game-editor__field">
          <span>Title</span>
          <input type="text" data-action="set-path" data-entity="world" data-path="title" value="${world.title ?? ''}" />
        </label>
        <label class="game-editor__field">
          <span>Subtitle</span>
          <input type="text" data-action="set-path" data-entity="world" data-path="subtitle" value="${world.subtitle ?? ''}" />
        </label>
        <label class="game-editor__field">
          <span>Unlock Requirement Text</span>
          <input type="text" data-action="set-path" data-entity="world" data-path="unlockRequirementText" value="${world.unlockRequirementText ?? ''}" />
        </label>
        <label class="game-editor__field game-editor__field--checkbox">
          <input type="checkbox" data-action="set-path" data-entity="world" data-path="startsUnlocked" data-value-type="boolean" ${world.startsUnlocked ? 'checked' : ''} />
          <span>Starts unlocked</span>
        </label>
        <label class="game-editor__field">
          <span>Unlock After World</span>
          <select data-action="set-path" data-entity="world" data-path="unlockAfterWorldId">
            <option value="">None</option>
            ${this.state.worlds.filter((entry) => entry.id !== world.id).map((entry) => `<option value="${entry.id}" ${entry.id === world.unlockAfterWorldId ? 'selected' : ''}>${entry.title}</option>`).join('')}
          </select>
        </label>
        <div class="game-editor__field-group">
          <h3>Sign Box</h3>
          <div class="game-editor__range-inputs">
            <input type="number" data-role="signbox-x" min="0" max="1" step="0.001" value="${world.signBox?.x ?? 0}" />
            <input type="number" data-role="signbox-y" min="0" max="1" step="0.001" value="${world.signBox?.y ?? 0}" />
            <input type="number" data-role="signbox-w" min="0" max="1" step="0.001" value="${world.signBox?.w ?? 0}" />
            <input type="number" data-role="signbox-h" min="0" max="1" step="0.001" value="${world.signBox?.h ?? 0}" />
          </div>
        </div>
        <div class="game-editor__field-group">
          <h3>Click Box</h3>
          <div class="game-editor__range-inputs">
            <input type="number" data-role="clickbox-x" min="0" max="1" step="0.001" value="${world.clickBox?.x ?? ''}" placeholder="x" />
            <input type="number" data-role="clickbox-y" min="0" max="1" step="0.001" value="${world.clickBox?.y ?? ''}" placeholder="y" />
            <input type="number" data-role="clickbox-w" min="0" max="1" step="0.001" value="${world.clickBox?.w ?? ''}" placeholder="w" />
            <input type="number" data-role="clickbox-h" min="0" max="1" step="0.001" value="${world.clickBox?.h ?? ''}" placeholder="h" />
          </div>
        </div>
      </section>
    `;
  }

  renderLevelPanel() {
    const level = this.selectedLevel;
    const world = this.selectedWorld;
    if (!level || !world) return '<div class="game-editor__empty">Select a level.</div>';
    const recipeOptions = Object.entries(this.state.game.recipes ?? {});
    const resolvedLevel = this.service.getResolvedLevel(this.state.validation, level.levelId);
    const descriptor = resolvedLevel?.resolvedRecipe?.descriptor ?? this.currentDescriptor;
    const errors = this.errorsFor(`worlds.${world.id}`);
    return `
      <section class="game-editor__detail-section">
        <div class="game-editor__detail-header">
          <h2>Level ${level.levelNum}</h2>
          <div class="game-editor__inline-actions">
            <button type="button" data-action="duplicate-level">Duplicate</button>
            <button type="button" data-action="delete-level" class="danger">Delete</button>
          </div>
        </div>
        ${this.renderErrorBlock(errors.filter((entry) => entry.path.includes(level.levelId) || entry.path.includes(`levels[`)))}
        <label class="game-editor__field">
          <span>Level ID</span>
          <input type="text" data-action="set-path" data-entity="level" data-path="levelId" value="${level.levelId}" />
        </label>
        <label class="game-editor__field">
          <span>Level Number</span>
          <input type="number" data-action="set-path" data-entity="level" data-path="levelNum" data-value-type="number" value="${level.levelNum}" />
        </label>
        <label class="game-editor__field">
          <span>Label</span>
          <input type="text" data-action="set-path" data-entity="level" data-path="label" value="${level.label ?? ''}" />
        </label>
        <label class="game-editor__field">
          <span>Slot</span>
          <select data-action="set-path" data-entity="level" data-path="slot" data-value-type="number">
            ${(this.state.game.levelSelect?.slots ?? []).map((slot) => `<option value="${slot.slot}" ${slot.slot === level.slot ? 'selected' : ''}>Slot ${slot.slot}</option>`).join('')}
          </select>
        </label>
        <label class="game-editor__field">
          <span>Recipe</span>
          <select data-action="set-path" data-entity="level" data-path="recipeId">
            ${recipeOptions.map(([recipeId, recipe]) => `<option value="${recipeId}" ${recipeId === level.recipeId ? 'selected' : ''}>${recipe.title} (${recipeId})</option>`).join('')}
          </select>
        </label>
        <div class="game-editor__panel-note">
          <strong>Resolved recipe:</strong> ${resolvedLevel?.resolvedRecipe?.title ?? 'Unknown'} · ${recipeKindLabel(descriptor)}
          <button type="button" data-action="jump-to-recipe" data-recipe-id="${level.recipeId}">Edit recipe</button>
        </div>
        <label class="game-editor__field">
          <span>Time Limit (seconds)</span>
          <input type="number" data-action="set-path" data-entity="level" data-path="timeLimit" data-value-type="number" value="${level.timeLimit ?? ''}" />
        </label>
        ${this.renderGoalEditor(level.goal)}
        <label class="game-editor__field">
          <span>Clear Reward</span>
          <input type="number" data-action="set-path" data-entity="level" data-path="clearReward" data-value-type="number" value="${level.clearReward ?? ''}" />
        </label>
        ${this.renderBonusTierEditor(level.bonusTiers ?? [])}
        <div class="game-editor__field-group">
          <h3>Level Rule Overrides</h3>
          ${this.renderFieldSet('level', 'overrides.rules', level.overrides?.rules ?? {}, descriptor?.editor?.ruleFields ?? [], true)}
        </div>
        <div class="game-editor__field-group">
          <h3>Level Scoring Overrides</h3>
          ${this.renderFieldSet('level', 'overrides.scoring', level.overrides?.scoring ?? {}, descriptor?.editor?.scoringFields ?? [], true)}
        </div>
        <div class="game-editor__resolved-preview">
          <h3>Resolved Effective Config</h3>
          <pre>${toDisplayJson({
            recipe: resolvedLevel?.resolvedRecipe?.title ?? null,
            family: resolvedLevel?.resolvedRecipe?.family ?? null,
            timeLimit: resolvedLevel?.timeLimit ?? null,
            goal: resolvedLevel?.goal ?? null,
            clearReward: resolvedLevel?.clearReward ?? null,
            bonusTiers: resolvedLevel?.bonusTiers ?? [],
            rules: resolvedLevel?.resolvedRecipe?.rules ?? null,
            scoring: resolvedLevel?.resolvedRecipe?.scoring ?? null,
          })}</pre>
        </div>
      </section>
    `;
  }

  renderRecipePanel() {
    const recipeId = this.currentRecipeId;
    const recipe = this.currentRecipe;
    const descriptor = this.currentDescriptor;
    if (!recipeId || !recipe || !descriptor) return '<div class="game-editor__empty">Select a recipe.</div>';
    const usedBy = this.service.getUsedBy(this.state.worlds, recipeId);
    const resolvedRecipe = this.service.getResolvedRecipe(this.state.validation, recipeId);
    const preview = descriptor.editor?.preview?.(resolvedRecipe ?? {
      id: recipeId,
      title: recipe.title,
      prompt: recipe.prompt,
      rules: recipe.rules,
      scoring: recipe.scoring,
      kind: recipe.kind,
    }) ?? null;
    const errors = this.errorsFor('manifest');

    return `
      <section class="game-editor__detail-section">
        <div class="game-editor__detail-header">
          <h2>Recipe Library</h2>
          <div class="game-editor__inline-actions">
            <button type="button" data-action="duplicate-recipe">Duplicate</button>
            <button type="button" data-action="delete-recipe" class="danger">Delete</button>
          </div>
        </div>
        ${this.renderErrorBlock(errors)}
        <label class="game-editor__field">
          <span>Recipe ID</span>
          <input type="text" value="${recipeId}" readonly />
        </label>
        <label class="game-editor__field">
          <span>Rename Recipe ID</span>
          <input type="text" data-action="rename-recipe-input" data-role="recipe-id-input" value="${recipeId}" />
        </label>
        <label class="game-editor__field">
          <span>Kind</span>
          <select data-action="set-path" data-entity="recipe" data-path="kind">
            ${this.state.editorDefinition.modeDescriptors.map((modeDescriptor) => `<option value="${modeDescriptor.kind}" ${modeDescriptor.kind === recipe.kind ? 'selected' : ''}>${recipeKindLabel(modeDescriptor)}</option>`).join('')}
          </select>
        </label>
        <label class="game-editor__field">
          <span>Title</span>
          <input type="text" data-action="set-path" data-entity="recipe" data-path="title" value="${recipe.title ?? ''}" />
        </label>
        <label class="game-editor__field">
          <span>Prompt</span>
          <input type="text" data-action="set-path" data-entity="recipe" data-path="prompt" value="${recipe.prompt ?? ''}" />
        </label>
        <div class="game-editor__field-group">
          <h3>Rules</h3>
          ${this.renderFieldSet('recipe', 'rules', recipe.rules ?? {}, descriptor.editor?.ruleFields ?? [])}
        </div>
        <div class="game-editor__field-group">
          <h3>Scoring</h3>
          ${this.renderFieldSet('recipe', 'scoring', recipe.scoring ?? {}, descriptor.editor?.scoringFields ?? [])}
        </div>
        <div class="game-editor__used-by">
          <h3>Used By</h3>
          ${usedBy.length ? `<ul>${usedBy.map((entry) => `<li>${entry.worldTitle} · Level ${entry.levelNum}: ${entry.label}</li>`).join('')}</ul>` : '<p>No levels currently use this recipe.</p>'}
        </div>
        ${this.renderRecipePreview(preview)}
      </section>
    `;
  }

  renderFieldSet(entity, basePath, values, fieldDefs, isOverride = false) {
    return fieldDefs.map((fieldDef) => {
      const fieldPath = `${basePath}.${fieldDef.key}`;
      const value = values?.[fieldDef.key];
      switch (fieldDef.type) {
        case 'select':
          return `
            <label class="game-editor__field">
              <span>${fieldDef.label}</span>
              <select data-action="set-path" data-entity="${entity}" data-path="${fieldPath}">
                ${(fieldDef.options ?? []).map((option) => `<option value="${option.value}" ${option.value === value ? 'selected' : ''}>${option.label}</option>`).join('')}
              </select>
              ${fieldDef.optional ? `<button type="button" data-action="clear-path" data-entity="${entity}" data-path="${fieldPath}">Clear</button>` : ''}
            </label>
          `;
        case 'range':
          return `
            <div class="game-editor__field-group game-editor__field-group--inline">
              ${renderRangeInputs(fieldDef.label, fieldPath, value ?? ['', ''], fieldDef)}
              ${fieldDef.optional ? `<button type="button" data-action="clear-path" data-entity="${entity}" data-path="${fieldPath}">Clear</button>` : ''}
            </div>
          `;
        case 'number':
          return `
            <label class="game-editor__field">
              <span>${fieldDef.label}</span>
              <input type="number" data-action="set-path" data-entity="${entity}" data-path="${fieldPath}" data-value-type="number" min="${fieldDef.min ?? ''}" max="${fieldDef.max ?? ''}" step="${fieldDef.step ?? '1'}" value="${value ?? ''}" />
              ${fieldDef.optional ? `<button type="button" data-action="clear-path" data-entity="${entity}" data-path="${fieldPath}">Clear</button>` : ''}
            </label>
          `;
        case 'text':
          return `
            <label class="game-editor__field">
              <span>${fieldDef.label}</span>
              <input type="text" data-action="set-path" data-entity="${entity}" data-path="${fieldPath}" value="${value ?? ''}" />
              ${fieldDef.optional ? `<button type="button" data-action="clear-path" data-entity="${entity}" data-path="${fieldPath}">Clear</button>` : ''}
            </label>
          `;
        case 'matcher':
          return this.renderMatcherEditor(entity, fieldPath, value ?? null, fieldDef);
        case 'phases':
          return this.renderPhaseEditor(entity, fieldPath, value ?? []);
        default:
          return '';
      }
    }).join('');
  }

  renderGoalEditor(goal) {
    const goalTypes = this.state.editorDefinition.goalTypes ?? [];
    return `
      <div class="game-editor__field-group">
        <h3>Goal</h3>
        <label class="game-editor__field">
          <span>Goal Type</span>
          <select data-action="set-path" data-entity="level" data-path="goal.type">
            ${goalTypes.map((entry) => `<option value="${entry.value}" ${entry.value === goal?.type ? 'selected' : ''}>${entry.label}</option>`).join('')}
          </select>
        </label>
        <label class="game-editor__field">
          <span>Goal Value</span>
          <input type="number" data-action="set-path" data-entity="level" data-path="goal.value" data-value-type="number" value="${goal?.value ?? ''}" />
        </label>
        <p class="game-editor__field-help">${goalTypes.find((entry) => entry.value === goal?.type)?.description ?? ''}</p>
      </div>
    `;
  }

  renderBonusTierEditor(bonusTiers) {
    return `
        <div class="game-editor__field-group">
          <h3>Bonus Tiers</h3>
        ${(bonusTiers ?? []).map((tier, index) => `
          <div class="game-editor__bonus-row">
            <input type="number" data-action="set-path" data-entity="level" data-path="bonusTiers.${index}.threshold" data-value-type="number" value="${tier.threshold ?? ''}" />
            <input type="number" data-action="set-path" data-entity="level" data-path="bonusTiers.${index}.reward" data-value-type="number" value="${tier.reward ?? ''}" />
            <button type="button" data-action="clear-path" data-entity="level" data-path="bonusTiers.${index}">Remove</button>
          </div>
        `).join('')}
        <button type="button" data-action="add-bonus-tier">Add Bonus Tier</button>
      </div>
    `;
  }

  renderMatcherEditor(entity, path, matcher, fieldDef) {
    const descriptor = this.currentDescriptor;
    const matcherOptions = descriptor?.editor?.matcherTypes ?? [];
    const normalized = typeof matcher === 'string' ? { type: matcher } : matcher;
    const type = normalized?.type ?? 'even';
    return `
      <div class="game-editor__matcher">
        <div class="game-editor__matcher-header">
          <span>${fieldDef.label}</span>
          <button type="button" data-action="clear-path" data-entity="${entity}" data-path="${path}">Clear</button>
        </div>
        <label class="game-editor__field">
          <span>Matcher Type</span>
          <select data-action="matcher-set-type" data-path="${path}" data-matcher-type-select="true">
            ${matcherOptions.map((option) => `<option value="${option.value}" ${option.value === type ? 'selected' : ''}>${option.label}</option>`).join('')}
          </select>
        </label>
        ${type === 'divisible_by' ? `
          <label class="game-editor__field">
            <span>Divisor</span>
            <input type="number" data-action="set-path" data-entity="${entity}" data-path="${path}.divisor" data-value-type="number" value="${normalized?.divisor ?? 2}" />
          </label>
          <label class="game-editor__field">
            <span>Remainder</span>
            <input type="number" data-action="set-path" data-entity="${entity}" data-path="${path}.remainder" data-value-type="number" value="${normalized?.remainder ?? 0}" />
          </label>
        ` : ''}
        ${type === 'less_than_or_equal' || type === 'greater_than_or_equal' ? `
          <label class="game-editor__field">
            <span>Value</span>
            <input type="number" data-action="set-path" data-entity="${entity}" data-path="${path}.value" data-value-type="number" value="${normalized?.value ?? 10}" />
          </label>
        ` : ''}
        ${type === 'not' ? this.renderMatcherEditor(entity, `${path}.rule`, normalized?.rule ?? createDefaultMatcher(), { label: 'Nested Rule' }) : ''}
        ${(type === 'any_of' || type === 'all_of') ? `
          <div class="game-editor__nested-list">
            ${(normalized?.rules ?? []).map((rule, index) => `
              <div class="game-editor__nested-item">
                ${this.renderMatcherEditor(entity, `${path}.rules.${index}`, rule, { label: `Rule ${index + 1}` })}
                <button type="button" data-action="matcher-remove-child" data-path="${path}.rules.${index}">Remove Rule</button>
              </div>
            `).join('')}
            <button type="button" data-action="matcher-add-child" data-path="${path}.rules">Add Rule</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderPhaseEditor(entity, path, phases) {
    return `
      <div class="game-editor__field-group">
        <div class="game-editor__detail-header">
          <h4>Phases</h4>
          <button type="button" data-action="phase-add" data-path="${path}">Add Phase</button>
        </div>
        ${(phases ?? []).map((phase, index) => `
          <div class="game-editor__phase-card">
            <div class="game-editor__detail-header">
              <strong>Phase ${index + 1}</strong>
              <button type="button" data-action="phase-delete" data-path="${path}.${index}">Delete</button>
            </div>
            <label class="game-editor__field">
              <span>Prompt</span>
              <input type="text" data-action="set-path" data-entity="${entity}" data-path="${path}.${index}.prompt" value="${phase.prompt ?? ''}" />
            </label>
            <label class="game-editor__field">
              <span>Switch After Caught</span>
              <input type="number" data-action="set-path" data-entity="${entity}" data-path="${path}.${index}.switchAfterCaught" data-value-type="number" value="${phase.switchAfterCaught ?? ''}" />
            </label>
            ${renderRangeInputs('Number Range', `${path}.${index}.numberRange`, phase.numberRange ?? ['', ''], { min: 0, max: 100, step: 1 })}
            ${renderRangeInputs('Spawn Delay', `${path}.${index}.spawnDelayRange`, phase.spawnDelayRange ?? ['', ''], { min: 0.1, max: 5, step: 0.05 })}
            ${renderRangeInputs('Fall Speed', `${path}.${index}.fallSpeedRange`, phase.fallSpeedRange ?? ['', ''], { min: 20, max: 300, step: 5 })}
            ${this.renderMatcherEditor(entity, `${path}.${index}.matcher`, phase.matcher ?? createDefaultMatcher(), { label: 'Phase Matcher' })}
          </div>
        `).join('')}
      </div>
    `;
  }

  renderRecipePreview(preview) {
    if (!preview) {
      return '<div class="game-editor__preview-card"><h3>Preview</h3><p>No preview available.</p></div>';
    }
    if (preview.type === 'collection') {
      return `
        <div class="game-editor__preview-card">
          <h3>Sample Targets</h3>
          ${(preview.phases ?? []).map((phase) => `
            <div class="game-editor__preview-phase">
              <strong>${phase.label}</strong>
              ${phase.switchAfterCaught != null ? `<span>Switch after ${phase.switchAfterCaught} catches</span>` : ''}
              <div class="game-editor__sample-grid">
                ${(phase.samples ?? []).map((sample) => `<span class="game-editor__sample-pill ${sample.match ? 'game-editor__sample-pill--good' : 'game-editor__sample-pill--bad'}">${sample.value}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
    return `
      <div class="game-editor__preview-card">
        <h3>Example Question / Answer Pairs</h3>
        ${(preview.rounds ?? []).map((round) => `
          <div class="game-editor__preview-round">
            <strong>${round.equation}</strong>
            <div>Correct: ${round.answer}</div>
            <div>Choices: ${round.options.join(', ')}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderCenterPanel() {
    const slots = this.state.game.levelSelect?.slots ?? [];
    const world = this.selectedWorld;
    const levelsBySlot = new Map((world?.levels ?? []).map((level) => [level.slot, level]));
    const selectedLevel = this.selectedLevel;
    const previewSource = (selectedLevel && this.service.getResolvedLevel(this.state.validation, selectedLevel.levelId)?.resolvedRecipe)
      || this.service.getResolvedRecipe(this.state.validation, this.currentRecipeId)
      || (this.currentRecipe ? {
        id: this.currentRecipeId,
        title: this.currentRecipe.title,
        prompt: this.currentRecipe.prompt,
        rules: this.currentRecipe.rules,
        scoring: this.currentRecipe.scoring,
        kind: this.currentRecipe.kind,
      } : null);
    const preview = previewSource && this.currentDescriptor?.editor?.preview
      ? this.currentDescriptor.editor.preview(previewSource)
      : null;

    return `
      <section class="game-editor__center-column">
        <div class="game-editor__map-card">
          <div class="game-editor__map-header">
            <h2>${world?.title ?? 'Level Slots'}</h2>
            <span>${world?.levels?.length ?? 0} levels</span>
          </div>
          <div class="game-editor__slot-map" style="background-image:url(${this.state.game.levelSelect?.backgroundPath ?? ''})">
            ${slots.map((slot) => {
              const level = levelsBySlot.get(slot.slot);
              return `
                <button
                  type="button"
                  class="game-editor__slot ${level ? 'game-editor__slot--filled' : 'game-editor__slot--empty'} ${selectedLevel?.levelId === level?.levelId ? 'game-editor__slot--selected' : ''}"
                  data-action="${level ? 'select-level' : 'create-level'}"
                  data-world-id="${world?.id ?? ''}"
                  data-level-id="${level?.levelId ?? ''}"
                  data-slot="${slot.slot}"
                  style="left:${slot.x * 100}%;top:${slot.y * 100}%;width:${slot.r * 220}%;height:${slot.r * 220}%"
                >
                  ${level ? level.levelNum : '+'}
                </button>
              `;
            }).join('')}
          </div>
        </div>
        <div class="game-editor__preview-stack">
          <div class="game-editor__preview-card">
            <h3>Level Bubble Summary</h3>
            ${selectedLevel ? `
              <p><strong>${selectedLevel.label}</strong></p>
              <p>${formatGoal(selectedLevel.goal)}</p>
              <p>Reward: ${selectedLevel.clearReward ?? 0} coins</p>
              <p>Bonuses: ${formatBonusTiers(selectedLevel.bonusTiers)}</p>
            ` : '<p>Select a level to inspect its summary.</p>'}
          </div>
          ${this.renderRecipePreview(preview)}
        </div>
      </section>
    `;
  }

  renderErrorBlock(errors) {
    if (!errors?.length) return '';
    return `
      <div class="game-editor__error-list">
        ${errors.map((error) => `<div class="game-editor__error-item">${error.message}</div>`).join('')}
      </div>
    `;
  }

  renderSidebar() {
    const selectedWorld = this.selectedWorld;
    const recipes = Object.entries(this.state.game.recipes ?? {});
    return `
      <aside class="game-editor__sidebar">
        <section class="game-editor__sidebar-section">
          <div class="game-editor__section-header">
            <h2>Worlds</h2>
          </div>
          ${this.state.worlds.map((world) => `
            <button type="button" class="game-editor__list-item ${world.id === this.state.selectedWorldId && this.state.selectionMode === 'world' ? 'is-selected' : ''}" data-action="select-world" data-world-id="${world.id}">
              <span>${world.title}</span>
              ${this.state.dirtyWorldIds.has(world.id) ? '<em>Dirty</em>' : ''}
            </button>
          `).join('')}
        </section>
        <section class="game-editor__sidebar-section">
          <div class="game-editor__section-header">
            <h2>Levels</h2>
            <button type="button" data-action="create-level">New</button>
          </div>
          ${(selectedWorld?.levels ?? []).slice().sort((a, b) => a.levelNum - b.levelNum).map((level) => `
            <button type="button" class="game-editor__list-item ${level.levelId === this.state.selectedLevelId && this.state.selectionMode === 'level' ? 'is-selected' : ''}" data-action="select-level" data-world-id="${selectedWorld.id}" data-level-id="${level.levelId}">
              <span>${level.levelNum}. ${level.label}</span>
              <small>Slot ${level.slot}</small>
            </button>
          `).join('')}
        </section>
        <section class="game-editor__sidebar-section">
          <div class="game-editor__section-header">
            <h2>Recipe Library</h2>
            <button type="button" data-action="create-recipe">New</button>
          </div>
          ${recipes.map(([recipeId, recipe]) => `
            <button type="button" class="game-editor__list-item ${recipeId === this.state.selectedRecipeId && this.state.selectionMode === 'recipe' ? 'is-selected' : ''}" data-action="select-recipe" data-recipe-id="${recipeId}">
              <span>${recipe.title}</span>
              <small>${recipeId}</small>
            </button>
          `).join('')}
        </section>
      </aside>
    `;
  }

  renderTopBar() {
    return `
      <header class="game-editor__topbar">
        <div class="game-editor__title-group">
          <h1>Math Garden Content Editor</h1>
          <p>Worlds, levels, recipes, and previews</p>
        </div>
        <div class="game-editor__meta">
          <label class="game-editor__field">
            <span>Game</span>
            <input type="text" value="${this.state.editorDefinition?.label ?? this.gameId}" readonly />
          </label>
          <label class="game-editor__field">
            <span>Current World</span>
            <select data-action="select-world-dropdown">
              ${this.state.worlds.map((world) => `<option value="${world.id}" ${world.id === this.state.selectedWorldId ? 'selected' : ''}>${world.title}</option>`).join('')}
            </select>
          </label>
        </div>
        <div class="game-editor__actions">
          <button type="button" data-action="reload-editor">Reload</button>
          <button type="button" data-action="save-world" ${this.selectedWorld && !this.state.dirtyWorldIds.has(this.selectedWorld.id) ? 'disabled' : ''}>Save World</button>
          <button type="button" data-action="save-recipes" ${!this.state.dirtyGame ? 'disabled' : ''}>Save Recipes</button>
          <button type="button" data-action="save-all" ${(!this.state.dirtyGame && this.state.dirtyWorldIds.size === 0) ? 'disabled' : ''}>Save All</button>
        </div>
        <div class="game-editor__status game-editor__status--${this.state.status.tone}">
          ${this.state.saving ? 'Saving… ' : ''}${this.state.status.text}
        </div>
      </header>
    `;
  }

  render() {
    const validationSummary = this.state.validation.errors.length
      ? `<div class="game-editor__validation-summary">${this.state.validation.errors.length} validation issue(s)</div>`
      : '<div class="game-editor__validation-summary game-editor__validation-summary--ok">Validation clean</div>';

    this.host.innerHTML = `
      <div class="game-editor">
        ${this.renderTopBar()}
        <div class="game-editor__body">
          ${this.renderSidebar()}
          ${this.renderCenterPanel()}
          <aside class="game-editor__details">
            ${validationSummary}
            ${this.renderRightPanel()}
          </aside>
        </div>
      </div>
    `;

    const worldSelect = this.host.querySelector('[data-action="select-world-dropdown"]');
    if (worldSelect) {
      worldSelect.addEventListener('change', (event) => {
        this.state.selectedWorldId = event.target.value;
        this.state.selectionMode = 'world';
        this.state.selectedLevelId = null;
        this.render();
      });
    }

    const recipeRenameInput = this.host.querySelector('[data-role="recipe-id-input"]');
    if (recipeRenameInput) {
      recipeRenameInput.addEventListener('change', (event) => {
        this.renameCurrentRecipeId(event.target.value);
      });
    }

    this.host.querySelectorAll('input[type="checkbox"][data-value-type="boolean"]').forEach((input) => {
      input.addEventListener('change', () => {
        this.setEntityPath(input.dataset.entity, input.dataset.path, input.checked);
      });
    });

    this.host.querySelectorAll('[data-matcher-type-select="true"]').forEach((select) => {
      select.addEventListener('change', () => {
        this.setMatcherType(select.dataset.path, select.value);
      });
    });

    this.host.querySelectorAll('[data-action="add-bonus-tier"]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!this.selectedWorld || !this.selectedLevel) return;
        this.withWorldMutation(this.selectedWorld.id, (world) => {
          const authoredLevel = world.levels.find((entry) => entry.levelId === this.selectedLevel.levelId);
          authoredLevel.bonusTiers = authoredLevel.bonusTiers ?? [];
          authoredLevel.bonusTiers.push({ threshold: 0, reward: 0 });
        });
      });
    });

    const bindBoxInputs = (roles, key) => {
      const inputs = roles.map((role) => this.host.querySelector(`[data-role="${role}"]`)).filter(Boolean);
      inputs.forEach((input) => {
        input.addEventListener('input', () => {
          const world = this.selectedWorld;
          if (!world) return;
          const values = roles.map((role) => this.host.querySelector(`[data-role="${role}"]`)?.value ?? '');
          this.withWorldMutation(world.id, (authoredWorld) => {
            if (values.every((entry) => entry !== '')) {
              authoredWorld[key] = {
                x: Number(values[0]),
                y: Number(values[1]),
                w: Number(values[2]),
                h: Number(values[3]),
              };
            } else {
              delete authoredWorld[key];
            }
          });
        });
      });
    };
    bindBoxInputs(['signbox-x', 'signbox-y', 'signbox-w', 'signbox-h'], 'signBox');
    bindBoxInputs(['clickbox-x', 'clickbox-y', 'clickbox-w', 'clickbox-h'], 'clickBox');
  }
}
