const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all students
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, c.name as course_name 
      FROM students s 
      LEFT JOIN courses c ON s.course_id = c.id 
      ORDER BY s.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific student by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT s.*, c.name as course_name, c.fees as course_fees
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.id
      WHERE s.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new student
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address, course_id } = req.body;
    
    const result = await db.query(
      'INSERT INTO students (name, email, phone, address, course_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, phone, address, course_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a student
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, course_id } = req.body;
    
    const result = await db.query(
      'UPDATE students SET name = $1, email = $2, phone = $3, address = $4, course_id = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [name, email, phone, address, course_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a student
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;