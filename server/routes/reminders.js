const express = require('express');
const { authenticate } = require('../middleware/auth');
const { pool } = require('../config/database');
const twilio = require('twilio');
const Groq = require('groq-sdk');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Initialize Twilio client with error handling
let twilioClient = null;
let groq = null;

try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('✅ Twilio client initialized');
  } else {
    console.warn('⚠️ Twilio credentials not found in environment variables');
  }
} catch (error) {
  console.error('❌ Failed to initialize Twilio client:', error.message);
}

// Initialize Groq client with error handling
try {
  if (process.env.GROQ_API_KEY) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    console.log('✅ Groq client initialized');
  } else {
    console.warn('⚠️ Groq API key not found in environment variables');
  }
} catch (error) {
  console.error('❌ Failed to initialize Groq client:', error.message);
}

// Get all reminders
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, s.name as student_name, s.phone as student_phone, s.email as student_email,
             f.amount as fee_amount, f.due_date
      FROM reminders r
      JOIN students s ON r.student_id = s.id
      LEFT JOIN fees f ON r.fee_id = f.id
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Send reminder to all students with pending fees
router.post('/send-all', async (req, res) => {
  try {
    if (!twilioClient) {
      return res.status(503).json({ error: 'Twilio service not available. Please check configuration.' });
    }
    // Get all students with pending fees
    const studentsResult = await pool.query(`
      SELECT DISTINCT s.*, c.name as course_name,
             COALESCE(SUM(f.amount), 0) as total_pending_amount,
             STRING_AGG(f.id::text, ',') as fee_ids
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN fees f ON s.id = f.student_id AND f.status = 'pending'
      GROUP BY s.id, s.name, s.email, s.phone, s.department, s.course_id, s.enrollment_date, s.created_at, s.updated_at, c.name
      HAVING COALESCE(SUM(f.amount), 0) > 0
      ORDER BY s.name
    `);

    const students = studentsResult.rows;
    const results = [];

    // Process each student with rate limiting (1.1s delay between calls)
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      
      try {
        // Create reminder record
        const reminderResult = await pool.query(
          'INSERT INTO reminders (student_id, fee_id, status) VALUES ($1, $2, $3) RETURNING *',
          [student.id, student.fee_ids ? student.fee_ids.split(',')[0] : null, 'initiated']
        );

        // Prepare student context for AI
        const studentContext = {
          name: student.name,
          phone: student.phone,
          email: student.email,
          department: student.department,
          course: student.course_name,
          pendingAmount: student.total_pending_amount
        };

        // Make Twilio call
        const call = await twilioClient.calls.create({
          twiml: generateTwiml(studentContext),
          to: student.phone,
          from: process.env.TWILIO_PHONE_NUMBER
        });

        // Update reminder with call SID
        await pool.query(
          'UPDATE reminders SET call_sid = $1, status = $2 WHERE id = $3',
          [call.sid, 'calling', reminderResult.rows[0].id]
        );

        results.push({
          student: student.name,
          phone: student.phone,
          callSid: call.sid,
          status: 'initiated'
        });

        // Rate limiting: wait 1.1 seconds between calls
        if (i < students.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1100));
        }

      } catch (error) {
        console.error(`Error calling student ${student.name}:`, error);
        results.push({
          student: student.name,
          phone: student.phone,
          error: error.message,
          status: 'failed'
        });
      }
    }

    res.json({
      message: `Reminder calls initiated for ${students.length} students`,
      results
    });

  } catch (error) {
    console.error('Error sending reminders:', error);
    res.status(500).json({ error: 'Failed to send reminders' });
  }
});

// Generate TwiML for the call
function generateTwiml(studentContext) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Hello ${studentContext.name}, this is a reminder from your educational institution. 
    You have a pending fee of ${studentContext.pendingAmount} rupees for your ${studentContext.course} course. 
    Please make the payment as soon as possible. 
    If you have any questions, please ask now, otherwise press any key to end the call.
  </Say>
  <Gather numDigits="1" action="/api/reminders/handle-response" method="POST">
    <Say voice="alice">Please press any key if you have a question, or wait to end the call.</Say>
  </Gather>
  <Say voice="alice">Thank you for your time. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

