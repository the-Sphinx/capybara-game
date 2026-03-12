# Milestone C --- Math Mode Expansion

## Goal

Expand educational content by adding additional math learning modes.

The minigame engine already supports configurable modes, so these are
primarily **new rule definitions**.

## New Modes

### Odd Numbers Mode

Catch: 1, 3, 5, 7, 9

Rules: - catching odd = correct - catching even = mistake - missing odd
= combo break

### Multiples of 3 Mode

Catch: 3, 6, 9

Rules: - catching multiples of 3 = correct - other numbers = mistake

### Addition Answer Mode

Display a question at top:

    3 + 4 = ?

Falling numbers appear below.

Player must catch the correct answer.

Example falling numbers: 2, 5, 7, 9

Correct catch: 7

### Subtraction Answer Mode

Example question:

    9 - 3 = ?

Possible answers fall from top.

Correct catch: 6

## Mode Config Example

``` javascript
{
  id: "even",
  label: "Catch Even Numbers",

  isCatchCorrect(item) {},
  isMissImportant(item) {},
  doesWrongCatchBreakCombo(item) {},
  doesMissBreakCombo(item) {}
}
```

## UI Additions

Each mode should display a **clear instruction banner**:

Examples: - "Catch EVEN numbers" - "Catch ODD numbers" - "Solve the
equation!"

## Implementation Steps

1.  Add odd numbers config
2.  Add multiples of 3 config
3.  Add addition question generator
4.  Add subtraction question generator
5.  Display equation UI for arithmetic modes
6.  Add unlock progression between modes
