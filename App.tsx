import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Preparation } from './components/Preparation';
import { PatientDatabase } from './components/PatientDatabase';
import { Dashboard } from './components/Dashboard';
import { Protocols } from './components/Protocols';
import { Planning } from './components/Planning';
import { ProductionStats } from './components/ProductionStats'; // Import Stats
import { PlanningProvider } from './contexts/PlanningContext';

const Login = ({ onLogin }: { onLogin: () => void }) => (
  <div className="flex items-center justify-center h-screen bg-slate-900 p-4">
    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center">
        <div className="w-16 h-16 bg-sky-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
             <span className="font-bold text-2xl">GP</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-6">GalePedia <span className="text-sky-600">Pro</span></h2>
        <button 
            onClick={onLogin}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
        >
            Simulate Login
        </button>
    </div>
  </div>
);

function App() {
  const [user, setUser] = useState<{ email: string } | null>(null);

  const handleLogin = () => {
    setUser({ email: 'demo@galepedia.com' });
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <PlanningProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          
          {/* Protected Routes */}
          {user ? (
            <Route element={<Layout userEmail={user.email} onLogout={handleLogout} />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stats" element={<ProductionStats />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/prepare" element={<Preparation />} />
              <Route path="/patients" element={<PatientDatabase />} />
              <Route path="/protocols" element={<Protocols />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}
        </Routes>
      </HashRouter>
    </PlanningProvider>
  );
}

export default App;