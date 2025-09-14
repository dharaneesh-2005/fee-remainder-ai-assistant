# AI Fee Reminder System

An intelligent payment reminder system that uses AI to automatically call students with pending fees, powered by Twilio voice calls and Groq's ultra-fast AI models.

## Features

### 🤖 AI-Powered Voice Calls
- **Ultra-fast AI responses** using Groq's fastest model (Llama 3.1 8B Instant)
- **Live transcription** with Groq's Whisper Large V3 Turbo
- **Total response time under 2 seconds** for seamless conversations
- **Intelligent conversation flow** with full student context
- **Automatic mentor escalation** for complex queries

### 📞 Smart Reminder System
- **Rate-limited calling** (1.1 seconds between calls) to respect Twilio limits
- **Bulk reminder functionality** to call all students with pending fees
- **Individual student calling** for targeted reminders
- **Call status tracking** and conversation logging

### 🎓 Complete Student Management
- **Course Management**: Create and manage courses with fee structures
- **Student Enrollment**: Add students and assign them to courses
- **Fee Tracking**: Assign fee amounts and track payment status
- **Payment Simulation**: Record payments without external payment providers
- **Comprehensive Dashboard**: Overview of all system metrics

### 🔐 Secure Authentication
- Simple username/password authentication
- JWT-based session management
- Protected routes and API endpoints

## Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Twilio** for voice calls
- **Groq SDK** for AI integration
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend
- **React 18** with functional components
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Toastify** for notifications
- **Lucide React** for icons

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Twilio account with phone number
- Groq API key

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ai-fee-reminder
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (root, server, and client)
npm run install-all
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb ai_fee_reminder

# Run the schema
psql ai_fee_reminder < server/config/schema.sql
```

### 4. Environment Configuration
Create a `.env` file in the `server` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_fee_reminder
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Groq Configuration
GROQ_API_KEY=your_groq_api_key

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 5. Start the Application
```bash
# Start both server and client in development mode
npm run dev

# Or start them separately:
# Server: npm run server
# Client: npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Default Login Credentials
- **Username**: admin
- **Password**: password

## Usage Workflow

### 1. Course Management
1. Navigate to the **Courses** section
2. Click **Add Course** to create a new course
3. Fill in course details (name, description, duration, fee amount)
4. Save the course

### 2. Student Enrollment
1. Go to the **Students** section
2. Click **Add Student** to enroll a new student
3. Fill in student details (name, email, phone, course assignment)
4. Save the student record

### 3. Fee Assignment
1. Navigate to the **Fees** section
2. Click **Add Fee Record** to assign fees to a student
3. Select the student and course
4. Set the total amount and due date
5. Save the fee record

### 4. Payment Recording
1. Go to the **Payments** section
2. Click **Record Payment** to log a payment
3. Select the student and fee record
4. Enter the payment amount
5. The system will automatically update fee status

### 5. AI-Powered Reminders
1. Navigate to the **Reminders** section
2. View all students with pending fees
3. Use **Call Now** for individual students or **Call All Students** for bulk reminders
4. The AI will:
   - Call the student with a personalized message
   - Listen to their response using live transcription
   - Provide intelligent responses based on student context
   - Escalate to mentor if needed

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create new course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Fees
- `GET /api/fees` - Get all fees
- `GET /api/fees/pending/list` - Get pending fees
- `POST /api/fees` - Create fee record
- `PUT /api/fees/:id` - Update fee record
- `DELETE /api/fees/:id` - Delete fee record

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Record payment
- `GET /api/payments/summary/:studentId` - Get payment summary

### Reminders
- `GET /api/reminders` - Get all reminders
- `POST /api/reminders/send/:studentId` - Send reminder to student
- `POST /api/reminders/send-all` - Send reminders to all students
- `POST /api/reminders/handle-response/:reminderId` - Twilio webhook handler

## AI Integration Details

### Groq Models Used
- **Llama 3.1 8B Instant**: Ultra-fast response generation
- **Whisper Large V3 Turbo**: Live audio transcription

### AI Conversation Flow
1. **Initial Call**: AI greets student with personalized message including name and pending amount
2. **Response Processing**: Student's response is transcribed using Whisper
3. **Context-Aware Response**: AI generates response using student's full context (name, course, fees, etc.)
4. **Escalation Logic**: If AI cannot answer or student requests mentor, call is escalated
5. **Conversation Continuation**: Process continues until student ends call or escalates

### Rate Limiting
- Calls are rate-limited to 1.1 seconds between each call
- Respects Twilio's rate limits to avoid service disruption
- Bulk calling includes automatic delays between calls

## Database Schema

The system uses the following main tables:
- `users` - Authentication and user management
- `courses` - Course information and fee structures
- `students` - Student details and enrollment information
- `fees` - Fee records and payment tracking
- `payments` - Payment history and transaction records
- `reminders` - Reminder call tracking and status
- `call_logs` - Detailed conversation logs and AI responses

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Helmet.js security headers

## Development

### Project Structure
```
ai-fee-reminder/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── ...
│   └── package.json
├── server/                 # Express backend
│   ├── config/            # Database and configuration
│   ├── middleware/        # Express middleware
│   ├── routes/           # API routes
│   └── package.json
├── package.json          # Root package.json
└── README.md
```

### Available Scripts
- `npm run dev` - Start both server and client
- `npm run server` - Start only the server
- `npm run client` - Start only the client
- `npm run install-all` - Install all dependencies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the repository or contact the development team.
