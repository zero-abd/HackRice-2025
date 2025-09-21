# DocLess MongoDB Integration

This document explains how to set up and use the MongoDB integration for user management and patient data in the DocLess application.

## 🏗️ Architecture Overview

The system includes:
- **User Management**: MongoDB storage for user profile data (authentication handled by frontend)
- **Patient Management**: Each user can manage their own patients
- **Conversation Storage**: Link conversation summaries to specific patients
- **Security**: User-specific data access and authorization

## 📁 Project Structure

The backend has been organized into logical folders:

```
backend/
├── database/                 # Database-related files
│   ├── __init__.py
│   ├── connection.py         # MongoDB connection and setup
│   ├── models.py            # Pydantic models for data validation
│   ├── auth.py              # Authentication utilities
│   └── services.py          # Business logic for users and patients
├── llm/                     # LLM-related files
│   ├── __init__.py
│   ├── service.py           # Conversation summarization service
│   └── demo_streaming.py    # Streaming demo script
├── server.py                # Main FastAPI application
├── setup_database.py       # Database initialization script
├── requirements.txt         # Python dependencies
└── README_MONGODB.md       # This documentation
```

## 📋 Prerequisites

1. **MongoDB**: Install and run MongoDB locally or use MongoDB Atlas
2. **Environment Variables**: Set up your `.env` file with the required variables
3. **Dependencies**: Install Python packages from requirements.txt

## 🔧 Environment Setup

Create a `.env` file in the backend directory with these variables:

```env
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=docless_db

# Application Settings
SECRET_KEY=your-secret-key-here
DEBUG=true  # Set to false in production
```

## 🚀 Installation & Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Start MongoDB**:
   ```bash
   # Local MongoDB
   mongod --dbpath /path/to/your/db
   
   # Or if using system service
   sudo systemctl start mongod
   ```

3. **Setup Database**:
   ```bash
   python setup_database.py
   ```

4. **Start the Server**:
   ```bash
   python server.py
   ```

## 📊 Database Schema

### Users Collection
```javascript
{
  "_id": ObjectId,
  "email": "user@example.com",
  "auth0_user_id": "auth0|user_id",
  "name": "Dr. John Doe",
  "job": "doctor", // "doctor", "nurse", or "none"
  "age": 35,
  "experience_years": 10,
  "medical_field": "cardiology",
  "license_number": "MD123456",
  "hospital_affiliation": "General Hospital",
  "specializations": ["cardiology", "emergency medicine"],
  "bio": "Experienced cardiologist...",
  "created_at": ISODate,
  "updated_at": ISODate,
  "is_active": true,
  "patient_ids": [ObjectId, ...]
}
```

### Patients Collection
```javascript
{
  "_id": ObjectId,
  "doctor_id": ObjectId, // Reference to user
  "first_name": "Jane",
  "last_name": "Smith",
  "date_of_birth": ISODate,
  "gender": "female",
  "phone_number": "+1234567890",
  "address": "123 Main St",
  "emergency_contact_name": "John Smith",
  "emergency_contact_phone": "+1234567891",
  "medical_history": ["hypertension", "diabetes"],
  "current_medications": ["metformin", "lisinopril"],
  "allergies": ["penicillin"],
  "insurance_info": {"provider": "Blue Cross", "policy": "12345"},
  "notes": "Patient notes...",
  "created_at": ISODate,
  "updated_at": ISODate,
  "is_active": true
}
```

### Conversations Collection
```javascript
{
  "_id": ObjectId,
  "patient_id": ObjectId,
  "doctor_id": ObjectId,
  "conversation_text": "Full conversation transcript...",
  "summary": {
    "key_points": [...],
    "medical_notes": [...],
    // LLM-generated summary structure
  },
  "conversation_date": ISODate,
  "created_at": ISODate
}
```

## 🔗 API Endpoints

### Authentication & User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user after Auth0 login |
| GET | `/auth/profile` | Get current user profile |
| PUT | `/auth/profile` | Update user profile |

### Patient Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/patients` | Create new patient |
| GET | `/patients` | Get all patients for current user |
| GET | `/patients/{id}` | Get specific patient |
| PUT | `/patients/{id}` | Update patient information |
| DELETE | `/patients/{id}` | Delete patient (soft delete) |

### Conversation Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/summarize-conversation` | Summarize conversation (with optional patient linking) |
| GET | `/patients/{id}/conversations` | Get conversation history for patient |

## 🔐 Authentication Flow

1. **Frontend Login**: User authentication is handled entirely in the React frontend
2. **User Creation**: User profile is created in MongoDB after successful frontend authentication
3. **Profile Completion**: User fills out medical professional details
4. **Data Access**: All subsequent requests are user-specific based on authenticated user context

## 🧪 Development Mode

For development mode, set `DEBUG=true` in your `.env` file. This will use mock authentication with email `test@example.com`.

## 📝 Usage Examples

### 1. Register a New User (after frontend authentication)
```json
POST /auth/register
{
  "name": "Dr. Sarah Johnson",
  "job": "doctor",
  "age": 40,
  "experience_years": 15,
  "medical_field": "neurology",
  "license_number": "MD789012",
  "hospital_affiliation": "City Medical Center",
  "specializations": ["neurology", "sleep medicine"],
  "bio": "Board-certified neurologist specializing in sleep disorders"
}
```

### 2. Create a Patient
```json
POST /patients
{
  "first_name": "Robert",
  "last_name": "Davis",
  "date_of_birth": "1985-03-15T00:00:00Z",
  "gender": "male",
  "phone_number": "+1555123456",
  "medical_history": ["asthma"],
  "current_medications": ["albuterol"],
  "allergies": ["shellfish"]
}
```

### 3. Summarize Conversation with Patient Link
```json
POST /summarize-conversation
{
  "conversation": "Nurse: How are you feeling today? Patient: I've been having chest pain...",
  "patient_id": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

## 🔍 Monitoring & Troubleshooting

### Check Database Connection
```bash
python -c "
import asyncio
from database import connect_to_mongo
asyncio.run(connect_to_mongo())
print('✅ Database connection successful!')
"
```

### View Database Contents
```bash
# Connect to MongoDB shell
mongo
use docless_db
db.users.find().pretty()
db.patients.find().pretty()
```

### Common Issues

1. **MongoDB Connection Error**: Ensure MongoDB is running and the URL is correct
2. **Authentication Issues**: Verify user session is properly established in frontend
3. **Permission Denied**: Check that users can only access their own patients

## 🚀 Production Considerations

1. **Security**: Update CORS origins to specific domains
2. **Environment**: Set `DEBUG=false` and ensure proper frontend authentication configuration
3. **Database**: Use MongoDB Atlas or properly secured MongoDB instance
4. **Indexes**: The setup script creates necessary indexes for performance
5. **Monitoring**: Set up logging and monitoring for production use

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Auth0 Python SDK](https://auth0.com/docs/quickstart/backend/python)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Motor (Async MongoDB) Documentation](https://motor.readthedocs.io/)
