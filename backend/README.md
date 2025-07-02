# Maverick Pathfinder Dashboard Backend

AI-Powered Training Dashboard Backend API built with FastAPI, MongoDB, and Ollama.

## 🚀 Features

- **AI-Generated User Profiles**: Automatically creates trainee profiles using Llama model
- **Email Integration**: Sends welcome emails with credentials via MailerSend
- **MongoDB Database**: Stores user data and training progress
- **RESTful API**: Complete CRUD operations for trainees and admins
- **Real-time Health Checks**: Monitors all service connections
- **CORS Support**: Configured for frontend integration

## 📋 Prerequisites

- Python 3.8+
- MongoDB Atlas account
- Ollama with Llama3 model
- MailerSend account for email services

## 🛠️ Installation

1. **Clone the repository and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install spaCy English model:**
   ```bash
   python -m spacy download en_core_web_sm
   ```

4. **Install Tesseract OCR (for PDF text extraction):**
   - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
   - Linux: `sudo apt-get install tesseract-ocr`
   - macOS: `brew install tesseract`

5. **Set up environment variables (optional):**
   Create a `.env` file in the project root or set the variables directly:
   ```bash
   MONGODB_URL=your_mongodb_connection_string
   MAILERSEND_API_KEY=your_mailersend_api_key
   SENDER_EMAIL=your_sender_email
   SENDER_NAME="Your Sender Name"
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3
   EMAILJS_PUBLIC_KEY=your_emailjs_public_key
   EMAILJS_SERVICE_ID=your_emailjs_service_id
   EMAILJS_TEMPLATE_ID=your_emailjs_template_id
   ```

6. **Initialize the backend:**
   ```bash
   python startup.py
   ```

7. **Start the server:**
   ```bash
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## 🔧 Configuration

The backend uses a centralized configuration system in `config.py`:

- **Database**: MongoDB Atlas connection
- **Email**: MailerSend API for sending emails
- **AI**: Ollama with Llama3 model for profile generation
- **CORS**: Configured for frontend development

## 📚 API Endpoints

### Health Check
- `GET /` - Overall health status
- `GET /health-check` - Alternative health check

### Authentication
- `POST /auth/login` - User login and new trainee registration

### Trainees
- `GET /trainees` - Get all trainees
- `GET /trainees/{emp_id}` - Get trainee by employee ID
- `GET /trainees/email/{email}` - Get trainee by email
- `POST /trainees/{emp_id}/recommendations` - Get AI recommendations
- `PUT /trainees/{emp_id}/progress` - Update trainee progress

### Admins
- `GET /admins` - List all admins

### Onboarding
- `POST /onboarding/upload-resumes` - Upload ZIP of PDF resumes
- `POST /onboarding/create-accounts-for-batch` - Create trainee accounts for a batch

### Batches
- `GET /batches/grouped` - Get batches grouped by phase and batch number

## 🔐 Authentication Flow

### New Trainee Registration
1. User submits email to `/auth/login` with `role: "trainee"`
2. AI generates professional name and secure password
3. System creates sequential employee ID (MAV-0001, MAV-0002, etc.)
4. User profile is stored in MongoDB
5. Welcome email with credentials is sent via MailerSend
6. User receives login credentials

### Existing User Login
1. User submits email and password
2. System validates credentials
3. Returns user profile and updates last login time

## 🤖 AI Integration

The backend uses Ollama with Llama3 model for:

- **Name Generation**: Creates professional names from email addresses
- **Password Generation**: Generates secure, memorable passwords
- **Training Recommendations**: Provides personalized learning suggestions

## 📧 Email System

MailerSend integration handles:

- **Welcome Emails**: Sent to new trainees with login credentials
- **Password Reset**: Automated password reset functionality
- **Professional Templates**: Beautiful HTML email templates

## 🗄️ Database Schema

### Trainees Collection
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "password": "string",
  "empId": "string (MAV-XXXX format)",
  "phase": "number",
  "progress": "number",
  "score": "number",
  "status": "string",
  "specialization": "string",
  "created_at": "string (ISO format)",
  "last_login": "string (ISO format)"
}
```

### Admins Collection
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "string",
  "created_at": "string (ISO format)"
}
```

## 🚀 Running the Backend

### Development Mode
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 🔍 Testing

### Health Check
```bash
curl http://localhost:8000/
```

### Create New Trainee
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@example.com", "role": "trainee"}'
```

### Get All Trainees
```bash
curl http://localhost:8000/trainees
```

## 🐛 Troubleshooting

### Common Issues

1. **Ollama Connection Failed**
   - Ensure Ollama is running: `ollama serve`
   - Check if Llama3 model is installed: `ollama list`
   - Install model if needed: `ollama pull llama3`

2. **MongoDB Connection Failed**
   - Verify connection string in config
   - Check network connectivity
   - Ensure MongoDB Atlas IP whitelist includes your IP

3. **MailerSend Connection Failed**
   - Verify `MAILERSEND_API_KEY` in config.
   - Ensure the sender domain and email are verified in your MailerSend account.

### Logs
The backend provides detailed logging for:
- Service connection status
- User registration process
- Email sending results
- Database operations

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URL` | MongoDB connection string | Atlas connection |
| `MAILERSEND_API_KEY` | MailerSend API key | `YOUR_MAILERSEND_API_KEY_HERE` |
| `SENDER_EMAIL` | Email sender address | `gksvaibav99@gmail.com` |
| `SENDER_NAME` | Name of the email sender | `Maverick Pathfinder Training` |
| `OLLAMA_BASE_URL` | Ollama service URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model name | `llama3` |
| `DEBUG` | Debug mode | `True` |
| `EMAILJS_PUBLIC_KEY` | EmailJS public key | `YOUR_EMAILJS_PUBLIC_KEY_HERE` |
| `EMAILJS_SERVICE_ID` | EmailJS service ID | `YOUR_EMAILJS_SERVICE_ID_HERE` |
| `EMAILJS_TEMPLATE_ID` | EmailJS template ID | `YOUR_EMAILJS_TEMPLATE_ID_HERE` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the Maverick Pathfinder Dashboard system.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review the API documentation
- Contact the development team

# Backend (FastAPI)

## Setup

### Manual
```sh
python -m venv venv
venv\Scripts\activate  # On Windows
# or
source venv/bin/activate  # On Mac/Linux
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env  # Edit as needed
uvicorn app.main:app --reload
```

### Docker
Handled by root docker-compose.yml

## Environment Variables
See `.env.example` for required variables.

## Running Tests
```sh
# (Add your test instructions here)
``` 