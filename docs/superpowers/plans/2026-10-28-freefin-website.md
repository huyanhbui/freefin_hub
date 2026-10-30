# FreeFin Website Implementation Plan

> **For agentic workers:** Execution in this project uses THE ASSEMBLY LINE from
> `/home/huyanh/code/CLAUDE.md` (Architect → Review → user approval → Worker → Audit → user final
> approval), one task per loop. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Claude never runs `git commit`.** Each task ends with a list of files and a commit message; the user commits.

**Goal:** A promo page and a guided, working FreeFin demo (escrow, income record, loan + guarantee
check, late-payment advance) with real Gemini AI and backup answers, hosted on Vercel.

**Architecture:** Static files in `site/` (Vercel Root Directory = `site`). Pure logic in ES modules
(`loan.js`, `data.js`) shared by the browser and one Vercel function (`api/ai.js`). The demo UI
(`demo.js`) is a small step machine that renders into `demo.html`.

**Tech Stack:** Plain HTML, CSS, JavaScript (ES modules). Node 26 for checks (`node:assert`). No npm packages.

**Spec:** `docs/specs/2026-10-28-freefin-website-design.md`

## Global Constraints

- No framework, no build step, no npm dependencies. `site/package.json` is only `{"type":"module"}`.
- Only `site/` is deployed. `rmit 26.md` and `RBPC2026_wac_FreeFin_Banking, finance and economics.pdf` are in `.gitignore`.
- All visible text is English. Every demo screen shows "Illustrative demo · sample data". Minh is labeled hypothetical.
- Never invent statistics or sources. Promo-page facts and their sources come from the slide PDF / `rmit 26.md` only.
- Money in VND millions, shown with one decimal and "M" (e.g. `15.0M`); 3-decimal values only where the doc uses them (`0.075M`, `3.675M`).
- Gemini key only in env `GEMINI_API_KEY`, read in `site/api/ai.js`. Endpoint `https://generativelanguage.googleapis.com/v1beta/interactions`, model `gemini-3.8-flash`, request shape as in `/home/huyanh/code/su-tu/api/_ai.js` (`gemini()` only, no OpenRouter).
- Brand: navy `#0b2e5c`, sky `#1fa2e0`, pale `#eaf5fc`, white. Headings Oswald (uppercase), body Inter (Google Fonts).
- Tasks 4–6 (UI): the implementer invokes the `frontend-design:frontend-design` skill first, within these constraints.
- Accessibility: real `<button>`/`<input type=range>` elements with labels, visible keyboard focus, readable contrast.
- Ask-first: `git init`, `git push`, any deploy, any upload to an outside service.

## Review Focus

1. Gemini down / no key / quota (429) / slow → every AI button shows the backup answer within ~12 s, never an error. (Task 3 test + Task 4 client timeout)
2. A judge types a huge or hostile brief ("ignore your rules…") → server rejects >600 chars, prompt treats it as data, price stays fixed. (Task 3 test)
3. Sliders pushed to extremes (income 0, debt above income, loan 0) → no `NaN`/`Infinity` on screen; result is "not eligible" with reasons. (Task 2 test)
4. Reload or "Restart demo" mid-story → clean start at step 1, no leftover state. (Task 4 manual check)
5. Phone-width screen (375 px) → panel stacks under the app; nothing cut off. (Tasks 4–6 manual check)

---

### Task 1: Repo and folder setup

**Files:**
- Modify: `.git/info/exclude` (created by `git init`)
- Create: `.gitignore`, `site/package.json`

- [ ] **Step 1:** With the user's yes (ask-first), run `git init` in `/home/huyanh/code/freefinhub`, then append to `.git/info/exclude`:
  `/.claude/`, `/graphify-out/`, `/.graphifyignore`.
- [ ] **Step 2:** `.gitignore` contains exactly: `rmit 26.md`, `RBPC2026_wac_FreeFin_Banking, finance and economics.pdf`, `.vercel/`, `node_modules/`.
- [ ] **Step 3:** `site/package.json` = `{"type":"module"}`.
- [ ] **Step 4: Verify**
  Run: `git check-ignore .claude/STATUS.md "rmit 26.md" && git status --porcelain`
  Expected: both paths printed; status lists only `.gitignore`, `docs/`, `site/`.
