# Capy Village — Post-Implementation Fix Plan (Final Review Approved)

## Status
The new architecture is **accepted** but **NOT yet complete** from an authoring UX perspective.

This document defines the **required final fixes**.  
Once these are implemented, the system will meet the intended goals.

---

# ✅ Definition of DONE

The system is considered **complete and correct** only if:

1. A developer can add a level **without guessing any keys**
2. JSON files provide **autocomplete + validation**
3. Docs match the **actual implementation**
4. Schema reflects **real constraints (types, enums, structure)**
5. No misleading or outdated artifacts remain

---

# 🔧 REQUIRED FIXES

---

## 1. Fix Authoring Documentation (CRITICAL)

### Problem
Current doc:
- describes OLD system (`modeId`, `type`, `params`)
- does NOT match new system (`recipeId`, `kind`, `rules`, `scoring`)

### Action
Rewrite:
```
docs/minigame_mode_authoring.md
```

### Must include:

#### Core Concepts
- game.json structure
- recipes
- worlds
- levels
- overrides

#### Example (minimal valid)
```json
{
  "recipes": {
    "collect_even": {
      "kind": "collect_numbers",
      "rules": {
        "matcher": "even",
        "numberRange": [1, 20]
      },
      "scoring": {
        "pointsPerCorrect": 2
      }
    }
  }
}
```

#### Example (full level)
```json
{
  "levelId": "level_1",
  "recipeId": "collect_even",
  "overrides": {
    "rules": {
      "numberRange": [1, 10]
    }
  }
}
```

#### List explicitly:
- allowed `kind` values
- allowed `rules.matcher` values
- allowed override fields

---

## 2. Fix JSON Schema (CRITICAL)

### Problem
Schema currently uses `{}` placeholders → useless for UX

### Action
Update:
```
math_garden.game.schema.json
```

### Must include:

#### Strong typing
- `numberRange`: array [number, number]
- `pointsPerCorrect`: number
- `wrongPenalty`: number

#### Enum constraints
```json
"matcher": {
  "type": "string",
  "enum": ["even", "odd", "prime", "divisible_by"]
}
```

#### Level structure
```json
"levels": {
  "type": "array",
  "items": {
    "type": "object",
    "required": ["levelId", "recipeId"],
    "properties": {
      "levelId": { "type": "string" },
      "recipeId": { "type": "string" },
      "overrides": {
        "type": "object",
        "properties": {
          "rules": { "type": "object" },
          "scoring": { "type": "object" }
        }
      }
    }
  }
}
```

### Result
- autocomplete works
- invalid keys rejected
- developer does NOT guess

---

## 3. Enforce Strict Validation in Runtime

### Problem
Some parts loosely validated

### Action
In pluginUtils:

#### Add validation for:
- `manifest.defaults`
- `world.defaults`
- level object shape
- unknown keys → ERROR (not ignore)

#### Improve error messages

BAD:
```
Invalid config
```

GOOD:
```
recipes.collect_even.rules.matcher:
expected one of ["even","odd","prime"], got "divide"
```

---

## 4. Fix Review Bundle Accuracy

### Problem
Review doc claims:
- scripts exist
- generation done

But:
- no script in package.json
- commit not finalized

### Action

Either:
#### Option A (preferred)
Add script:
```
"generate:authoring": "node scripts/generateSchemas.js"
```

OR

#### Option B
Update review doc to reflect reality

### Also:
- add real commit hash
- remove "pending"

---

## 5. Reduce Plugin Registry Feel (Minor Improvement)

### Problem
`handlerMap` still acts like mini registry

### Action
Refactor plugin:

Instead of:
```js
handlerMap = {
  collect_numbers: handler
}
```

Use:
```js
modeDescriptors = [collectNumbersMode]
```

And derive handler from descriptor

### Result
- removes duplication
- true single source of truth

---

# 🧪 FINAL UX TEST (MANDATORY)

After fixes, test these EXACT scenarios:

---

## Test 1 — Add Level

Expected:
- edit ONE file only
- autocomplete works
- no guessing

---

## Test 2 — Add Recipe

Expected:
- edit ONE file only
- schema suggests valid keys
- enum suggestions visible

---

## Test 3 — Add World

Expected:
- edit ONE file OR add ONE world file
- no other changes

---

## Test 4 — Make Mistake

Example:
```json
"matcher": "divide"
```

Expected:
- clear error message
- shows allowed values

---

# 🎯 FINAL VERDICT

Architecture: ✅ GOOD  
Runtime structure: ✅ GOOD  
Plugin system: ✅ GOOD  

Authoring UX: ❌ NOT COMPLETE → FIX REQUIRED

---

# 🚀 AFTER THESE FIXES

The system will achieve:

- minimal file touching
- zero guessing JSON authoring
- clear hierarchy (game → world → level)
- extensibility without central bottlenecks

---

# ✅ APPROVAL CONDITION

I will say **"THIS IS GOOD"** only after:

- schema is strict and usable
- docs match implementation
- validation is strong and helpful
- review doc is accurate

Until then:
**do not consider implementation complete**
