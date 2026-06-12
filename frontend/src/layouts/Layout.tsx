import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
