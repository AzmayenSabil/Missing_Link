import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClass = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <Loader2 className={`${sizeClass} animate-spin text-indigo-500`} />
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
