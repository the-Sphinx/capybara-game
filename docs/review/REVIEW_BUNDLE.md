# REVIEW BUNDLE

## 1. Task Summary
- Task name: Locked popup UX and microcopy
- Date: 2026-03-25
- Time: 12:12 +03
- Branch: scene-restructure
- Commit hash: pending
- Agent: Codex
- Status: completed

## 2. Objective
Replace the temporary top-banner locked feedback on the Math world screen with a small contextual popup that appears near the clicked locked world, feels like part of the game world, communicates the unlock requirement quickly, and disappears automatically without blocking interaction.

## 3. What Changed
- Removed the temporary top-centered locked message banner from the fullscreen Math world screen.
- Added a compact contextual popup that appears near the clicked locked world instead of at the top of the screen.
- Anchored the popup to the clicked sign’s normalized sign-box position, preferring placement above the sign and falling back lower when needed.
- Updated locked microcopy to the requested short two-line structure:
- `Locked`
- `Complete {Required World} first`
- Added a short auto-dismiss flow of about 2 seconds.
- Added immediate dismissal on the next interaction by clearing the popup on hover/selection changes.
- Added a small bump animation on the clicked locked sign so the world itself reacts to the click.
- Tightened the sign typography and spacing so titles and second-row content align more consistently across all signs.
- Increased title size slightly, brightened the flower row, reduced the lock icon a bit, and normalized the gap between the title and second row.
- Kept unlocked world behavior unchanged.

## 4. Files Changed
- capy-village/src/ui/HubModal.js
- capy-village/src/style.css
- docs/review/REVIEW_BUNDLE.md
- docs/progress.md

## 5. Architecture Impact
This keeps the fullscreen Math world screen structure intact and only refines the locked feedback mechanism. Locked feedback is now represented as transient world-screen state with anchored popup positioning derived from the same sign-box metadata already used for the clickable regions, so no new global modal/toast system was introduced.

## 6. Key Implementation Notes
The locked popup now uses:

```text
- anchor point from the clicked world sign box
- compact warm bubble styling
- centered 2-line content
- auto-dismiss timer
```

Popup copy now follows:

```text
Locked
Complete Number Garden first
```

The sign feedback includes:

```text
1. contextual popup
2. short bump animation on the clicked locked sign
```

## 7. Risks / Known Issues
- Popup placement is anchored from the normalized sign box with simple bounds clamping, so it is much closer to the clicked world than the previous banner but still not a hand-authored bubble anchor per world.
- The popup currently avoids screen-edge/header overlap through generic clamping rather than a per-world authored placement table.
- This pass was verified through publish/build and code-path inspection, but I intentionally did not start a new Playwright browser session because of the earlier orphan-window issue.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: improved because locked feedback is now tied directly to the clicked world location
- hybrid retrieval: unchanged
- verification layer: improved because the unlock requirement is now surfaced in immediate contextual feedback
- generic schema: unchanged
- inspectability: improved because locked behavior is easier to understand from the world screen itself

## 9. Testing Performed
- Ran `npm run publish-assets` successfully from the repo root.
- Ran `npm run build` successfully in `capy-village`.
- Reviewed the Math world click handler to confirm locked worlds do not navigate.
- Reviewed popup placement logic to confirm it is derived from the clicked sign box and clamped away from top/screen edges.
- Reviewed interaction flow to confirm the popup auto-dismisses and clears on the next interaction.
- Reviewed sign-class handling to confirm the bump animation only applies to the clicked locked world.
- Reviewed the sign layout CSS to confirm second-row alignment and spacing are now fixed more consistently across signs.

## 10. Example Output / Logs
```text
Locked
Complete Number Garden first
```

## 11. Recommended Reviewer Focus
- Open the Math world screen and click several locked worlds.
- Confirm the popup appears near the clicked world rather than at the top of the screen.
- Confirm the message is readable at a glance and disappears automatically.
- Confirm the locked sign gives a small bump response and the game does not navigate.

## 12. Suggested Next Step
If you want even more polish later, the next follow-up would be adding a tiny speech-bubble pointer or per-world anchor offsets so the popup can point even more precisely at each specific sign.
