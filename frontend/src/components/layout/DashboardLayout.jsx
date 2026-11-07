import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  Bell,
} from 'lucide-react';

export default function DashboardLayout({ 
  navItems = [], 
  activeTab, 
  onSelectTab, 
  onTabChange,
  title, 
  subtitle, 
  actions, 
  children 
}) {
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelectTab = onSelectTab || onTabChange;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen sticky top-0 shrink-0 select-none z-30 justify-between">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center border-b border-slate-200">
            <Link to="/" className="flex items-center space-x-2.5">
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
                className="w-8 h-8 rounded-lg bg-blue-600 items-center justify-center text-white font-extrabold text-xs"
              >
                HK
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight">
                HackKro
              </span>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              const count = item.count !== undefined ? item.count : item.badge;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (handleSelectTab) handleSelectTab(item.id);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={18} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>

                  {count !== undefined && count !== null && count > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                        item.isAlert
                          ? 'bg-amber-100 text-amber-800 font-bold'
                          : isSelected
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Settings & Sign Out */}
        <div className="p-3 border-t border-slate-200 bg-white space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut size={18} className="text-slate-400 group-hover:text-rose-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER & DRAWER */}
      <div className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="h-16 px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="https://res.cloudinary.com/payb7fsq/image/upload/v1791981789/Hack_Kro_Logo.png"
              alt="HackKro Logo"
              className="h-7 w-auto object-contain"
            />
            <span className="text-base font-bold text-slate-900">HackKro</span>
          </Link>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="px-4 py-4 border-t border-slate-100 bg-white space-y-1 shadow-lg">
            <div className="pb-3 mb-2 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                <span className="text-xs text-slate-500 capitalize">{user?.role} Workspace</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-600 font-semibold px-2 py-1 rounded bg-rose-50 border border-rose-100 cursor-pointer"
              >
                Sign Out
              </button>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              const count = item.count !== undefined ? item.count : item.badge;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (handleSelectTab) handleSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={18} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>
                  {count !== undefined && count !== null && count > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 px-8 items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-slate-500 hover:text-slate-900">
              Home
            </Link>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-900">
              {isAdmin ? 'Admin Dashboard' : 'Intern Dashboard'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {actions}

            {/* Notification Bell */}
            <div className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
              <Bell size={18} />
            </div>

            {/* User Avatar Circle */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-xs font-semibold text-slate-800">
                {user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
