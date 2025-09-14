const express = require('express');
const twilio = require('twilio');
const Groq = require('groq-sdk');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initialize Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Rate limiting for calls (1.1 seconds between calls)
let lastCallTime = 0;
const CALL_INTERVAL = 1100; // 1.1 seconds in milliseconds

// Get all reminders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.*,
        s.name as student_name,
        s.phone as student_phone,
        s.email as student_email,
        f.pending_amount,
        f.total_amount,
        c.name as course_name
      FROM reminders r
      JOIN students s ON r.student_id = s.id
      JOIN fees f ON r.fee_id = f.id
      LEFT JOIN courses c ON f.course_id = c.id
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ message: 'Error fetching reminders' });
  }
});

// Get reminder by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        r.*,
        s.name as student_name,
        s.phone as student_phone,
        s.email as student_email,
        f.pending_amount,
        f.total_amount,
        c.name as course_name
      FROM reminders r
      JOIN students s ON r.student_id = s.id
      JOIN fees f ON r.fee_id = f.id
      LEFT JOIN courses c ON f.course_id = c.id
      WHERE r.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching reminder:', error);
    res.status(500).json({ message: 'Error fetching reminder' });
  }
});

// Send reminder to a specific student
router.post('/send/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student with fee information
    const studentResult = await pool.query(`
      SELECT 
        s.*,
        f.id as fee_id,
        f.pending_amount,
        f.total_amount,
        f.due_date,
        c.name as course_name
      FROM students s
      JOIN fees f ON s.id = f.student_id
      LEFT JOIN courses c ON f.course_id = c.id
      WHERE s.id = $1 AND f.pending_amount > 0
    `, [studentId]);

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found or no pending fees' });
    }

    const student = studentResult.rows[0];

    // Rate limiting check
    const currentTime = Date.now();
    const timeSinceLastCall = currentTime - lastCallTime;
    
    if (timeSinceLastCall < CALL_INTERVAL) {
      const waitTime = CALL_INTERVAL - timeSinceLastCall;
      return res.status(429).json({ 
        message: `Please wait ${Math.ceil(waitTime / 1000)} seconds before making another call`,
        waitTime: waitTime
      });
    }

    // Create reminder record
    const reminderResult = await pool.query(
      'INSERT INTO reminders (student_id, fee_id, call_status) VALUES ($1, $2, $3) RETURNING *',
      [studentId, student.fee_id, 'initiated']
    );

    const reminder = reminderResult.rows[0];

    // Make Twilio call
    const call = await twilioClient.calls.create({
      twiml: `<Response>
        <Say>Hello ${student.name}, this is a payment reminder. You have a pending fee of ${student.pending_amount} rupees for ${student.course_name || 'your course'}. Please make the payment as soon as possible. Do you have any questions?</Say>
        <Record maxLength="30" action="/api/reminders/handle-response/${reminder.id}" method="POST" />
      </Response>`,
      to: student.phone,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    // Update reminder with call SID
    await pool.query(
      'UPDATE reminders SET call_status = $1 WHERE id = $2',
      ['calling', reminder.id]
    );

    lastCallTime = currentTime;

    res.json({
      message: 'Reminder call initiated',
      reminder: reminder,
      callSid: call.sid,
      student: {
        name: student.name,
        phone: student.phone,
        pending_amount: student.pending_amount,
        course_name: student.course_name
      }
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({ message: 'Error sending reminder' });
  }
});

// Send reminders to all students with pending fees
router.post('/send-all', authenticateToken, async (req, res) => {
  try {
    // Get all students with pending fees
    const studentsResult = await pool.query(`
      SELECT 
        s.*,
        f.id as fee_id,
        f.pending_amount,
        f.total_amount,
        f.due_date,
        c.name as course_name
      FROM students s
      JOIN fees f ON s.id = f.student_id
      LEFT JOIN courses c ON f.course_id = c.id
      WHERE f.pending_amount > 0 AND f.status = 'pending'
      ORDER BY f.due_date ASC
    `);

    if (studentsResult.rows.length === 0) {
      return res.json({ message: 'No students with pending fees found' });
    }

    const students = studentsResult.rows;
    const results = [];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      
      // Rate limiting - wait between calls
      if (i > 0) {
        const waitTime = CALL_INTERVAL;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      try {
        // Create reminder record
        const reminderResult = await pool.query(
          'INSERT INTO reminders (student_id, fee_id, call_status) VALUES ($1, $2, $3) RETURNING *',
          [student.id, student.fee_id, 'initiated']
        );

        const reminder = reminderResult.rows[0];

        // Make Twilio call
        const call = await twilioClient.calls.create({
          twiml: `<Response>
            <Say>Hello ${student.name}, this is a payment reminder. You have a pending fee of ${student.pending_amount} rupees for ${student.course_name || 'your course'}. Please make the payment as soon as possible. Do you have any questions?</Say>
            <Record maxLength="30" action="/api/reminders/handle-response/${reminder.id}" method="POST" />
          </Response>`,
          to: student.phone,
          from: process.env.TWILIO_PHONE_NUMBER
        });

        // Update reminder with call SID
        await pool.query(
          'UPDATE reminders SET call_status = $1 WHERE id = $2',
          ['calling', reminder.id]
        );

        results.push({
          student: student.name,
          phone: student.phone,
          callSid: call.sid,
          status: 'initiated'
        });
      } catch (error) {
        console.error(`Error calling student ${student.name}:`, error);
        results.push({
          student: student.name,
          phone: student.phone,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      message: `Initiated calls to ${results.length} students`,
      results: results
    });
  } catch (error) {
    console.error('Error sending bulk reminders:', error);
    res.status(500).json({ message: 'Error sending bulk reminders' });
  }
});

// Handle Twilio webhook for call response
router.post('/handle-response/:reminderId', async (req, res) => {
  try {
    const { reminderId } = req.params;
    const { RecordingUrl, CallSid } = req.body;

    // Get reminder with student information
    const reminderResult = await pool.query(`
      SELECT 
        r.*,
        s.name as student_name,
        s.phone as student_phone,
        f.pending_amount,
        f.total_amount,
        c.name as course_name
      FROM reminders r
      JOIN students s ON r.student_id = s.id
      JOIN fees f ON r.fee_id = f.id
      LEFT JOIN courses c ON f.course_id = c.id
      WHERE r.id = $1
    `, [reminderId]);

    if (reminderResult.rows.length === 0) {
      return res.status(404).send('Reminder not found');
    }

    const reminder = reminderResult.rows[0];

    if (RecordingUrl) {
      // Transcribe the recording using Groq Whisper
      try {
        const transcription = await transcribeAudio(RecordingUrl);
        
        // Get AI response using Groq
        const aiResponse = await getAIResponse(transcription, reminder);
        
        // Log the call
        await pool.query(
          'INSERT INTO call_logs (reminder_id, student_id, call_sid, transcription, ai_response) VALUES ($1, $2, $3, $4, $5)',
          [reminderId, reminder.student_id, CallSid, transcription, aiResponse]
        );

        // Update reminder
        await pool.query(
          'UPDATE reminders SET call_status = $1, ai_response = $2 WHERE id = $3',
          ['completed', aiResponse, reminderId]
        );

        // Generate TwiML response
        const twiml = new twilio.twiml.VoiceResponse();
        
        if (aiResponse.includes('escalate') || aiResponse.includes('mentor')) {
          twiml.say('I understand you need more help. Let me connect you with a mentor.');
          // Here you would add logic to connect to a mentor
          twiml.say('Please hold while I transfer you to our support team.');
        } else {
          twiml.say(aiResponse);
        }
        
        twiml.say('Thank you for your time. Have a great day!');
        twiml.hangup();

        res.type('text/xml');
        res.send(twiml.toString());
      } catch (error) {
        console.error('Error processing call response:', error);
        
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say('I apologize, but I had trouble understanding your response. Please contact our support team for assistance.');
        twiml.hangup();
        
        res.type('text/xml');
        res.send(twiml.toString());
      }
    } else {
      // No recording, just hang up
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.say('Thank you for your time. Have a great day!');
      twiml.hangup();
      
      res.type('text/xml');
      res.send(twiml.toString());
    }
  } catch (error) {
    console.error('Error handling call response:', error);
    res.status(500).send('Error processing call');
  }
});

// Helper function to transcribe audio using Groq Whisper
async function transcribeAudio(audioUrl) {
  try {
    // Download the audio file
    const response = await fetch(audioUrl);
    const audioBuffer = await response.arrayBuffer();
    
    // Use Groq's Whisper API for transcription
    const transcription = await groq.audio.transcriptions.create({
      file: new File([audioBuffer], 'recording.wav'),
      model: 'whisper-large-v3-turbo',
    });
    
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

// Helper function to get AI response using Groq
async function getAIResponse(transcription, reminder) {
  try {
    const systemPrompt = `You are a helpful payment reminder assistant. You have access to the following student information:
    - Student Name: ${reminder.student_name}
    - Course: ${reminder.course_name || 'Not specified'}
    - Pending Amount: ${reminder.pending_amount} rupees
    - Total Amount: ${reminder.total_amount} rupees
    
    Your role is to:
    1. Answer questions about payment details, due dates, and course information
    2. Help with payment-related queries
    3. If the student asks questions you cannot answer or requests to speak with a mentor, respond with "escalate to mentor"
    4. If the student clearly rejects or says they don't want to pay, acknowledge politely and end the conversation
    5. Keep responses concise and helpful (under 50 words)
    
    If you don't have the information needed to answer a question, respond with "escalate to mentor".`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcription }
      ],
      model: 'llama-3.1-8b-instant', // Using Groq's fastest model
      max_tokens: 100,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return 'I apologize, but I had trouble processing your request. Let me connect you with a mentor.';
  }
}

// Get call logs for a reminder
router.get('/logs/:reminderId', authenticateToken, async (req, res) => {
  try {
    const { reminderId } = req.params;
    const result = await pool.query(
      'SELECT * FROM call_logs WHERE reminder_id = $1 ORDER BY created_at DESC',
      [reminderId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching call logs:', error);
    res.status(500).json({ message: 'Error fetching call logs' });
  }
});

module.exports = router;
