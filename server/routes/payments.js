const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all payments
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, s.name as student_name, f.description as fee_description
      FROM payments p
      JOIN students s ON p.student_id = s.id
      JOIN fees f ON p.fee_id = f.id
      ORDER BY p.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get payments for a specific student
router.get('/student/:student_id', async (req, res) => {
  try {
    const { student_id } = req.params;
    const result = await db.query(`
      SELECT p.*, s.name as student_name, f.description as fee_description
      FROM payments p
      JOIN students s ON p.student_id = s.id
      JOIN fees f ON p.fee_id = f.id
      WHERE p.student_id = $1
      ORDER BY p.payment_date DESC
    `, [student_id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new payment (simulation)
router.post('/', async (req, res) => {
  try {
    const { student_id, fee_id, amount, payment_method } = req.body;
    
    // Begin transaction
    await db.query('BEGIN');
    
    // Create payment record
    const paymentResult = await db.query(
      'INSERT INTO payments (student_id, fee_id, amount, payment_method) VALUES ($1, $2, $3, $4) RETURNING *',
      [student_id, fee_id, amount, payment_method]
    );
    
    // Update fee record to mark as paid
    await db.query(
      'UPDATE fees SET paid = true, updated_at = NOW() WHERE id = $1',
      [fee_id]
    );
    
    // Commit transaction
    await db.query('COMMIT');
    
    res.status(201).json(paymentResult.rows[0]);
  } catch (err) {
    // Rollback transaction on error
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT p.*, s.name as student_name, f.description as fee_description
      FROM payments p
      JOIN students s ON p.student_id = s.id
      JOIN fees f ON p.fee_id = f.id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;