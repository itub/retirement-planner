import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/index.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM retirement_plans WHERE user_id=$1', [req.user.id]);
    res.json(rows[0] ?? null);
  } catch (err) { next(err); }
});

router.put('/', async (req, res, next) => {
  try {
    const {
      current_age, current_income, retirement_age,
      has_spouse, spouse_current_age, spouse_current_income, spouse_retirement_age,
      annual_retirement_budget,
      real_estate_equity, plan_to_sell_real_estate, real_estate_sale_age,
      ss_draw_age, ss_monthly_estimate,
      spouse_ss_draw_age, spouse_ss_monthly_estimate,
      inflation_rate, income_growth_rate,
    } = req.body;

    const { rows } = await query(
      `INSERT INTO retirement_plans (
        user_id, current_age, current_income, retirement_age,
        has_spouse, spouse_current_age, spouse_current_income, spouse_retirement_age,
        annual_retirement_budget,
        real_estate_equity, plan_to_sell_real_estate, real_estate_sale_age,
        ss_draw_age, ss_monthly_estimate, spouse_ss_draw_age, spouse_ss_monthly_estimate,
        inflation_rate, income_growth_rate
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      ON CONFLICT (user_id) DO UPDATE SET
        current_age=EXCLUDED.current_age, current_income=EXCLUDED.current_income,
        retirement_age=EXCLUDED.retirement_age, has_spouse=EXCLUDED.has_spouse,
        spouse_current_age=EXCLUDED.spouse_current_age,
        spouse_current_income=EXCLUDED.spouse_current_income,
        spouse_retirement_age=EXCLUDED.spouse_retirement_age,
        annual_retirement_budget=EXCLUDED.annual_retirement_budget,
        real_estate_equity=EXCLUDED.real_estate_equity,
        plan_to_sell_real_estate=EXCLUDED.plan_to_sell_real_estate,
        real_estate_sale_age=EXCLUDED.real_estate_sale_age,
        ss_draw_age=EXCLUDED.ss_draw_age, ss_monthly_estimate=EXCLUDED.ss_monthly_estimate,
        spouse_ss_draw_age=EXCLUDED.spouse_ss_draw_age,
        spouse_ss_monthly_estimate=EXCLUDED.spouse_ss_monthly_estimate,
        inflation_rate=EXCLUDED.inflation_rate,
        income_growth_rate=EXCLUDED.income_growth_rate,
        updated_at=NOW()
      RETURNING *`,
      [
        req.user.id, current_age, current_income, retirement_age,
        has_spouse ?? false, spouse_current_age, spouse_current_income, spouse_retirement_age,
        annual_retirement_budget ?? 80000,
        real_estate_equity ?? 0, plan_to_sell_real_estate ?? false, real_estate_sale_age,
        ss_draw_age ?? 67, ss_monthly_estimate ?? 0,
        spouse_ss_draw_age, spouse_ss_monthly_estimate ?? 0,
        inflation_rate ?? 0.03, income_growth_rate ?? 0.02,
      ]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
