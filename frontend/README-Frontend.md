# Healthcare Dashboard Frontend

A modern, responsive healthcare dashboard built with React, TypeScript, and Auth0 authentication.

## Features

- **Authentication**: Secure login/logout with Auth0
- **Dashboard**: Beautiful analytics with charts and statistics
- **Patient Management**: View and manage patient information
- **Profile Management**: User profile with Auth0 integration
- **Settings**: Customizable application settings
- **Responsive Design**: Mobile-friendly with glassy UI theme

## Tech Stack

- React 18 with TypeScript
- Vite for fast development
- Auth0 for authentication
- Tailwind CSS for styling
- Recharts for data visualization
- Lucide React for icons

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`

## Auth0 Configuration

The app is configured to use Auth0 with the following settings:
- Domain: `dev-vsok4njdueqa22q1.us.auth0.com`
- Client ID: `mNYLi9yXfBgvaUwYBAeKa2Frsp6FsEHE`

## Project Structure

```
src/
├── auth/
│   └── auth0-config.ts      # Auth0 configuration
├── components/
│   ├── Dashboard.tsx        # Main dashboard with charts
│   ├── LoginButton.tsx      # Auth0 login component
│   ├── LogoutButton.tsx     # Auth0 logout component
│   ├── Patients.tsx         # Patient management page
│   ├── Profile.tsx          # User profile display
│   ├── ProfilePage.tsx      # Profile management page
│   ├── Settings.tsx         # Application settings
│   ├── Sidebar.tsx          # Navigation sidebar
│   └── StatCard.tsx         # Reusable stat card component
├── App.tsx                  # Main application component
├── main.tsx                 # Entry point with Auth0Provider
└── index.css               # Global styles with Tailwind
```

## Features Overview

### Dashboard
- Patient statistics with trend indicators
- Interactive charts for patient data
- Treatment distribution pie chart
- Weekly appointment tracking
- Recovery rate metrics

### Responsive Design
- Desktop: Sidebar navigation on the left
- Mobile: Collapsible top navigation
- Glassy theme with backdrop blur effects
- Grid pattern background

### Authentication Flow
1. User visits the app
2. Redirected to Auth0 Universal Login
3. After authentication, user sees the dashboard
4. Secure logout returns to login screen

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
