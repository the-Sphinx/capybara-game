# Math Garden — Redesigned Levels (Fun + Learning + Progression)

## Design Principles Applied
- Each world introduces a **concept**
- Each 10-level sequence includes:
  - tutorial → practice → variation → challenge → boss
- Avoid repetition
- Increase **cognitive difficulty**, not just numbers
- Use variation: mixed rules, distractors, pressure

---

# 🌿 WORLD 1 — EVEN & ODD BASICS (Number Garden)

Goal: Understand parity

## Levels

1. Tutorial: collect EVEN (1–10, slow, no penalty)
2. Practice: collect EVEN (1–15)
3. Variation: EVEN + odd distractors (denser spawn)
4. Practice: collect ODD (1–15)
5. Variation: EVEN vs ODD switch mid-game
6. Challenge: EVEN only but faster
7. Variation: EVEN under 20 only
8. Challenge: EVEN + tight time limit
9. Mixed: EVEN or ODD (instruction changes mid)
10. Boss: EVEN + fast + distractors + high goal

---

# 🌳 WORLD 2 — MULTIPLES & DIVISIBILITY

Goal: Introduce divisibility thinking

1. Tutorial: multiples of 2
2. Practice: multiples of 3
3. Variation: multiples of 2 vs 3
4. Practice: multiples of 5
5. Challenge: multiples of 3 (faster)
6. Variation: multiples of 3 OR 5
7. Challenge: multiples of 4 with distractors
8. Variation: NOT divisible by 3
9. Mixed: divisible by 2 OR NOT 3
10. Boss: mixed rules + fast + dense

---

# 🌼 WORLD 3 — PRIME NUMBERS

Goal: Recognize primes vs non-primes

1. Tutorial: primes (1–20, slow)
2. Practice: primes (1–30)
3. Variation: primes vs obvious composites
4. Challenge: primes faster
5. Variation: primes + near-miss numbers (9,15,21)
6. Practice: primes (higher range)
7. Variation: NOT prime
8. Challenge: primes + time pressure
9. Mixed: prime OR even
10. Boss: primes + dense + fast

---

# 🌸 WORLD 4 — ADDITION & SUBTRACTION

Goal: Solve basic equations

1. Tutorial: addition (small numbers)
2. Practice: addition
3. Variation: addition with distractors
4. Practice: subtraction
5. Variation: mixed addition/subtraction
6. Challenge: faster equations
7. Variation: multi-choice answers
8. Challenge: harder numbers
9. Mixed: random operations
10. Boss: fast + mixed + high accuracy needed

---

# 🍉 WORLD 5 — MIXED MASTERY

Goal: Combine all concepts

1. EVEN + primes
2. multiples + even
3. primes + addition
4. mixed collect + answer
5. NOT rules (not even, not prime)
6. high-speed collect
7. mixed rules switching mid-level
8. low mistake tolerance (precision)
9. chaos mode (random rules)
10. FINAL BOSS: all combined, fast, high reward

---

# 🎯 Notes for Implementation

- Use existing `collect_numbers` and `answer_equation`
- Use:
  - matcher variations
  - overrides.rules
  - overrides.scoring
- Introduce:
  - faster spawn
  - tighter time
  - distractor density

---

# ✅ Expected Outcome

- No repetition feeling
- Clear learning progression
- Increasing challenge
- Higher engagement
- Replayability
