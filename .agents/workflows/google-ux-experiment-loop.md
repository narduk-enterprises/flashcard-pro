---
description: Run continuous UX experiments with hypothesis-driven implementation and measurable outcomes
---

Use this workflow when you want a repeatable loop for shipping UX experiments autonomously.

## Loop Structure

Each cycle should produce one implemented experiment and one decision: keep, iterate, or revert.

## Step 1: Define Hypothesis

1. Write a one-line hypothesis:
   - "If we change X for Y users, metric Z should improve by N%."
2. Document in `docs/ux/experiments.md` with:
   - Baseline behavior
   - Audience
   - Success and guardrail metrics

## Step 2: Design Experiment Variant

1. Specify control vs. variant behavior.
2. Keep scope small (single page, single flow, or single component family).
3. Identify instrumentation requirements (events or server logs).

## Step 3: Implement and Guard

1. Add the variant behind a simple runtime flag when possible.
2. Implement robust UI states (loading/error/empty/success).
3. Ensure accessibility and responsive behavior are not regressed.

## Step 4: Evaluate

1. Run checks:
   // turbo-all
   `pnpm run lint`
   `pnpm run typecheck`
2. Record a decision in `docs/ux/experiments.md`:
   - Keep
   - Iterate
   - Revert
3. Add next action for the following cycle.
