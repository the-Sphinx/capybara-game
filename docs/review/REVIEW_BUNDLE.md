# REVIEW BUNDLE

## 1. Task Summary
- Task name: Math Garden HUD readability and arcade prompt restore
- Date: 2026-03-23
- Time: 17:05 +03
- Branch: scene-restructure
- Commit hash: pending
- Agent: Codex
- Status: completed

## 2. Objective
Restore Math Garden arcade instructions in the HUD and improve the readability of math equations/instructions against the textured center banner.

## 3. What Changed
- Added an arcade center HUD block for Math Garden so collection modes again show their title and instruction prompt.
- Restored prompts like `Catch even numbers!` / `Catch odd numbers!` by rendering `m.prompt` in arcade mode, matching the behavior already used by Language Grove.
- Strengthened the center HUD text styling so equations and instructions are more legible on the textured banner.
- Added a subtle pill background and stronger outline/shadow treatment to the equation and instruction text.

## 4. Files Changed
- capy-village/src/games/mathGarden/MathGardenGame.js
- capy-village/src/style.css

## 5. Architecture Impact
This is a contained HUD/rendering fix. It does not change game rules or progression data; it only restores the intended arcade prompt rendering path and improves cross-game center HUD readability styling.

## 6. Key Implementation Notes
Math Garden now follows the same arcade-center HUD pattern already present in Language Grove:

```text
- arcade center title
- arcade instruction prompt
- separate floating equation banner for answer mode
```

## 7. Risks / Known Issues
- This pass was verified through build and code-path inspection, but I intentionally did not start a new Playwright browser session because of the earlier orphan-window issue.
- The HUD text styling is shared, so Language Grove and other center-banner content also get the slightly stronger readability treatment.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: improved because game HUD instructions now match configured mode prompts again
- hybrid retrieval: unchanged
- verification layer: improved because arcade prompt rendering now matches the existing game config data
- generic schema: unchanged
- inspectability: improved through clearer on-screen math instructions and equation readability

## 9. Testing Performed
- Ran `npm run build` successfully in `capy-village`.
- Reviewed Math Garden start-path logic to confirm arcade collection modes now render center HUD prompt content.
- Confirmed prompt strings such as `Catch even numbers!` and `Catch odd numbers!` are still present in `arcade.json` and now have a live render path again.
- Verified the updated HUD styling compiles through the main app stylesheet build.

## 10. Example Output / Logs
```text
Toolbar toggle:
- Footprints: Off
- Footprints: On
```

```text
Editor footprint fields:
- type
- radius
- width
- depth
- offsetX
- offsetZ
- rotationOffset
```

## 11. Recommended Reviewer Focus
- Start Math Garden in arcade collection mode and confirm the center HUD shows the mode title and prompt.
- Check that answer-mode equations remain readable against the center banner background.
- Compare the instruction readability with Language Grove to confirm the shared HUD styling still feels consistent.

## 12. Suggested Next Step
If needed, the next good follow-up would be giving Math Garden answer mode its own slightly more colorful equation treatment so it reads even more distinctly from collection-mode instructions.
