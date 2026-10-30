// Check the loan rules against the worked example in the team doc (Section 10).
// Run: node tests/loan.test.mjs  (no output = all good)
import assert from "node:assert/strict";
import { incomeStats, checkLoan } from "../site/loan.js";
import { SAMPLE } from "../site/data.js";

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} should be ${b}`);

// Every number in the result, deep inside too, must be finite.
function allFinite(x) {
  if (typeof x === "number") return assert.ok(Number.isFinite(x), `not finite: ${x}`);
  if (x && typeof x === "object") Object.values(x).forEach(allFinite);
}

// Sample data: lower of the 3- and 6-month average is exactly 20M.
const s = incomeStats(SAMPLE.history, SAMPLE.currentMonth);
assert.equal(s.income, 20);
assert.ok(s.months >= 6);
assert.ok(s.clients >= 3);
assert.ok(s.largestShare <= 0.5);

// The doc's worked example.
const base = { age: 25, months: 7, clients: 4, largestShare: 0.4, income: 20, living: 6, existingDebt: 0.5, loan: 30, term: 12 };
const r = checkLoan(base);
near(r.conservative, 14);
near(r.limit, 4.2);
near(r.firstMonth.principal, 2.5);
near(r.firstMonth.interest, 0.45);
near(r.firstMonth.guaranteeFee, 0.075);
near(r.firstMonth.setupFee, 0.15);
near(r.firstMonth.total, 3.675);
near(r.guarantee.covered, 15);
assert.equal(r.cover.toFixed(2), "2.18");
assert.equal(r.eligible, true);
assert.equal(r.maxLoan, 30);
assert.deepEqual(r.rules.map((x) => x.id), ["age", "history", "clients", "concentration", "cap", "payment", "cover"]);
assert.ok(r.rules.every((x) => x.pass));
assert.equal(r.rules.find((x) => x.id === "payment").detail, "3.675M vs limit 4.2M");
assert.equal(r.rules.find((x) => x.id === "cover").detail, "2.18× cover");

// Above the pilot cap.
const big = checkLoan({ ...base, loan: 40 });
assert.equal(big.rules.find((x) => x.id === "cap").pass, false);
assert.equal(big.eligible, false);

// Extremes: no NaN / Infinity, never eligible.
for (const extra of [
  { income: 0, existingDebt: 20, loan: 0 },
  { income: 0, existingDebt: 0, loan: 0 },
  { term: 0 },
  { term: 0, loan: 0, existingDebt: 0 },
]) {
  const x = checkLoan({ ...base, ...extra });
  assert.equal(x.eligible, false, JSON.stringify(extra));
  allFinite(x);
}
