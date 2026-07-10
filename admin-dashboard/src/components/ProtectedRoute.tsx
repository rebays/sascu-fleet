'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This only runs in the browser
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');

    let role: string | undefined;
    try {
      role = userRaw ? JSON.parse(userRaw).role : undefined;
    } catch {
      role = undefined;
    }

    if (!token) {
      router.push('/login');
    } else if (role === 'admin') {
      setIsAuthenticated(true);
    } else {
      // Token belongs to a non-admin (or malformed) session — never
      // render the dashboard for it, bounce back to login instead.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.error('User not found');
      router.push('/login');
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-2xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect soon
  }

  return <>{children}</>;
}