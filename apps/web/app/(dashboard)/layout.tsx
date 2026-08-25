"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { User, FileText, Briefcase, LayoutDashboard, Sparkles, LogOut, LogIn, Users, Database, ShieldAlert } from "lucide-react";
import { logoutUser } from "@/lib/firebase";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string | null; isAdmin?: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          const isAdmin = data.user.isAdmin ?? (data.user.email?.toLowerCase().trim() === "sanjeev1803t@gmail.com");
          setCurrentUser({ ...data.user, isAdmin });
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/profile", label: "Profile & Autofill Data", icon: User },
    { href: "/applications", label: "Applications", icon: Briefcase },
    { href: "/resumes", label: "Resumes & Docs", icon: FileText },
  ];

  const adminNavItems = [
    { href: "/users", label: "Users & Members", icon: Users },
    { href: "/database", label: "Database Inspector", icon: Database },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between shrink-0">
        <div>
          <Link href="/" className="flex items-center gap-2.5 px-3 py-2">
            <div className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">I Hate Form</span>
          </Link>

          {/* User Nav */}
          <nav className="mt-6 space-y-1">
            <div className="px-3 pb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Applicant Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Admin Nav (Strictly for sanjeev1803t@gmail.com) */}
          {currentUser?.isAdmin && (
            <div className="mt-6 space-y-1 pt-4 border-t border-slate-800/80">
              <div className="px-3 pb-1.5 text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                <span>Admin Restricted</span>
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? "bg-amber-950/40 text-amber-300 border border-amber-700/50"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {currentUser ? (
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-medium truncate">{currentUser.name || currentUser.email}</span>
                {currentUser.isAdmin ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/60">
                    ADMIN
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 mt-1 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 border border-slate-700 text-slate-300 rounded-lg text-[11px] transition cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2 text-center">
              <p className="text-slate-400 text-[11px]">Sync with Chrome Extension</p>
              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-medium transition"
              >
                <LogIn className="w-3 h-3" />
                Sign In / Sign Up
              </Link>
            </div>
          )}

          <div className="px-3 py-2 bg-slate-900/60 rounded-lg border border-slate-800/80 text-[11px] flex items-center justify-between text-slate-400">
            <span>Extension Bridge</span>
            <span className="text-emerald-400 font-medium">Ready</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/20">
          <div className="text-xs text-slate-400">I Hate Form / Student & Applicant Workspace</div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Cloud Sync Active</span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
