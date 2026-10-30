// FreeFin loan rules (team doc, Section 10). Money is in VND millions.
// Used by the browser demo and by api/ai.js. The rules decide, never the AI.

const RATE = 0.18; // interest per year (internal assumption)
const GUARANTEE_RATE = 0.06; // guarantee fee per year
const SETUP_FEE = 0.15; // once per activated loan
const CAP = 30; // pilot loan cap
const GUARANTEE_MAX = 15;

// "2026-10" -> month number we can subtract.
const monthIndex = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + m - 1;
};

// 4.2 -> "4.2M", 14 -> "14.0M", 3.675 -> "3.675M"
export const fmtM = (x) => x.toFixed(Math.abs(x * 10 - Math.round(x * 10)) < 1e-9 ? 1 : 3) + "M";

export function incomeStats(history, currentMonth) {
  const cur = monthIndex(currentMonth);
  const byMonth = {};
  const byClient6 = {};
  let first = cur;
  for (const h of history) {
    const i = monthIndex(h.month);
    if (i > cur) continue;
    first = Math.min(first, i);
    byMonth[i] = (byMonth[i] || 0) + h.net;
    if (i > cur - 6) byClient6[h.client] = (byClient6[h.client] || 0) + h.net;
  }
  // Average over the last n calendar months. Empty months count as 0.
  const avg = (n) => {
    let sum = 0;
    for (let k = 0; k < n; k++) sum += byMonth[cur - k] || 0;
    return sum / n;
  };
  const avg3 = avg(3);
  const avg6 = avg(6);
  const sum6 = Object.values(byClient6).reduce((a, b) => a + b, 0);
  return {
    avg3,
    avg6,
    income: Math.min(avg3, avg6),
    months: history.length ? cur - first + 1 : 0,
    clients: new Set(history.map((h) => h.client)).size,
    largestShare: sum6 > 0 ? Math.max(...Object.values(byClient6)) / sum6 : 0,
  };
}

// First-month payments and cash cover for one loan amount.
function firstMonthFor({ income, living, existingDebt, term }, loan) {
  const conservative = 0.7 * income;
  const limit = 0.3 * conservative;
  const covered = Math.min(0.5 * loan, GUARANTEE_MAX);
  const firstMonth = {
    principal: term > 0 ? loan / term : 0,
    interest: (loan * RATE) / 12,
    guaranteeFee: (covered * GUARANTEE_RATE) / 12,
    setupFee: loan > 0 ? SETUP_FEE : 0,
    existing: existingDebt,
  };
  firstMonth.total = firstMonth.principal + firstMonth.interest + firstMonth.guaranteeFee + firstMonth.setupFee + existingDebt;
  // No payments at all -> no cover to measure. Count as 0 so it never shows Infinity.
  const cover = firstMonth.total > 0 ? (conservative - living) / firstMonth.total : 0;
  return {
    conservative,
    limit,
    covered,
    firstMonth,
    cover,
    paymentOk: term > 0 && firstMonth.total <= limit,
    coverOk: cover >= 1.5,
  };
}

export function checkLoan(input) {
  const { age, months, clients, largestShare, loan, term } = input;
  const c = firstMonthFor(input, loan);
  const rules = [
    { id: "age", label: "Aged 18 or above", pass: age >= 18, detail: `Age ${age}` },
    { id: "history", label: "At least 6 months of work history", pass: months >= 6, detail: `${months} months` },
    { id: "clients", label: "At least 3 independent clients", pass: clients >= 3, detail: `${clients} clients` },
    {
      id: "concentration",
      label: "Largest client at most 50% of income",
      pass: largestShare <= 0.5,
      detail: `Largest client ${Math.round(largestShare * 100)}%`,
    },
    { id: "cap", label: `Loan at most ${fmtM(CAP)} (pilot cap)`, pass: loan <= CAP, detail: `Loan ${fmtM(loan)}` },
    {
      id: "payment",
      label: "Monthly debt payments at most 30% of conservative income",
      pass: c.paymentOk,
      detail: term > 0 ? `${fmtM(c.firstMonth.total)} vs limit ${fmtM(c.limit)}` : "Term must be at least 1 month",
    },
    {
      id: "cover",
      label: "Cash after living costs at least 1.5× debt payments",
      pass: c.coverOk,
      detail: `${c.cover.toFixed(2)}× cover`,
    },
  ];

  // Largest multiple of 0.1 up to the cap that passes "payment" and "cover".
  let maxLoan = 0;
  for (let i = CAP * 10; i >= 0; i--) {
    const x = firstMonthFor(input, i / 10);
    if (x.paymentOk && x.coverOk) {
      maxLoan = i / 10;
      break;
    }
  }

  return {
    rules,
    eligible: rules.every((r) => r.pass) && loan > 0 && term > 0,
    conservative: c.conservative,
    limit: c.limit,
    cover: c.cover,
    firstMonth: c.firstMonth,
    guarantee: { covered: c.covered, fee: c.firstMonth.guaranteeFee },
    maxLoan,
  };
}
