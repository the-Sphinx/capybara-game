# Task: Upgrade Watermelon Catch to a Real Minigame (v2)

## Goal

Transform the current placeholder Watermelon Catch minigame into a simple but real playable minigame.

The current version only increases score when clicking a button.

Version 2 should introduce:

- falling watermelons
- clicking/tapping to catch them
- a time limit
- scoring logic
- coins based on performance
- a result summary screen
- different falling speeds for different watermelons

The goal is **not visual perfection**, but a real gameplay loop.

---

# Current State

The project already has:

- BaseGame architecture
- GameManager
- working minigame launch flow
- UI popup
- score counter
- finish button
- coins being awarded

Now we replace the "click button" mechanic with a real game.

---

# Gameplay Design

## Basic Rules

Watermelons fall from the top of the game panel.

Player clicks/taps watermelons to catch them before they disappear.

Each caught watermelon increases score.

Missed watermelons disappear.

Game lasts a fixed time.

---

# 1. Game Duration

Add a **timer**.

Recommended duration:

20 seconds

Display the timer in the UI.

Example:

Time: 18s

When timer reaches zero:

- game automatically ends
- results screen appears

---

# 2. Falling Watermelons

Spawn watermelons at the top of the game area.

Basic behavior:

- spawn at random X positions
- fall downward
- disappear if reaching the bottom

Recommended spawn rate:

1 melon every **0.8 – 1.2 seconds**

### Important:
Watermelons should fall at **different speeds**.

Suggested approach:

- each spawned melon gets its own random fall speed
- use a reasonable range such as:
  - slow melons
  - medium melons
  - slightly faster melons

Example concept:

```
melon.speed = randomBetween(minSpeed, maxSpeed)
```

This will make gameplay feel more alive and less mechanical.

---

# 3. Catching Watermelons

When player clicks a watermelon:

- it disappears
- score increases by 1
- optional small pop animation

If watermelon reaches bottom:

- it disappears
- counts as missed

---

# 4. Score System

Score should increase for each successful catch.

Example display:

Score: 12

Track two stats:

- caught
- missed

Example stats object:

```
{
  caught: 12,
  missed: 5
}
```

---

# 5. Coins Earned

Coins should be based on performance.

Suggested formula:

```
coinsEarned = floor(score / 2)
```

Examples:

Score 10 → 5 coins  
Score 25 → 12 coins

GameManager should receive the result and add coins to the player.

---

# 6. Result Screen

After time ends show a result summary.

Example:

Watermelon Catch Results

Score: 18  
Caught: 18  
Missed: 6  

Coins Earned: +9 🍉

Button:

Return to Village

Pressing it closes the minigame and resumes world controls.

---

# 7. UI Layout

Recommended layout inside the popup panel:

Title:
Watermelon Catch 🍉

Top bar:

Score: X  
Time: XX

Main play area:

falling watermelons

Bottom:

Finish / Exit button (optional)

Game should also auto-finish when timer ends.

---

# 8. Implementation Notes

Keep implementation simple.

Avoid physics engines.

Recommended approach:

- maintain an array of melons
- update their positions every frame
- assign a random speed to each melon when spawned
- detect clicks on melons
- remove when caught or offscreen

---

# 9. Visual Style

Use the same visual style as the current popup UI.

Watermelons can be:

- simple sprite
- simple 3D object
- emoji-style icon

Perfection is not required yet.

---

# 10. Interaction Prompt

Update the world interaction prompt text.

Instead of:

Press [E] to enter Watermelon Catch

Use:

Press [E] to play Watermelon Catch 🍉

This sounds more natural and playful.

---

# 11. Success Criteria

This task is complete when:

1. Watermelons fall from the top
2. Different watermelons fall at different speeds
3. Player can click/tap them to catch
4. Score increases correctly
5. Timer counts down
6. Game ends automatically when timer reaches zero
7. Results screen appears
8. Coins are awarded based on score
9. Player returns to village after finishing

---

# Future Educational Upgrade (Not in this task)

After this version, the next step will be to add educational logic and polish this same game further instead of moving immediately to new games.

Examples for future versions:

Catch the answer to **3 + 4**  
Catch only **even numbers**  
Catch the number **6**

For now keep gameplay simple and make the arcade version solid first.
