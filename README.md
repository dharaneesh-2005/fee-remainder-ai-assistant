# Fee Remainder AI Assistant

An AI-powered fee remainder system with call assistant functionality using Twilio and Groq AI.

## Features

- **AI-Powered Reminders**: Uses Groq's fastest model for ultra-fast responses (< 2 seconds)
- **Live Transcription**: Groq's Whisper Large V3 Turbo for real-time speech-to-text
- **Smart Context**: AI has full context of student details, courses, and fee information
- **Rate-Limited Calls**: Respects Twilio's 1.1s rate limit between calls
- **Mentor Escalation**: Automatically connects to mentors when AI cannot answer questions
- **Complete Management System**: Courses, Students, Fees, and Payments management
- **Payment Simulation**: Built-in payment processing simulation
- **Modern UI**: React with Material-UI for a beautiful interface

## Tech Stack

- **Frontend**: React, Material-UI, React Router
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **AI**: Groq API (Whisper + Fastest Model)
- **Communication**: Twilio Voice API
- **Authentication**: JWT-based simple auth

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- Twilio Account
- Groq API Key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dharaneesh-2005/fee-remainder-ai-assistant.git
cd fee-remainder-ai-assistant
```

2. Install dependencies:
```bash
npm run install-all
```

3. Set up environment variables:
```bash
# Copy the example environment file
cp server/env.example server/.env

# Edit server/.env with your configuration:
# - Database credentials
# - Twilio credentials
# - Groq API key
# - JWT secret
```

4. Set up PostgreSQL database:
```bash
# Create database
createdb fee_remainder_db

# The application will automatically create tables on first run
```

5. Start the development servers:
```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend (port 3000).

### Default Login Credentials

- Username: `admin`
- Password: `admin123`

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── services/       # API services
├── server/                 # Express backend
│   ├── config/            # Database configuration
│   ├── routes/            # API routes
│   ├── models/            # Data models
│   ├── middleware/        # Express middleware
│   └── utils/             # Utility functions
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Fees
- `GET /api/fees` - Get all fees
- `POST /api/fees` - Assign fee
- `PUT /api/fees/:id` - Update fee
- `DELETE /api/fees/:id` - Delete fee

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments/process` - Process payment

### Reminders
- `GET /api/reminders` - Get reminder history
- `POST /api/reminders/send-all` - Send AI-powered reminders

## AI Integration Workflow

1. **Reminder Initiation**: Admin clicks "Send All Reminders"
2. **Rate-Limited Calls**: System calls each student with 1.1s delay
3. **Default Message**: Plays student name and pending fee amount
4. **AI Interaction**: If student asks questions, Groq AI responds
5. **Live Transcription**: Whisper converts speech to text
6. **Ultra-Fast Response**: Groq's fastest model responds in < 2 seconds
7. **Smart Escalation**: Connects to mentor if AI cannot answer

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fee_remainder_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_jwt_secret_key

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Groq
GROQ_API_KEY=your_groq_api_key

# Server
PORT=5000
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For support, please open an issue on GitHub or contact the maintainers.
