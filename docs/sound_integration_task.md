# Task: Add Sound Loading / Sound Config / Playback Variation

## Goal

Integrate the manually downloaded sound files into the game in a clean, reusable way.

This task should:

- preload the sound files
- create a simple sound config / registry
- expose friendly sound labels such as `pop`, `bite`, `correct`, `wrong`, `reward`
- use the sounds in the appropriate gameplay events
- add small playback-rate variation to repeated sounds so they feel less repetitive

The sounds are already downloaded manually by the project owner.
This task is about wiring them into the game properly.

---

# 1. Create a Sound Config File

Create a small config file that maps sound labels to actual file names.

Suggested file:

`public/data/sounds.json`

or

`src/config/sounds.js`

Either is acceptable. Keep it simple.

Example structure:

```json
{
  "pop": "/audio/ree34_pop.wav",
  "bite": "/audio/chomp_bite_01.wav",
  "correct": "/audio/correct_ding_01.wav",
  "wrong": "/audio/soft_wrong_01.wav",
  "reward": "/audio/reward_coin_01.wav"
}
```

If JSON is inconvenient, use a JS config object.

The important part is that game code should refer to sounds by label, not hardcoded file paths.

Example usage:

- `playSound("pop")`
- `playSound("bite")`
- `playSound("correct")`

---

# 2. Create a Small Sound Manager / Audio Helper

Create a small reusable helper.

Suggested file:

`src/audio/SoundManager.js`

Responsibilities:

- preload sounds once
- store them by label
- expose a simple `play()` method
- optionally support volume control later
- support subtle playback-rate variation

Suggested conceptual API:

```javascript
soundManager.load(soundConfig)
soundManager.play("bite")
soundManager.play("correct")
```

Keep it lightweight. Do not build a huge system.

---

# 3. Preload All Sounds on Game Startup

When the app starts, load all configured sounds once.

Do not instantiate a new `Audio()` every time a melon is clicked.

The goal is:

- no repeated file loading
- lower latency
- consistent playback

If the project already has a central bootstrap/init file, preload there.

---

# 4. Add Playback-Rate Variation

For frequently repeated sounds such as:

- `bite`
- `pop`

add slight playback-rate randomization.

Example concept:

```javascript
base rate: 1.0
actual rate: 0.92 to 1.08
```

This should be subtle.

Purpose:
- repeated bites feel less robotic
- repeated pops feel less annoying

Important:
Do not apply strong variation.
Keep it small and cute.

Recommended:
- randomize only certain sounds
- not necessary for reward or wrong sounds unless it still feels good

---

# 5. Recommended Sound Event Mapping

Use the sound labels in these places:

## Classic Watermelon Mode

- spawn watermelon → optional `pop`
- catch watermelon → `bite`
- game result / reward → `reward`

## Educational Number Mode

- spawn number → optional `pop`
- correct click → `correct`
- wrong click → `wrong`
- result / reward → `reward`

If needed, keep some sounds disabled until they feel right.
Do not overdo audio spam.

---

# 6. Avoid Overlapping Audio Problems

Repeated click-heavy games can get noisy.

Add lightweight protection if easy:

- very short cooldown per sound
or
- restart sound cleanly if replayed
or
- clone playback only when needed

Goal:
- game feels responsive
- sound does not become chaotic

Keep it simple.

---

# 7. Optional Volume Settings (Only If Easy)

If very easy, include basic default volumes in the config.

Example:

```json
{
  "bite": {
    "file": "/audio/chomp_bite_01.wav",
    "volume": 0.7,
    "varyRate": true
  },
  "correct": {
    "file": "/audio/correct_ding_01.wav",
    "volume": 0.6,
    "varyRate": false
  }
}
```

This is optional but nice if implementation remains simple.

If that feels too heavy, use flat path mapping plus hardcoded defaults in the helper.

---

# 8. Recommended Final Config Shape

Preferred shape if manageable:

```json
{
  "pop": {
    "file": "/audio/ree34_pop.wav",
    "volume": 0.45,
    "varyRate": true,
    "minRate": 0.94,
    "maxRate": 1.06
  },
  "bite": {
    "file": "/audio/chomp_bite_01.wav",
    "volume": 0.7,
    "varyRate": true,
    "minRate": 0.92,
    "maxRate": 1.08
  },
  "correct": {
    "file": "/audio/correct_ding_01.wav",
    "volume": 0.65,
    "varyRate": false
  },
  "wrong": {
    "file": "/audio/soft_wrong_01.wav",
    "volume": 0.5,
    "varyRate": false
  },
  "reward": {
    "file": "/audio/reward_coin_01.wav",
    "volume": 0.75,
    "varyRate": false
  }
}
```

The project owner can later swap the file names without touching the gameplay code.

---

# 9. Keep the Usage Simple in Game Code

Watermelon Catch and future games should never care about actual filenames.

They should only call:

```javascript
playSound("bite")
playSound("correct")
playSound("wrong")
```

This is important for maintainability.

---

# 10. Success Criteria

This task is complete when:

1. There is a centralized sound config file
2. Sounds are preloaded once
3. Game code uses sound labels instead of raw file paths
4. `bite`, `correct`, `wrong`, `pop`, and `reward` are wired into the right events
5. Repeated sounds such as `bite` and `pop` use subtle playback-rate variation
6. Audio feels responsive and not repetitive

---

# 11. Notes for the Coding Agent

- keep implementation simple
- prefer maintainability over complexity
- do not build a huge audio engine
- a tiny config + sound helper is enough
- make it easy for the user to replace sound files later by changing only the config

The project owner already downloaded the sound files manually.
Please wire them in cleanly and make the filenames configurable.
