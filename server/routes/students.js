const express = require('express');
const { authenticate } = require('../middleware/auth');
const { pool } = require('../config/database');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all students with course information
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, c.name as course_name, c.fee_amount as course_fee
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.id
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT s.*, c.name as course_name, c.fee_amount as course_fee
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.id
      WHERE s.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Create new student
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, department, course_id, enrollment_date } = req.body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required' });
    }
    
    const result = await pool.query(
      'INSERT INTO students (name, email, phone, department, course_id, enrollment_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, phone, department, course_id, enrollment_date || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, department, course_id, enrollment_date } = req.body;
    
    const result = await pool.query(
      'UPDATE students SET name = $1, email = $2, phone = $3, department = $4, course_id = $5, enrollment_date = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [name, email, phone, department, course_id, enrollment_date || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Get students with pending fees
router.get('/pending-fees/list', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT s.*, c.name as course_name,
             COALESCE(SUM(f.amount), 0) as total_pending_amount
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN fees f ON s.id = f.student_id AND f.status = 'pending'
      GROUP BY s.id, s.name, s.email, s.phone, s.department, s.course_id, s.enrollment_date, s.created_at, s.updated_at, c.name
      HAVING COALESCE(SUM(f.amount), 0) > 0
      ORDER BY s.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching students with pending fees:', error);
    res.status(500).json({ error: 'Failed to fetch students with pending fees' });
  }
});

module.exports = router;
