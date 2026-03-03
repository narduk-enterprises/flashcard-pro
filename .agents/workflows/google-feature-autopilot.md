---
description: Autonomously brainstorm, scope, build, and verify a feature with minimal human intervention
---

Use this workflow when you want the agent to operate end-to-end: discovery, planning, implementation, testing, and documentation.

## Autopilot Contract

- Do not wait for intermediate approval unless blocked by missing product requirements.
- Prefer incremental, production-safe changes over large rewrites.
- Keep commits small and conventional.

## Step 1: Feature Discovery

1. Inspect current UX and existing APIs in `apps/web/`.
2. Propose 5 feature ideas with:
   - User value
   - Technical shape
   - Estimated effort
3. Select one feature using impact-to-effort ratio.

## Step 2: Implementation Plan

1. Produce a checklist in `docs/features/<feature-slug>.md` with:
   - Goal
   - Scope
   - Out-of-scope
   - Data/API changes
   - UI changes
   - Test plan
2. Start with the smallest shippable slice.

## Step 3: Build Vertically

1. Implement backend route/data updates first (if needed).
2. Implement composables and state handling.
3. Implement UI components and page wiring.
4. Add SEO/schema composable calls on new pages.

## Step 4: Self-Review and Hardening

1. Run checks:
   // turbo-all
   `pnpm run lint`
   `pnpm run typecheck`
2. Validate edge cases:
   - Empty data
   - Invalid input
   - Slow/network-failure paths
3. If visual changes were made, capture screenshots.

## Step 5: Ship Notes

1. Write a short delivery summary:
   - Problem solved
   - Files changed
   - Follow-up ideas
2. Commit with conventional commit format.
