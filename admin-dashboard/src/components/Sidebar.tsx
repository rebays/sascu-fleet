"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Car,
  Home,
  Receipt,
  Users,
  LogOut,
  Settings,
  ChevronsUpDown,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const menuItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/bookings", label: "Bookings", icon: Receipt },
  { href: "/vehicles", label: "Vehicles", icon: Car },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface CurrentUser {
  name?: string;
  email?: string;
  role?: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/login";
  };

  const displayName = user?.name || "Admin";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const roleLabel = user?.role === "superadmin" ? "Super Admin" : "Admin";

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
        <Popover open={profileOpen} onOpenChange={setProfileOpen}>
          <PopoverTrigger asChild>
            <button
              className={`flex items-center gap-3 px-2.5 py-2 rounded-lg w-full text-left transition-colors ${
                profileOpen
                  ? "bg-gray-100 dark:bg-slate-800"
                  : "hover:bg-gray-100 dark:hover:bg-slate-800"
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-semibold shrink-0 shadow-sm ring-2 ring-white dark:ring-slate-900">
                {initials || "A"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{roleLabel}</p>
              </div>
              <ChevronsUpDown className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" side="top" sideOffset={8} className="w-60 p-1.5">
            <div className="flex items-center gap-3 px-2.5 py-2 mb-1">
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {initials || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.email || roleLabel}</p>
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-slate-800 my-1" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md w-full text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Log out</span>
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
