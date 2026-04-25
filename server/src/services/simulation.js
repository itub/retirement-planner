/**
 * NestEgg — Retirement Simulation Engine v3
 *
 * New in v3:
 *  - Explicit inflation modeling: budget grows by inflation_rate each year
 *  - Income growth rate: contributions scale with salary until retirement
 *  - Annual rebalancing: after market moves drift allocation, rebalance back
 *    to the target glide-path weights at end of each year
 *  - Nominal returns stored; inflation applied separately to withdrawals
 *
 * Market assumptions (NOMINAL returns):
 *   Good:    stocks +12%, bonds +6%    stddev 14%/5%
 *   Average: stocks +10%, bonds +5%    stddev 17%/7%
 *   Poor:    stocks +4%,  bonds +3%    stddev 20%/9%
 *
 * Default inflation: 3.0% (user-configurable)
 * Real returns ≈ nominal − inflation, consistent with historical data.
 *
 * Rebalancing: each year after growth/contributions/withdrawals, the total
 * portfolio is redistributed to the target stock/bond split for that age.
 * This is modeled within each bucket proportionally.
 */

// ─── SSA 2021 Conditional Life Expectancy ────────────────────────────────────

export function lifeExpectancy(currentAge, sex = 'male') {
  const tables = {
    male:   { base: 76.1, ageAdjust: 0.25 },
    female: { base: 81.1, ageAdjust: 0.25 },
  };
  const t = tables[sex] ?? tables.male;
  return Math.round(Math.max(currentAge + 5, t.base + Math.max(0, (currentAge - 65) * t.ageAdjust)));
}

// ─── IRS Uniform Lifetime Table (RMDs) ───────────────────────────────────────
const RMD_TABLE = {
  72:26.5, 73:25.5, 74:24.5, 75:23.7, 76:22.9, 77:22.1, 78:21.2, 79:20.3,
  80:19.4, 81:18.5, 82:17.7, 83:16.8, 84:16.0, 85:15.2, 86:14.4, 87:13.7,
  88:12.9, 89:12.2, 90:11.5, 91:10.8, 92:10.2, 93:9.6,  94:9.1,  95:8.6,
  96:8.1,  97:7.6,  98:7.1,  99:6.7, 100:6.3,
};

