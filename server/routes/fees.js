const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all fee records
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT f.*, s.name as student_name, c.name as course_name
      FROM fees f
      JOIN students s ON f.student_id = s.id
      JOIN courses c ON s.course_id = c.id
      ORDER BY f.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get fee records for a specific student
router.get('/student/:student_id', async (req, res) => {
  try {
    const { student_id } = req.params;
    const result = await db.query(`
      SELECT f.*, s.name as student_name, c.name as course_name, c.fees as total_fees
      FROM fees f
      JOIN students s ON f.student_id = s.id
      JOIN courses c ON s.course_id = c.id
      WHERE f.student_id = $1
      ORDER BY f.due_date
    `, [student_id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new fee record
router.post('/', async (req, res) => {
  try {
    const { student_id, amount, due_date, description } = req.body;
    
    const result = await db.query(
      'INSERT INTO fees (student_id, amount, due_date, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [student_id, amount, due_date, description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a fee record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, due_date, description, paid } = req.body;
    
    const result = await db.query(
      'UPDATE fees SET amount = $1, due_date = $2, description = $3, paid = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [amount, due_date, description, paid, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fee record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a fee record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM fees WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fee record not found' });
    }
    
    res.json({ message: 'Fee record deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;