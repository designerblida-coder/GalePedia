import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  FlaskConical, 
  Users, 
  BookOpen, 
  LogOut, 
  Pill,
  CalendarDays,
  BarChart3 
} from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const getLinkClass = ({ isActive }: { isActive: boolean }) => 
    `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
      isActive 
        ? 'bg-slate-100 text-sky-600 border-r-4 border-sky-600 dark:bg-slate-800 dark:text-sky-400 dark:border-sky-400' 
        : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
    }`;

  return (
    <nav className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col no-print transition-colors duration-300 h-full">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-sky-600/20">
            <Pill className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight dark:text-white">
            Gale<span className="text-sky-600">Pedia</span>
          </span>
        </div>
        
        <div className="space-y-1">
          <NavLink to="/" className={getLinkClass}>
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/stats" className={getLinkClass}>
            <BarChart3 className="w-5 h-5" />
            <span>Stats Production</span>
          </NavLink>

          <NavLink to="/planning" className={getLinkClass}>
            <CalendarDays className="w-5 h-5" />
            <span>Planning</span>
          </NavLink>
          
          <NavLink to="/prepare" className={getLinkClass}>
            <FlaskConical className="w-5 h-5" />
            <span>Préparation</span>
          </NavLink>
          
          <NavLink to="/patients" className={getLinkClass}>
            <Users className="w-5 h-5" />
            <span>Base Patients</span>
          </NavLink>
          
          <NavLink to="/protocols" className={getLinkClass}>
            <BookOpen className="w-5 h-5" />
            <span>Protocoles</span>
          </NavLink>
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-slate-100 dark:border-slate-800">
        <button 
          onClick={onLogout} 
          className="w-full text-slate-400 hover:text-red-500 text-xs font-bold flex items-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </nav>
  );
};