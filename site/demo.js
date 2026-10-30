// FreeFin guided demo. A small step machine: change `state`, then call render().
// Safety: text from the AI, backup answers or the user only goes into the page as text
// (h() uses append(), which makes text nodes). This file never uses innerHTML.
import { fmtM, incomeStats, checkLoan } from "./loan.js";
import { SAMPLE, BACKUP, FEE } from "./data.js";

const AI_TIMEOUT_MS = 12_000;

// Like fmtM, but drops a trailing 0 after two decimals: 2.950M -> 2.95M. 0.075M and 15.0M stay.
const money = (x) => fmtM(x).replace(/(\.\d\d)0M$/, "$1M");
// The same fix for amounts inside the rule texts that loan.js builds with fmtM.
const tidy = (s) => s.replace(/(\.\d\d)0M/g, "$1M");

const JOB = SAMPLE.newJob;
const STATS = incomeStats(SAMPLE.history, SAMPLE.currentMonth);
const FEE_RATE = FEE[JOB.found];
const JOB_FEE = Math.round(JOB.price * FEE_RATE * 100) / 100;
const JOB_NET = Math.round((JOB.price - JOB_FEE) * 100) / 100;
const pct = (x) => Math.round(x * 100) + "%";

// Slider defaults = the doc's worked example. Income comes from the sample history (20M),
// snapped to the slider step.
const DEFAULTS = {
  income: Math.round(STATS.income * 2) / 2,
  living: SAMPLE.living,
  existingDebt: SAMPLE.existingDebt,
  loan: SAMPLE.loan,
  term: SAMPLE.term,
};
const SLIDERS = [
  { key: "income", label: "Income after work costs, per month", min: 0, max: 40, step: 0.5 },
  { key: "living", label: "Living costs, per month", min: 0, max: 20, step: 0.5 },
  { key: "existingDebt", label: "Existing debt payments, per month", min: 0, max: 10, step: 0.1 },
  { key: "loan", label: "Loan amount", min: 0, max: 40, step: 0.5 },
  { key: "term", label: "Term", min: 6, max: 24, step: 1, show: (v) => `${v} months` },
];
// All 9 inputs that checkLoan and /api/ai expect.
const loanInput = (sl) => ({
  age: SAMPLE.freelancer.age,
  months: STATS.months,
  clients: STATS.clients,
  largestShare: STATS.largestShare,
  ...sl,
});
// Step 6 uses the first bank repayment from the default loan: 2.5M + 0.45M = 2.95M.
const DEFAULT_FIRST = checkLoan(loanInput(DEFAULTS)).firstMonth;
const REPAY = DEFAULT_FIRST.principal + DEFAULT_FIRST.interest;

const ROLE_WHO = {
  freelancer: `Signed in as ${SAMPLE.freelancer.name}, ${SAMPLE.freelancer.role.toLowerCase()}`,
  client: "Signed in as the client (a fictional small business)",
  bank: "Signed in as the partner bank (sample)",
};
const ROLE_PEEK = { freelancer: "What Minh sees now", client: "What the client sees now", bank: "What the bank sees now" };

const fresh = () => ({
  step: 1,
  role: "client",
  done: false, // true = the ending screen
  brief: JOB.brief,
  accepted: { client: false, freelancer: false },
  funded: false,
  submitted: false,
  released: false,
  sliders: { ...DEFAULTS },
  sent: false, // step 5: application sent to the bank
  advance: 0, // step 6: 0 = payment late, 1 = advance paid, 2 = client paid
  ai: {}, // task -> { loading } or { text, backup }
});

export let state = fresh();

// ---------- AI ----------

// Ask the server. Any failure (non-200, network, 12 s timeout, bad answer) -> the backup answer.
export async function askAI(task, extra = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);
  try {
    const r = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ task, ...extra }),
      signal: ctrl.signal,
    });
    const data = r.ok ? await r.json() : null;
    if (typeof data?.text === "string" && data.text.trim()) return { text: data.text.trim(), backup: false };
  } catch {
    // Fall through to the backup answer.
  } finally {
    clearTimeout(timer);
  }
  return { text: BACKUP[task], backup: true };
}

