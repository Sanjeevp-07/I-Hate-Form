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
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white p-4 flex flex-col justify-between shrink-0 shadow-sm">
        <div>
          <Link href="/" className="flex items-center gap-2.5 px-3 py-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0066FF] border border-blue-200">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900">I Hate Form</span>
          </Link>

          {/* User Nav */}
          <nav className="mt-6 space-y-1">
            <div className="px-3 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
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
                      ? "bg-blue-50 text-[#0066FF] font-semibold border border-blue-200 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#0066FF]" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Admin Nav (Strictly for sanjeev1803t@gmail.com) */}
          {currentUser?.isAdmin && (
            <div className="mt-6 space-y-1 pt-4 border-t border-slate-200">
              <div className="px-3 pb-1.5 text-[10px] font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-amber-500" />
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
                        ? "bg-amber-50 text-amber-800 font-semibold border border-amber-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-amber-600" : "text-slate-400"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {currentUser ? (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-800">
                <span className="font-medium truncate">{currentUser.name || currentUser.email}</span>
                {currentUser.isAdmin ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    ADMIN
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 mt-1 bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-center">
              <p className="text-slate-500 text-[11px]">Sync with Chrome Extension</p>
              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 py-1.5 bg-[#0066FF] hover:bg-blue-700 text-white rounded-lg text-[11px] font-medium transition shadow-sm"
              >
                <LogIn className="w-3 h-3" />
                Sign In / Sign Up
              </Link>
            </div>
          )}

          <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] flex items-center justify-between text-slate-600">
            <span>Extension Bridge</span>
            <span className="text-emerald-600 font-semibold">Ready</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-200 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md">
          <div className="text-xs text-slate-500 font-medium">I Hate Form / Student & Applicant Workspace</div>
          <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Cloud Sync Active</span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
