import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/index.js';
import { runScenario, runMonteCarlo, lifeExpectancy, buildWithdrawalSchedule } from '../services/simulation.js';

const router = Router();
router.use(requireAuth);

async function getPlanAndAccounts(userId) {
  const [p, a] = await Promise.all([
    query('SELECT * FROM retirement_plans WHERE user_id=$1', [userId]),
    query('SELECT * FROM accounts WHERE user_id=$1', [userId]),
  ]);
  return { plan: p.rows[0], accounts: a.rows };
}

router.get('/run', async (req, res, next) => {
  try {
    const { plan, accounts } = await getPlanAndAccounts(req.user.id);
    if (!plan) return res.status(400).json({ error: 'No retirement plan found. Please complete your profile first.' });

    const le = lifeExpectancy(Number(plan.current_age));
    const [good, average, poor] = ['good', 'average', 'poor'].map(s => runScenario(plan, accounts, s, le));
    const { confidenceScore, percentileBands } = runMonteCarlo(plan, accounts, le, 1000);

    res.json({ lifeExpectancyAge: le, confidenceScore, scenarios: { good, average, poor }, monteCarlo: percentileBands });
  } catch (err) { next(err); }
});

router.get('/withdrawals', async (req, res, next) => {
  try {
    const { plan, accounts } = await getPlanAndAccounts(req.user.id);
    if (!plan) return res.status(400).json({ error: 'No plan found.' });
    const le = lifeExpectancy(Number(plan.current_age));
    const schedule = buildWithdrawalSchedule(plan, accounts, le);
    res.json({ schedule, lifeExpectancyAge: le });
  } catch (err) { next(err); }
});

export default router;