async function runAI(task, extra) {
  if (state.ai[task]?.loading) return;
  const job = { loading: true };
  state.ai[task] = job;
  render();
  const res = await askAI(task, extra);
  // Restart, or a slider move, replaced the job: drop this old answer.
  if (state.ai[task] !== job) return;
  state.ai[task] = res;
  announce(res.backup ? "Offline example is ready." : "AI answer is ready.");
  render();
}

// ---------- small DOM helpers ----------

// h("p", { class: "x", onclick: fn }, "text", child) -> element. Strings become text nodes.
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (typeof v === "function") el.addEventListener(k.replace(/^on/, ""), v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  el.append(...kids.flat(Infinity).filter((k) => k != null && k !== false && k !== ""));
  return el;
}

const announce = (msg) => (document.getElementById("status").textContent = msg);

// A button that stays focusable when it is "off" (aria-disabled), so keyboard focus is not lost.
function action(id, label, off, fn, cls = "btn") {
  return h("button", { type: "button", id, class: cls, "aria-disabled": off ? "true" : null, onclick: () => !off && fn() }, label);
}

const switchTo = (role, label) => action("to-" + role, label, false, () => setRole(role), "btn line");

function view(title, ...kids) {
  return h("div", { class: "screen" }, h("h2", { id: "app-title", class: "screen-title", tabindex: "-1" }, title), ...kids);
}

function peek(role, ...kids) {
  const main = STEPS[state.step - 1].mainRole;
  return h(
    "div",
    { class: "peek" },
    h("h2", { id: "app-title", class: "peek-title", tabindex: "-1" }, ROLE_PEEK[role]),
    ...kids,
    switchTo(main, `Back to the ${main} view`),
  );
}

// Fact list: [[label, value, note?], ...]. In "lines" lists the note sits under the label.
const facts = (rows, cls = "facts") => {
  const under = cls.includes("lines");
  return h("dl", { class: cls }, rows.map(([k, v, note]) => {
    const small = note && h("small", {}, note);
    return h("div", {}, h("dt", {}, k, under && small), h("dd", {}, v, !under && small));
  }));
};

function aiBlock(task, label, extra, note = "Offline example: a pre-written answer, shown because the AI is not available.") {
  const a = state.ai[task];
  const busy = !!a?.loading;
  return h(
    "div",
    { class: "ai" },
    h(
      "button",
      { type: "button", id: "ai-" + task, class: "btn", "aria-disabled": busy ? "true" : null, "aria-busy": busy ? "true" : null, onclick: () => !busy && runAI(task, extra()) },
      busy ? "Working… (up to 12 s)" : label,
    ),
    a?.text && h("div", { class: "ai-out" }, a.backup && h("p", { class: "ai-note" }, note), h("p", { class: "ai-text" }, a.text)),
  );
}

const tick = (pass) => h("span", { class: pass ? "ok" : "no", "aria-label": pass ? "Pass" : "Fail" }, pass ? "✓" : "✗");

