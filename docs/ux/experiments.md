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

### Next Action
Evaluate adding keyboard-first nav focus styling and command launcher experiment.
