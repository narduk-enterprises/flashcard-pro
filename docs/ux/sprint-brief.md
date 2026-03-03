# UX Sprint Brief

## Target User
Authenticated flashcard learners switching between deck management and study flows.

## Critical Journey
Open app → orient in global navigation → jump to key destination (Home/Discover/New Deck) → continue session.

## Pain Point
Header interactions lacked a few usability/accessibility safeguards:
- logout action had inline async template logic
- active navigation state was visual-only (no `aria-current`)
- mobile menu trigger did not expose expanded/collapsed state

## Constraints
- Keep implementation in `apps/web/` only
- Keep layer-provided patterns intact
- Use Nuxt UI 4 components and token-friendly classes
