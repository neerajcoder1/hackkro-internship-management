import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowRight, LogOut, Bell } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-all shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <img
            src="https://res.cloudinary.com/payb7fsq/image/upload/v1791981789/Hack_Kro_Logo.png"
            alt="HackKro Logo"
            className="h-8 w-auto object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div
            style={{ display: 'none' }}
            className="w-8 h-8 rounded-lg bg-blue-600 items-center justify-center text-white font-extrabold text-sm"
          >
            HK
          </div>
          <div className="border-l border-slate-200 pl-3">
            <span className="text-sm font-bold text-slate-900 block leading-tight">
              HackKro
            </span>
            <span className="text-[11px] font-medium text-slate-500 block leading-tight">
              Internship Management System
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center space-x-2 sm:space-x-3">
          <Link
            to="/"
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isActive('/')
                ? 'text-blue-600 bg-blue-50 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Overview
          </Link>

          <Link
            to="/portals"
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isActive('/portals')
                ? 'text-blue-600 bg-blue-50 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Portals
          </Link>

          {isAuthenticated ? (
            <>
              {/* Intern Workspace */}
              <Link
                to="/intern"
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/intern')
                    ? 'text-blue-600 bg-blue-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Intern Dashboard
              </Link>

              {/* Admin Portal (Strictly hidden from Interns) */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/admin')
                      ? 'text-blue-600 bg-blue-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Admin Dashboard
                </Link>
              )}

              {/* User Profile */}
              <div className="flex items-center space-x-3 pl-3 ml-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-slate-900 leading-none">{user.name}</p>
                  <span
                    className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full mt-1 border ${
                      isAdmin
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-3 pl-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Register</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
