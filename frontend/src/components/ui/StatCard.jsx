import React from 'react';

export default function StatCard({ label, value, subtext, icon: Icon, variant = 'blue' }) {
  const iconVariants = {
    blue: 'bg-blue-50 text-primary-600 border-blue-100',
    emerald: 'bg-emerald-50 text-success-700 border-emerald-100',
    amber: 'bg-amber-50 text-warning-600 border-amber-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  const iconStyle = iconVariants[variant] || iconVariants.blue;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-card hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm font-medium text-slate-500">
          {label}
        </span>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${iconStyle}`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline">
        <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {value}
        </span>
      </div>

      {subtext && (
        <p className="mt-1.5 text-xs text-slate-500">
          {subtext}
        </p>
      )}
    </div>
  );
}
