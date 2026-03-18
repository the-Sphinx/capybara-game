# Language Grove Minigame — Implementation Plan

## Objective

Implement the **Language Grove** category of minigames in Capy Village, reusing the existing `fallingChoices` mechanic from Math Garden.

---

## Specs Consumed

- `docs/capy_language_grove_minigame_spec.md` — letter-selection modes (vowels, consonants, lettersInWord, missingLetter, caseMatch)
- `docs/capy_language_grove_falling_games_spec.md` — word-level modes (categoryCatch, sentenceCompletion, opposites, synonyms, riddle)
- `docs/capy_village_universal_hud_spec.md` — universal HUD, arcade/adventure distinction

---

## Architecture Decision

Two sub-engines inside `LanguageGroveGame`, mirroring MathGarden:

| Engine | Mechanic | Modes |
|--------|----------|-------|
| `stream` | Items fall one-at-a-time continuously. Catch correct ones, avoid wrong ones. | vowels, consonants, categoryCatch, lettersInWord |
| `choiceRound` | Prompt shown in HUD center. 3–4 word tiles fall at once. Exactly one correct answer per round. Correct catch → next round. | sentenceCompletion, opposites, synonyms, riddle |

**Explicitly postponed** (not in this version):
- `missingLetter` — multi-step interaction, needs word reveal logic
- `caseMatch` — needs mixed case rendering (future)
- `pictureLetterCatch` — needs image assets

---

## Files

### New files (4)

1. `capy-village/src/games/languageGrove/content.js`
   - Word/prompt data: vowels, consonants, category word lists, sentences, opposites, synonyms, riddles

2. `capy-village/src/games/languageGrove/LanguageGroveGame.js`
   - Extends `BaseGame`
   - Stream engine + ChoiceRound engine
   - HUD: same structure as MathGarden (left=goal, center=prompt/level, right=timer)
   - Reuses `mg-tile`, `mg-feedback`, `wmc-root`, `wmc-play-area`, `wmc-hud` CSS classes

3. `capy-village/src/games/languageGrove/adventure.json`
   - 10 levels, mix of modes, increasing difficulty

4. `capy-village/src/games/languageGrove/arcade.json`
   - Arcade config with all 8 modes and weights

### Modified files (2)

5. `capy-village/src/main.js`
   - Import and register `language_grove` game, levels, arcade config

6. `capy-village/public/data/categories.json`
   - Set `comingSoon: false`, `gameId: "language_grove"` for Language Grove entry

---

## Content Plan (`content.js`)

```
VOWELS = [A, E, I, O, U]
CONSONANTS = [B, C, D, F, G, H, J, K, L, M, N, P, Q, R, S, T, V, W, X, Y, Z]
ALL_LETTERS = A–Z

CATEGORIES:
  animals      = [DOG, CAT, LION, BIRD, FISH, BEAR, FROG, DUCK, WOLF, DEER]
  fruits       = [APPLE, MANGO, GRAPE, PEACH, LEMON, MELON, BERRY, PLUM, LIME, PEAR]
  colors       = [RED, BLUE, GREEN, PINK, GOLD, GRAY, BROWN, BLACK, WHITE, ORANGE]
  foods        = [BREAD, RICE, SOUP, CAKE, MILK, MEAT, CORN, BEAN, EGG, PIZZA]
  clothes      = [SHIRT, PANTS, HAT, COAT, SOCK, BOOT, SCARF, DRESS, GLOVE, CAP]
  flyingThings = [BIRD, PLANE, BEE, KITE, BAT, CLOUD, ROCKET, OWL, WASP, EAGLE]

SENTENCES (15 entries)
OPPOSITES (15 entries)
SYNONYMS (15 entries)
RIDDLES (10 entries)
```

---

## Adventure Level Design (10 levels)

| # | Label | Mode | SubType | Goal | Time | Reward |
|---|-------|------|---------|------|------|--------|
| 1 | Vowel Garden | vowels | stream | catch 3 | 60s | 15 |
| 2 | More Vowels | vowels | stream | catch 5 | 55s | 20 |
| 3 | Consonant Trail | consonants | stream | catch 5 | 55s | 20 |
| 4 | Animal Friends | categoryCatch / animals | stream | catch 4 | 60s | 25 |
| 5 | Fruit Basket | categoryCatch / fruits | stream | catch 4 | 55s | 25 |
| 6 | Finish the Sentence | sentenceCompletion | choiceRound | correct 3 | 60s | 30 |
| 7 | Letters in DOG | lettersInWord / DOG | stream | catch 3 | 45s | 30 |
| 8 | Opposites! | opposites | choiceRound | correct 4 | 55s | 35 |
| 9 | Flying Things | categoryCatch / flyingThings | stream | catch 5 | 50s | 40 |
| 10 | Word Wizard | synonyms | choiceRound | correct 5 | 50s | 50 |

