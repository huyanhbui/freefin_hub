# CLAUDE.md — FreeFin (freefinhub) — project-only rules

Shared rules: `/home/huyanh/code/CLAUDE.md` (loaded automatically, before this file).
This file adds rules for this project only. Do not repeat shared rules here.

## Project type

A business plan entry, not an app. There is no app code here.

- Competition: RMIT Business Plan Competition 2026 (RBPC2026), area "Banking, finance and economics".
- Team "wac": Nguyen Giang Gia Han, Tran Le An Khue, Đào Xuân Hiếu, Trương Như Tình.
- Product: FreeFin, a finance platform for freelancers (job matching + escrow-style payments,
  loan application support + platform credit guarantee, repayment advances).
- `RBPC2026_wac_FreeFin_Banking, finance and economics.pdf` — the slide deck. 24 pages, made in Canva, about 71 MB.
  It is an export. The real slides live in Canva, not in this folder.
- `rmit 26.md` — the team's working doc (a Google Docs export). Vietnamese and English mixed.
  Has the competition rules, slide plan, task split, deadlines, and English versions of
  sections 10–14 and 20 near the end. Has embedded images as long `[imageN]: data:...` lines.
- This folder is NOT a git repo (checked 2026-10-28).

## Language of user-facing files

- Slides, business plan and video: English (the judges read these).
- `rmit 26.md`: Vietnamese team notes plus English final text. Keep each part in its own language.

## Content files I edit myself

- `rmit 26.md`
- The slides, in Canva (outside this folder).

## Ask-first commands

Never do without asking me first:
- uploading or publishing any project file or text to an outside service (artifacts, Presenton,
  public image import, web tools) — it is our competition entry and may be cached forever
- `git init` — the workflow files must be hidden in `.git/info/exclude` first (SETUP.md Step 1)

## Always YES files (THE GATE Q2)

- any change to the PDF, or any new file meant for submission (slides, business plan, video script)
- any change to finance numbers or tables in `rmit 26.md` (they repeat in several places)
- deleting or replacing any file the team gave us

## Usually NO

- reading the PDF or the doc, extracting text, checking numbers and finding mismatches
- a text fix in `rmit 26.md` that I asked for word by word

## Safety rules (Review checks these)

- Never invent data, sources, interviews or survey results. The Minh case is labeled hypothetical: keep that label.
- Keep every "illustrative", "assumption", "hypothesis to validate" label. The judges must see what is not proven.
- A finance number must be the same everywhere: Vietnamese table, English table, and slides.
- Sources: small numbers like [1] on the slide, full list on the last slide.
- Do not touch the long `[imageN]: data:...` lines in `rmit 26.md`.

## Audit checks

- `pdfinfo "RBPC2026_wac_FreeFin_Banking, finance and economics.pdf"` — page count
- `pdftotext -layout "RBPC2026_wac_FreeFin_Banking, finance and economics.pdf" -` — read slide text
- `grep -n` in `rmit 26.md` to compare numbers

**Only if CHECKS TO RUN says the user said yes:** none yet

**Never run** anything that writes to, renames or deletes the PDF or `rmit 26.md`.

## Code map notes

No code, so no code map (graphify). Skip it.
