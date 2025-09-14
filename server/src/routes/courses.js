import { Router } from 'express';
import { pool } from '../db.js';

export const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('select * from courses order by id desc');
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, code, description } = req.body;
    const { rows } = await pool.query(
      'insert into courses(name, code, description) values ($1,$2,$3) returning *',
      [name, code, description]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});
