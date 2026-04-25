import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/index.js';

const router = Router();
router.use(requireAuth);

// GET all accounts for the current user
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at ASC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST create a new account
router.post('/', async (req, res, next) => {
  try {
    const { name, account_type, current_balance, annual_contribution, employer_match_pct, employer_match_limit_pct, owner } = req.body;
    const { rows } = await query(
      `INSERT INTO accounts (user_id, name, account_type, current_balance, annual_contribution, employer_match_pct, employer_match_limit_pct, owner)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, name, account_type, current_balance ?? 0, annual_contribution ?? 0, employer_match_pct ?? 0, employer_match_limit_pct ?? 0, owner ?? 'primary']
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT update an account
router.put('/:id', async (req, res, next) => {
  try {
    const { name, account_type, current_balance, annual_contribution, employer_match_pct, employer_match_limit_pct, owner } = req.body;
    const { rows } = await query(
      `UPDATE accounts SET name=$1, account_type=$2, current_balance=$3, annual_contribution=$4,
       employer_match_pct=$5, employer_match_limit_pct=$6, owner=$7, updated_at=NOW()
       WHERE id=$8 AND user_id=$9 RETURNING *`,
      [name, account_type, current_balance, annual_contribution, employer_match_pct, employer_match_limit_pct, owner, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE an account
router.delete('/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM accounts WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
