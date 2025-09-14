# Fee Reminder AI Assistant (React + Express + PostgreSQL + Twilio + Groq)

A full-stack fee reminder system that:

- Manages courses, students, fees, and payments (simulation).
- Calls students via Twilio with a paced queue (1.1s spacing) to respect rate limits.
- Uses Groq for ultra-fast AI responses during calls.
- Future: live transcription with Groq Whisper large v3 turbo and streaming AI replies (<2s target).

## Stack

- Client: React (Vite)
- Server: Node.js + Express
- DB: PostgreSQL
- Telephony: Twilio (Programmable Voice, Gather, Dial)
- AI: Groq SDK (chat completions; plan for Whisper v3 Turbo live streaming)

## Project Structure

- `client/` React app with pages: Dashboard, Courses, Students, Student Details, Fees, Payments, Remind
- `server/` Express API with routes: auth, courses, students, fees, payments, remind, webhooks/twilio
- `server/src/services/` integrations for Twilio, Groq, and a rate-limited call queue
- `server/schema.sql` DB schema and view for dues
- `server/scripts/migrate.js` applies schema

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally
- Twilio account (with a verified caller number for testing)
- Groq API key
- A public tunnel for webhooks (e.g., ngrok) when testing calls over the phone network

## Setup

1) Install dependencies

```powershell
# From repo root
npm --version

# Server deps
npm install --prefix server

# Client deps
npm install --prefix client
```

2) Configure environment

```powershell
# Copy example env and edit values
Copy-Item server\.env.example server\.env
```

Edit `server/.env` and set:

- `DATABASE_URL` e.g., `postgres://postgres:postgres@localhost:5432/fee_reminder`
- Twilio keys: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_CALLER_NUMBER`, `MENTOR_NUMBER`
- Groq: `GROQ_API_KEY`
- `PUBLIC_BASE_URL` to the public tunnel base URL (e.g., from ngrok)

3) Create database and run migrations

```powershell
# Create DB (assuming psql in PATH)
psql -U postgres -c "CREATE DATABASE fee_reminder;"

# Apply schema
npm run migrate --prefix server
```

4) Run the apps

```powershell
# Start the API server
npm run dev --prefix server

# In another terminal, start the client
npm run dev --prefix client
```

- API: http://localhost:4000/api/health
- Client: http://localhost:5173

5) Expose the server for Twilio

```powershell
# Example using ngrok
ngrok http http://localhost:4000
```

Update `PUBLIC_BASE_URL` in `server/.env` with the ngrok HTTPS URL, restart the server.

6) Configure Twilio Voice webhook

- Incoming call webhook: `GET {PUBLIC_BASE_URL}/api/webhooks/twilio/twiml?student_id=1`
- For programmatic outbound calls, the server will pass this TwiML URL automatically per student.

## Usage Flow

1. Add Courses in the Courses page.
2. Add Students in the Students page (assign course as needed).
3. Add Fees in the Fees page (sets the initial total and due amount).
4. Simulate Payments in the Payments page (reduces the current due amount).
5. Remind: click "Remind All" to queue calls for all students with `due_amount > 0`.
   - The call says the student's name and due amount, asks for questions.
   - If a question is asked, the AI responds concisely using the context (name, dept, due, total).
   - If the user rejects (e.g., "do not call", "already paid"), we end politely.
   - If the AI cannot answer, it connects to `MENTOR_NUMBER`.

## Notes on Sub-2s AI Responses

- Today, Twilio `Gather` posts the speech transcript after the user stops speaking.
- To achieve sub-2s E2E latency, we plan to add a WebSocket or Twilio Media Streams proxy that forwards audio chunks in near-real-time to Groq Whisper large v3 turbo and streams partial transcripts to the chat model. The current code includes a placeholder in `server/src/services/groqClient.js` and we will wire a `/remind/live` signaling endpoint in a subsequent iteration.

## Security and Auth

- A basic in-memory login is provided for now (`/api/auth/login`) with default `admin/admin123`. This will be replaced with a proper auth later.

## Git: Initialize and Commit

```powershell
# Initialize repo and make the initial commit
git init
git add .
git commit -m "chore: scaffold full-stack fee reminder with Twilio + Groq"
```

Commit subsequent changes as you proceed.

## Important Environment Variables

See `server/.env.example` for the full list:

- `PORT`, `API_PREFIX`, `LOG_LEVEL`
- `DATABASE_URL`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_CALLER_NUMBER`, `MENTOR_NUMBER`
- `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_WHISPER_MODEL`
- `PUBLIC_BASE_URL`

## Disclaimer

- Outbound calls and telephony features require proper configuration and Twilio account credits/verification.
- The payment flow is a simulation and not connected to a real payment provider.