---

## Arcade Config

8 modes with weights. Weighted random mode selection per arcade run.

| Mode ID | Label | SubType | Weight |
|---------|-------|---------|--------|
| vowels | Vowel Catch | stream | 2 |
| consonants | Consonant Catch | stream | 2 |
| categoryCatch_animals | Animal Words | stream | 3 |
| categoryCatch_foods | Food Words | stream | 2 |
| sentenceCompletion | Sentence Finish | choiceRound | 2 |
| opposites | Opposites | choiceRound | 2 |
| synonyms | Synonyms | choiceRound | 2 |
| riddle | Riddle Catch | choiceRound | 1 |

---

## HUD Layout

Reuse existing MathGarden HUD CSS. Center section shows:
- **stream modes**: level line + instruction (e.g. "Catch the Vowels" / "Catch: ANIMALS")
- **choiceRound modes**: level line + current prompt (e.g. "Opposite of: HOT")

---

## Stream Engine Details

- Spawn one text tile every 0.8–1.2s (tunable via `fallSpeed`)
- Tile falls at base 120 px/s scaled by level's `fallSpeed`
- Correct item caught → +pts, combo++, goalCount++
- Wrong item caught → combo reset, feedback "Wrong!"
- Item falls off → if correct, missed++, combo reset
- Goal: catch N correct items (catchCount goalType)

For `lettersInWord`: display target word in center HUD. Falling letters are mix of letters from the word + random others. Catching a letter IN the word = correct.

For `categoryCatch`: display category name in center HUD. Falling words are mix of category members + distractors from a different category.

---

## ChoiceRound Engine Details

- Show prompt text in HUD center
- Spawn 3–4 word tiles simultaneously at different X positions, staggered -Y offsets
- Exactly one is correct
- Correct tile caught → next round, goalCount++
- Wrong tile caught → shake animation, wrong sound
- Correct tile falls off → round skipped, missed++
- Goal: N correct rounds (correctAnswers goalType)

---

## Tile CSS Note

Long words need wider tiles. Solution: override `mg-tile` width in Language Grove context:
```css
.lg-tile { width: auto; min-width: 72px; padding: 0 16px; }
```
Add `lg-tile` class alongside `mg-tile` for Language Grove, so existing MathGarden tiles are unaffected.

---

## Implementation Subtasks

- [x] 1. Create `content.js` with all word/prompt data
- [x] 2. Create `LanguageGroveGame.js` (constructor, start, stream engine, choiceRound engine, _endGame)
- [x] 3. Create `adventure.json` and `arcade.json`
- [x] 4. Register in `main.js`, enable in `categories.json`
- [x] 5. Verify locally with Playwright — PASS (HUD, tiles spawning, timer, goal counter all confirmed)
- [ ] 6. Commit and push

---

## Edge Cases to Handle

1. **Long tile words** — use `lg-tile` class with `width: auto; min-width: 72px`
2. **ChoiceRound**: guarantee exactly 1 correct tile per round
3. **Stream**: enforce minimum 1 correct item per spawn batch (not all wrong)
4. **Category distractors**: pick from a DIFFERENT category to keep it unambiguous
5. **Content exhaustion**: shuffle + loop arrays when content runs out in arcade

---

## Self-Review

**Strengths:**
- Reuses MathGarden CSS, HUD structure, result screen — minimal new UI work
- Clean two-engine design mirrors existing patterns exactly
- 8 distinct modes gives variety without over-engineering
- Content data in its own module — easy to expand later

**Risks / mitigations:**
- Tile width for long words → `lg-tile` CSS class with auto width
- Content variety: 15 sentences + 15 opposites + 15 synonyms + 10 riddles is sufficient for arcade
- `lettersInWord` correctness: correct = letter IS IN word (not which position), allows multiple correct tiles per round — adds natural variety

**Confirmed scope:** satisfies both spec documents. Deferred modes (missingLetter, caseMatch, pictureLetterCatch) are clearly documented for future.
