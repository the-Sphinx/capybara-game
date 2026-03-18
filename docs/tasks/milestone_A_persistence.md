# Milestone A --- Persistence System (SaveManager)

## Goal

Ensure player progress is **never lost** even if the server restarts.\
All important game data should be stored locally and loaded
automatically on game start.

## Scope

Implement a centralized **SaveManager** that handles all reading and
writing of persistent data.

## Data To Persist

Sample data to be saved

``` json
{
  "version": 1,
  "coins": 0,
  "ownedItems": [],
  "equipped": {
    "hat": null,
    "neck": null
  },
  "progress": {
    "watermelonCatch": {
      "unlockedModes": ["classic"],
      "bestScores": {}
    }
  },
  "settings": {
    "soundOn": true,
    "musicOn": true
  }
}
```

## SaveManager Responsibilities

-   Load save data at game startup
-   Create default save if none exists
-   Save updates automatically after key events
-   Provide helper methods to other systems

## Example Class Structure

``` javascript
class SaveManager {
  load()
  save()

  getData()

  addCoins(amount)
  unlockItem(id)
  equipItem(slot, itemId)

  recordScore(gameId, modeId, score)
}
```

## Key Integration Points

Save should trigger when: - coins are awarded - items are purchased -
items are equipped - a game run ends - a best score is achieved

## Implementation Steps

1.  Create SaveManager module
2.  Load save on game initialization
3.  Provide default save structure
4.  Integrate coin updates
5.  Integrate closet system with save data
6.  Save best scores after each game

## Notes

Include a **save version number** to allow future upgrades to the save
format.
