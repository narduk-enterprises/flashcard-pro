---
description: Use Google's HEART framework to identify UX gaps, prioritize fixes, and generate implementation-ready tasks
---

Use this workflow when you want an autonomous UX audit that turns vague quality concerns into concrete engineering work.

## Outcome

By the end, you will have:
- A scored UX report using HEART dimensions (Happiness, Engagement, Adoption, Retention, Task Success)
- A prioritized backlog with severity and effort tags
- At least one shipped UX improvement with validation notes

## Step 1: Define UX Goals and Success Signals

1. Identify the surface area you are auditing (`apps/web/app/pages/*`, shared components, forms, onboarding, etc.).
2. For each HEART dimension, define:
   - **Goal** (what should improve)
   - **Signal** (what user behavior suggests improvement)
   - **Metric** (what can be measured from UI behavior, logs, or analytics)
3. Create a short scorecard in `docs/ux/heart-scorecard.md`.

## Step 2: Run a Heuristic and Flow Audit

1. Review the target route(s) and record issues in these buckets:
   - Navigation clarity
   - Visual hierarchy and density
   - Feedback states (loading, success, error, empty)
   - Accessibility (keyboard, aria labels, contrast, focus order)
   - Mobile and tablet behavior
2. Capture each issue with:
   - Reproduction steps
   - User impact
   - Proposed change
   - HEART dimension impacted

## Step 3: Convert Findings to Backlog

1. Create `docs/ux/heart-backlog.md` with this schema:
   - `ID`
   - `Issue`
   - `Dimension` (H/E/A/R/T)
   - `Severity` (S1–S4)
   - `Effort` (XS/S/M/L)
   - `Owner` (agent)
   - `Implementation Plan`
2. Sort by: highest severity first, then lowest effort.

## Step 4: Implement Top UX Improvements

1. Select the top 1–3 backlog items that are safe to ship now.
2. Implement changes directly in `apps/web/` while respecting layer constraints.
3. Add/update tests where practical.

## Step 5: Validate and Report

1. Run quality checks:
   // turbo-all
   `pnpm run lint`
   `pnpm run typecheck`
2. Provide a concise before/after summary:
   - What changed
   - Which HEART dimensions improved
   - Remaining known UX debt
