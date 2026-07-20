"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full px-0 md:px-6 pt-0 md:pt-4">
      <div className="bg-white/95 backdrop-blur-md border-0 md:border md:border-gray-200 md:rounded-lg shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-black"
          >
            <div
              aria-hidden="true"
              className="relative w-9 h-9 shrink-0 bg-primary"
              style={{
                maskImage: "url(/sascu-logo-ori.png)",
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskImage: "url(/sascu-logo-ori.png)",
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
              }}
            />
            <span className="text-primary">SASCU</span>
          </Link>

          {/* Navigation and Button */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/about"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/about") ? "text-black" : "text-gray-600"
              }`}
            >
              About
            </Link>
            <Link
              href="/vehicles"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/vehicles") ? "text-black" : "text-gray-600"
              }`}
            >
              Vehicles
            </Link>
            <Link
              href="/track-booking"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Track Booking
            </Link>
          </div>

          {/* Mobile CTA */}
          <Link
            href="/track-booking"
            className="md:hidden inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Track Booking
          </Link>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-gray-200 px-4 py-3 flex items-center justify-center gap-6">
          <Link
            href="/about"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/about") ? "text-black" : "text-gray-600"
            }`}
          >
            About
          </Link>
          <Link
            href="/vehicles"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/vehicles") ? "text-black" : "text-gray-600"
            }`}
          >
            Vehicles
          </Link>
        </nav>
      </div>
    </header>
  );
}
