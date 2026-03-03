---
description: Run an autonomous, Google-style design sprint loop from problem framing to shipped UI prototype
---

Use this workflow when you want the agent to independently brainstorm, prototype, and implement UX improvements in one pass.

## Outcome

- A clearly framed UX problem statement
- Multiple solution candidates
- One implemented, test-validated solution
- Notes for the next iteration

## Step 1: Map and Frame the Problem

1. Define:
   - Target user
   - Critical user journey
   - Pain point and constraints
2. Write a sprint brief in `docs/ux/sprint-brief.md`.

## Step 2: Sketch Multiple Solutions

1. Generate at least 3 candidate solution patterns:
   - Conservative (low risk)
   - Balanced (moderate scope)
   - Bold (high UX impact)
2. For each candidate, include:
   - Why it helps
   - Risks/trade-offs
   - Estimated implementation effort

## Step 3: Decide With a Scoring Matrix

1. Score each candidate across:
   - Usability impact
   - Engineering complexity
   - Accessibility confidence
   - Performance risk
   - Maintainability
2. Pick the highest total score and log rationale in `docs/ux/sprint-decision.md`.

## Step 4: Implement the Winning Variant

1. Build only the chosen variant.
2. Ensure the page continues to use layer SEO composables.
3. Add explicit states for loading, empty, and errors.

## Step 5: QA + Screenshot + Learnings

1. Run local validation checks:
   // turbo-all
   `pnpm run lint`
   `pnpm run typecheck`
2. If the change is visual, capture a screenshot artifact.
3. Write `docs/ux/sprint-retro.md` with:
   - What worked
   - What to improve next sprint
