
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { MapsView } from './views/MapsView';
import { LoginView } from './views/LoginView';
import { ViewType } from './types';

interface User {
  email: string;
  name: string;
  role: string;
  jabatan: string;
  area: string;
  picture?: string;
}

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<ViewType>(ViewType.DASHBOARD);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLogin = () => {
    checkSession();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setIsLoggedIn(false);
      setUser(null);
      setActiveView(ViewType.DASHBOARD);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (activeView) {
      case ViewType.DASHBOARD:
        return <DashboardView />;
      case ViewType.MAPS:
        return <MapsView />;
      case ViewType.ENGAGEMENT:
      case ViewType.GRIEVANCE:
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-white/50 backdrop-blur-sm rounded-3xl border border-white/40 text-gray-500">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Under Construction</h2>
            <p className="text-slate-500">This module is currently being developed.</p>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <h2 className="text-2xl font-semibold mb-2">{activeView} Section</h2>
            <p>This module is currently being populated with community data.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc]">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        onLogout={handleLogout}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          userName={user?.name || 'User'} 
          userRole={user?.jabatan || user?.role || 'Jabatan'} 
          userPicture={user?.picture}
        />
        
        <div className="flex-1 overflow-hidden bg-gradient-to-br from-[#e2f3f1] via-[#f3f4f6] to-[#f5f3ff]">
          {/* Container full tanpa margin/padding berlebih untuk view Maps */}
          <div className={activeView === ViewType.MAPS ? "h-full w-full" : "max-w-7xl mx-auto p-8"}>
            {activeView !== ViewType.MAPS && (
              <div className="mb-6">
                <span className="text-teal-600 font-medium">Welcome back, {user?.name?.split(' ')[0]} 👋</span>
                <h1 className="text-4xl font-bold text-slate-800 mt-1">{activeView}</h1>
              </div>
            )}
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