// Handle call response and AI interaction
router.post('/handle-response', async (req, res) => {
  try {
    const { CallSid, From, Digits } = req.body;
    
    // Find the reminder record
    const reminderResult = await pool.query(
      'SELECT r.*, s.*, c.name as course_name FROM reminders r JOIN students s ON r.student_id = s.id LEFT JOIN courses c ON s.course_id = c.id WHERE r.call_sid = $1',
      [CallSid]
    );

    if (reminderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const reminder = reminderResult.rows[0];

    if (Digits) {
      // Student pressed a key, start AI conversation
      const twiml = await generateAIConversation(reminder);
      res.type('text/xml').send(twiml);
    } else {
      // No response, end call
      await pool.query(
        'UPDATE reminders SET status = $1, call_duration = $2 WHERE call_sid = $3',
        ['completed', 30, CallSid] // Assuming 30 seconds for basic call
      );
      
      res.type('text/xml').send(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">Thank you for your time. Goodbye.</Say>
          <Hangup/>
        </Response>
      `);
    }

  } catch (error) {
    console.error('Error handling call response:', error);
    res.type('text/xml').send(`
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice">Sorry, there was an error. Goodbye.</Say>
        <Hangup/>
      </Response>
    `);
  }
});

// Generate AI conversation TwiML
async function generateAIConversation(student) {
  try {
    if (!groq) {
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">I'm sorry, I'm having trouble right now. Let me connect you to a mentor.</Say>
  <Redirect>/api/reminders/connect-mentor</Redirect>
</Response>`;
    }
    // Prepare context for Groq AI
    const context = `
      Student Information:
      - Name: ${student.name}
      - Phone: ${student.phone}
      - Email: ${student.email}
      - Department: ${student.department}
      - Course: ${student.course_name}
      - Pending Fee: ${student.total_pending_amount || 'Unknown amount'}
      
      You are a helpful AI assistant for fee collection. The student has a pending fee and may have questions.
      Keep responses brief and helpful. If you cannot answer a question, offer to connect them to a mentor.
      Be polite and professional.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: context
        },
        {
          role: "user",
          content: "The student has pressed a key indicating they have a question. Generate a brief response asking what they need help with."
        }
      ],
      model: "llama3-8b-8192", // Fast model for quick responses
      temperature: 0.7,
      max_tokens: 100
    });

    const aiResponse = completion.choices[0]?.message?.content || "How can I help you with your fee payment?";

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${aiResponse}</Say>
  <Gather numDigits="1" action="/api/reminders/ai-response" method="POST" timeout="10">
    <Say voice="alice">Please press any key to continue or wait to end the call.</Say>
  </Gather>
  <Say voice="alice">Thank you for your time. Goodbye.</Say>
  <Hangup/>
</Response>`;

  } catch (error) {
    console.error('Error generating AI response:', error);
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">I'm sorry, I'm having trouble right now. Let me connect you to a mentor.</Say>
  <Redirect>/api/reminders/connect-mentor</Redirect>
</Response>`;
  }
}

// Handle AI conversation continuation
router.post('/ai-response', async (req, res) => {
  try {
    const { CallSid, From, SpeechResult } = req.body;
    
    // Find the reminder record
    const reminderResult = await pool.query(
      'SELECT r.*, s.*, c.name as course_name FROM reminders r JOIN students s ON r.student_id = s.id LEFT JOIN courses c ON s.course_id = c.id WHERE r.call_sid = $1',
      [CallSid]
    );

    if (reminderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const reminder = reminderResult.rows[0];

    if (SpeechResult) {
      // Process the speech with Groq AI
      const aiResponse = await processStudentQuestion(reminder, SpeechResult);
      
      // Update reminder with AI response
      await pool.query(
        'UPDATE reminders SET ai_response = $1 WHERE call_sid = $2',
        [aiResponse, CallSid]
      );

      res.type('text/xml').send(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">${aiResponse}</Say>
          <Gather numDigits="1" action="/api/reminders/ai-response" method="POST" timeout="10">
            <Say voice="alice">Do you have any other questions? Press any key to continue or wait to end the call.</Say>
          </Gather>
          <Say voice="alice">Thank you for your time. Goodbye.</Say>
          <Hangup/>
        </Response>
      `);
    } else {
      // No speech detected, end call
      await pool.query(
        'UPDATE reminders SET status = $1 WHERE call_sid = $2',
        ['completed', CallSid]
      );
      
      res.type('text/xml').send(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">Thank you for your time. Goodbye.</Say>
          <Hangup/>
        </Response>
      `);
    }

  } catch (error) {
    console.error('Error handling AI response:', error);
    res.type('text/xml').send(`
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice">I'm sorry, I'm having trouble. Let me connect you to a mentor.</Say>
        <Redirect>/api/reminders/connect-mentor</Redirect>
      </Response>
    `);
  }
});

// Process student question with Groq AI
async function processStudentQuestion(student, question) {
  try {
    if (!groq) {
      return "I'm sorry, I'm having trouble understanding. Let me connect you to a mentor who can help you.";
    }
    const context = `
      Student Information:
      - Name: ${student.name}
      - Phone: ${student.phone}
      - Email: ${student.email}
      - Department: ${student.department}
      - Course: ${student.course_name}
      - Pending Fee: ${student.total_pending_amount || 'Unknown amount'}
      
      Student Question: "${question}"
      
      You are a helpful AI assistant for fee collection. Answer the student's question briefly and helpfully.
      If you cannot answer the question or if the student seems frustrated, offer to connect them to a mentor.
      Keep responses under 50 words and be professional.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: context
        },
        {
          role: "user",
          content: question
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 100
    });

    return completion.choices[0]?.message?.content || "I understand your concern. Let me connect you to a mentor who can help you better.";

  } catch (error) {
    console.error('Error processing student question:', error);
    return "I'm sorry, I'm having trouble understanding. Let me connect you to a mentor who can help you.";
  }
}

// Connect to mentor
router.post('/connect-mentor', async (req, res) => {
  try {
    // Get available mentor
    const mentorResult = await pool.query(
      'SELECT * FROM mentors WHERE is_available = true ORDER BY RANDOM() LIMIT 1'
    );

    if (mentorResult.rows.length === 0) {
      res.type('text/xml').send(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">I'm sorry, no mentors are available right now. Please call back later or contact us directly.</Say>
          <Hangup/>
        </Response>
      `);
      return;
    }

    const mentor = mentorResult.rows[0];

    res.type('text/xml').send(`
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice">I'm connecting you to ${mentor.name}, a mentor from our ${mentor.department} department.</Say>
        <Dial>${mentor.phone}</Dial>
        <Say voice="alice">The mentor is not available right now. Please try calling back later.</Say>
        <Hangup/>
      </Response>
    `);

  } catch (error) {
    console.error('Error connecting to mentor:', error);
    res.type('text/xml').send(`
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice">I'm sorry, I cannot connect you to a mentor right now. Please try calling back later.</Say>
        <Hangup/>
      </Response>
    `);
  }
});

module.exports = router;
