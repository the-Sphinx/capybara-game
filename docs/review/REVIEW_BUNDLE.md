# REVIEW BUNDLE

## 1. Task Summary
- Task name: Number Garden level overlay
- Date: 2026-03-26
- Time: 00:35 +03
- Branch: scene-restructure
- Commit hash: pending
- Agent: Codex
- Status: completed

## 2. Objective
Implement a Number Garden level-node overlay system that opens from the Math world-select flow, keeps the map full-screen, adds clickable level nodes with lock/current/completed states, and uses a lightweight info bubble instead of panels.

## 3. What Changed
- Added a reusable Math level-overlay path that currently activates when opening the `Number Garden` world.
- Replaced the old generic placeholder for `Number Garden` with a full-screen node overlay rendered on top of the Math world background image.
- Added explicit normalized node coordinates for Number Garden levels in the Math world config.
- Added clickable stone-style level nodes with:
- level number
- lock overlay for locked levels
- current-level glow/pulse
- selected-node highlight
- Added an anchored info bubble near the selected node showing:
- level title
- short description
- clear reward
- bonus preview
- play button when unlocked
- Added click-outside behavior to dismiss the info bubble.
- Kept other worlds on the existing placeholder path for now.

## 4. Files Changed
- capy-village/src/games/mathGarden/worlds.js
- capy-village/src/ui/HubModal.js
- capy-village/src/style.css
- docs/review/REVIEW_BUNDLE.md
- docs/progress.md

## 5. Architecture Impact
This introduces a reusable level-overlay renderer inside the hub flow while keeping the current fullscreen world-map shell. Node coordinates are explicit config data instead of hardcoded in rendering logic, which leaves room for future world-specific overlays without changing the hub architecture again.

## 6. Key Implementation Notes
The Number Garden overlay currently uses:

```text
- the same fullscreen Math background shell
- explicit normalized level-node coordinates
- save-driven locked/current/completed node state
- a lightweight anchored bubble instead of a side panel
```

Node behavior now includes:

```text
- hover: slight brightness and scale
- click: open bubble
- click elsewhere: close bubble
- unlocked: show play button
- locked: show lock-state bubble text
```

The info bubble displays:

```text
Level N — Label
Description / goal text
💰 reward
⭐ bonus preview
[ Play ] when unlocked
```

## 7. Risks / Known Issues
- The Number Garden node positions are authored directly in config for now because the task did not include node coordinates or a dedicated level-map image.
- The overlay currently uses the existing Math Garden background image rather than a separate world-specific level-map asset.
- Only `Number Garden` is upgraded to the new node-overlay flow in this pass; other worlds still use the placeholder path.
- This pass was verified through publish/build and code-path inspection, but I intentionally did not start a new Playwright browser session because of the earlier orphan-window issue.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: improved because Number Garden now has explicit overlay structure rather than a generic placeholder
- hybrid retrieval: unchanged
- verification layer: improved because level info now appears contextually next to selected nodes
- generic schema: improved because node coordinates and overlay behavior are separated from rendering code
- inspectability: improved through visible node states and anchored info bubbles

## 9. Testing Performed
- Ran `npm run publish-assets` successfully from the repo root.
- Ran `npm run build` successfully in `capy-village`.
- Reviewed the hub flow to confirm opening `Number Garden` now enters the node-overlay screen instead of the generic placeholder.
- Reviewed node-state derivation to confirm locked/current/completed visuals come from existing save progression.
- Reviewed the node bubble logic to confirm click selection and click-outside dismissal work through explicit overlay state.
- Reviewed unlocked play-button wiring to confirm selected unlocked nodes start the corresponding Math Garden adventure level.

## 10. Example Output / Logs
```text
Level 1 — Sprout
Answer 3 correctly
```

```text
💰 15 coins
⭐ Bonus: +6 / +8
```

## 11. Recommended Reviewer Focus
- Open `Book Statue` → `Math Garden` → `Adventure` → `Number Garden`.
- Verify the level nodes appear on the full-screen map and show number/current/lock state clearly.
- Click unlocked and locked nodes to confirm the info bubble content and play-button behavior.
- Click outside the bubble and confirm it dismisses cleanly.

## 12. Suggested Next Step
The next strong follow-up would be adding dedicated node-coordinate maps for the remaining Math worlds so the current reusable overlay renderer can replace the placeholder path world by world.
