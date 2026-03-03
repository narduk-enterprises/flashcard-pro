---
description: Perform a high-signal UI polish pass focused on micro-interactions, clarity, and consistency
---

Use this workflow when functionality exists but the experience needs to feel more professional and cohesive.

## Step 1: Build a Polish Checklist

1. Audit the target pages for:
   - Spacing rhythm and alignment consistency
   - Typography hierarchy and readability
   - CTA clarity and button prominence
   - Form affordances and validation messaging
   - Motion and transition consistency
2. Save checklist to `docs/ux/polish-checklist.md`.

## Step 2: Apply Nuxt UI + Token-First Refinements

1. Replace ad hoc styling with design-token-friendly utilities.
2. Ensure consistent use of Nuxt UI variants, sizes, and iconography.
3. Add missing empty/loading/error states where users might hesitate.

## Step 3: Interaction Quality Pass

1. Ensure visible focus states for keyboard users.
2. Reduce cognitive load in dense screens (grouping, separators, card structure).
3. Validate touch target sizing for mobile.

## Step 4: Validate + Capture

1. Run checks:
   // turbo-all
   `pnpm run lint`
   `pnpm run typecheck`
2. Capture screenshots of improved screens for visual diffing.
3. Summarize improvements in `docs/ux/polish-summary.md`.
