# Capy Village — Recommended Architecture Plan for Worlds / Levels / Modes

## Executive Summary

After reviewing the current repo structure and comparing it against the alternative plugin/primitives proposal, the best direction is:

**Keep the current runtime class hierarchy, remove the global mode registry as an authoring bottleneck, introduce per-game plugins with colocated mode descriptors, and collapse authoring into one conceptual game manifest with optional physical file splitting.**

This gives the best balance of:
- low file-touch count
- obvious author workflow
- extensibility for new games
- runtime clarity
- generated schema/docs from one source of truth
- minimal architectural magic

This document first stress-tests the competing approaches with realistic developer scenarios, then proposes the final design.

---

# 1. What Problem We Are Actually Solving

The real problem is **not** just that `modeRegistry.js` exists.

The real problem is that a developer authoring a game or mode must currently understand and coordinate multiple layers:

- runtime handler classes
- a global registry
- JSON recipes
- level files
- schema/docs drift

That creates too much framework tax for common tasks.

The target user experience should be:

- **new level** → obvious JSON-only change
- **new world** → obvious JSON-only change
- **new recipe using an existing mode family** → obvious JSON-only change
- **new game using existing engine behavior** → one plugin + one config
- **new gameplay family** → one new engine primitive + one plugin, nothing central

---

# 2. Scenario Stress Test

Below are the scenarios that matter most. A good design should optimize these first.

---

## Scenario A — Add one new level to an existing world

Example:
- Add level 7 to `number_garden`
- Reuse an existing recipe
- Change only reward, goal, and difficulty override

### Best possible UX
Developer should:
- open one obvious JSON file
- add one new level object
- be done

### Current design
Likely touches:
- per-world levels file
- maybe `modes.json` if recipe not reusable
- maybe schema/docs if new keys are unclear

### Other agent's plan
Touches:
- `levels/<worldId>_levels.json`
- maybe `mode_recipes.json`

This is decent.

### My final recommendation
Touches:
- `game.json` or `worlds/number_garden.json` only
- optionally a recipe section if reusing is not possible

**Verdict:** author should not have to think about registry, runtime, or engine names.

---

## Scenario B — Add a new world to an existing game

Example:
- Add `multiplication_meadow`
- 10 levels
- mostly reuses existing recipes

### Best possible UX
Developer should:
- add one world file or one world object
- maybe add world metadata in one known place
- not touch runtime code

### Current design
Likely touches:
- `world_select.json`
- per-world level file
- possibly `level_select.json`
- maybe mode references depending on structure

Too fragmented.

### Other agent's plan
Touches:
- `world_select.json`
- `level_select.json`
- `levels/<worldId>_levels.json`

Better, but still split into multiple conceptual places for one authoring action.

### My final recommendation
Touches:
- `game.json` or `worlds/multiplication_meadow.json`
- nothing else unless there is custom art/layout metadata

**Verdict:** optional splitting is fine; mandatory splitting is not.

---

## Scenario C — Add a new recipe within an existing gameplay family

Example:
- New Math Garden recipe `collect_prime`
- Same collect mechanic
- Different rule set only

### Best possible UX
Developer should:
- add one recipe object
- reference it from a level
- never touch runtime code

### Current design
Often touches:
- `modes.json`
- level file
- maybe registry/schema if the contract is unclear

### Other agent's plan
Touches:
- `mode_recipes.json`
- level file

Good.

### My final recommendation
Touches:
- recipe section inside `game.json` or world file
- one level reference

Also good.

**Verdict:** both proposals improve this a lot. The important part is that the contract is obvious and generated from code, not hand-maintained elsewhere.

---

## Scenario D — Add a new game that reuses an existing engine behavior

Example:
- New minigame uses falling collect behavior
- Custom art/content and rules
- No new engine primitive

### Best possible UX
Developer should:
- create one plugin
- create one config
- register the game in one obvious place

### Current design
Likely touches:
- game class
- GameManager registration path
- global registry
- config files
- possibly schemas

Too many coordination points.

### Other agent's plan
Touches:
- one plugin module
- config JSON

Good.

### My final recommendation
Touches:
- one plugin entry
- one game shell if needed
- one config manifest

Also good.

**Verdict:** plugin-based is correct here.

---

## Scenario E — Add a truly new gameplay family

Example:
- A drag-and-drop sorting mode
- Not collect/answer/choice
- Needs new runtime loop

### Best possible UX
Developer should:
- add one engine primitive
- add one mode descriptor/plugin
- create authored config
- no central registry edits

### Current design
This likely ripples through:
- registry
- handler creation
- validation
- docs/schema
- config

### Other agent's plan
Touches:
- one primitive module
- one plugin

Good.

### My final recommendation
Touches:
- one primitive
- one per-game mode descriptor/plugin
- authored config

