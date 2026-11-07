import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function NotificationBanner({ type = 'success', message, onDismiss }) {
  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border mb-6 flex items-start justify-between text-sm shadow-subtle transition-all ${
        isSuccess
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-rose-50 border-rose-200 text-rose-900'
      }`}
    >
      <div className="flex items-center space-x-3">
        {isSuccess ? (
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
        ) : (
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
        )}
        <span className="font-medium text-xs sm:text-sm leading-relaxed">{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-black/5 transition-colors"
          aria-label="Dismiss alert"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
