const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all payments with student and fee information
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        s.name as student_name,
        s.phone as student_phone,
        s.email as student_email,
        f.total_amount as fee_total,
        f.pending_amount as fee_pending
      FROM payments p
      JOIN students s ON p.student_id = s.id
      JOIN fees f ON p.fee_id = f.id
      ORDER BY p.payment_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Error fetching payments' });
  }
});

// Get payment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        p.*,
        s.name as student_name,
        s.phone as student_phone,
        s.email as student_email,
        f.total_amount as fee_total,
        f.pending_amount as fee_pending
      FROM payments p
      JOIN students s ON p.student_id = s.id
      JOIN fees f ON p.fee_id = f.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Error fetching payment' });
  }
});

// Get payments by student ID
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pool.query(`
      SELECT 
        p.*,
        s.name as student_name,
        s.phone as student_phone,
        s.email as student_email,
        f.total_amount as fee_total,
        f.pending_amount as fee_pending
      FROM payments p
      JOIN students s ON p.student_id = s.id
      JOIN fees f ON p.fee_id = f.id
      WHERE p.student_id = $1
      ORDER BY p.payment_date DESC
    `, [studentId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching student payments:', error);
    res.status(500).json({ message: 'Error fetching student payments' });
  }
});

// Create new payment (simulation)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { student_id, fee_id, amount, payment_method = 'simulation' } = req.body;

    if (!student_id || !fee_id || !amount) {
      return res.status(400).json({ message: 'Student ID, fee ID, and amount are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than 0' });
    }

    // Check if student exists
    const studentResult = await pool.query(
      'SELECT id FROM students WHERE id = $1',
      [student_id]
    );
    if (studentResult.rows.length === 0) {
      return res.status(400).json({ message: 'Student not found' });
    }

    // Check if fee exists and get current pending amount
    const feeResult = await pool.query(
      'SELECT pending_amount, total_amount, paid_amount FROM fees WHERE id = $1 AND student_id = $2',
      [fee_id, student_id]
    );
    if (feeResult.rows.length === 0) {
      return res.status(400).json({ message: 'Fee record not found for this student' });
    }

    const fee = feeResult.rows[0];
    if (amount > fee.pending_amount) {
      return res.status(400).json({ 
        message: `Payment amount (${amount}) cannot exceed pending amount (${fee.pending_amount})` 
      });
    }

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Create payment record
      const paymentResult = await pool.query(
        'INSERT INTO payments (student_id, fee_id, amount, payment_method, transaction_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [student_id, fee_id, amount, payment_method, `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`]
      );

      // Update fee record
      const new_paid_amount = parseFloat(fee.paid_amount) + parseFloat(amount);
      const new_pending_amount = parseFloat(fee.total_amount) - new_paid_amount;
      const new_status = new_pending_amount <= 0 ? 'paid' : 'partial';

      await pool.query(
        'UPDATE fees SET paid_amount = $1, pending_amount = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        [new_paid_amount, new_pending_amount, new_status, fee_id]
      );

      await pool.query('COMMIT');

      res.status(201).json({
        ...paymentResult.rows[0],
        updated_fee: {
          paid_amount: new_paid_amount,
          pending_amount: new_pending_amount,
          status: new_status
        }
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Error creating payment' });
  }
});

// Get payment summary for student
router.get('/summary/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        s.name as student_name,
        s.phone as student_phone,
        s.email as student_email,
        COALESCE(SUM(f.total_amount), 0) as total_fees,
        COALESCE(SUM(f.paid_amount), 0) as total_paid,
        COALESCE(SUM(f.pending_amount), 0) as total_pending,
        COUNT(p.id) as payment_count
      FROM students s
      LEFT JOIN fees f ON s.id = f.student_id
      LEFT JOIN payments p ON s.id = p.student_id
      WHERE s.id = $1
      GROUP BY s.id, s.name, s.phone, s.email
    `, [studentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({ message: 'Error fetching payment summary' });
  }
});

module.exports = router;
