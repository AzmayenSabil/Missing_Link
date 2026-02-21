import React from 'react';
import { CheckCircle, Loader2, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import type { ProjectStatus } from '../../types';

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; bg: string; border: string; text: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Pending',
    bg: '#94a3b810',
    border: '#94a3b833',
    text: '#94a3b8',
    icon: <Clock className="w-3 h-3" />,
  },
  ingesting: {
    label: 'Analyzing...',
    bg: '#00d4ff10',
    border: '#00d4ff33',
    text: '#00d4ff',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  refreshing: {
    label: 'Refreshing...',
    bg: '#ffd60010',
    border: '#ffd60033',
    text: '#ffd600',
    icon: <RefreshCw className="w-3 h-3 animate-spin" />,
  },
  ready: {
    label: 'Ready',
    bg: '#00ffa310',
    border: '#00ffa333',
    text: '#00ffa3',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  error: {
    label: 'Error',
    bg: '#ff446610',
    border: '#ff446633',
    text: '#ff4466',
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
