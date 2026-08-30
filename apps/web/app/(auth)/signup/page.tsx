"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Mail, User, ArrowRight, AlertCircle, RefreshCw, ShieldCheck, ExternalLink } from "lucide-react";
import { signInWithGoogle, signUpWithEmail } from "@/lib/firebase";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigError, setIsConfigError] = useState(false);

  const getFirebaseErrorMessage = (err: any): string => {
    const code = err?.code || "";
    if (code === "auth/configuration-not-found" || code === "auth/operation-not-allowed") {
      setIsConfigError(true);
      return "Firebase Authentication is not activated in your Firebase Console yet. Please enable Google / Email under Authentication > Sign-in method.";
    }
    if (code === "auth/email-already-in-use") {
      return "An account with this email already exists. Please sign in instead.";
    }
    if (code === "auth/weak-password") {
      return "Password is too weak. Please use at least 6 characters.";
    }
    if (code === "auth/invalid-email") {
      return "Please enter a valid email address.";
    }
    if (code === "auth/popup-closed-by-user") {
      return "Google sign-in popup was closed before completing.";
    }
    if (code === "auth/cancelled-popup-request") {
      return "Google sign-in was cancelled.";
    }
    return err?.message || "Failed to create account. Please try again.";
  };

  const handleAdminDirectLogin = async () => {
    setAdminLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: "admin_sanjeev1803t",
          email: "sanjeev1803t@gmail.com",
          displayName: "Sanjeev Kumar (Admin)",
        }),
      });

      if (res.ok) {
        router.push("/profile");
        router.refresh();
      } else {
        setError("Failed to initialize admin session.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsConfigError(false);

    try {
      await signUpWithEmail(email, password, name);
      router.push("/profile");
      router.refresh();
    } catch (err: any) {
      console.warn("Firebase Signup fallback:", err);
      // Fallback to local signup route if needed
      try {
        const localRes = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (localRes.ok) {
          router.push("/profile");
          router.refresh();
          return;
        }
      } catch {
        // ignore fallback error
      }
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    setIsConfigError(false);

    try {
      await signInWithGoogle();
      router.push("/profile");
      router.refresh();
    } catch (err: any) {
      console.warn("Firebase Google Auth:", err);
      setError(getFirebaseErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center p-3.5 bg-blue-50 text-[#0066FF] rounded-2xl border border-blue-200 mb-2 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-500 font-medium">Join I Hate Form & autofill job applications in seconds</p>
        </div>

        {/* Card */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-5">
          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading || adminLoading}
            type="button"
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{googleLoading ? "Connecting Google Auth..." : "Sign Up with Google"}</span>
          </button>

          {/* Quick Admin Access Button */}
          <button
            onClick={handleAdminDirectLogin}
            disabled={adminLoading || googleLoading || loading}
            type="button"
            className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {adminLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>Sign In as Admin (sanjeev1803t@gmail.com)</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">or email</span>
            <div className="border-t border-slate-200 w-full"></div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="font-medium">{error}</span>
              </div>
              {isConfigError && (
                <div className="pt-2 border-t border-rose-200 text-[11px] text-rose-700">
                  <p className="mb-1 font-semibold">How to enable Firebase Authentication:</p>
                  <ol className="list-decimal pl-4 space-y-0.5 text-rose-800">
                    <li>Go to <a href="https://console.firebase.google.com/project/i-hate-form/authentication/providers" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1 font-semibold text-[#0066FF]">Firebase Console <ExternalLink className="w-2.5 h-2.5" /></a></li>
                    <li>Click <strong>Get Started</strong> in Authentication</li>
                    <li>Enable <strong>Google</strong> and <strong>Email/Password</strong> providers</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sanjeev Kumar"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#0066FF] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sanjeev1803t@gmail.com"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#0066FF] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Password (min. 6 characters)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#0066FF] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading || adminLoading}
              className="w-full py-3 px-4 bg-[#0066FF] hover:bg-[#0052CC] active:scale-98 text-white rounded-full font-bold transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-xs"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? "Creating account..." : "Sign Up & Set Up Profile"}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-[#0066FF] hover:underline font-bold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
