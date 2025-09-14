const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all courses
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM courses ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific course by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM courses WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new course
router.post('/', async (req, res) => {
  try {
    const { name, description, department, duration, fees } = req.body;
    
    const result = await db.query(
      'INSERT INTO courses (name, description, department, duration, fees) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, department, duration, fees]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a course
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, department, duration, fees } = req.body;
    
    const result = await db.query(
      'UPDATE courses SET name = $1, description = $2, department = $3, duration = $4, fees = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [name, description, department, duration, fees, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a course
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM courses WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;