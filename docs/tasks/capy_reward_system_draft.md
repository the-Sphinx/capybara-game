# Capy Village — Reward System Draft (Adventure + Arcade)

## Goal

Define a clear, kid-friendly, unified reward model for:
- Adventure mode
- Arcade mode
- Locked level browsing

This task is focused on economy clarity and reward communication.

Important:
- Do NOT introduce a second currency
- Do NOT introduce Capy Level yet
- Do NOT lock store items behind progression yet
- Keep the system simple enough for young players to understand

---

## FINAL DESIGN DECISIONS

### 1. Single Currency
Use only one currency:
- Coins

Do not add:
- watermelon coins
- game-specific currencies
- premium coins

---

### 2. Arcade Reward Rule
All arcade games must follow the same rule:

```js
coinsEarned = score
```

Meaning:
- 1 score = 1 coin

Apply this to:
- Watermelon Catch arcade
- Math Garden arcade
- any future arcade games unless explicitly redesigned later

This must be visible in the arcade UI so the player understands it before playing.

Example helper text:
- Arcade Reward: 1 score = 1 coin

---

### 3. Adventure Reward Rule
Adventure mode should use:
- a main goal
- a clear reward
- bonus thresholds

The level should not end immediately when the goal is reached.

Instead:
- the player completes the main goal
- gameplay continues naturally
- extra performance can earn bonus coins
- result screen explains rewards clearly

---

## CORE UX PRINCIPLE

The player should always understand:
1. what the goal is
2. what is needed to clear the level
3. what extra rewards are possible
4. how many coins were earned and why

---

## ADVENTURE REWARD STRUCTURE

Each adventure level should define:

```js
{
  goal: number,
  clearReward: number,
  bonusTiers: [
    { threshold: number, reward: number },
    { threshold: number, reward: number }
  ]
}
```

Example:

```js
{
  goal: 10,
  clearReward: 10,
  bonusTiers: [
    { threshold: 20, reward: 5 },
    { threshold: 30, reward: 5 }
  ]
}
```

Meaning:
- reach 10 → level cleared → +10 coins
- reach 20 → +5 bonus coins
- reach 30 → +5 bonus coins

Total if player reaches 27:
- clear reward: 10
- threshold 20 bonus: 5
- threshold 30 bonus: not reached
- total: 15 coins

---

## IN-GAME ADVENTURE FEEDBACK

When the player reaches the main goal during play, show a short message:

- Goal Complete! Keep going for bonus coins!

This message should:
- appear clearly
- stay briefly
- not block gameplay

This teaches the reward model naturally.

---

## RESULT SCREEN BREAKDOWN

Adventure result screens must show a line-by-line reward breakdown.

Example:

```text
LEVEL COMPLETE!

Collected: 27

Goal Reached (10): +10 coins
Bonus Reached (20): +5 coins

Total Earned: 15 coins
```

If a bonus was not reached, do not show it as earned.
Optional:
- show unreached bonus lines in faded style

Example:
- Bonus (30): not reached

---

## LOCKED LEVEL BROWSING

Players must be able to open or preview locked levels.

Locked levels should still show:
- level name
- level goal
- clear reward
- bonus thresholds
- unlock requirement

Because this happens inside a specific game's level map or screen, the unlock rule can stay local and simple.

Example:
- Complete Level 4 to unlock

Do not use vague generic lock messages if the game context is already known.

---

## RECOMMENDED SAMPLE REWARD TABLES

These are starter balancing values only.
Use them as a first implementation pass.

---

# WATERMELON CATCH — ADVENTURE

## Level 1
- Goal: 10
- Clear Reward: 10
- Bonuses:
  - 20 → +5
  - 30 → +5

## Level 2
- Goal: 14
- Clear Reward: 12
- Bonuses:
  - 24 → +5
  - 34 → +6

## Level 3
- Goal: 18
- Clear Reward: 14
- Bonuses:
  - 28 → +6
  - 38 → +8

## Level 4
- Goal: 22
- Clear Reward: 16
- Bonuses:
  - 32 → +6
  - 42 → +8

## Level 5
- Goal: 26
- Clear Reward: 18
- Bonuses:
  - 36 → +8
  - 46 → +10

Notes:
- thresholds should feel reachable but not automatic
- bonus tiers should feel exciting, not confusing
- do not add too many bonus levels

---

# MATH GARDEN — ADVENTURE

Use the same structure, but with math-appropriate goals.

Suggested metric:
- correct answers

## Level 1
- Goal: 8 correct
- Clear Reward: 10
- Bonuses:
  - 12 correct → +5
  - 16 correct → +5

