/**
 * Watermelon Catch — Mode Configs
 *
 * Each mode defines the presentation, layout, and rule layers for the game.
 * Add new educational modes here; the core engine in WatermelonCatchGame.js
 * reads these to drive behavior without code changes.
 *
 * Fields:
 *   id            — unique string identifier
 *   title         — display title shown at game start & result screen
 *   subject       — category ('fun' | 'math' | ...)
 *   prompt        — instruction shown below the title
 *   itemType      — 'emoji' | 'number'
 *   emoji         — emoji to display (itemType='emoji' only)
 *   numberRange   — [min, max] inclusive (itemType='number' only)
 *   wrongFeedback — short text shown on wrong click
 *   layoutType    — 'falling' (only type for now)
 *   difficulty    — 1-5 scale, for future progression
 *   level         — intended sequence position
 *   unlockOrder   — order in which modes unlock (0 = always available)
 *   wrongPenalty  — score deducted on wrong click (0 = no penalty; score never goes below 0)
 *   isCorrect     — fn(value) => bool — true if the clicked item scores a point
 */
export const WATERMELON_CATCH_MODES = [
  {
    id: 'classic',
    title: 'Watermelon Catch 🍉',
    subject: 'fun',
    prompt: 'Catch the watermelons!',
    itemType: 'emoji',
    emoji: '🍉',
    wrongFeedback: '🚫',
    wrongPenalty: 0,
    layoutType: 'falling',
    difficulty: 1,
    level: 1,
    unlockOrder: 0,
    isCorrect: (_value) => true,
  },
  {
    id: 'even_numbers',
    title: 'Catch Even Numbers',
    subject: 'math',
    prompt: 'Catch even numbers!',
    itemType: 'number',
    numberRange: [1, 20],
    wrongFeedback: 'Odd!',
    wrongPenalty: 1,
    layoutType: 'falling',
    difficulty: 1,
    level: 2,
    unlockOrder: 1,
    isCorrect: (value) => value % 2 === 0,
  },

  // ── Future modes (not yet implemented) ────────────────────────────────────
  // { id: 'odd_numbers',     subject: 'math', level: 3, unlockOrder: 2, ... }
  // { id: 'multiples_of_3', subject: 'math', level: 4, unlockOrder: 3, ... }
  // { id: 'addition_5',     subject: 'math', level: 5, unlockOrder: 4, ... }
];
