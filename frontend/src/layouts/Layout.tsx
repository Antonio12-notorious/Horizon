import React from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { MobileNav } from "../components/MobileNav";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar: visível apenas em desktop (lg+) */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main
          className="flex-1 bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300
                     pb-16 lg:pb-0"
        >
          {/* pb-16 reserva espaço para a bottom nav em mobile */}
          {children}
        </main>
      </div>

      {/* Bottom Navigation: visível apenas em mobile (< lg) */}
      <MobileNav />
    </div>
  );
}