- [ ] **Step 5:** Files for the user to commit: `.gitignore docs site`. Message: `chore: set up FreeFin website repo`.

### Task 2: Loan rules and sample data

**Files:**
- Create: `site/loan.js`, `site/data.js`, `tests/loan.test.mjs`

**Interfaces:**
- Produces (`site/loan.js`):
  - `incomeStats(history, currentMonth) -> { avg3, avg6, income, months, clients, largestShare }`
    `history` = `[{ month: "YYYY-MM", client: string, net: number }]` (net = VND M received after fee and project costs).
    `avg3`/`avg6` = average of monthly net totals over the last 3 / 6 calendar months ending at `currentMonth` (empty months count as 0).
    `income` = min(avg3, avg6). `months` = calendar months from first entry to `currentMonth`, inclusive.
    `clients` = distinct clients. `largestShare` = largest client's share of the last 6 months' net (0–1).
  - `checkLoan(input) -> { rules, eligible, conservative, limit, cover, firstMonth, guarantee, maxLoan }`
    `input = { age, months, clients, largestShare, income, living, existingDebt, loan, term }`
    - `conservative = 0.7 × income`; `limit = 0.30 × conservative`
    - equal principal: `principal = loan/term`, `interest = loan × 0.18/12`
    - `guarantee.covered = min(0.5 × loan, 15)`; `guaranteeFee = covered × 0.06/12`; `setupFee = 0.15`
    - `firstMonth = { principal, interest, guaranteeFee, setupFee, existing: existingDebt, total }`
    - `cover = (conservative − living) / firstMonth.total`
    - `rules` = array of `{ id, label, pass, detail }`, ids in this order:
      `age` (≥18), `history` (months ≥6), `clients` (≥3), `concentration` (largestShare ≤0.5),
      `cap` (loan ≤30), `payment` (total ≤ limit), `cover` (cover ≥1.5)
    - `eligible` = every rule passes and `loan > 0`
    - `maxLoan` = largest multiple of 0.1 in [0, 30] whose `payment` and `cover` rules pass with the same other inputs (0 if none)
    - Never returns `NaN`/`Infinity` (guard total = 0).
- Produces (`site/data.js`): `SAMPLE = { currentMonth, freelancer: { name: "Minh", age: 25, role }, newJob: { client, price, found: "platform" | "own", milestone, brief }, history, living: 6, existingDebt: 0.5, loan: 30, term: 12, oddActivityHint }`
  and `BACKUP = { agreement, income_summary, explain_loan, odd_activity }` (strings).
  `history` already includes `newJob`'s net. Clients are fictional small businesses. `newJob.found = "platform"` → fee 8%.

- [ ] **Step 1: Write the failing test** `tests/loan.test.mjs` (uses `node:assert/strict`):
  - `incomeStats(SAMPLE.history, SAMPLE.currentMonth)`: `income === 20`, `months >= 6`, `clients >= 3`, `largestShare <= 0.5`.
  - `checkLoan` with the doc example `{age:25, months:7, clients:4, largestShare:0.4, income:20, living:6, existingDebt:0.5, loan:30, term:12}`:
    `conservative 14`, `limit 4.2`, `firstMonth.principal 2.5`, `interest 0.45`, `guaranteeFee 0.075`, `total 3.675` (±1e-9), `cover.toFixed(2) === "2.18"`, `eligible true`, `maxLoan 30`.
  - `loan: 40` → rule `cap` fails, `eligible false`.
  - Extremes `income:0, existingDebt:20, loan:0` → `eligible false`, every number finite.
