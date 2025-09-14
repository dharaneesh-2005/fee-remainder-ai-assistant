import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { router as authRouter } from './routes/auth.js';
import { router as coursesRouter } from './routes/courses.js';
import { router as studentsRouter } from './routes/students.js';
import { router as feesRouter } from './routes/fees.js';
import { router as paymentsRouter } from './routes/payments.js';
import { router as remindRouter } from './routes/remind.js';
import { router as twilioWebhookRouter } from './webhooks/twilio.js';
import { ensureDb } from './db.js';

dotenv.config();

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
app.use(pinoHttp({ logger }));
app.use(cors());
app.use(express.json());
// Twilio sends application/x-www-form-urlencoded for Gather callbacks
app.use(express.urlencoded({ extended: true }));

const API_PREFIX = process.env.API_PREFIX || '/api';

app.get(API_PREFIX + '/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use(API_PREFIX + '/auth', authRouter);
app.use(API_PREFIX + '/courses', coursesRouter);
app.use(API_PREFIX + '/students', studentsRouter);
app.use(API_PREFIX + '/fees', feesRouter);
app.use(API_PREFIX + '/payments', paymentsRouter);
app.use(API_PREFIX + '/remind', remindRouter);
app.use(API_PREFIX + '/webhooks/twilio', twilioWebhookRouter);

// Basic error handler
app.use((err, _req, res, _next) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = process.env.PORT || 4000;

ensureDb()
  .then(() => {
    app.listen(port, () => {
      logger.info(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    logger.error({ err }, 'Failed to init DB');
    process.exit(1);
  });