Also good.

**Verdict:** the central registry should not exist in this world.

---

# 3. Skeptical Review of the Other Agent's Plan

The uploaded plan has several strong ideas:
- remove the global registry
- use engine primitives
- use per-game plugins
- generate validation/docs/schema from plugin contracts
- keep author JSON game-facing instead of engine-facing fileciteturn1file0

Those are directionally correct.

But there are several important weaknesses.

---

## Weakness 1 — It still over-fragments authoring

The plan recommends separate files like:
- `world_select.json`
- `level_select.json`
- `mode_recipes.json`
- `levels/<worldId>_levels.json` fileciteturn1file0

This is better than today in some ways, but still not ideal for author UX.

For common tasks like “add a new world,” the author still has to understand multiple files:
- world metadata
- level layout/progression metadata
- levels
- recipes

That is still too spread out for the most common content operations.

### Why this matters
A framework should optimize the most frequent actions first.
World and level authoring are frequent.
Splitting their data across several mandatory files is unnecessary complexity.

---

## Weakness 2 — “Engine primitives” can become a second registry if not carefully constrained

The plan says engine primitives would live under something like:
- `engine/primitives/`
- `plugins/` fileciteturn1file0

That can be good.
But if every new idea gets turned into a new primitive too early, you just reinvent a new central abstraction layer with different names.

### Risk
Developers may start asking:
- is this a new primitive?
- is this just plugin logic?
- where should this rule live?
- is `collect_prime` data, plugin logic, or primitive logic?

If those boundaries are not explicit, the system becomes conceptually muddy.

### Fix
Keep the primitive set deliberately tiny.
Only promote something to an engine primitive when:
- at least 2 games use it
- its lifecycle/UI loop is truly shared
- it is stable enough to deserve engine-level ownership

Everything else should stay in game plugin land.

---

## Weakness 3 — The plan hides some complexity inside “plugin contracts”

The plan says plugin contracts should own:
- kinds
- validation
- runtime creation
- docs
- schema
- defaults fileciteturn1file0

That is mostly right, but there is a design risk:

If the plugin contract becomes too broad, it turns into a mini-registry per game instead of a clean, typed descriptor.

### Risk
One plugin file becomes a giant bag of:
- handlers
- validation DSL
- docs
- factories
- examples
- normalization

That is better than one global file, but still not a great developer experience.

### Fix
Use **small colocated mode descriptors**, not one giant plugin blob.

Per game, use:
- one `plugin.ts` file to export and register
- multiple `modeType` descriptor files, one per mode family or mode type
- one tiny shared contract helper for validation/doc generation

That keeps the source of truth local and readable.

---

## Weakness 4 — It improves the vocabulary, but not enough the inheritance model

The uploaded plan improves naming:
- `recipeId`
- `kind`
- `rules`
- `scoring` fileciteturn1file1

Good.

But it does not sufficiently define hierarchical content inheritance across:
- game defaults
- world defaults
- level overrides

Without that, authors will still repeat a lot of JSON.

### Fix
Make inheritance first-class:
- game-wide defaults
- per-world defaults
- per-level overrides
- clear override policy generated from the mode descriptor

This is essential for the “structured hierarchical framework” you asked for.

---

# 4. Skeptical Review of My Earlier Proposal

My earlier proposal had the right direction, but it also needed tightening.

## Weakness 1 — A single `game.json` can become too large
True for larger games.

### Fix
Use **one conceptual schema**, but allow optional file splitting:
- small games: one `game.json`
- larger games: `game.json` + `worlds/*.json`

The schema stays the same.
Only the physical layout changes.

---

## Weakness 2 — Plugin discovery can become too magical
If plugins are auto-discovered through globbing, the architecture becomes less obvious.

### Fix
Use one explicit bootstrap registration file.
No hidden discovery magic.

---

## Weakness 3 — Code-first contracts alone can feel developer-heavy
True.

### Fix
Generate:
- JSON Schema
- markdown docs
- examples

from the same descriptor metadata.

That gives non-engineers a clear authoring surface.

---

# 5. Final Recommended Design

This is the design I would approve as a senior software architect.

---

## Layer 1 — Stable Engine Primitives

Keep a small, stable engine core.

Examples:
- `CollectPrimitive`
- `AnswerPrimitive`
- `ChoiceRoundPrimitive`

These should represent **runtime loops**, not game-specific semantics.

They should know about:
- item spawning cadence
- round flow
- scoring hooks
- win/loss hooks
- timer/goal lifecycle
- input lifecycle

They should **not** know about:
- math divisibility
- language categories
- fruit-specific logic
- content generation details

### Rule
A new primitive is added only if it is reusable across multiple games.

---

## Layer 2 — Per-Game Plugins

