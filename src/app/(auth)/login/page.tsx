"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/leads");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-[#111]">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8 dark:bg-[#111] dark:border-[#222] dark:shadow-black/20">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl text-2xl font-bold mb-4 shadow-lg" style={{ backgroundColor: "#C6FE1E", color: "#0a0a0a", boxShadow: "0 4px 14px rgba(198, 254, 30, 0.25)" }}>
              D
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dodo CRM</h1>
            <p className="text-gray-500 mt-1 text-sm dark:text-neutral-400 font-sub">Sign in to manage your leads</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex items-center gap-2 dark:bg-red-950/50 dark:border-red-800 dark:text-red-400">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-neutral-300">Email</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vansh@dodopayments.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-neutral-300">Password</label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-[#222]">
            <p className="text-center text-xs text-gray-400 mb-2 dark:text-neutral-500">Demo credentials</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded-lg p-2.5 text-center dark:bg-[#1a1a1a]">
                <p className="font-medium text-gray-700 dark:text-neutral-300">Admin</p>
                <p className="text-gray-500 font-mono mt-0.5 dark:text-neutral-400">vansh@dodopayments.com</p>
                <p className="text-gray-400 font-mono dark:text-neutral-500">admin123</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5 text-center dark:bg-[#1a1a1a]">
                <p className="font-medium text-gray-700 dark:text-neutral-300">Member</p>
                <p className="text-gray-500 font-mono mt-0.5 dark:text-neutral-400">purrvi@dodopayments.com</p>
                <p className="text-gray-400 font-mono dark:text-neutral-500">member123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
