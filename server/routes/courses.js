const express = require('express');
const { authenticate } = require('../middleware/auth');
const { executeQuery } = require('../config/database');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all courses
router.get('/', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM courses ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Create new course
router.post('/', async (req, res) => {
  try {
    const { name, description, duration_months, fee_amount } = req.body;
    
    if (!name || !fee_amount) {
      return res.status(400).json({ error: 'Name and fee amount are required' });
    }
    
    const result = await pool.query(
      'INSERT INTO courses (name, description, duration_months, fee_amount) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, duration_months, fee_amount]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Update course
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, duration_months, fee_amount } = req.body;
    
    const result = await pool.query(
      'UPDATE courses SET name = $1, description = $2, duration_months = $3, fee_amount = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, description, duration_months, fee_amount, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete course
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if course has students
    const studentsResult = await pool.query('SELECT COUNT(*) FROM students WHERE course_id = $1', [id]);
    if (parseInt(studentsResult.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete course with enrolled students' });
    }
    
    const result = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

module.exports = router;
