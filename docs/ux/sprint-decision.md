# UX Sprint Decision

## Candidate Solutions

| Candidate | Description | Benefits | Risks | Effort |
|---|---|---|---|---|
| Conservative | Refactor logout handler to script method only | Removes lint warning, cleaner template | Small UX impact | XS |
| Balanced | Conservative + add `aria-current`, `aria-expanded`, and disabled/loading state for logout | Better accessibility and interaction feedback with low risk | Minor template churn | S |
| Bold | Rebuild header/nav with full command palette and keyboard nav | High UX upside long-term | Much larger scope and regression risk | L |

## Scoring Matrix (1 low → 5 high)

| Candidate | Usability Impact | Eng. Complexity (inverse) | A11y Confidence | Perf Risk (inverse) | Maintainability | Total |
|---|---:|---:|---:|---:|---:|---:|
| Conservative | 2 | 5 | 2 | 5 | 5 | 19 |
| Balanced | 4 | 4 | 5 | 5 | 5 | **23** |
| Bold | 5 | 1 | 3 | 3 | 2 | 14 |

## Winner
**Balanced**. Best impact-to-effort ratio and directly addresses discovered UX debt while staying safe for release.
