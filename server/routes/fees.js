const express = require('express');
const { authenticate } = require('../middleware/auth');
const { pool } = require('../config/database');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all fees with student and course information
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, s.name as student_name, s.phone as student_phone, s.email as student_email,
             c.name as course_name
      FROM fees f
      JOIN students s ON f.student_id = s.id
      LEFT JOIN courses c ON f.course_id = c.id
      ORDER BY f.due_date ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ error: 'Failed to fetch fees' });
  }
});

// Get fees by student ID
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pool.query(`
      SELECT f.*, s.name as student_name, s.phone as student_phone, s.email as student_email,
             c.name as course_name
      FROM fees f
      JOIN students s ON f.student_id = s.id
      LEFT JOIN courses c ON f.course_id = c.id
      WHERE f.student_id = $1
      ORDER BY f.due_date ASC
    `, [studentId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching student fees:', error);
    res.status(500).json({ error: 'Failed to fetch student fees' });
  }
});

// Create new fee
router.post('/', async (req, res) => {
  try {
    const { student_id, course_id, amount, due_date } = req.body;
    
    if (!student_id || !amount || !due_date) {
      return res.status(400).json({ error: 'Student ID, amount, and due date are required' });
    }
    
    const result = await pool.query(
      'INSERT INTO fees (student_id, course_id, amount, due_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [student_id, course_id, amount, due_date]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating fee:', error);
    res.status(500).json({ error: 'Failed to create fee' });
  }
});

// Update fee
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, due_date, status } = req.body;
    
    const result = await pool.query(
      'UPDATE fees SET amount = $1, due_date = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [amount, due_date, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fee not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating fee:', error);
    res.status(500).json({ error: 'Failed to update fee' });
  }
});

// Delete fee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM fees WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fee not found' });
    }
    
    res.json({ message: 'Fee deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee:', error);
    res.status(500).json({ error: 'Failed to delete fee' });
  }
});

// Get pending fees summary
router.get('/summary/pending', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_pending_fees,
        SUM(amount) as total_pending_amount,
        COUNT(DISTINCT student_id) as students_with_pending_fees
      FROM fees 
      WHERE status = 'pending'
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching pending fees summary:', error);
    res.status(500).json({ error: 'Failed to fetch pending fees summary' });
  }
});

module.exports = router;