Each game has one plugin entry point:

- owns its mode descriptors
- owns game-specific generators/resolvers
- maps descriptors to primitives
- validates authored data using descriptor metadata

Example:
- `math_garden/plugin.ts`
- `language_grove/plugin.ts`

The plugin should be small.
Its job is coordination, not storing all details inline.

---

## Layer 3 — Per-Mode Descriptors (Colocated, Typed, Small)

Each mode type gets its own descriptor file.

Example:
- `collectNumbers.mode.ts`
- `answerEquation.mode.ts`

Each descriptor defines:
- author-facing `kind`
- which primitive it uses
- recipe fields
- defaults
- allowed level overrides
- examples/docs metadata
- a resolver that turns recipe + level override into runtime config

This is the true single source of truth.

It replaces the current split between:
- runtime mode class
- global registry metadata
- schema
- docs

---

## Layer 4 — Authored Game Manifest

Use one conceptual authoring model.

Default:
- `public/config/games/<gameId>/game.json`

Optional split for larger games:
- `game.json`
- `worlds/<worldId>.json`

The schema is the same in both cases.

### Authoring model

```json
{
  "id": "math_garden",
  "defaults": {
    "timeLimit": 60,
    "goal": { "type": "catchCount", "value": 5 }
  },
  "recipes": {
    "collect_even_basic": {
      "kind": "collect_numbers",
      "title": "Collect Even Numbers",
      "prompt": "Catch even numbers!",
      "rules": {
        "matcher": "divisible_by",
        "divisor": 2,
        "remainder": 0,
        "numberRange": [1, 20]
      },
      "scoring": {
        "pointsPerCorrect": 2,
        "wrongPenalty": 1
      }
    }
  },
  "worlds": [
    {
      "id": "number_garden",
      "title": "Number Garden",
      "defaults": {
        "recipeId": "collect_even_basic"
      },
      "levels": [
        {
          "levelId": "number_garden_1",
          "levelNum": 1,
          "label": "Warm-Up",
          "overrides": {
            "rules": {
              "numberRange": [1, 10]
            }
          }
        }
      ]
    }
  ]
}
```

### Why this is better
- one obvious place to author content
- hierarchy is explicit
- no mandatory fragmentation
- easy to split later by world if needed

---

## Layer 5 — Generated Schema / Docs / Validation

Generate these from descriptors:
- runtime validation
- JSON schema
- authoring docs
- examples

Do not hand-maintain multiple contract definitions.

---

# 6. Design Rules That Keep This Clean

## Rule A — One source of truth per mode type
A mode type should be defined once.

## Rule B — Primitives are generic runtime loops only
No game semantics in primitives.

## Rule C — Plugins coordinate, descriptors define
Plugin file should stay thin.

## Rule D — Content hierarchy is first-class
Support:
- game defaults
- world defaults
- level overrides

## Rule E — Optional file splitting only
Teach one schema, not many conceptual schemas.

## Rule F — No central global registry
No more bottleneck file for every new addition.

---

# 7. What a Developer Touches in the Final Design

## Add a new level
- edit one world file or `game.json`

## Add a new world
- edit `game.json` or add one `worlds/<worldId>.json`

## Add a new recipe in an existing mode family
- edit recipe section in config only

## Add a new game using existing primitives
- add one plugin
- add one config manifest
- optionally add a shell class

## Add a new gameplay family
- add one primitive
- add one descriptor
- add plugin wiring
- add config

This is the best practical balance between extensibility and author simplicity.

---

# 8. Migration Strategy

## Phase 1 — Introduce descriptors and plugins without breaking runtime
- add per-game plugin structure
- add descriptor helper utilities
- adapt one game first, preferably Math Garden
- keep an adapter from old config to new runtime if needed

## Phase 2 — Collapse authoring model
- move from `modes.json` + multiple selection files toward `game.json`
- support optional world file splitting

## Phase 3 — Generate schema/docs
- emit JSON schema from descriptors
- emit authoring markdown/examples from descriptors

## Phase 4 — Remove old registry path
- delete `modeRegistry.js`
- remove old schema duplication
- remove old config normalization path

---

# 9. Final Recommendation

The uploaded plan is good in direction, but it still keeps too much mandatory authoring fragmentation and risks turning plugin contracts into another complex layer. fileciteturn1file0turn1file1

The strongest final design is:

- **small stable engine primitives**
- **thin per-game plugins**
- **colocated per-mode descriptors as the single source of truth**
- **one conceptual game manifest with optional physical file splitting**
- **first-class inheritance through defaults and overrides**
- **generated schema/docs from descriptors**

That is the cleanest design for both:
- engine developers
- content authors

and it minimizes the number of files a developer has to understand and touch for the most common tasks.
