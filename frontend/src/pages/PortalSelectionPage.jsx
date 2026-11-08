import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import PortalSelection from '../components/PortalSelection.jsx';

export default function PortalSelectionPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-slate-50/50 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 font-sans">
      <div className="w-full">
        {/* Breadcrumb Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <nav className="flex items-center space-x-2 text-xs font-medium text-slate-500">
            <Link
              to="/"
              className="inline-flex items-center gap-1 hover:text-slate-800 transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-slate-400" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-800 font-semibold">Portal Selection</span>
          </nav>
        </div>

        {/* Portal Selection Component */}
        <PortalSelection />
      </div>
    </div>
  );
}
