'use client';
import { Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between print:hidden">
      <div className="flex items-center gap-3">
        <button className="lg:hidden text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold">
          Welcome back, Admin
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  );
}
