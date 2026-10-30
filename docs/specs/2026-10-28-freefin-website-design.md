# FreeFin website — design

Date: 2026-10-28. Status: waiting for the user's approval. Reviewed once by a builder check.

## 1. Why this exists

FreeFin is the team "wac" entry in the RMIT Business Plan Competition 2026 (area: Banking, finance
and economics). The judges get slides and a video. This website lets them **see the platform
really working**: they click through a freelancer's real-looking journey and watch the rules,
money flows and AI do their jobs.

Source of truth for all content and numbers: `rmit 26.md` (English sections 10, 11, 13, 14, 20 near the
end of the file are the newest) and the slide PDF in the project root.

## 2. Goals, non-goals, anti-goals

Goals
- **The demo works on Vercel by 30/10**, because the team screen-records it for the video
  (video deadline 30/10). The promo page must be live by **1/11** (final submission).
  Build order: demo first, promo page second.
- One link. No sign-up. Works on a laptop browser; must not break on a phone.
- All four core features work with sample data: job + escrow, income record, loan + guarantee
  check, late-payment advance.
- Real Gemini AI in four places, with a backup answer if it fails.
- Looks like the same brand as the Canva slides.

Non-goals
- Real accounts, real money, real banks, saved data, admin tools, Vietnamese version.

Anti-goals (would be a failure even if it "works")
- Any number that does not match `rmit 26.md`, or any invented data, source, interview or statistic.
- Hiding that it is a simulation. Every demo screen shows "Illustrative demo · sample data".
- The demo freezing or showing an error in front of a judge.
- The Gemini API key reaching the browser.
- The team's working files (`rmit 26.md`, the slide PDF) being served on the public site.
- Messy code: frameworks, build tools or libraries that the job does not need.

## 3. What was decided with the user

- Audience: competition judges.
- Layout: **promo page + demo**. The promo page has a big "Try the live demo" button.
- Demo flow: **guided story** as Minh, steps 1–6 with "Next" / "Back".
- Demo screen: **layout B** — the app on the left, a dark "What is happening" panel on the right
  that explains each step in plain words, step dots at the top.
- Role switch at the top of the app: **Freelancer / Client / Bank**. Same sample data, three views.
- Look: **match the slides** — dark navy and bright sky blue on white, tall bold uppercase headings
  (condensed type), blue city-building photo mood.
- Gemini AI (the user already has a key from the su-tu project) for: drafting the job agreement,
  the income summary for the bank, explaining the loan result, spotting odd activity.
- If Gemini fails or is slow: show a **pre-written backup answer**, never an error.
- Loan step: **sliders** so judges can change the inputs and see the result change live.
- Promo page shows the team: "wac" and the four names, like slide 1.
- Deploy: **GitHub repo + Vercel** (auto-deploy on push). The user commits and pushes.
- Repo: git in this folder, **site only**. `rmit 26.md` and the slide PDF are in `.gitignore`,
  so they never reach GitHub. Before `git init` (ask-first), the workflow files are hidden in
  `.git/info/exclude` (SETUP.md Step 1).
- The demo appears in the video, and the link goes in the submission. Adding the link to the
  slides and video is the team's job in Canva, not part of this build.
- Text: English.

## 4. Promo page

One scrolling page. Content comes from the slides and doc, shortened:

1. Hero — "‘FREEFIN’ Freelancer finance platform", one-line promise, "Try the live demo" button,
   "No sign-up · sample data".
2. The problems we address — the three problems from slide 4 with their sources as small [n].
3. Three core features — connect & escrow, loan support + guarantee, repayment advance.
4. How it works — the user journey strip (register → agree → deliver → paid → request financing →
   bank decides).
5. Value for each participant — freelancer / client / bank / platform.
6. Team — "From ‘wac’ team" and the four names.
7. Sources — the full list for the [n] marks, same rule as the slides.
8. Second "Try the live demo" button.

Labels stay honest: impacts are "expected", differences are "hypotheses to validate",
as in the doc.

## 5. The demo story

Main character: Minh, freelance video editor (hypothetical, label kept). Sample clients are made-up
small businesses, clearly fictional. Money in VND, shown like "15.0M".

**Fixed numbers.** The new job's price is fixed in the sample data. A judge can edit the brief, and
Gemini changes the wording of the agreement, but the price, fee and every later number stay the
same. That keeps step 5 equal to the doc's worked example. The sample history is built so the lower
of the 3-month and 6-month averages (new job included) is exactly 20M. The step 5 income slider
starts from that number. Moving a slider is a "what if" and does not change steps 1–4.

