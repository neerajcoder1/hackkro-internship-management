import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-space-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-space-900 border border-rose-500/30 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-400 text-lg font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-white mb-2 tracking-tight">Access Restricted (403)</h2>
          <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
            Your current account role (<span className="text-brand-400 font-mono font-bold">{user.role}</span>) does not have authorization to view this area.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/"
              className="px-5 py-2 text-xs font-semibold bg-space-850 hover:bg-space-800 text-white rounded-lg border border-white/5 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
