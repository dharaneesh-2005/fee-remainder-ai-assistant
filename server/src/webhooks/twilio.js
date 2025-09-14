import { Router } from 'express';
import { pool } from '../db.js';
import { quickAnswer } from '../services/groqClient.js';

export const router = Router();

// Basic TwiML that greets with student name and dues, then records/collects speech
router.get('/twiml', async (req, res, next) => {
  try {
    const { student_id } = req.query;
    const { rows } = await pool.query('select * from v_student_dues where student_id=$1', [student_id]);
    const s = rows[0];
    if (!s) return res.type('text/xml').send('<Response><Say>Student not found.</Say></Response>');

    // TwiML: Say greeting, then gather speech input and post to /webhooks/twilio/ai
    const response = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hello ${s.name}. This is a reminder from the accounts office. Your pending fee is ${s.due_amount} rupees. Please pay as soon as possible. If you have any question, please speak after the beep.</Say>
  <Gather input="speech" speechTimeout="auto" action="${process.env.PUBLIC_BASE_URL || 'https://example.com'}/api/webhooks/twilio/ai?student_id=${s.student_id}" method="POST" />
  <Say>We did not receive any input. Goodbye.</Say>
</Response>`;

    res.set('Content-Type', 'text/xml');
    res.send(response);
  } catch (e) { next(e); }
});

// Handle AI response; if cannot answer, connect to mentor
router.post('/ai', async (req, res, next) => {
  try {
    const { student_id } = req.query;
    const transcript = req.body?.SpeechResult || '';
    const { rows } = await pool.query('select * from v_student_dues where student_id=$1', [student_id]);
    const s = rows[0];

    // Simple rejection detection
    const lower = transcript.toLowerCase();
    const isRejection = /(no|stop|not interested|do not call|already paid)/.test(lower);

    if (!transcript) {
      return res.type('text/xml').send('<Response><Say>Sorry, I did not hear that. Goodbye.</Say></Response>');
    }

    if (isRejection) {
      return res.type('text/xml').send('<Response><Say>Understood. We will not bother you further. Goodbye.</Say></Response>');
    }

    // Build context for AI
    const context = `Student: ${s.name}\nDept: ${s.dept}\nDue: ${s.due_amount}\nTotal: ${s.total_amount}`;
    const { text } = await quickAnswer([
      { role: 'system', content: 'You are a concise accounts assistant. Answer within 1-2 sentences.' },
      { role: 'user', content: `Context:\n${context}\n\nQuestion: ${transcript}` }
    ]);

    if (!text || /i don't know|not sure|unknown/i.test(text)) {
      // Connect to mentor
      const dial = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting you to the mentor now. Please hold.</Say>
  <Dial>${process.env.MENTOR_NUMBER || '+10000000000'}</Dial>
</Response>`;
      return res.type('text/xml').send(dial);
    }

    const answer = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${text}</Say>
  <Say>Do you have any other questions?</Say>
  <Gather input="speech" speechTimeout="auto" action="${process.env.PUBLIC_BASE_URL || 'https://example.com'}/api/webhooks/twilio/ai?student_id=${s.student_id}" method="POST" />
</Response>`;

    res.type('text/xml').send(answer);
  } catch (e) { next(e); }
});
