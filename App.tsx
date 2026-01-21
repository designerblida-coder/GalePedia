import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Preparation } from './components/Preparation';
import { PatientDatabase } from './components/PatientDatabase';
import { Dashboard } from './components/Dashboard';
import { Protocols } from './components/Protocols';
import { Planning } from './components/Planning';
import { ProductionStats } from './components/ProductionStats';
import { Login } from './components/Login';
import { PlanningProvider } from './contexts/PlanningContext';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Public Route Wrapper (redirects to dashboard if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  if (currentUser) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <PlanningProvider>
          <HashRouter>
            <Routes>
              {/* Login Route (Public but redirects if logged in) */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/stats" element={<ProductionStats />} />
                <Route path="/planning" element={<Planning />} />
                <Route path="/prepare" element={<Preparation />} />
                <Route path="/patients" element={<PatientDatabase />} />
                <Route path="/protocols" element={<Protocols />} />
              </Route>
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </HashRouter>
        </PlanningProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;