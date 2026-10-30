// Sample data for the demo. Minh is hypothetical. Every client is a made-up small business.
// Money is in VND millions. "net" = money Minh keeps after the FreeFin fee and project costs.
// The months are picked so the lower of the 3- and 6-month average is exactly 20M,
// the income used in the doc's worked example (Section 10).

// FreeFin fee (Section 13): 8% if FreeFin found the client, 2% if Minh brought the client.
export const FEE = { platform: 0.08, own: 0.02 };

const newJob = {
  client: "Harbor Tea House",
  price: 12.5,
  found: "platform",
  milestone: "One milestone: the full 12.5M is paid into FreeFin escrow first and released when the client accepts the final video.",
  brief:
    "We are Harbor Tea House, a small tea shop. We need one 60-second promo video for our new autumn menu, " +
    "for Facebook and TikTok. We will send about 2 hours of phone footage. Please add English subtitles and our " +
    "logo at the end. One round of changes. We need the final video within 10 days.",
};

// Rounded to 2 decimals so the sums stay exact: 12.5 x 0.92 = 11.5.
const newJobNet = Math.round(newJob.price * (1 - FEE[newJob.found]) * 100) / 100;

const history = [
  { month: "2026-04", client: "Lotus Lane Bakery", net: 8 },
  { month: "2026-04", client: "Blue Kite Travel", net: 8 },
  { month: "2026-05", client: "Lotus Lane Bakery", net: 8 },
  { month: "2026-05", client: "Blue Kite Travel", net: 6 },
  { month: "2026-05", client: "Green Fern Spa", net: 4 },
  { month: "2026-06", client: "Lotus Lane Bakery", net: 8 },
  { month: "2026-06", client: "Green Fern Spa", net: 7 },
  { month: "2026-06", client: "Blue Kite Travel", net: 4 },
  { month: "2026-07", client: "Lotus Lane Bakery", net: 8 },
  { month: "2026-07", client: "Blue Kite Travel", net: 7 },
  { month: "2026-07", client: "Green Fern Spa", net: 5 },
  { month: "2026-08", client: "Lotus Lane Bakery", net: 8 },
  { month: "2026-08", client: "Green Fern Spa", net: 8 },
  { month: "2026-08", client: "Blue Kite Travel", net: 6 },
  { month: "2026-09", client: "Lotus Lane Bakery", net: 8 },
  // The same client paid one job in two parts on the same day. Harmless, but worth a flag.
  { month: "2026-09", day: 12, client: "Blue Kite Travel", net: 4 },
  { month: "2026-09", day: 12, client: "Blue Kite Travel", net: 4 },
  { month: "2026-09", client: "Green Fern Spa", net: 4 },
  { month: "2026-10", client: "Lotus Lane Bakery", net: 8 },
  { month: "2026-10", client: "Green Fern Spa", net: 1.5 },
  { month: "2026-10", client: newJob.client, net: newJobNet },
];

export const SAMPLE = {
  currentMonth: "2026-10",
  freelancer: { name: "Minh", age: 25, role: "Freelance video editor (hypothetical)" },
  newJob,
  history,
  living: 6,
  existingDebt: 0.5,
  loan: 30,
  term: 12,
  oddActivityHint:
    "On 12 September 2026, Blue Kite Travel paid Minh 8.0M in two parts (4.0M + 4.0M) on the same day.",
};

// Pre-written answers, shown when the AI is slow or not available. Written for the default data.
export const BACKUP = {
  agreement:
    "Job agreement (draft)\n" +
    "Client: Harbor Tea House. Freelancer: Minh (video editor).\n" +
    "Scope: one 60-second promo video for the new autumn menu, for Facebook and TikTok, edited from the client's phone footage, with English subtitles and the client's logo at the end.\n" +
    "Price: 12.5M VND, fixed. Milestone: the full amount is paid into FreeFin escrow first and released when the client accepts the final video.\n" +
    "Deadline: final video within 10 days. Acceptance: the video matches the scope above; one round of changes is included.\n" +
    "This is an illustrative draft for the demo, not a legal contract.",
  income_summary:
    "Minh has 7 months of income records on FreeFin, from April to October 2026, with 4 independent clients. " +
    "After fees and project costs, his average monthly income is 21.0M over the last 3 months and 20.0M over the last 6 months, so the lower figure, 20.0M, is used. " +
    "His largest client, Lotus Lane Bakery, made up 40% of his income in the last 6 months, within the 50% limit. " +
    "Every payment is linked to an agreement and an accepted delivery. These are illustrative sample numbers.",
  explain_loan:
    "Based on the rules, this application passes every check. Minh's income of 20.0M becomes a conservative 14.0M, so his monthly debt payments may be up to 4.2M. " +
    "In the first month he would pay 3.675M in total: 2.5M principal, 0.45M interest, a 0.075M guarantee fee, a 0.15M setup fee and 0.5M of existing debt. " +
    "After living costs, his cash covers these payments 2.18 times, above the 1.5 times minimum. " +
    "This is not a loan approval: the bank makes its own decision. The numbers are illustrative.",
  odd_activity:
    "One thing is worth a quick look: on 12 September 2026, Blue Kite Travel paid 8.0M in two parts (4.0M + 4.0M) on the same day. " +
    "This looks like a normal split payment for one job, but a reviewer should match it to the agreement. " +
    "No circular payments or payments between related people were found, and no single client paid more than 50% of the income. " +
    "This is a warning-sign check on sample data, not a final decision.",
};
