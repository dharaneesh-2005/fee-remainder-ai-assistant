import { Router } from 'express';
import { pool } from '../db.js';

export const router = Router();

router.get('/dues', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('select * from v_student_dues order by student_id desc');
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { student_id, total_amount, due_amount, due_date, notes } = req.body;
    const { rows } = await pool.query(
      'insert into fees(student_id, total_amount, due_amount, due_date, notes) values ($1,$2,$3,$4,$5) returning *',
      [student_id, total_amount, due_amount, due_date, notes]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});
