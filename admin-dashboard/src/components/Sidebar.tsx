"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  FileText,
  Home,
  Receipt,
  Users,
  BarChart3,
  LogOut,
  Settings,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const menuItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/bookings", label: "Bookings", icon: Receipt },
  { href: "/vehicles", label: "Vehicles", icon: Car },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="w-64 bg-white dark:bg-slate-900 text-gray-900 dark:text-white flex flex-col print:hidden border-r border-gray-200 dark:border-slate-800">
      <div className="p-6 border-b border-gray-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SASCU</h1>
        <p className="text-sm text-gray-600 dark:text-slate-400">Vehicle Rental System</p>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}