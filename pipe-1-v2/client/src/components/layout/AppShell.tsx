import React from 'react';
import Header from './Header';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col cyber-bg">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
