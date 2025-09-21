import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import LoginButton from './components/LoginButton';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import ProfilePage from './components/ProfilePage';
import Settings from './components/Settings';
import { useApiService, User } from './services/api';

function App() {
  const { isLoading, error, isAuthenticated, user } = useAuth0();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const apiService = useApiService();

  // Auto-setup user account after Auth0 login
  useEffect(() => {
    const setupUser = async () => {
      if (isAuthenticated && user && !currentUser && !userLoading) {
        setUserLoading(true);
        try {
          const userData = await apiService.createUserIfNeeded();
          setCurrentUser(userData);
        } catch (error) {
          console.error('Failed to setup user:', error);
        } finally {
          setUserLoading(false);
        }
      }
    };

    setupUser();
  }, [isAuthenticated, user, currentUser, userLoading, apiService]);

  if (isLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/15 via-blue-300/8 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-violet-400/15 via-purple-300/8 to-transparent rounded-full blur-3xl"></div>
        <div className="glass-card p-8 text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isLoading ? 'Authenticating...' : 'Setting up your account...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/15 via-blue-300/8 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-violet-400/15 via-purple-300/8 to-transparent rounded-full blur-3xl"></div>
        <div className="glass-card p-8 text-center relative z-10">
          <p className="text-red-600 mb-4">Authentication Error</p>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginButton />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'patients':
        return <Patients />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      {/* Blue hues top-left */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 via-blue-300/5 to-transparent rounded-full blur-3xl"></div>
      {/* Violet hues bottom-right */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-violet-400/10 via-purple-300/5 to-transparent rounded-full blur-3xl"></div>
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-20"></div>
      
      <div className="flex relative z-10 overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 p-2 lg:p-2 min-w-0 pt-20 lg:pt-4">
          <div className="max-w-7xl mx-auto">
            {renderCurrentPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;