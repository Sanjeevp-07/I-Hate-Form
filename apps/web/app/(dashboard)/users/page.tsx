"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Search, ShieldCheck, Mail, MapPin, Briefcase, ShieldAlert, ArrowLeft } from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  authProvider: string;
  role: string;
  applicationsCount: number;
  fieldsFilled: number;
  location: string;
  joinedAt: string;
  status: string;
}

export default function UsersDirectoryPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDenied, setIsDenied] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => {
        if (res.status === 403) {
          setIsDenied(true);
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUsers(data.users || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (isDenied) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 bg-amber-950/60 border border-amber-800/60 rounded-full flex items-center justify-center mx-auto text-amber-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white">Admin Access Restricted</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The Users & Members directory is restricted exclusively to the Master Administrator (<strong>sanjeev1803t@gmail.com</strong>).
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Overview
        </Link>
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.location.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const totalApplications = users.reduce((acc, u) => acc + (u.applicationsCount || 0), 0);
  const totalFields = users.reduce((acc, u) => acc + (u.fieldsFilled || 0), 0);

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">I Hate Form Users & Members</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950/70 border border-amber-800/50 text-amber-400 text-xs font-semibold">
              Admin Restricted • {users.length} Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Master Administrator directory of registered users and synchronization status.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, location..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Metrics Cards Skeleton / Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-xl animate-pulse space-y-2">
              <div className="h-3 bg-slate-800 rounded w-24"></div>
              <div className="h-6 bg-slate-800 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Total Registered Users</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{users.length}</div>
            <div className="text-[11px] text-emerald-400 mt-1">All verified accounts</div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Applications Tracked</span>
              <Briefcase className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{totalApplications}</div>
            <div className="text-[11px] text-slate-400 mt-1">Across Greenhouse, Workday & Lever</div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Form Inputs Auto-Filled</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{totalFields.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-400 mt-1">96.4% Deterministic Accuracy</div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-6 space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800"></div>
                  <div className="space-y-1.5">
                    <div className="h-3 bg-slate-800 rounded w-32"></div>
                    <div className="h-2.5 bg-slate-800 rounded w-48"></div>
                  </div>
                </div>
                <div className="h-4 bg-slate-800 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No users match "{search}"
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Auth Provider</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5 text-center">Applications</th>
                  <th className="px-5 py-3.5 text-center">Fields Filled</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{user.name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {user.authProvider === "google" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/40 text-[11px] font-medium">
                          <svg className="w-3 h-3" viewBox="0 0 24 24">
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
                          Google
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium">
                          <Mail className="w-3 h-3 text-slate-400" />
                          Email Auth
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">{user.role}</td>
                    <td className="px-5 py-3.5 text-slate-400">
                      <div className="flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{user.location}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-white">
                      {user.applicationsCount}
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono text-emerald-400 font-semibold">
                      {user.fieldsFilled}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[10px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
