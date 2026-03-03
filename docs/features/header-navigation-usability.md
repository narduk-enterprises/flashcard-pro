# Feature Plan: Header Navigation Usability

## Goal
Improve global header interaction clarity and accessibility without changing overall IA.

## Scope
- Refactor logout click logic into script method.
- Add active route semantics for desktop and mobile navigation items.
- Add menu trigger accessibility state (`aria-expanded`, `aria-controls`).
- Add logout loading/disabled state.

## Out of Scope
- New routes
- Header visual redesign
- Command palette

## Data/API Changes
None.

## UI Changes
- Header nav links announce active page state.
- Mobile nav toggle announces expanded/collapsed state.
- Logout button shows pending state.

## Test Plan
- Run `pnpm run lint` and `pnpm run typecheck`.
- Manual interaction check in browser screenshot pass.