- [ ] **Step 2:** Run `node tests/loan.test.mjs` → fails (module not found).
- [ ] **Step 3:** Implement `site/loan.js` and `site/data.js` per Interfaces. Backup answers are written for the default data and sound like the real AI (2–5 sentences each; `agreement` is a short structured agreement for `newJob`).
- [ ] **Step 4:** Run `node tests/loan.test.mjs` → exits 0, no output.
- [ ] **Step 5:** Files to commit: `site/loan.js site/data.js tests/loan.test.mjs`. Message: `feat: add loan rules and sample data`.

### Task 3: Gemini function

**Files:**
- Create: `site/api/ai.js`, `tests/ai.test.mjs`

**Interfaces:**
- Consumes: `SAMPLE`, `checkLoan`, `incomeStats` (Task 2).
- Produces: `POST /api/ai` body `{ task, brief?, loanInput? }` → `200 { text }` or `4xx/5xx { error }`.
  - `task` ∈ `agreement | income_summary | odd_activity | explain_loan`, else 400.
  - `agreement`: `brief` string, 1–600 chars after trim, else 400. Prompt includes `SAMPLE.newJob` price/milestone as fixed facts; brief marked as client text, never instructions.
  - `income_summary`, `odd_activity`: server uses `SAMPLE.history` + `incomeStats`; no client data.
  - `explain_loan`: `loanInput` with the 9 `checkLoan` keys, each a finite number in the slider range (else 400); server runs `checkLoan` itself and asks Gemini to explain that result. The rules decide, not the AI.
  - No key → 500; Gemini 429 → 429; other failure/timeout (10 s) → 502. Error body never contains the key or the prompt.
  - Default export `handler(req, res)` (Vercel Node style, like su-tu).

- [ ] **Step 1: Write the failing test** `tests/ai.test.mjs` with a fake `res` (`status()`/`json()` recorder), env key unset:
  - `task:"hack"` → 400; `agreement` with 601-char brief → 400; `explain_loan` with `income:"x"` → 400; GET → 405.
  - Valid `income_summary` with no key → 500 and body `{ error }` only.
  - Stub `globalThis.fetch` to return `{ ok:true, json:()=>({ output_text:"hi", status:"completed" }) }`, set a fake key → valid `agreement` → 200 `{ text:"hi" }`; stub returning `ok:false,status:429` → 429.
- [ ] **Step 2:** Run `node tests/ai.test.mjs` → fails.
- [ ] **Step 3:** Implement `site/api/ai.js`.
- [ ] **Step 4:** Run `node tests/ai.test.mjs && node tests/loan.test.mjs` → exit 0.
- [ ] **Step 5:** Files to commit: `site/api/ai.js tests/ai.test.mjs`. Message: `feat: add Gemini function with input checks`.

### Task 4: Demo shell and steps 1–3

**Files:**
- Create: `site/demo.html`, `site/style.css`, `site/demo.js`

**Interfaces:**
- Consumes: `SAMPLE`, `BACKUP` (Task 2), `POST /api/ai` (Task 3).
- Produces (`site/demo.js`): `askAI(task, extra) -> Promise<{ text, backup: boolean }>` — 12 s client timeout; any non-200, network error or timeout → `{ text: BACKUP[task], backup: true }`. A backup answer is shown normally (small "offline example" note is fine).
  `state = { step: 1..6, role: "freelancer"|"client"|"bank", ... }`; `go(step)`, `setRole(role)`, `render()`.
  `STEPS` = array of 6 `{ title, mainRole, renderMain(state), renderPeek(role, state), panel(state) }`.

- [ ] **Step 1:** Layout B from the spec: step dots + titles on top; app (left) with Freelancer / Client / Bank switch; dark navy "What is happening" panel (right) with Back / Next; banner "Illustrative demo · sample data"; header link back to `index.html`. Under 760 px the panel stacks under the app.
- [ ] **Step 2:** Step 1 (Client): editable pre-filled `SAMPLE.newJob.brief`, "Draft agreement" → `askAI("agreement", { brief })`, show result, "Accept" for both sides. Price shown from `SAMPLE.newJob.price` regardless of AI text.
- [ ] **Step 3:** Step 2 (Client): "Fund milestone" → status "Held by FreeFin". Step 3 (Freelancer): "Submit work" → client "Accept" → released; show fee 8% (platform-found client) and net to Minh.
- [ ] **Step 4:** Peek cards for non-main roles on steps 1–3 (one short card each).
- [ ] **Step 5: Verify** — `python3 -m http.server -d site 8000`, open `http://localhost:8000/demo.html`:
  "Draft agreement" shows the backup agreement (no API locally) within 12 s; steps 1–3 run forward and back; role switch works; reload returns to step 1; 375 px width readable; browser console has no errors.
