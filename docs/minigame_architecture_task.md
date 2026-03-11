# Task: Add BaseGame + GameManager + First Minigame Launch Flow

## Goal

Create the foundation for all educational minigames in the project.

This task should add:

- a reusable `BaseGame` class (or abstract game interface / base class)
- a `GameManager`
- one village interactable object that launches a minigame
- one first minigame hook using the new game system

This task is about the architecture and launch flow, not about building the full final minigame yet.

---

# Important Context

The game already has:

- a working village
- player movement
- camera follow
- object interaction system
- Capy Closet / hotel interaction logic
- coin / cosmetic economy in progress or planned

We should reuse the same world interaction pattern already used for opening the Capy Closet.

That means:

walk near object → show prompt → press E → open system

Now we apply the same logic to minigames.

---

# High-Level Design

We want the project to support many educational games later:

- math
- language
- geography
- logic

So all games must follow one shared structure.

---

# 1. BaseGame

Create a shared base class or abstract-like interface for games.

Suggested file:

`src/games/BaseGame.js`

Suggested responsibilities:

- store basic metadata
- provide lifecycle methods
- define a common API used by `GameManager`

Suggested shape:

    class BaseGame {
      constructor(config) {}
      start() {}
      update(delta) {}
      pause() {}
      resume() {}
      finish(result) {}
      destroy() {}
    }

The exact syntax can vary, but all future games should follow the same interface.

---

# 2. Game Result Format

All games should return results in a consistent format.

Suggested example:

    {
      gameId: "watermelon_catch",
      success: true,
      score: 12,
      coinsEarned: 15,
      stats: {
        caught: 12,
        missed: 3
      }
    }

This will later make it easy to:

- award coins
- show result screens
- unlock progress
- track subject progress

---

# 3. GameManager

Create a central manager responsible for launching and ending minigames.

Suggested file:

`src/games/GameManager.js`

Responsibilities:

- launch a game by id
- pause or disable village controls while game is active
- mount game UI / overlay
- update the active game
- receive game results
- return player to village after game ends
- award coins later using the returned result

Suggested methods:

- `register(gameId, gameFactory)`
- `startGame(gameId)`
- `endGame(result)`
- `isGameRunning()`

The exact API can vary.

---

# 4. First Game Launch Object in the Village

Use the existing interaction system pattern to create a minigame launch object.

This can be a temporary placeholder object for now.

Recommended starter object:

- a math object near the market area
- or a watermelon-themed learning object

Example prompt:

`Press E to play Watermelon Catch`

This object should use the same interaction architecture already used for the closet / hotel.

Do not reinvent the interaction system if the current one already works.

---

# 5. First Minigame Hook

Create the first game module:

`src/games/WatermelonCatchGame.js`

For this task, the minigame itself can be extremely simple.

The important part is the launch flow.

Minimum acceptable behavior:

- opening the game hides or pauses village interaction
- game overlay appears
- placeholder gameplay state starts
- player can finish / exit the game
- result object is returned to `GameManager`

This can start as a simple placeholder UI if needed.

Example placeholder behavior:

- show title
- show instructions
- press space or click to score points
- press finish button
- result returns coinsEarned

The real polished game can come in the next step.

---

# 6. World Pause / Input Handling

When a game starts:

- village movement should stop
- closet / other interactions should stop
- game input becomes active

When a game ends:

- game overlay disappears
- village controls resume

This separation is very important.

---

# 7. UI for the First Game

For now, a simple overlay is acceptable.

Example minimal layout:

- title: `Watermelon Catch`
- short instruction text
- score display
- finish / exit button

Do not over-design the first game screen yet.

The goal is proving the architecture.

---

# 8. Coin Reward Hook

The game result should include `coinsEarned`, but this task does not need to fully integrate the closet economy yet unless trivial.

At minimum:

- `GameManager` should receive the coins value from the result
- it should be logged or temporarily shown
- architecture should make it easy to connect to player coins next

If easy, add the coins to the player state immediately.

---

# 9. Suggested File Structure

Suggested structure:

    src/
      games/
        BaseGame.js
        GameManager.js
        WatermelonCatchGame.js

Use equivalent structure if the project already has a good organization.

---

# 10. Recommended Development Scope

For this task, focus on:

- architecture
- interaction → launch flow
- one game hook
- game start / finish / return to world

Do NOT spend time yet on:

- beautiful minigame art
- multiple games
- Wisdom Tree replay system
- advanced reward animations
- subject progression UI

Those come later.

---

# 11. Success Criteria

This task is complete when all of the following are true:

1. A `BaseGame` structure exists.
2. A `GameManager` exists and can launch a game.
3. One village object can launch the first minigame.
4. The minigame takes over input while active.
5. The player can finish or exit the minigame.
6. A result object is returned.
7. The world resumes after the game ends.
8. The system is clean enough to support future games.

---

# 12. Notes for the Coding Agent

- Reuse the existing interaction system used for the closet / hotel if possible.
- Keep the first game minimal.
- Prioritize architecture over polish.
- Build the system so later games can plug in easily.
- Keep code simple and maintainable.

This task is the foundation for the entire educational gameplay loop.
