import { Router } from 'express';
import { pool } from '../db.js';

export const router = Router();

// Simulate a payment and reduce due_amount accordingly
router.post('/simulate', async (req, res, next) => {
  try {
    const { student_id, amount } = req.body;
    await pool.query('begin');
    const pay = await pool.query(
      'insert into payments(student_id, amount, method) values ($1,$2,$3) returning *',
      [student_id, amount, 'simulation']
    );
    // reduce last fee's due_amount
    const feeRef = await pool.query(
      `update fees set due_amount = greatest(due_amount - $1, 0)
       where id = (select max(id) from fees where student_id = $2)
       returning *`,
      [amount, student_id]
    );
    await pool.query('commit');
    res.json({ payment: pay.rows[0], fee: feeRef.rows[0] });
  } catch (e) {
    await pool.query('rollback');
    next(e);
  }
});
