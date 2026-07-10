"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Car,
  Home,
  Receipt,
  Users,
  LogOut,
  Settings,
} from "lucide-react";

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
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200 dark:border-slate-800">
        <div className="relative w-9 h-9 shrink-0">
          <Image src="/sascu-logo-ori.png" alt="SASCU" fill className="object-contain" priority />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold leading-tight">SASCU</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 truncate">Vehicle Rental System</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? "" : "text-gray-400 dark:text-slate-500"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
