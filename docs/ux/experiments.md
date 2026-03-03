# UX Experiments

## Experiment 001 — Header Semantics + Pending Feedback

### Hypothesis
If we expose explicit interaction state in header controls for returning learners, task success for navigation/logout should improve by at least 10% (proxy: fewer repeated clicks and clearer active-state cues).

### Baseline
Header provided visual active states only and inline logout action without pending lock.

### Audience
Authenticated users on desktop and mobile.

### Success Metrics
- Reduced repeated logout clicks while request is pending.
- Improved route orientation via semantic active-state cues.

### Guardrail Metrics
- No increased navigation failure errors.
- No regression in render performance.

### Control vs Variant
- **Control:** prior header behavior.
- **Variant:** script handler + `aria-current` + `aria-expanded` + pending logout.

### Decision
**Keep**. Change is low risk, lint-clean, and improves accessibility semantics.

---

## Experiment 002 — Quick Navigation Launcher

### Hypothesis
If we add a keyboard-accessible quick launcher (`⌘/Ctrl+K`) for common routes, engagement with high-value pages should improve by at least 8% for returning users.

### Baseline
Users navigate exclusively through standard header/menu links.

### Audience
Returning users who revisit the dashboard and discover flow frequently.

### Success Metrics
- Increased transitions to key destinations from the launcher.
- Faster time-to-route-change after app load.

### Guardrail Metrics
- No increase in accidental route changes.
- No regression in mobile navigation clarity.

### Control vs Variant
- **Control:** standard header nav only.
- **Variant:** button-triggered + keyboard-triggered searchable quick actions modal.

### Decision
**Keep**. Provides meaningful ergonomic improvement with minimal complexity and no lint/type regressions.

### Next Action
Instrument lightweight usage analytics for launcher opens and action selections.
