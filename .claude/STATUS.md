# STATUS.md

Last checked: 2026-10-28

## BIG PROJECT GOAL

Submit the FreeFin business plan to the RMIT Business Plan Competition 2026 (area: Banking, finance
and economics) by 1/11. FreeFin is a finance platform for freelancers in Vietnam: it records their
work and payments, helps them apply for bank loans with a limited platform guarantee, and advances
loan repayments when a client pays late. Deliverables: the slide deck (business plan) and a video of
2 minutes or less (MP4 or MOV).

---

## CURRENT CHRONOLOGICAL STEP

**Step 4 — not chosen yet**

Stage: see `.claude/sticky.md`.

The website is complete locally (promo page + demo). The user does git and deploy themselves.
Run: `node --env-file-if-exists=.env server.mjs` → http://127.0.0.1:3000/

Done when:
- the user names the next task

---

## CURRENT VERIFIED STATE

- 2026-10-28: folder has 2 files: the slide PDF (24 pages) and `rmit 26.md`. Not a git repo. No app code.
- 2026-10-28: workflow files created (`.claude/`). No code map, because there is no code.
- 2026-10-28: user wants a promo + working demo website for the judges. Design and plan approved.
- 2026-10-28: user said they do git and deploy themselves; run locally only.
- 2026-10-28: Step 1 done (engine: loan rules, sample data, Gemini function, local server). Audit PASS.
- 2026-10-28: Step 2 done (demo pages, 6 steps + ending). Audit PASS. Run: `node --env-file-if-exists=.env server.mjs` → http://127.0.0.1:3000/demo.html
- 2026-10-28: Step 3 done (promo page). Audit PASS. Website complete locally.
- 2026-10-28: number mismatches found between the slides and the doc (see VERIFIED FACTS). Not fixed.

---

## CURRENT BLOCKERS

- none

---

## NEXT ACTION

- User: put the Gemini key in `.env` and try the site locally; record the demo for the video (due 30/10).
- User, before first `git add`: `printf '/.claude/\n/graphify-out/\n/.graphifyignore\n' >> .git/info/exclude`
- User, on Vercel: Root Directory `site`, env var `GEMINI_API_KEY`.

---

## VERIFIED FACTS

Checked in the files on 2026-10-28.

- Deadlines (`rmit 26.md:232-251`): final slides 27/10, video sources 28/10, video 30/10, final submission 1/11.
- Video rules (`rmit 26.md`, "### Video"): max 2 minutes, MP4 or MOV; must cover background/problem,
  how the tech solves it, expected outcomes.
- English Section 10 (`rmit 26.md:599-618`): worked example 30M loan, 12 months, 18% → first payment 2.95M,
  total 3.675M, limit 4.2M, cover 2.18×. Section 13 (`:640-647`): fee 8% new clients, 2% own clients, setup 0.15M,
  guarantee fee 6%/yr.
- Gemini pattern to copy: `/home/huyanh/code/su-tu/api/_ai.js` (`gemini()`), key in env `GEMINI_API_KEY`.
- Slide plan has 22 slides (`rmit 26.md:204-230`). The PDF has 24 pages.
- Doc design note (`rmit 26.md:253`): sources as small [1] numbers, full list on the last slide.
- Doc finance (`rmit 26.md:503-528`, English copy `:679-715`): Year 2 total revenue 2,386.6;
  Year 1 contribution after direct and risk costs 220.2 (VND million).
- Slides show different values (PDF text): "Total revenue 300.0 2,386.2 4,773.2" on the growth slide,
  and "Contribution ... 2,202" for Year 1 on the projections slide. These do not match the doc.
- Slide typos seen in PDF text: "Veelacen", "Year tt", "quarteed sustanting principal", "implementant".
- Marketing slide "The Invisible Payslip" talks about employee benefits on internal channels.
  The doc (`rmit 26.md:369-376`) says it is a digital payslip for freelancers. They do not match.

---

## FILE MAP

Project:
- `RBPC2026_wac_FreeFin_Banking, finance and economics.pdf` — slide deck, Canva export
- `rmit 26.md` — team working doc (Vietnamese + English), plan, finance tables, deadlines
- `docs/specs/`, `docs/superpowers/plans/` — website design and build plan
- `site/` — the website (only this folder is deployed); `server.mjs` — local dev server; `tests/` — checks

Workflow:
- `.claude/CLAUDE.md` — rules for this project only (shared rules: `/home/huyanh/code/CLAUDE.md`)
- `.claude/STATUS.md` — this file
- `.claude/sticky.md` — open loop state
- `.claude/notation-log.md` — history of finished loops
- `.claude/design.md` — why the plan is built this way
- `.claude/memory/` — longer notes
- `/home/huyanh/code/.claude-workflow/` — shared roles, envelope formats, setup, templates

---

## RULES

- Never invent data, sources or interviews. Keep all "illustrative / assumption" labels.
- Finance numbers must match in every place they appear.
- Ask before uploading anything to an outside service, and before `git init`.
- Changes to the PDF, to finance tables, or to anything for submission go through the assembly line.
- The user commits and pushes. Claude never commits.
