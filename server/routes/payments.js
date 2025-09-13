const express = require('express');
const { authenticate } = require('../middleware/auth');
const { pool } = require('../config/database');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all payments with student information
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, s.name as student_name, s.phone as student_phone, s.email as student_email,
             f.amount as fee_amount, f.due_date
      FROM payments p
      JOIN students s ON p.student_id = s.id
      LEFT JOIN fees f ON p.fee_id = f.id
      ORDER BY p.payment_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get payments by student ID
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pool.query(`
      SELECT p.*, s.name as student_name, s.phone as student_phone, s.email as student_email,
             f.amount as fee_amount, f.due_date
      FROM payments p
      JOIN students s ON p.student_id = s.id
      LEFT JOIN fees f ON p.fee_id = f.id
      WHERE p.student_id = $1
      ORDER BY p.payment_date DESC
    `, [studentId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching student payments:', error);
    res.status(500).json({ error: 'Failed to fetch student payments' });
  }
});

// Process payment (simulation)
router.post('/process', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { student_id, fee_id, amount, payment_method = 'simulation' } = req.body;
    
    if (!student_id || !amount) {
      return res.status(400).json({ error: 'Student ID and amount are required' });
    }
    
    // Generate transaction ID
    const transaction_id = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create payment record
    const paymentResult = await client.query(
      'INSERT INTO payments (student_id, fee_id, amount, payment_method, transaction_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [student_id, fee_id, amount, payment_method, transaction_id]
    );
    
    // If fee_id is provided, update fee status
    if (fee_id) {
      await client.query(
        'UPDATE fees SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['paid', fee_id]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      ...paymentResult.rows[0],
      message: 'Payment processed successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  } finally {
    client.release();
  }
});

// Get payment summary
router.get('/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_amount_collected,
        COUNT(DISTINCT student_id) as students_paid,
        DATE_TRUNC('month', payment_date) as month,
        SUM(amount) as monthly_amount
      FROM payments 
      WHERE status = 'completed'
      GROUP BY DATE_TRUNC('month', payment_date)
      ORDER BY month DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({ error: 'Failed to fetch payment summary' });
  }
});

module.exports = router;
