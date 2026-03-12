# Milestone B --- Minigame Polish

## Goal

Improve gameplay feel and excitement by adding special objects, combo
mechanics, and better UI feedback.

## New Object Types

-   normal watermelon
-   golden watermelon
-   hourglass
-   bomb

## Golden Watermelon

Spawn chance: \~4%

Effects: - bonus score (+3) - sparkle particles - unique sound

## Hourglass

Spawn chance: \~3%

Effects: - adds +5 seconds to remaining time - blue glow particle effect

## Bomb

Spawn chance: \~3%

Effects: - resets combo - removes run reward - small screen shake

## Combo System

Combo increases with consecutive **correct catches**.

Important rules: - combo break conditions depend on game mode -
unimportant misses should not break combos

Example combo stages:

  Streak   Bonus
  -------- --------------
  3        combo starts
  5        +2 bonus
  10       +5 bonus

## Feedback Improvements

Correct Catch: - bite sound - particle burst - floating +score text -
combo indicator

Wrong Catch: - wrong sound - red floating text - combo reset

Important Miss: - fail sound - combo reset animation

## Timer Improvements

Add **time progress bar** below timer.

Behavior: - shrinks continuously - pulses during last 10 seconds - sync
with ticking sound

## Implementation Steps

1.  Create item type system
2.  Implement golden watermelon
3.  Implement hourglass
4.  Implement bomb
5.  Add combo logic
6.  Add progress bar timer
7.  Add catch/miss feedback effects
