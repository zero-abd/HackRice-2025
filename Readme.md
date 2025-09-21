# HackRice 2025 - Project Setup Guide

This guide will walk you through setting up the HackRice 2025 project components.

## Project Structure

```
HackRice-2025/
├── frontend/          # React + TypeScript frontend
├── backend/           # Backend API (coming soon)
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

This backend service uses Ollama with Qwen models to analyze nurse-patient conversations and generate structured medical summaries.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Note:** This setup uses the Ollama Python library instead of HTTP API calls for better performance and easier integration.

### 2. Install and Setup Ollama

1. Download Ollama from [ollama.ai](https://ollama.ai)
2. Install and start Ollama:
   ```bash
   ollama serve
   ```

3. Download the Qwen model (in a new terminal):
   ```bash
   # Download one of these models:
   # ollama pull qwen3:8b
   ```

4. Update the `MODEL_NAME` in `server.py` to match your downloaded model:
   ```python
   MODEL_NAME = "qwen3:8b"
   ```

### 3. Run the Server

```bash
python server.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and Ollama connection status.

### Summarize Conversation
```
POST /summarize-conversation
Content-Type: application/json

{
  "conversation": "Nurse: How are you feeling today?\nPatient: I have a headache..."
}
```

Returns structured JSON with:
- `vitals`: Blood pressure, heart rate, temperature, etc.
- `symptoms`: Current symptoms, duration, severity
- `medical_history`: Medications, allergies, conditions
- `patient_concerns`: Patient's specific concerns
- `nurse_observations`: Nurse's observations
- `additional_characteristics`: Mobility, mental state, etc.
- `summary`: Brief summary for doctor review

