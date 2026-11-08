import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import PortalSelectionPage from './pages/PortalSelectionPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import InternPortal from './pages/InternPortal.jsx';
import AdminPortal from './pages/AdminPortal.jsx';

function AppContent() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/intern') || location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 font-sans">
      {!isDashboard && <Navbar />}

      <main className="flex-1 flex flex-col min-w-0">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/portals" element={<PortalSelectionPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Intern Workspace */}
          <Route
            path="/intern"
            element={
              <ProtectedRoute allowedRoles={['intern', 'admin']}>
                <InternPortal />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPortal />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isDashboard && (
        <footer className="border-t border-slate-200 bg-white py-5 px-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-slate-600">
              <span className="font-semibold text-slate-900">HackKro Internship Management System</span>
              <span>•</span>
              <span className="font-mono text-[11px] text-blue-600 font-bold">Enterprise SaaS</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Official Platform:{' '}
              <a
                href="https://www.hackkro.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
              >
                hackkro.com
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
