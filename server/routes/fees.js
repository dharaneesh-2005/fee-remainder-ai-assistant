const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all fees with student and course information
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        f.*,
        s.name as student_name,
        s.phone as student_phone,
        s.email as student_email,
        c.name as course_name
      FROM fees f
      JOIN students s ON f.student_id = s.id
      LEFT JOIN courses c ON f.course_id = c.id
      ORDER BY f.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ message: 'Error fetching fees' });
  }
});

// Get fee by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        f.*,
        s.name as student_name,
        s.phone as student_phone,
        s.email as student_email,
        c.name as course_name
      FROM fees f
      JOIN students s ON f.student_id = s.id
      LEFT JOIN courses c ON f.course_id = c.id
      WHERE f.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching fee:', error);
    res.status(500).json({ message: 'Error fetching fee' });
  }
});

// Get fees by student ID
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pool.query(`
      SELECT 
        f.*,
        s.name as student_name,
        s.phone as student_phone,
        s.email as student_email,
        c.name as course_name
      FROM fees f
      JOIN students s ON f.student_id = s.id
      LEFT JOIN courses c ON f.course_id = c.id
      WHERE f.student_id = $1
      ORDER BY f.created_at DESC
    `, [studentId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching student fees:', error);
    res.status(500).json({ message: 'Error fetching student fees' });
  }
});

// Create new fee record
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { student_id, course_id, total_amount, due_date } = req.body;

    if (!student_id || !total_amount) {
      return res.status(400).json({ message: 'Student ID and total amount are required' });
    }

    // Check if student exists
    const studentResult = await pool.query(
      'SELECT id FROM students WHERE id = $1',
      [student_id]
    );
    if (studentResult.rows.length === 0) {
      return res.status(400).json({ message: 'Student not found' });
    }

    // Check if course exists (if provided)
    if (course_id) {
      const courseResult = await pool.query(
        'SELECT id FROM courses WHERE id = $1',
        [course_id]
      );
      if (courseResult.rows.length === 0) {
        return res.status(400).json({ message: 'Course not found' });
      }
    }

    const pending_amount = total_amount; // Initially, pending amount equals total amount

    const result = await pool.query(
      'INSERT INTO fees (student_id, course_id, total_amount, pending_amount, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [student_id, course_id, total_amount, pending_amount, due_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating fee:', error);
    res.status(500).json({ message: 'Error creating fee' });
  }
});

// Update fee record
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { total_amount, due_date, status } = req.body;

    if (!total_amount) {
      return res.status(400).json({ message: 'Total amount is required' });
    }

    // Get current fee record
    const currentFee = await pool.query(
      'SELECT paid_amount FROM fees WHERE id = $1',
      [id]
    );

    if (currentFee.rows.length === 0) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    const paid_amount = currentFee.rows[0].paid_amount;
    const pending_amount = total_amount - paid_amount;

    const result = await pool.query(
      'UPDATE fees SET total_amount = $1, pending_amount = $2, due_date = $3, status = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [total_amount, pending_amount, due_date, status, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating fee:', error);
    res.status(500).json({ message: 'Error updating fee' });
  }
});

// Delete fee record
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM fees WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    res.json({ message: 'Fee record deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee:', error);
    res.status(500).json({ message: 'Error deleting fee' });
  }
});

// Get pending fees (for reminders)
router.get('/pending/list', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        f.*,
        s.name as student_name,
        s.phone as student_phone,
        s.email as student_email,
        c.name as course_name
      FROM fees f
      JOIN students s ON f.student_id = s.id
      LEFT JOIN courses c ON f.course_id = c.id
      WHERE f.pending_amount > 0 AND f.status = 'pending'
      ORDER BY f.due_date ASC, f.created_at ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pending fees:', error);
    res.status(500).json({ message: 'Error fetching pending fees' });
  }
});

module.exports = router;
