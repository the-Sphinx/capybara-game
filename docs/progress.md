# Progress

## 2026-03-18

### Completed
- Implemented the asset normalization pipeline from `docs/tasks/capy_asset_normalization_pipeline.md`.
- Added a root `npm run normalize-assets` command.
- Added the initial asset registry for `hut_1`, `mushroom_house`, and `book_statue`.
- Switched normalization to canonical unit-height exports so layout JSON can define true in-world size later.
- Verified normalized outputs are ground-aligned, bottom-centered, and effectively `height = 1`.
- Added `assets/` to `.gitignore`.
- Added a review bundle at `docs/review/REVIEW_BUNDLE.md`.

### Workflow Notes
- New tasks should be read from `docs/tasks/`.
- After each meaningful task: self-check the implementation against the task doc, update `docs/review/REVIEW_BUNDLE.md`, update this file, then commit and push.

### Known Risks
- The current Node-based GLB pipeline emits texture-loading warnings, so final texture preservation still needs review.