## Level 2
- Goal: 10 correct
- Clear Reward: 12
- Bonuses:
  - 14 correct → +5
  - 18 correct → +6

## Level 3
- Goal: 12 correct
- Clear Reward: 14
- Bonuses:
  - 16 correct → +6
  - 20 correct → +8

## Level 4
- Goal: 14 correct
- Clear Reward: 16
- Bonuses:
  - 18 correct → +6
  - 22 correct → +8

## Level 5
- Goal: 16 correct
- Clear Reward: 18
- Bonuses:
  - 20 correct → +8
  - 24 correct → +10

Important:
- Use the same reward logic as Watermelon Catch
- Keep cross-game economy understandable

---

## ARCADE MODE DISPLAY REQUIREMENTS

Arcade mode screens must clearly state the reward rule before starting.

Example text:
- Arcade Reward: 1 score = 1 coin

This should appear:
- on the arcade selection screen
- or just before the run starts
- or both

Arcade result screen must show:

```text
ARCADE COMPLETE!

Score: 37
Coins Earned: 37
```

No hidden conversion.
No half conversion.
No rounding.

---

## LOCKED LEVEL CARD CONTENT

For every locked level card or node, show:
- Level name or number
- Goal
- Clear reward
- Bonus thresholds
- Unlock requirement

Example:

```text
Level 4
Goal: Collect 22
Reward: 16 coins
Bonus: 32 → +6, 42 → +8
Unlock: Complete Level 3
```

This should motivate the player to continue.

---

## IMPLEMENTATION TASKS

### 1. Standardize arcade rewards
Update all arcade games so:

```js
coinsEarned = score
```

Remove inconsistent formulas such as:

```js
Math.floor(score / 2)
```

---

### 2. Extend adventure level data
Add support for:
- goal
- clearReward
- bonusTiers

If bonusTiers are not currently part of level config, add them to the relevant data structure.

---

### 3. Update adventure reward calculation
When the run ends:
- if score < goal → no clear reward
- if score >= goal → award clear reward
- also award each bonus tier reached

Example pseudo-code:

```js
let coinsEarned = 0;
let rewardBreakdown = [];

if (score >= level.goal) {
  coinsEarned += level.clearReward;
  rewardBreakdown.push({
    label: `Goal Reached (${level.goal})`,
    reward: level.clearReward
  });

  for (const tier of level.bonusTiers || []) {
    if (score >= tier.threshold) {
      coinsEarned += tier.reward;
      rewardBreakdown.push({
        label: `Bonus Reached (${tier.threshold})`,
        reward: tier.reward
      });
    }
  }
}
```

---

### 4. Add in-run goal completion messaging
When the player first reaches the goal in adventure mode:
- show a message:
  - Goal Complete! Keep going for bonus coins!
- only show once per run

---

### 5. Upgrade result screens
Adventure result screen should show:
- final performance
- reward breakdown
- total coins earned

Arcade result screen should show:
- score
- total coins earned

---

### 6. Allow locked level browsing
Locked levels should still be clickable/selectable for preview.
If a locked level is selected:
- show level details
- prevent start
- show unlock requirement

---

## ACCEPTANCE CRITERIA

1. All arcade games reward coins using:
   - 1 score = 1 coin

2. Adventure levels use:
   - goal
   - clear reward
   - bonus thresholds

3. Players see:
   - the goal before play
   - possible rewards before play
   - why they earned coins after play

4. Locked levels can be browsed and previewed

5. No second currency is introduced

6. Store locking by Capy Level is NOT added in this task

---

## TESTING CHECKLIST

### Arcade
- Watermelon Catch arcade:
  - score 12 → earn 12 coins
  - score 37 → earn 37 coins

- Math Garden arcade:
  - score 12 → earn 12 coins
  - score 37 → earn 37 coins

### Adventure
Use a sample level:
- goal = 10
- clear reward = 10
- bonuses at 20 and 30

Test:
- score 8 → no clear reward
- score 10 → 10 coins
- score 19 → 10 coins
- score 20 → 15 coins
- score 27 → 15 coins
- score 30 → 20 coins
- score 37 → 20 coins

### Locked levels
- verify locked levels can be previewed
- verify rewards and unlock condition are visible
- verify level cannot start while locked

---

## FUTURE ITEMS (NOT IN THIS TASK)

Do NOT implement yet:
- Capy Level
- store items locked behind progression
- Capy Passport
- stamps or stickers
- second currency
- cross-game unlock dependencies for cosmetics

Those can be added later once the base reward loop feels good.

---

## FINAL NOTE

This task is about clarity, motivation, and consistency.

The player should feel:
- I know what to do
- I know what I can win
- I understand why I got this reward
- I want to try the next level
