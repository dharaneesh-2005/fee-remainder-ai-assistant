import { Router } from 'express';
import { pool } from '../db.js';

export const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('select * from students order by id desc');
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('select * from students where id=$1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, dept, phone, email, course_id } = req.body;
    const { rows } = await pool.query(
      'insert into students(name, dept, phone, email, course_id) values ($1,$2,$3,$4,$5) returning *',
      [name, dept, phone, email, course_id]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});
