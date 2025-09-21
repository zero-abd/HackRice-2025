# HackRice 2025 - Project Setup Guide

This guide will walk you through setting up the HackRice 2025 project components.

## Project Structure

```
HackRice-2025/
├── frontend/          # React + TypeScript frontend with Auth0
├── backend/           # FastAPI backend with Ollama LLM integration
```

## Prerequisites
- Node.js and npm installed on your machine
---

# Frontend Setup

## Auth0 Authentication Setup

### Prerequisites for Auth0
- An Auth0 account (sign up at [auth0.com](https://auth0.com) if you don't have one)

### Step 1: Create an Auth0 Account and Application

#### 1.1 Sign up for Auth0
1. Go to [auth0.com](https://auth0.com)
2. Click "Sign Up" and create your account
3. Choose the **Free** plan to get started

#### 1.2 Create a New Application
1. Once logged in, navigate to the [Auth0 Dashboard](https://manage.auth0.com)
2. Click on **"Applications"** in the left sidebar
3. Click **"Create Application"**
4. Fill in the application details:
   - **Name**: `DocLess` (or any name you prefer)
   - **Application Type**: Select **"Single Page Web Applications"**
5. Click **"Create"**

#### 1.3 Configure Application Settings
1. In your newly created application, go to the **"Settings"** tab
2. Scroll down to **"Application URIs"** section
3. Configure the following URLs:
   - **Allowed Callback URLs**: 
     ```
     http://localhost:5173, http://localhost:3000, http://localhost:4173
     ```
   - **Allowed Logout URLs**: 
     ```
     http://localhost:5173, http://localhost:3000, http://localhost:4173
     ```
   - **Allowed Web Origins**: 
     ```
     http://localhost:5173, http://localhost:3000, http://localhost:4173
     ```
4. Click **"Save Changes"**

### Step 2: Get Your Auth0 Credentials

#### 2.1 Copy Domain and Client ID
1. In your Auth0 application's **"Settings"** tab
2. Find the **"Basic Information"** section at the top
3. Copy the following values:
   - **Domain**: This will look like `your-tenant.auth0.com`
   - **Client ID**: This will be a long alphanumeric string

#### 2.2 Set up Environment Variables (Recommended)
1. Copy the example environment file:
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. Open `frontend/.env.local` and replace the placeholder values with your actual Auth0 credentials:
   ```env
   VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
   VITE_AUTH0_CLIENT_ID=your-auth0-client-id
   ```

3. The `auth0-config.ts` file is already configured to use these environment variables:
   ```typescript
   export const auth0Config = {
     domain: import.meta.env.VITE_AUTH0_DOMAIN,
     clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
     authorizationParams: {
       redirect_uri: window.location.origin,
       scope: "openid profile email",
     },
     cacheLocation: "localstorage" as const,
     useRefreshTokens: true,
   };
   ```

## Test Your Setup

1. Start your development server:
```bash
cd frontend
npm run dev
```

2. Navigate to your application in the browser
3. Try logging in with the Auth0 login button
4. You should be redirected to Auth0's login page
5. After successful authentication, you should be redirected back to your app

---


# Backend Setup

This FastAPI backend service uses Ollama with Qwen models to analyze nurse-patient conversations and generate structured medical summaries. The application features a modern class-based architecture with real-time streaming capabilities.

## Architecture

### Key Components:
- **`llm_service.py`**: Contains the `ConversationSummarizer` class with all LLM-related functionality
- **`server.py`**: FastAPI application with clean endpoint definitions
- **`requirements.txt`**: FastAPI, Uvicorn, Pydantic, and Ollama dependencies

### Key Features:
- ✅ FastAPI with automatic API documentation
- ✅ Real-time streaming analysis using Server-Sent Events (SSE)
- ✅ Pydantic models for request/response validation
- ✅ Async/await support for better performance
- ✅ Type hints throughout the codebase
- ✅ Separation of concerns with modular design
- ✅ Interactive API documentation

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install and Setup Ollama

1. Download Ollama from [ollama.ai](https://ollama.ai)
2. Install and start Ollama:
   ```bash
   ollama serve
   ```

3. Download the Qwen model (in a new terminal):
   ```bash
   ollama pull qwen3:8b
   ```

4. The model name is configured in `server.py` as:
   ```python
   MODEL_NAME = "qwen3:8b"
   ```

### 3. Run the FastAPI Server

```bash
python server.py
```

The server will start on `http://localhost:8000`

### 4. Access API Documentation
FastAPI automatically generates interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### GET /health
Health check endpoint that verifies Ollama connection and model availability.

**Response:**
```json
{
  "status": "healthy",
  "ollama_connected": true,
  "model": "qwen3:8b",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST /summarize-conversation
Summarizes a nurse-patient conversation into structured medical data (traditional endpoint).

**Request:**
```json
{
  "conversation": "Nurse: How are you feeling today?\nPatient: I have a headache..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vitals": {"blood_pressure": "120/80", "heart_rate": "72"},
    "symptoms": {"primary": "headache", "severity": "moderate"},
    "medical_history": {"medications": [], "allergies": []},
    "patient_concerns": ["headache pain"],
    "nurse_observations": ["patient appears alert"],
    "additional_characteristics": {"mobility": "good"},
    "summary": "Patient reports headache, vitals stable"
  }
}
```

### POST /summarize-conversation-stream 🌊 **NEW!**
**Real-time streaming** version of conversation summarization using Server-Sent Events (SSE).

**Benefits of Streaming:**
- ⚡ **Immediate feedback** - See analysis start instantly
- 🔄 **Real-time progress** - Watch the AI think through the conversation
- 📱 **Better UX** - No waiting for complete response
- ⏱️ **Faster perceived performance** - Users see results as they're generated

**Request:** Same as traditional endpoint

**Response:** Stream of Server-Sent Events
```
data: {"type": "metadata", "data": {"started_at": "...", "model_used": "qwen3:8b", "status": "started"}}

data: {"type": "chunk", "data": {"chunk": "Let me analyze", "accumulated_length": 15, "done": false}}

data: {"type": "final", "data": {"vitals": {...}, "symptoms": {...}, "metadata": {...}}}

data: {"type": "complete", "data": {"message": "Stream completed"}}
```

### GET /test-conversation
Test endpoint that processes a sample conversation.

### GET /test-conversation-stream 🌊 **NEW!**
**Streaming** test endpoint with sample conversation.

## Testing

### Quick Streaming Demo
```bash
cd backend
python demo_streaming.py
```

## Development Notes

### Error Handling
The API uses proper HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid input)
- `500`: Internal Server Error (Ollama issues, processing errors)

### Troubleshooting
1. **Import errors**: Install dependencies with `pip install -r requirements.txt`
2. **Ollama connection failed**: Ensure `ollama serve` is running
3. **Model not found**: Run `ollama pull qwen3:8b`
4. **Port conflicts**: Change port in `server.py` if 8000 is in use

