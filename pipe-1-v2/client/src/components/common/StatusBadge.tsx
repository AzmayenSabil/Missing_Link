import React from 'react';
import { CheckCircle, Loader2, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import type { ProjectStatus } from '../../types';

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Pending',
    color: 'bg-gray-100 text-gray-500',
    icon: <Clock className="w-3 h-3" />,
  },
  ingesting: {
    label: 'Analyzing...',
    color: 'bg-blue-100 text-blue-700',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  refreshing: {
    label: 'Refreshing...',
    color: 'bg-amber-100 text-amber-700',
    icon: <RefreshCw className="w-3 h-3 animate-spin" />,
  },
  ready: {
    label: 'Ready',
    color: 'bg-green-100 text-green-700',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  error: {
    label: 'Error',
    color: 'bg-red-100 text-red-600',
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
