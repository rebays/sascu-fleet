"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;


      // Save token
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;

      toast.success(`Welcome back, ${user.name || "Admin"}!`);

      // Redirect to dashboard
      router.push("/");
    } catch (err: any) {
      const message = err.response?.data?.message || "Invalid credentials";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Image src="/sascu-logo-ori.png" alt="SASCU" fill className="object-contain" priority />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SASCU</h1>
          <p className="text-gray-600 mt-2">Vehicle Rental Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-gray-500"
              placeholder="admin@company.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-gray-600"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full py-3 text-lg font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
          <div className="text-center mt-4">
            <a href="/forgot-password" className="text-blue-600 hover:underline">
              Forgot password?
            </a>
          </div>
        </form>
      </Card>
    </div>
  );
}