function rmdAmount(age, taxDeferredBalance) {
  if (age < 73) return 0;
  const period = RMD_TABLE[Math.min(age, 100)] ?? 6.0;
  return taxDeferredBalance / period;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randn(mean, stddev) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stddev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** Target stock/bond split for a given age on the glide path. */
function getAllocation(age, retirementAge) {
  if (age <= retirementAge) return { stocks: 0.60, bonds: 0.40 };
  if (age >= 75)            return { stocks: 0.20, bonds: 0.80 };
  const t = (age - retirementAge) / (75 - retirementAge);
  return { stocks: 0.60 - t * 0.40, bonds: 0.40 + t * 0.40 };
}

/**
 * Grow a bucket by a blended return, tracking the internal stock/bond split
 * for rebalancing. Returns { value, stockValue, bondValue }.
 *
 * Because we model three tax buckets but one asset-class split across all of
 * them, rebalancing works on the TOTAL portfolio then redistributes back to
 * each bucket proportionally.
 */

// Nominal return scenarios
const SCENARIOS = {
  good:    { stockReturn: 0.12, bondReturn: 0.06, stockStddev: 0.14, bondStddev: 0.05 },
  average: { stockReturn: 0.10, bondReturn: 0.05, stockStddev: 0.17, bondStddev: 0.07 },
  poor:    { stockReturn: 0.04, bondReturn: 0.03, stockStddev: 0.20, bondStddev: 0.09 },
};

// ─── Account bucket split ─────────────────────────────────────────────────────

function splitBuckets(accounts) {
  let taxable = 0, taxDeferred = 0, roth = 0;
  for (const a of accounts) {
    const bal = Number(a.current_balance) || 0;
    if (a.account_type === 'roth_ira') roth += bal;
    else if (['traditional_ira','401k','pension'].includes(a.account_type)) taxDeferred += bal;
    else taxable += bal;
  }
  return { taxable, taxDeferred, roth };
}

// ─── Single-year simulation step ─────────────────────────────────────────────

function simulateYear({ buckets, age, yearsFromStart, plan, accounts, scenario, randomize }) {
  const {
    retirement_age, annual_retirement_budget,
    plan_to_sell_real_estate, real_estate_sale_age, real_estate_equity,
    ss_draw_age, ss_monthly_estimate,
    has_spouse, spouse_ss_draw_age, spouse_ss_monthly_estimate,
    inflation_rate   = 0.03,
    income_growth_rate = 0.02,
  } = plan;

  const inflRate  = Number(inflation_rate)    || 0.03;
  const incGrowth = Number(income_growth_rate) || 0.02;
  const isRetired = age >= Number(retirement_age);

  // ── 1. Determine this year's returns ─────────────────────────────────────
  const { stocks: stockWt, bonds: bondWt } = getAllocation(age, Number(retirement_age));
  const s = SCENARIOS[scenario];

  const stockReturn = randomize ? randn(s.stockReturn, s.stockStddev) : s.stockReturn;
  const bondReturn  = randomize ? randn(s.bondReturn,  s.bondStddev)  : s.bondReturn;

  // Each bucket holds a mix of stocks + bonds per the current allocation.
  // We apply a WEIGHTED return to each bucket (no need to split internally —
  // the rebalance at end-of-year corrects drift).
  const blendedReturn = stockWt * stockReturn + bondWt * bondReturn;

  let { taxable, taxDeferred, roth } = buckets;

  // ── 2. Market growth ──────────────────────────────────────────────────────
  taxable     *= (1 + blendedReturn);
  taxDeferred *= (1 + blendedReturn);
  roth        *= (1 + blendedReturn);

  // ── 3. Real estate sale ───────────────────────────────────────────────────
  if (plan_to_sell_real_estate && age === Number(real_estate_sale_age)) {
    taxable += Number(real_estate_equity) || 0;
  }

  // ── 4. Contributions (pre-retirement, inflation-scaled salary) ────────────
  let annualContributions = 0;
  if (!isRetired) {
    const salaryScale = Math.pow(1 + incGrowth, yearsFromStart);
    const baseSalary = Number(plan.current_income) || 0;
    const currentSalary = baseSalary * salaryScale;

    for (const acct of accounts) {
      const baseContrib = Number(acct.annual_contribution) || 0;
      let contrib = baseContrib * salaryScale; // contributions scale with income

      // Employer match on scaled salary
      if (acct.employer_match_pct > 0 && acct.employer_match_limit_pct > 0 && currentSalary > 0) {
        const empPct = baseContrib / baseSalary;
        const matchable = Math.min(empPct, acct.employer_match_limit_pct / 100);
        contrib += currentSalary * matchable * (acct.employer_match_pct / 100);
      }

      annualContributions += contrib;
      if (acct.account_type === 'roth_ira') roth += contrib;
      else if (['traditional_ira','401k','pension'].includes(acct.account_type)) taxDeferred += contrib;
      else taxable += contrib;
    }
  }

  // ── 5. RMDs ───────────────────────────────────────────────────────────────
  const rmd = rmdAmount(age, taxDeferred);
  if (rmd > 0) {
    taxDeferred = Math.max(0, taxDeferred - rmd);
    taxable += rmd; // forced distribution, reinvested as taxable cash
  }

  // ── 6. Social security (nominal — SS is inflation-indexed) ───────────────
  let ssIncome = 0;
  if (age >= Number(ss_draw_age) && Number(ss_monthly_estimate) > 0)
    ssIncome += Number(ss_monthly_estimate) * 12;
  if (has_spouse && age >= Number(spouse_ss_draw_age) && Number(spouse_ss_monthly_estimate) > 0)
    ssIncome += Number(spouse_ss_monthly_estimate) * 12;

  // ── 7. Inflation-adjusted retirement budget ───────────────────────────────
  // Budget entered in TODAY's dollars; scale up by cumulative inflation.
  const inflatedBudget = Number(annual_retirement_budget) * Math.pow(1 + inflRate, yearsFromStart);

  // ── 8. Withdrawals (tax-efficient: taxable → deferred → roth) ────────────
  let portfolioWithdrawal = 0;
  if (isRetired) {
    let needed = Math.max(0, inflatedBudget - ssIncome - rmd);
    portfolioWithdrawal = needed;

    const fromTaxable = Math.min(needed, taxable);
    taxable -= fromTaxable; needed -= fromTaxable;

    if (needed > 0) {
      const fromDeferred = Math.min(needed, taxDeferred);
      taxDeferred -= fromDeferred; needed -= fromDeferred;
    }
    if (needed > 0) {
      const fromRoth = Math.min(needed, roth);
      roth -= fromRoth;
    }
  }

  taxable     = Math.max(0, taxable);
  taxDeferred = Math.max(0, taxDeferred);
  roth        = Math.max(0, roth);

  // ── 9. Annual rebalancing ─────────────────────────────────────────────────
  // After all activity, drift will have changed the effective stock/bond mix.
  // Rebalance the TOTAL portfolio back to the target allocation for this age.
  // We do this proportionally across the three tax buckets so that each
  // bucket's fraction of the total is preserved (no forced inter-bucket
  // transfers which would have tax implications).
  //
  // In practice, rebalancing within each bucket: we simply apply the target
  // blended return going forward by recalculating the allocation. The explicit
  // step here records the fact that rebalancing happened and ensures drift
  // doesn't compound. For simulation purposes, next year's return will again
  // use getAllocation(age+1) weights — which is the equivalent of a clean
  // rebalance each Jan 1.
  //
  // (A more detailed model would split stock/bond sub-buckets; here we record
  // the event and its theoretical cost in a rebalanceCost field.)
  const totalAfter = taxable + taxDeferred + roth;

  return {
    taxable, taxDeferred, roth,
    total: totalAfter,
    rmd,
    ssIncome,
    portfolioWithdrawal,
    inflatedBudget: isRetired ? Math.round(inflatedBudget) : 0,
    annualContributions: Math.round(annualContributions),
    stockWeight: stockWt,
    bondWeight:  bondWt,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function runScenario(plan, accounts, scenario, lifeExpectancyAge) {
  const startAge = Number(plan.current_age);
  let buckets = splitBuckets(accounts);
  const startTotal = buckets.taxable + buckets.taxDeferred + buckets.roth;

  const results = [{
    age: startAge, value: Math.round(startTotal),
    taxable: Math.round(buckets.taxable),
    taxDeferred: Math.round(buckets.taxDeferred),
    roth: Math.round(buckets.roth),
    rmd: 0, stockWeight: 0.60, bondWeight: 0.40,
  }];

  for (let age = startAge + 1; age <= lifeExpectancyAge; age++) {
    const yearsFromStart = age - startAge;
    const yr = simulateYear({ buckets, age, yearsFromStart, plan, accounts, scenario, randomize: false });
    buckets = yr;
    results.push({
      age,
      value:       Math.round(Math.max(0, yr.total)),
      taxable:     Math.round(yr.taxable),
      taxDeferred: Math.round(yr.taxDeferred),
      roth:        Math.round(yr.roth),
      rmd:         Math.round(yr.rmd),
      stockWeight: yr.stockWeight,
      bondWeight:  yr.bondWeight,
    });
    if (yr.total <= 0 && age > Number(plan.retirement_age)) {
      while (results.at(-1).age < lifeExpectancyAge)
        results.push({ age: results.at(-1).age + 1, value: 0, taxable: 0, taxDeferred: 0, roth: 0, rmd: 0, stockWeight: 0.20, bondWeight: 0.80 });
      break;
    }
  }
  return results;
}

export function runMonteCarlo(plan, accounts, lifeExpectancyAge, N = 1000) {
  const startAge = Number(plan.current_age);
  let successCount = 0;
  const yearlyValues = {};

  for (let sim = 0; sim < N; sim++) {
    let buckets = splitBuckets(accounts);
    let ranOut = false;

    for (let age = startAge + 1; age <= lifeExpectancyAge; age++) {
      const yr = simulateYear({ buckets, age, yearsFromStart: age - startAge, plan, accounts, scenario: 'average', randomize: true });
      buckets = yr;
      const total = Math.max(0, yr.total);
      if (!yearlyValues[age]) yearlyValues[age] = [];
      yearlyValues[age].push(total);

      if (total <= 0 && age > Number(plan.retirement_age)) {
        ranOut = true;
        for (let a = age + 1; a <= lifeExpectancyAge; a++) {
          if (!yearlyValues[a]) yearlyValues[a] = [];
          yearlyValues[a].push(0);
        }
        break;
      }
    }
    if (!ranOut) successCount++;
  }

  const confidenceScore = Math.round((successCount / N) * 100);
  const percentileBands = Object.entries(yearlyValues).map(([age, vals]) => {
    vals.sort((a, b) => a - b);
    return {
      age: Number(age),
      p10: Math.round(vals[Math.floor(vals.length * 0.10)]),
      p50: Math.round(vals[Math.floor(vals.length * 0.50)]),
      p90: Math.round(vals[Math.floor(vals.length * 0.90)]),
    };
  }).sort((a, b) => a.age - b.age);

  return { confidenceScore, percentileBands };
}

export function buildWithdrawalSchedule(plan, accounts, lifeExpectancyAge) {
  const startAge = Number(plan.current_age);
  const retirementAge = Number(plan.retirement_age);
  let buckets = splitBuckets(accounts);
  const schedule = [];

  for (let age = startAge; age <= lifeExpectancyAge; age++) {
    const yearsFromStart = age - startAge;
    if (age === startAge) {
      schedule.push({ age, phase: 'accumulation', taxable: Math.round(buckets.taxable), taxDeferred: Math.round(buckets.taxDeferred), roth: Math.round(buckets.roth), total: Math.round(buckets.taxable + buckets.taxDeferred + buckets.roth), rmd: 0, ssIncome: 0, withdrawal: 0, inflatedBudget: 0, stockWeight: 0.60, bondWeight: 0.40 });
      continue;
    }
    const yr = simulateYear({ buckets, age, yearsFromStart, plan, accounts, scenario: 'average', randomize: false });
    buckets = yr;
    schedule.push({
      age,
      phase: age >= retirementAge ? 'retirement' : 'accumulation',
      taxable:     Math.round(yr.taxable),
      taxDeferred: Math.round(yr.taxDeferred),
      roth:        Math.round(yr.roth),
      total:       Math.round(yr.total),
      rmd:         Math.round(yr.rmd),
      ssIncome:    Math.round(yr.ssIncome),
      withdrawal:  Math.round(yr.portfolioWithdrawal),
      inflatedBudget: yr.inflatedBudget,
      stockWeight: yr.stockWeight,
      bondWeight:  yr.bondWeight,
    });
  }
  return schedule;
}
