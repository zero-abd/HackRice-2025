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

*Coming soon - Backend API setup instructions*
