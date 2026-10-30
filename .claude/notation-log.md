# notation-log.md — history of finished loops

Only Notation writes this file. Newest entry at the bottom. Never edit old entries.

Entry format:

```
## YYYY-MM-DD — Step N — <short title>
RESULT: done | stopped | rejected
WHAT CHANGED:
CHECKS:
COMMIT: (the user's commit hash, only if the user shares it)
```

---


## 2026-10-28 — Step 1 — Website engine: loan rules, sample data, Gemini function, local server
RESULT: done
WHAT CHANGED: new files .gitignore, server.mjs, site/package.json, site/loan.js, site/data.js, site/api/ai.js,
  tests/loan.test.mjs, tests/ai.test.mjs. Architect added a decoded "/api/" 404 guard in server.mjs after Audit.
CHECKS: both tests exit 0; doc worked example reproduced (2.95, 3.675, 4.2, 2.18, maxLoan 30); sample income 20;
  path escapes and /api%2fai.js → 404; no-key POST → 500 {error}; 20,000 random inputs → no NaN/Infinity. Audit PASS.
COMMIT: (not shared yet — user has not set up git)

## 2026-10-28 — Step 2 — Demo pages: shell, steps 1–6, ending
RESULT: done
WHAT CHANGED: new files site/demo.html, site/style.css, site/demo.js (layout B, role switch, 6 steps, ending, backups).
CHECKS: tests exit 0; Playwright 43 checks 0 fail (step 5 shows 2.95M/0.075M/0.15M/3.675M/4.2M/2.18×; cap fails at 40;
  no NaN at income 0; 375 px no scroll; keyboard-only run); no innerHTML; only expected "500" network logs. Audit PASS.
COMMIT: (not shared yet — user has not set up git)

## 2026-10-28 — Step 3 — Promo page
RESULT: done
WHAT CHANGED: new site/index.html; promo styles appended to site/style.css (all scoped under .promo, lines 1–290 unchanged).
CHECKS: tests exit 0; other files unchanged (md5); both demo links work; [1]–[3] link to src-1..3; numbers match the slide;
  0 console/page errors; 375 px fits; demo header pixel-identical; reduced motion respected. Audit PASS.
COMMIT: (not shared yet — user has not set up git)