- [ ] **Step 6:** Files to commit: `site/demo.html site/style.css site/demo.js`. Message: `feat: add demo shell and steps 1-3`.

### Task 5: Demo steps 4–6 and ending

**Files:**
- Modify: `site/demo.js`, `site/style.css`

**Interfaces:**
- Consumes: `incomeStats`, `checkLoan` (Task 2); `askAI`, `STEPS`, `state` (Task 4).

- [ ] **Step 1:** Step 4 (Freelancer): history table, avg3/avg6, clients, largest client share from `incomeStats`; buttons "Write income summary" → `askAI("income_summary")`, "Check for odd activity" → `askAI("odd_activity")`.
- [ ] **Step 2:** Step 5: sliders — income (0–40, default from `incomeStats`), living (0–20, default 6), existing debt (0–10, default 0.5), loan (0–40, default 30), term (6–24, default 12). Live `checkLoan` result: tick/cross per rule with `detail`, first-month breakdown, limit, cover, max loan, guarantee covered. "Explain this result" → `askAI("explain_loan", { loanInput })`. Bank view (main after Minh's view): application package + "The bank decides" note.
- [ ] **Step 3:** Step 6 (Freelancer): timeline — repayment due (first-month bank payment from Step 5 defaults, 2.95M) → client payment late → FreeFin advances it (capped, set period, milestone already funded) → bank paid on time → client pays → advance recovered. Panel states: advance and client acceptance are two separate decisions; an advance is not a guarantee; costs are disclosed upfront (no number).
- [ ] **Step 4:** Ending screen: summary of the 6 steps, "Restart demo" (resets `state` to step 1, defaults), link to promo page.
- [ ] **Step 5: Verify** — same local server: with defaults step 5 shows `2.95M`, `0.075M`, `0.15M`, `3.675M`, limit `4.2M`, cover `2.18×`, all ticks; loan slider to 40 → `cap` cross; income to 0 → crosses, no `NaN`; all AI buttons show backups; restart works; `node tests/loan.test.mjs` still exits 0.
- [ ] **Step 6:** Files to commit: `site/demo.js site/style.css`. Message: `feat: add demo steps 4-6`.

### Task 6: Promo page

**Files:**
- Create: `site/index.html`
- Modify: `site/style.css`

- [ ] **Step 1:** Sections in spec order (hero, problems with [n] sources, three features, how it works, value for each participant, team "From ‘wac’ team" + four names, sources list, second demo button). Text shortened from the slides; "expected" / "hypotheses to validate" wording kept. Sources = the ones printed on the slides (SeABank 2025; CafeF April 2026; PayPal survey 2017 reported by VietNamNet 2018).
- [ ] **Step 2: Verify** — local server, `http://localhost:8000/`: both demo buttons open `demo.html`; every [n] has a matching source; 375 px readable; no console errors. `grep -c "\[1\]" site/index.html` ≥ 1.
- [ ] **Step 3:** Files to commit: `site/index.html site/style.css`. Message: `feat: add promo page`.

### Task 7: Deploy (user does this, Claude gives exact clicks)

- [ ] **Step 1:** User creates a GitHub repo and pushes (ask-first: Claude only gives commands).
- [ ] **Step 2:** Vercel → New Project → import the repo → Root Directory `site` → Framework "Other" → Environment Variable `GEMINI_API_KEY` (same key as su-tu) → Deploy.
- [ ] **Step 3: Verify** on the live URL: `/` loads; `/rmit%2026.md` → 404; demo step 1 "Draft agreement" returns a real (non-backup) answer.