**Role switch.** Each step opens in the main person's view: steps 1–2 Client, steps 3–4 and 6
Freelancer, step 5 Bank (after Minh's view of the check). The switch lets judges peek at the other
two sides. Those show one small card, "what this side sees now", not a full screen.

**Step 1 — Agree on a job.** Client view: a short brief in a text box (pre-filled, editable).
"Draft agreement" sends it to Gemini, which returns scope, price, deadline, milestones and
acceptance criteria. Both sides "accept". Panel explains why clear terms matter.

**Step 2 — Escrow.** Client funds the milestone. Money shows as "held by FreeFin", not yet Minh's.

**Step 3 — Deliver and get paid.** Minh submits the work, client accepts, money is released.
Fee by the doc's Section 13: **8%** if FreeFin found the client, **2%** if Minh brought the client.
Show which one applies and the amount kept.

**Step 4 — Income record.** Minh's history: jobs from several independent clients over 6+ months,
including the new one. Shows the 3-month and 6-month averages, largest client share.
Gemini writes the "income evidence summary" for the bank. A second Gemini call ("Check for odd
activity") flags things like circular payments or one client paying most of the money. The sample
data includes one harmless thing worth a flag so the check has something to say.

**Step 5 — Loan and guarantee check.** The rules decide. Gemini only explains. Rules from
`rmit 26.md` Section 10:
- age 18+; at least 6 months of history; at least 3 independent clients;
- conservative income = 70% × the lower of the 3-month and 6-month average income;
- total monthly debt payments ≤ 30% of conservative income;
- cash left after living costs ≥ 1.5 × debt payments;
- largest client ≤ 50% of income;
- pilot loan cap 30M; guarantee = 50% of outstanding principal, max 15M, going down as principal
  is repaid; final limit = the lowest of product cap, repayment capacity (and the bank's limit).
- loan: equal principal instalments, 18% per year (internal assumption), guarantee fee 6%/yr ×
  guaranteed outstanding ÷ 12, setup fee 0.15M once.

Sliders: income after work costs, living costs, existing debt payments, loan amount, term.
Defaults = the doc's worked example: income 20M, living 6M, existing debt 0.5M, loan 30M, 12 months
→ first payment 2.95M + 0.075M guarantee fee + 0.15M setup + 0.5M existing ≈ 3.675M, below the 4.2M
limit, cash cover ≈ 2.18×. The screen must reproduce these numbers exactly. Each rule shows a
green tick or red cross. Then "Explain this result" → Gemini, plain words.
Bank view: the application package (identity verified, income summary, rule results, guarantee
terms) and "Bank decides" — the bank decides, not FreeFin.

**Step 6 — Late payment.** A client payment is late just before Minh's repayment is due. Rules from
the slide "Payment and advance rules": the milestone was funded first; the advance is capped and for
a set period; recovered when the client pays; advance and client acceptance are two separate
decisions; an advance is never counted as a guarantee. Show: repayment due → FreeFin advances it
→ bank paid on time → client pays → advance recovered. No fee number is in the doc, so the screen
says the costs are "disclosed upfront", without a made-up amount.

Ending: a short summary of what happened, "Restart demo", and a link back to the promo page.

## 6. How it gets made (technical)

- Plain HTML, CSS and JavaScript. No framework, no build step, no npm packages.
- All site files live in a `site/` folder. Vercel's "Root Directory" is set to `site`, so only that
  folder is public. Planned files:
  - `site/index.html` — promo page
  - `site/demo.html` — demo
  - `site/style.css` — shared look
  - `site/demo.js` — sample data, rules, step logic
  - `site/api/ai.js` — the one Vercel server function that calls Gemini
- Demo state lives in memory. Reload = fresh start.
- Gemini: copy only the Gemini part of `/home/huyanh/code/su-tu/api/_ai.js` (same endpoint, model
  and request shape). Key read from the Vercel env var `GEMINI_API_KEY`.
- `site/api/ai.js` accepts only the four known task names and a small, length-capped input. The
  server builds the prompt; the browser never sends a prompt. The user's typed brief is treated as
  data, not as instructions. Short timeout. Any failure → the browser shows the backup answer for
  that task. Backup answers live in `demo.js`.
- Loan math is plain functions with one small runnable check that reproduces the Section 10
  worked example (2.95M, 3.675M, 4.2M, 2.18×).
- Fonts and photos: free web fonts close to the slides. Photos only if free to use; otherwise use
  blue shapes, no photos.
- Accessibility basics: real buttons, readable contrast, keyboard can move through the steps.

## 7. Left to the builder

- Exact wording of each "What is happening" panel (short, plain, true to the doc).
- The sample transaction list (fictional, consistent with Minh's 15–22M monthly income and the
  defaults above).
- Exact fonts, spacing and how the layout folds down on a phone.
- The backup answers' wording (they must sound like the real AI answer for the default data).

## 8. Claude's calls (not chosen by the user — check these)

- Plain HTML/CSS/JS, no framework.
- `site/` folder + Vercel Root Directory, so the working doc and PDF are never public.
- Fees: 8% / 2% from Section 13 (the slides show "average 5%" as a model average).
- Loan rules and defaults from the English Section 10, not the older Vietnamese example (≈6M).
- No advance fee number shown, because the doc has none.
- No rate limiting on the AI function at first; the input caps plus the backup answers cover the
  risk. Add a limit if the key gets abused.
- Job price fixed. Brief edits change wording only.
- Role switch: main view per step, plus small "peek" cards for the other two sides.
- This document lives in `docs/specs/` and goes into git.
