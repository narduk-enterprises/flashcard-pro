# HEART Backlog

| ID | Issue | Dimension | Severity | Effort | Owner | Implementation Plan |
|---|---|---|---|---|---|---|
| HX-001 | Logout handler embedded complex async expression in template | T, H | S2 | XS | agent | Move logic to `handleLogout()` and add pending/disabled state |
| HX-002 | Active route state lacked semantic announcement | T, A | S2 | S | agent | Add route helper + `aria-current` for nav links |
| HX-003 | Mobile menu button lacked expanded state semantics | T, A | S3 | XS | agent | Add `aria-expanded` + `aria-controls`; bind menu id |
