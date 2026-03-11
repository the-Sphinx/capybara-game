# Task: Add Sound Effects to Watermelon Catch / Educational Modes

## Goal

Add a small but high-impact sound layer to the game.

This task should improve game feel by adding short, cute, responsive sound effects for:

- catching watermelons
- correct answers
- wrong answers
- item spawn / pop
- end-of-game reward / coin gain

The visual style is already strong. Sound is now the next polish step.

---

# Why This Matters

Small audio cues dramatically improve perceived game quality.

For this game, the most important immediate sounds are:

1. Watermelon catch / bite / crunch
2. Correct answer sound
3. Wrong answer sound

Optional but recommended:

4. Spawn / pop sound
5. Reward / coin sound

---

# Recommended Sound Style

Because the game art style is soft, cute, toy-like, and cozy, the sounds should be:

- short
- playful
- soft / cartoon-like
- satisfying
- not harsh
- not realistic in a gross way
- not loud arcade buzzer style

Reference feel:

- Animal Crossing
- Mario
- cozy mobile games

Avoid:

- aggressive error buzzers
- realistic chewing sounds
- harsh metallic UI sounds

---

# Recommended Sound Set

## 1. Catch Sound
Use for:
- catching watermelon
- optionally catching a correct answer in educational modes

Desired feel:
- crunchy bite
- soft cartoon chomp
- satisfying short snack sound

Suggested search terms:
- cartoon bite
- fruit bite
- apple crunch
- crunchy bite
- cartoon crunch

---

## 2. Correct Answer Sound
Use for:
- correct number click
- correct educational answer
- small success feedback

Desired feel:
- happy ding
- bright chime
- cute success blip

Suggested search terms:
- correct answer
- success chime
- cute ding
- positive blip
- game correct

---

## 3. Wrong Answer Sound
Use for:
- wrong number click
- wrong educational answer

Desired feel:
- soft boop
- gentle error sound
- playful mistake cue

Suggested search terms:
- wrong answer
- cartoon error
- soft buzzer
- negative blip
- game wrong

Important:
This should feel light and forgiving, not punishing.

---

## 4. Spawn / Pop Sound (Optional but Recommended)
Use for:
- new watermelon appearing
- new number appearing

Desired feel:
- pop
- bubble
- soft plop
- spawn blip

Suggested search terms:
- pop
- bubble
- UI pop
- toy pop

---

## 5. Reward / Coin Sound (Optional but Recommended)
Use for:
- end-of-game coin reward
- purchase success later in closet UI

Desired feel:
- coin pickup
- reward sparkle
- soft bling

Suggested search terms:
- coin collect
- reward sparkle
- cute reward
- game reward

---

# Best Free Sound Sources

## Pixabay Sound Effects
Recommended as the first source.

Why:
- royalty-free
- no attribution required
- easy search
- good for bite / cartoon / pop sounds

Good starting pages:
- bite / biting
- eating
- cartoon

---

## Mixkit
Recommended especially for:
- correct
- wrong
- reward
- game UI sounds

Why:
- free to use
- easy browsing
- good game/UI library

Good starting pages:
- correct
- wrong
- game
- game show

---

## ZapSplat
Recommended as a backup source if needed.

Why:
- huge library
- lots of UI and game sounds

Important:
- free tier generally requires attribution
- premium removes attribution requirement

Use only if Pixabay / Mixkit do not provide a good match.

---

## Freesound
Use carefully.

Why:
- huge library
- many good one-off sounds

Important:
Check the individual license for each sound:
- CC0 = safest
- CC BY = requires attribution
- non-commercial licenses should be avoided for this project

---

# Suggested First Audio Pack for This Game

For now, choose only these 5 sounds:

1. `bite.wav` or `bite.mp3`
2. `correct.wav` or `correct.mp3`
3. `wrong.wav` or `wrong.mp3`
4. `pop.wav` or `pop.mp3`
5. `reward.wav` or `reward.mp3`

Store in a folder such as:

`public/audio/`

Example:

- `public/audio/bite.mp3`
- `public/audio/correct.mp3`
- `public/audio/wrong.mp3`
- `public/audio/pop.mp3`
- `public/audio/reward.mp3`

---

# Implementation Recommendation

Do not instantiate `new Audio()` every time the event happens.

Instead, create a tiny sound manager or preload helper.

Example approach:

- preload sounds once
- reuse them during gameplay

Suggested concept:

- `bite` for catching watermelon
- `correct` for correct number
- `wrong` for wrong number
- `pop` for spawn
- `reward` for results / coin gain

---

# Important Polish Suggestion

Add slight pitch variation for repeated sounds.

Example idea:
- when the same sound plays multiple times, vary playback rate slightly

This makes repeated catches feel much less repetitive.

Examples:
- bite sound slightly different each time
- pop sound slightly different each time

Keep variation subtle.

---

# Where Each Sound Should Play

## Classic Watermelon Mode
- spawn watermelon → optional `pop`
- catch watermelon → `bite`
- results / coins → `reward`

## Educational Number Mode
- spawn number → optional `pop`
- correct click → `correct`
- wrong click → `wrong`
- results / coins → `reward`

---

# Nice-to-Have Audio Behaviors (Only If Easy)

If simple to implement, add:

- mute / sound toggle button
- very low-volume ambient background loop later
- softer wrong sound than correct sound
- short delay between repeated sound triggers so audio does not become messy

These are optional.

---

# Source / License Notes

If using:

## Pixabay
Generally royalty-free and no attribution required.

## Mixkit
Free sound effects available under Mixkit’s license for use in projects.

## ZapSplat
Free tier generally requires attribution.

## Freesound
License depends on each individual file. Check before use.

---

# Success Criteria

This task is complete when:

1. The game has at least these three sounds:
   - catch / bite
   - correct
   - wrong
2. Sounds trigger in the correct events
3. Audio feels cute and soft, not harsh
4. Repeated sounds are not too repetitive
5. Optional reward / pop sounds are added if easy
6. Chosen sound files come from free sources with compatible licenses

---

# Notes for the Coding Agent

- Keep implementation simple
- Prioritize responsiveness
- Do not overbuild a full audio engine yet
- A small reusable sound helper is enough
- Choose sounds that match the soft toy-like visual style
