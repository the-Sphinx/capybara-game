# REVIEW BUNDLE

## 1. Task Summary
- Task name: Math world fullscreen simplification
- Date: 2026-03-25
- Time: 11:55 +03
- Branch: scene-restructure
- Commit hash: pending
- Agent: Codex
- Status: completed

## 2. Objective
Convert the existing Math Garden world-select screen into a fullscreen, image-first experience that removes the right-side panel, keeps overlays minimal on the wooden signs, and makes world selection feel like exploring the world art rather than navigating a menu.

## 3. What Changed
- Reworked the Math Garden world-select screen to use the background image as the dominant fullscreen UI surface.
- Removed the right-side details panel from the world-select flow.
- Kept only minimal sign content on each wooden sign:
- world title
- 5 flower-based progress icons for unlocked worlds
- centered lock icon for locked worlds
- Added broader clickable hotspots around each sign so nearby world patches are easier to click.
- Added fullscreen selection and hover feedback with subtle brightness/glow rather than heavy scaling.
- Changed locked-world clicks to show an in-screen popup message instead of relying on a side details panel.
- Kept unlocked-world clicks opening the existing placeholder world-entry screen.

## 4. Files Changed
- capy-village/src/ui/HubModal.js
- capy-village/src/style.css
- docs/review/REVIEW_BUNDLE.md
- docs/progress.md

## 5. Architecture Impact
This keeps the same underlying Math world metadata and save-derived world state, but simplifies the presentation layer. The world-select screen is now a fullscreen image-first renderer with larger interaction zones and minimal sign-local UI, making it easier to reuse the same architecture for future themed world maps without rebuilding a separate side-panel layout.

## 6. Key Implementation Notes
The fullscreen world-select now uses:

```text
- one fullscreen-styled hub panel
- the Math Garden image as the primary world UI
- expanded hotspot hit areas derived from each exact sign box
- visual sign content still anchored to the exact user-provided sign bounds
```

Progress display now uses 5 flowers:

```text
- 1 flower = 2 completed levels
- half flower = 1 completed level
- locked worlds show only a centered lock icon
```

Locked interactions now surface:

```text
{World Title} is locked. {Unlock requirement}
```

inside the fullscreen view as a lightweight popup banner.

## 7. Risks / Known Issues
- The 5-flower progress row is derived from completed-level counts and assumes the current 10-level total model described in the task.
- The broader click regions are generated from the sign boxes by expansion rather than hand-authored patch polygons, so they are friendlier than sign-only clicks but still approximate.
- This pass was verified through publish/build and code-path inspection, but I intentionally did not start a new Playwright browser session because of the earlier orphan-window issue.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: improved because the fullscreen flow leans more heavily on the authored Math Garden image
- hybrid retrieval: unchanged
- verification layer: improved because locked-world feedback is now immediate in-screen on click
- generic schema: unchanged
- inspectability: slightly improved because selection state is visible directly on the world art without splitting attention to a side panel

## 9. Testing Performed
- Ran `npm run publish-assets` successfully from the repo root.
- Ran `npm run build` successfully in `capy-village`.
- Reviewed the world-select renderer to confirm the right-side panel path is removed from the Math Garden world screen.
- Reviewed locked/unlocked click behavior to confirm locked worlds now produce a popup message and unlocked worlds still proceed.
- Reviewed the hotspot-expansion logic to confirm click areas include more than the strict sign face while the visual overlays stay sign-anchored.

## 10. Example Output / Logs
```text
Choose a patch to explore.
```

```text
Geometry Yard is locked. Complete Fraction Forest
```

## 11. Recommended Reviewer Focus
- Open `Book Statue` → `Math Garden` → `Adventure` and confirm the screen is fullscreen and image-first with no right panel.
- Verify each sign shows only title plus flowers or a lock, with no extra detail text on the sign.
- Click a locked world and confirm a popup message appears.
- Click an unlocked world and confirm it still proceeds into the placeholder world-entry screen.

## 12. Suggested Next Step
The next natural follow-up would be replacing the current approximate expanded hotspots with hand-authored patch regions if you want even tighter island-level click targeting later.
