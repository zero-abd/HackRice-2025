import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import ProfilePage from './components/ProfilePage';
import Settings from './components/Settings';
import Welcome from './components/Welcome';
import * as db from './services/db';
import type { Profile } from './types/patient';

const Backdrop = () => (
  <>
    <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 via-blue-300/5 to-transparent rounded-full blur-3xl"></div>
    <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-violet-400/10 via-purple-300/5 to-transparent rounded-full blur-3xl"></div>
    <div className="absolute inset-0 grid-pattern opacity-20"></div>
  </>
);

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    db.getProfile()
      .then((p) => setProfile(p ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not open local storage.'));
  }, []);

  const saveProfile = async (p: Profile) => {
    setProfile(await db.saveProfile(p));
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <p className="text-red-600 mb-2 font-medium">DocLess could not open its local database</p>
          <p className="text-gray-600 text-sm">{error} Private browsing modes sometimes block IndexedDB.</p>
        </div>
      </div>
    );
  }

  if (profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (profile === null) {
    return <Welcome onCreate={saveProfile} />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'patients':
        return <Patients />;
      case 'profile':
        return <ProfilePage profile={profile} onSave={saveProfile} />;
      case 'settings':
        return (
          <Settings
            onDataCleared={() => {
              setCurrentPage('dashboard');
              setProfile(null);
            }}
          />
        );
      default:
        return <Dashboard profile={profile} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      <Backdrop />
      <div className="flex relative z-10 overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          profile={profile}
        />
        <main className="flex-1 p-3 sm:p-4 min-w-0 pt-20 lg:pt-4">
          <div className="max-w-7xl mx-auto">{renderCurrentPage()}</div>
        </main>
      </div>
    </div>
  );
}

export default App;
