import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Layout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Check local storage or system preference
    if (localStorage.getItem('theme') === 'dark') return true;
    return false;
  });

  const location = useLocation();

  // Handle Dark Mode Side Effects
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = async () => {
      try {
          await logout();
      } catch (error) {
          console.error("Logout failed", error);
      }
  };

  // Dynamic Title based on Route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/prepare': return 'Nouvelle Préparation';
      case '/patients': return 'Base de Données Patients';
      case '/protocols': return 'Protocoles & Molécules';
      case '/planning': return 'Planning Opérationnel';
      case '/stats': return 'Statistiques de Production';
      default: return 'Tableau de bord';
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex justify-between items-center transition-colors duration-300">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white transition-colors">
            {getPageTitle()}
          </h2>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span>{currentUser?.email || 'Connecté'}</span>
            </div>

            {/* Custom Toggle Switch for Theme */}
            <label className="relative inline-flex items-center cursor-pointer w-[50px] h-[26px]">
              <input 
                type="checkbox" 
                checked={isDark} 
                onChange={toggleTheme} 
                className="sr-only peer" 
              />
              <div className="w-full h-full bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[20px] after:w-[20px] after:transition-all dark:border-gray-600 peer-checked:bg-sky-600"></div>
              
              <div className="absolute left-[6px] top-[5px] text-amber-500 text-[10px] opacity-100 peer-checked:opacity-0 transition-opacity">
                 <Sun size={10} fill="currentColor" />
              </div>
              <div className="absolute right-[6px] top-[5px] text-white text-[10px] opacity-0 peer-checked:opacity-100 transition-opacity">
                 <Moon size={10} fill="currentColor" />
              </div>
            </label>
          </div>
        </header>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1600px] mx-auto animate-[fadeIn_0.4s_ease-out]">
                <Outlet />
            </div>
        </div>
      </main>
    </div>
  );
};