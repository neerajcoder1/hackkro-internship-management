import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Hourglass, 
  Calendar, 
  Zap, 
  XCircle 
} from 'lucide-react';

const statusConfig = {
  pending: {
    label: 'Pending',
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Clock,
  },
  'in-progress': {
    label: 'In Progress',
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Clock,
  },
  submitted: {
    label: 'Under Review',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Hourglass,
  },
  approved: {
    label: 'Approved',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  completed: {
    label: 'Completed',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Needs Revision',
    classes: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
  },
  overdue: {
    label: 'Overdue',
    classes: 'bg-red-50 text-red-700 border-red-200',
    icon: AlertCircle,
  },
  daily: {
    label: 'Daily Task',
    classes: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: Zap,
  },
  weekly: {
    label: 'Weekly Milestone',
    classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: Calendar,
  },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const normalized = (status || '').toLowerCase();
  const config = statusConfig[normalized] || {
    label: status || 'Unknown',
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Clock,
  };

  const IconComponent = config.icon;

  const sizeClasses =
    size === 'xs'
      ? 'text-xs px-2 py-0.5'
      : size === 'md'
      ? 'text-sm px-3 py-1'
      : 'text-xs px-2.5 py-1';

  const iconSizes = size === 'xs' ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-subtle ${sizeClasses} ${config.classes}`}
    >
      <IconComponent size={iconSizes} className="shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}
