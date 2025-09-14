const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all students with course information
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.*,
        c.name as course_name,
        c.fee_amount as course_fee
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.id
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// Get student by ID with course and fee information
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        s.*,
        c.name as course_name,
        c.fee_amount as course_fee,
        f.total_amount,
        f.paid_amount,
        f.pending_amount,
        f.due_date,
        f.status as fee_status
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN fees f ON s.id = f.student_id
      WHERE s.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Error fetching student' });
  }
});

// Create new student
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, course_id, enrollment_date } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Student name and phone are required' });
    }

    // Check if course exists
    if (course_id) {
      const courseResult = await pool.query(
        'SELECT id FROM courses WHERE id = $1',
        [course_id]
      );
      if (courseResult.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
    }

    const result = await pool.query(
      'INSERT INTO students (name, email, phone, course_id, enrollment_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, phone, course_id, enrollment_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating student:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Error creating student' });
    }
  }
});

// Update student
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, course_id, enrollment_date, status } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Student name and phone are required' });
    }

    // Check if course exists
    if (course_id) {
      const courseResult = await pool.query(
        'SELECT id FROM courses WHERE id = $1',
        [course_id]
      );
      if (courseResult.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
    }

    const result = await pool.query(
      'UPDATE students SET name = $1, email = $2, phone = $3, course_id = $4, enrollment_date = $5, status = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [name, email, phone, course_id, enrollment_date, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating student:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Error updating student' });
    }
  }
});

// Delete student
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM students WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Error deleting student' });
  }
});

// Get students by course
router.get('/course/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await pool.query(`
      SELECT 
        s.*,
        c.name as course_name,
        c.fee_amount as course_fee
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.id
      WHERE s.course_id = $1
      ORDER BY s.name
    `, [courseId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching students by course:', error);
    res.status(500).json({ message: 'Error fetching students by course' });
  }
});

module.exports = router;
