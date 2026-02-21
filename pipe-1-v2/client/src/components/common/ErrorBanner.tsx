import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl px-4 py-3"
      style={{ background: '#1a0a10', border: '1px solid #ff446633' }}
    >
      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ff4466' }} />
      <p className="text-sm text-slate-300 flex-1">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 transition-colors"
          style={{ color: '#ff446666' }}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
