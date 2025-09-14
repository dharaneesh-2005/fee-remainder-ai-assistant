import { Router } from 'express';
import { pool } from '../db.js';
import { enqueue } from '../services/callQueue.js';
import { placeCall } from '../services/twilioClient.js';

export const router = Router();

// Kick off reminder calls to all with dues. We queue to respect Twilio rate limits.
router.post('/all', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('select * from v_student_dues where due_amount > 0');
    const results = [];
    for (const s of rows) {
      const twimlUrl = `${process.env.PUBLIC_BASE_URL || 'https://example.com'}/api/webhooks/twilio/twiml?student_id=${s.student_id}`;
      results.push(
        enqueue(() => placeCall({ to: s.phone, url: twimlUrl }))
      );
    }
    // respond immediately with queued count
    res.json({ queued: results.length });
  } catch (e) { next(e); }
});