function ruleList(rules) {
  return h(
    "ul",
    { class: "rules" },
    rules.map((r) => h("li", { class: r.pass ? "pass" : "fail" }, tick(r.pass), h("span", {}, r.label, h("small", {}, tidy(r.detail))))),
  );
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dateLabel = ({ month, day }) => {
  const [y, m] = month.split("-").map(Number);
  return `${day ? day + " " : ""}${MON[m - 1]} ${y}`;
};

const statFacts = () =>
  facts(
    [
      ["3-month average", money(STATS.avg3)],
      ["6-month average", money(STATS.avg6)],
      ["Income used", money(STATS.income), "the lower of the two"],
      ["Months of history", String(STATS.months)],
      ["Independent clients", String(STATS.clients)],
      ["Largest client share", pct(STATS.largestShare), "last 6 months"],
    ],
    "facts grid",
  );

// ---------- step 5 parts ----------

function loanResult(s) {
  const r = checkLoan(loanInput(s.sliders));
  const f = r.firstMonth;
  return h(
    "div",
    { class: "result" },
    h(
      "p",
      { class: r.eligible ? "verdict good" : "verdict bad" },
      r.eligible ? "Passes the FreeFin check" : "Does not pass the FreeFin check",
      h("small", {}, "This is not a loan approval. The bank makes the lending decision."),
    ),
    facts(
      [
        ["Payment limit", money(r.limit), "30% of conservative income (70% of income)"],
        ["First-month payments", money(f.total)],
        ["Cash cover", `${r.cover.toFixed(2)}×`, "minimum 1.5×"],
        ["Largest loan that fits", money(r.maxLoan), "pilot cap 30.0M"],
        ["Guarantee covers", money(r.guarantee.covered), "50% of principal, max 15.0M"],
      ],
      "facts grid",
    ),
    h("h3", {}, "First month, in detail"),
    facts(
      [
        ["Bank repayment", money(f.principal + f.interest), `${money(f.principal)} principal + ${money(f.interest)} interest (18% a year, internal assumption)`],
        ["Guarantee fee", money(f.guaranteeFee), "6% a year on the guaranteed amount"],
        ["Setup fee", money(f.setupFee), "once"],
        ["Existing debt", money(f.existing)],
        ["Total", money(f.total)],
      ],
      "facts lines",
    ),
    h("h3", {}, "Rules"),
    ruleList(r.rules),
  );
}

const isDefault = (sl) => Object.keys(DEFAULTS).every((k) => sl[k] === DEFAULTS[k]);

function explainBlock(s) {
  const note = isDefault(s.sliders)
    ? undefined
    : "Offline example: a pre-written answer for the default slider values, shown because the AI is not available.";
  return aiBlock("explain_loan", "Explain this result", () => ({ loanInput: loanInput(state.sliders) }), note);
}

function loanCheck(s) {
  const result = h("div", { id: "loan-result" }, loanResult(s));
  const explain = h("div", {}, explainBlock(s));
  const sliders = SLIDERS.map((d) => {
    const show = d.show || money;
    const out = h("output", { for: "s-" + d.key, id: "o-" + d.key }, show(s.sliders[d.key]));
    const input = h("input", {
      type: "range",
      id: "s-" + d.key,
      min: d.min,
      max: d.max,
      step: d.step,
      value: s.sliders[d.key],
      oninput: (e) => {
        state.sliders[d.key] = Number(e.target.value);
        out.textContent = show(state.sliders[d.key]);
        // The old explanation no longer matches the numbers.
        delete state.ai.explain_loan;
        result.replaceChildren(loanResult(state));
        explain.replaceChildren(explainBlock(state));
      },
    });
    return h("div", { class: "slider" }, h("div", { class: "slider-top" }, h("label", { for: "s-" + d.key }, d.label), out), input);
  });
  return view(
    "Check a loan and guarantee",
    h("p", { class: "lead" }, `Minh asks for a ${money(SAMPLE.loan)} loan. FreeFin's rules check it first. Move a slider to try a "what if".`),
    h("div", { class: "loan" }, h("fieldset", { class: "sliders" }, h("legend", {}, "Inputs, in VND millions"), sliders), result),
    explain,
    h(
      "div",
      { class: "row" },
      action("send", s.sent ? "Send to bank again" : "Send to bank", false, () => {
        state.sent = true;
        setRole("bank");
      }),
      h("span", { class: "hint" }, "Opens the Bank view with the application package."),
    ),
  );
}

function bankPackage(s) {
  const input = loanInput(s.sliders);
  const r = checkLoan(input);
  const summary = state.ai.income_summary?.text;
  return view(
    "Loan application package",
    h("p", { class: "lead" }, `From FreeFin, for ${SAMPLE.freelancer.name}. Sample data.`),
    facts(
      [
        ["Applicant", `${SAMPLE.freelancer.name}, ${SAMPLE.freelancer.age}`, SAMPLE.freelancer.role],
        ["Identity", "Verified ✓"],
        ["Requested", `${money(input.loan)} over ${input.term} months`],
        ["FreeFin check", r.eligible ? "Passes" : "Does not pass"],
      ],
      "facts grid",
    ),
    h("h3", {}, "Income summary"),
    summary ? h("p", { class: "ai-text box" }, summary) : statFacts(),
    h("h3", {}, "Rule results"),
    ruleList(r.rules),
    h("h3", {}, "Guarantee terms"),
    h(
      "p",
      {},
      `FreeFin guarantees 50% of the outstanding principal, at most 15.0M, going down as the principal is repaid. ` +
        `Covered now: ${money(r.guarantee.covered)}. Guarantee fee: 6% a year on the guaranteed amount (${money(r.guarantee.fee)} in the first month).`,
    ),
    h("p", { class: "callout" }, "The bank makes the lending decision, not FreeFin."),
  );
}

// ---------- step 6 ----------

function advanceTimeline(s) {
  const events = [
    ["Repayment due", `Minh's first bank repayment is due: ${money(REPAY)} (${money(DEFAULT_FIRST.principal)} principal + ${money(DEFAULT_FIRST.interest)} interest).`],
    ["Client payment is late", "Green Fern Spa's milestone is funded and held by FreeFin, but the client has not accepted the work yet."],
    ["FreeFin advances the money", `FreeFin advances ${money(REPAY)}. The advance is capped, runs for a set period, and its costs are shown upfront.`],
    ["Bank paid on time", `Minh pays the bank ${money(REPAY)} on time.`],
    ["Client accepts and pays", "Green Fern Spa accepts the work, so FreeFin releases the milestone."],
    ["Advance recovered", "The advance is paid back from the client's payment. It is closed."],
  ];
  const shown = [2, 4, 6][s.advance];
  return view(
    "Late payment: a repayment advance",
    h(
      "ol",
      { class: "timeline" },
      events.map(([t, d], i) => h("li", { class: i < shown ? "on" : "later" }, h("strong", {}, t), h("span", {}, d), i >= shown && h("small", {}, "Not yet"))),
    ),
    s.advance === 0 && action("advance", "Ask FreeFin for an advance", false, () => { state.advance = 1; render(); }),
    s.advance === 1 && action("client-pays", "Client accepts the work", false, () => { state.advance = 2; render(); }),
    s.advance === 2 && h("p", { class: "callout good" }, "Done. Minh paid the bank on time, and the advance is closed."),
  );
}

// ---------- the six steps ----------

const notInStep = (who) => peek(who, h("p", {}, "The bank is not part of this step. Paid jobs will later count in Minh's income record."));

export const STEPS = [
  {
    title: "Agree on a job",
    mainRole: "client",
    renderMain: (s) => {
      const drafted = !!s.ai.agreement?.text;
      return view(
        "Post a job, agree on terms",
        h("label", { for: "brief", class: "field-label" }, "Your job brief"),
        h("textarea", { id: "brief", rows: 6, maxlength: 600, oninput: (e) => (state.brief = e.target.value) }, s.brief),
        h("p", { class: "hint" }, "Edit the brief if you like (up to 600 characters). The price stays fixed."),
        aiBlock("agreement", "Draft agreement", () => ({ brief: state.brief })),
        h("h3", {}, "Fixed terms"),
        facts([
          ["Client", JOB.client, "fictional"],
          ["Freelancer", SAMPLE.freelancer.name, "hypothetical"],
          ["Price", money(JOB.price), "fixed"],
          ["Milestone", JOB.milestone],
        ]),
        h(
          "div",
          { class: "row" },
          action("accept-client", s.accepted.client ? "Accepted as client ✓" : "Accept as client", !drafted || s.accepted.client, () => {
            state.accepted.client = true;
            render();
          }),
          !drafted && h("span", { class: "hint" }, "Draft the agreement first."),
        ),
        h("p", { class: "hint" }, s.accepted.freelancer ? "Minh has accepted ✓" : "Minh accepts in the Freelancer view."),
        !s.accepted.freelancer && switchTo("freelancer", "Open the Freelancer view"),
        s.accepted.client && s.accepted.freelancer && h("p", { class: "callout good" }, "Both sides accepted. The terms are agreed."),
      );
    },
    renderPeek: (role, s) =>
      role === "freelancer"
        ? peek(
            role,
            s.ai.agreement?.text
              ? h("p", {}, `Minh reads the same draft: ${money(JOB.price)}, one milestone paid into escrow first.`)
              : h("p", {}, "Waiting for the client to draft the agreement."),
            s.ai.agreement?.text &&
              action("accept-freelancer", s.accepted.freelancer ? "Accepted as Minh ✓" : "Accept as Minh", s.accepted.freelancer, () => {
                state.accepted.freelancer = true;
                render();
              }),
          )
        : notInStep(role),
    panel: () => [
      "Harbor Tea House, a fictional tea shop, needs a promo video.",
      "AI turns the client's brief into a draft agreement: scope, price, deadline, milestone and acceptance.",
      `The price is fixed at ${money(JOB.price)}. The AI only writes the words.`,
      "Clear terms up front mean fewer arguments later.",
    ],
  },
  {
    title: "Escrow",
    mainRole: "client",
    renderMain: (s) =>
      view(
        "Fund the milestone",
        h("div", { class: s.funded ? "vault held" : "vault" }, h("span", { class: "vault-amount" }, money(JOB.price)), h("span", { class: "vault-label" }, s.funded ? "Held by FreeFin" : "Not funded yet")),
        h("p", {}, JOB.milestone),
        action("fund", s.funded ? "Milestone funded ✓" : "Fund milestone", s.funded, () => {
          state.funded = true;
          render();
        }),
        s.funded && h("p", { class: "callout" }, "The money is held by FreeFin. It is not Minh's yet. It is released only when you accept the video."),
      ),
    renderPeek: (role, s) =>
      role === "freelancer"
        ? peek(role, h("p", {}, s.funded ? `The milestone is funded: ${money(JOB.price)} is held by FreeFin. Minh can start work knowing the money is there.` : "Minh waits until the client funds the milestone."))
        : notInStep(role),
    panel: () => [
      "The client pays the milestone into escrow before work starts.",
      "FreeFin holds the money. It is not Minh's yet.",
      "Minh knows the money is there. The client knows it is released only after acceptance.",
    ],
  },
  {
    title: "Deliver and get paid",
    mainRole: "freelancer",
    renderMain: (s) =>
      view(
        "Deliver the work, get paid",
        action("submit", s.submitted ? "Work submitted ✓" : "Submit work", s.submitted, () => {
          state.submitted = true;
          render();
        }),
        s.submitted && !s.released && h("p", { class: "hint" }, "Waiting for Harbor Tea House to accept the video."),
        s.submitted && !s.released && switchTo("client", "Open the Client view to accept"),
        h("h3", {}, s.released ? "Released to Minh" : "Still held by FreeFin"),
        facts(
          [
            ["Price", money(JOB.price)],
            ["FreeFin fee", money(JOB_FEE), `${pct(FEE_RATE)}, because FreeFin found this client`],
            ["Minh receives", money(JOB_NET)],
          ],
          "facts lines",
        ),
        h("p", { class: "hint" }, `If Minh had brought the client himself, the fee would be ${pct(FEE.own)}.`),
        s.released && h("p", { class: "callout good" }, `The client accepted. ${money(JOB_NET)} is now Minh's.`),
      ),
    renderPeek: (role, s) => {
      if (role === "bank") return notInStep(role);
      if (s.released) return peek(role, h("p", {}, "You accepted the video. FreeFin released the money to Minh."));
      if (!s.submitted) return peek(role, h("p", {}, "Harbor Tea House waits for the video."));
      return peek(
        role,
        h("p", {}, `Minh has submitted the video. Accept it to release ${money(JOB.price)} from escrow.`),
        action("accept-work", "Accept the video", false, () => {
          state.released = true;
          setRole("freelancer");
        }),
      );
    },
    panel: () => [
      "Minh delivers. The client accepts, so FreeFin releases the money.",
      `FreeFin keeps a fee: ${pct(FEE.platform)} when FreeFin found the client, ${pct(FEE.own)} when Minh brought the client.`,
      `This client came through FreeFin, so the fee is ${pct(FEE_RATE)}.`,
    ],
  },
  {
    title: "Income record",
    mainRole: "freelancer",
    renderMain: () =>
      view(
        "Minh's income record",
        statFacts(),
        h(
          "div",
          { class: "table-wrap" },
          h(
            "table",
            {},
            h("caption", {}, "Paid jobs. Net = what Minh kept after the FreeFin fee and project costs."),
            h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Date"), h("th", { scope: "col" }, "Client"), h("th", { scope: "col", class: "num" }, "Net"))),
            h("tbody", {}, SAMPLE.history.map((r) => h("tr", {}, h("td", {}, dateLabel(r)), h("td", {}, r.client), h("td", { class: "num" }, money(r.net))))),
          ),
        ),
        aiBlock("income_summary", "Write income summary", () => ({})),
        aiBlock("odd_activity", "Check for odd activity", () => ({})),
      ),
    renderPeek: (role) =>
      peek(
        role,
        h("p", {}, role === "bank" ? "The bank gets this record in step 5, as part of Minh's loan application." : "Clients are not part of this step. The paid job now counts in Minh's record."),
      ),
    panel: () => [
      "Every paid job becomes part of Minh's income record.",
      "FreeFin uses the lower of the 3-month and 6-month averages, to stay careful.",
      "AI writes a summary for the bank and flags anything worth a look. A person makes the final call.",
    ],
  },
  {
    title: "Loan check",
    mainRole: "freelancer",
    renderMain: loanCheck,
    renderPeek: (role, s) => {
      if (role === "client") return peek(role, h("p", {}, "Clients are not part of the loan check."));
      if (s.sent) return bankPackage(s);
      return peek(role, h("p", {}, "No application yet. Minh sends it from the Freelancer view."));
    },
    panel: (s) =>
      s.role === "bank" && s.sent
        ? [
            "The bank gets one clear package: verified identity, income summary, rule results and guarantee terms.",
            "FreeFin's guarantee lowers the bank's risk.",
            "The bank makes the lending decision, not FreeFin.",
          ]
        : [
            "The rules decide. The AI only explains.",
            "Move the sliders to try a \"what if\". The numbers are illustrative, and the 18% interest rate is an internal assumption.",
            "Passing this check is not a loan approval: the bank makes the lending decision.",
          ],
  },
  {
    title: "Late payment",
    mainRole: "freelancer",
    renderMain: advanceTimeline,
    renderPeek: (role, s) =>
      peek(
        role,
        h(
          "p",
          {},
          role === "client"
            ? "Green Fern Spa decides on the work as usual. The advance does not change the client's acceptance."
            : s.advance > 0
              ? `The bank received ${money(REPAY)} on time. The advance is not counted as a guarantee.`
              : `Minh's repayment of ${money(REPAY)} is due.`,
        ),
      ),
    panel: () => [
      "A client is late just before Minh's repayment is due.",
      "FreeFin can advance the money because the milestone was already funded. The advance is capped and runs for a set period.",
      "Approving the advance and the client accepting the work are two separate decisions. An advance never counts as a guarantee.",
      "The costs of an advance are disclosed upfront.",
    ],
  },
];

const ENDING = [
  ["Agree on a job", `Harbor Tea House and Minh agreed clear terms for a ${money(JOB.price)} job.`],
  ["Escrow", "The client funded the milestone first. FreeFin held the money."],
  ["Deliver and get paid", `The client accepted the video. Minh received ${money(JOB_NET)} after the ${pct(FEE_RATE)} fee.`],
  ["Income record", `Paid jobs built Minh's income record: ${money(STATS.income)} a month used.`],
  ["Loan check", `FreeFin's rules checked a ${money(SAMPLE.loan)} loan with a guarantee. The bank decides.`],
  ["Late payment", `An advance paid the ${money(REPAY)} repayment on time until the client paid.`],
];

function ending() {
  return view(
    "The full loop, on sample data",
    h("ol", { class: "summary" }, ENDING.map(([t, d]) => h("li", {}, h("strong", {}, t), h("span", {}, d)))),
    h(
      "div",
      { class: "row" },
      action("restart", "Restart demo", false, () => {
        state = fresh();
        announce("Demo restarted at step 1.");
        render();
      }),
      h("a", { class: "btn line", href: "index.html" }, "Back to the FreeFin page"),
    ),
  );
}

// ---------- navigation and render ----------

export function go(step) {
  state.step = step;
  state.done = false;
  state.role = STEPS[step - 1].mainRole;
  announce(`Step ${step} of 6: ${STEPS[step - 1].title}`);
  render();
  const app = document.getElementById("app");
  if (app.getBoundingClientRect().top < 0) app.scrollIntoView();
}

export function setRole(role) {
  state.role = role;
  render();
}

export function render() {
  const keep = document.activeElement?.id;
  const st = STEPS[state.step - 1];

  document.querySelectorAll("#rail li").forEach((li, i) => {
    const cur = !state.done && i === state.step - 1;
    const btn = li.firstElementChild;
    if (cur) btn.setAttribute("aria-current", "step");
    else btn.removeAttribute("aria-current");
    li.className = state.done || i < state.step - 1 ? "past" : cur ? "now" : "";
  });

  document.getElementById("appbar").hidden = state.done;
  document.querySelectorAll(".roles button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.role === state.role)));
  document.getElementById("who").textContent = ROLE_WHO[state.role];

  const main = document.getElementById("main");
  main.replaceChildren(state.done ? ending() : state.role === st.mainRole ? st.renderMain(state) : st.renderPeek(state.role, state));

  document.getElementById("panel-step").textContent = state.done ? "Done" : `Step ${state.step} of 6`;
  const lines = state.done
    ? ["That was the full FreeFin loop on sample data.", "Minh is hypothetical and the clients are fictional.", "Restart to try it again, or other slider values."]
    : st.panel(state);
  document.getElementById("panel").replaceChildren(...lines.map((t) => h("p", {}, t)));

  const back = document.getElementById("back");
  const next = document.getElementById("next");
  back.setAttribute("aria-disabled", String(state.step === 1 && !state.done));
  next.setAttribute("aria-disabled", String(state.done));
  next.textContent = state.done ? "Finished" : state.step === 6 ? "Finish" : "Next";

  // Keep keyboard focus where it was. If that element is gone, focus the new screen title.
  if (keep) (document.getElementById(keep) || document.getElementById("app-title"))?.focus({ preventScroll: true });
}

function init() {
  document.getElementById("rail").replaceChildren(
    ...STEPS.map((s, i) =>
      h("li", {}, h("button", { type: "button", onclick: () => go(i + 1) }, h("span", { class: "dot", "aria-hidden": "true" }, String(i + 1)), h("span", { class: "t" }, s.title))),
    ),
  );
  document.querySelectorAll(".roles button").forEach((b) => b.addEventListener("click", () => setRole(b.dataset.role)));
  document.getElementById("back").addEventListener("click", () => {
    if (state.done) go(6);
    else if (state.step > 1) go(state.step - 1);
  });
  document.getElementById("next").addEventListener("click", () => {
    if (state.done) return;
    if (state.step < 6) return go(state.step + 1);
    state.done = true;
    announce("Demo finished.");
    render();
  });
  render();
}

init();
