const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all students with pending fees
router.get('/pending', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.id, s.name, s.phone, c.name as course_name, 
             SUM(f.amount) as pending_amount
      FROM students s
      JOIN courses c ON s.course_id = c.id
      JOIN fees f ON s.id = f.student_id
      WHERE f.paid = false
      GROUP BY s.id, s.name, s.phone, c.name
      ORDER BY s.id
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Initiate reminder calls for all students with pending fees
router.post('/call-all', async (req, res) => {
  try {
    // In a real implementation, this would integrate with Twilio
    // For now, we'll simulate the process
    
    const students = await db.query(`
      SELECT s.id, s.name, s.phone, c.name as course_name, 
             SUM(f.amount) as pending_amount
      FROM students s
      JOIN courses c ON s.course_id = c.id
      JOIN fees f ON s.id = f.student_id
      WHERE f.paid = false
      GROUP BY s.id, s.name, s.phone, c.name
      ORDER BY s.id
    `);
    
    // Simulate calling each student with a delay to respect rate limits
    // In a real implementation, this would use Twilio with proper rate limiting
    
    res.json({
      message: `Initiated calls to ${students.rows.length} students with pending fees`,
      students: students.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Handle a call to a specific student
router.post('/call/:student_id', async (req, res) => {
  try {
    const { student_id } = req.params;
    
    // Get student details with pending fees
    const studentResult = await db.query(`
      SELECT s.id, s.name, s.phone, c.name as course_name, 
             SUM(f.amount) as pending_amount
      FROM students s
      JOIN courses c ON s.course_id = c.id
      JOIN fees f ON s.id = f.student_id
      WHERE s.id = $1 AND f.paid = false
      GROUP BY s.id, s.name, s.phone, c.name
    `, [student_id]);
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found or no pending fees' });
    }
    
    const student = studentResult.rows[0];
    
    // In a real implementation, this would initiate a Twilio call
    // with the student details and AI integration
    
    res.json({
      message: `Call initiated to ${student.name}`,
      student: student
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;