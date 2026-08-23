"use client";

import React, { useState, useEffect } from "react";
import { Briefcase, CheckCircle2, Clock, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    applications: 14,
    fieldsFilled: 182,
    timeSaved: "4.2 hrs",
    aiTier: "NVIDIA Llama-3.1 70B",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">I Hate Form Overview</h1>
        <p className="text-xs text-slate-400 mt-1">Track your active applications, field mapping statistics, and AI token utilization.</p>
      </div>

      {/* Metrics Row */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 animate-pulse">
              <div className="h-3 bg-slate-800 rounded w-20"></div>
              <div className="h-7 bg-slate-800 rounded w-16"></div>
              <div className="h-2.5 bg-slate-800 rounded w-28"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs">Applications</span>
              <Briefcase className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{stats.applications}</div>
            <div className="text-[11px] text-emerald-400 mt-1">+3 this week</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs">Fields Auto-filled</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{stats.fieldsFilled}</div>
            <div className="text-[11px] text-slate-400 mt-1">96.4% accuracy</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs">Time Saved</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{stats.timeSaved}</div>
            <div className="text-[11px] text-purple-400 mt-1">~18 min / form</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs">AI Routing Engine</span>
              <Sparkles className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-lg font-bold text-white mt-2 truncate">NVIDIA NIM</div>
            <div className="text-[11px] text-emerald-400 mt-1">{stats.aiTier}</div>
          </div>
        </div>
      )}

      {/* Recent Applications Table */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <h2 className="text-sm font-semibold text-white mb-4">Recent Autofill Sessions</h2>
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <div className="h-4 bg-slate-800 rounded w-48"></div>
                <div className="h-4 bg-slate-800 rounded w-24"></div>
                <div className="h-4 bg-slate-800 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-slate-400 pb-2">
                <tr>
                  <th className="py-2 font-medium">Domain / Company</th>
                  <th className="py-2 font-medium">Job Title</th>
                  <th className="py-2 font-medium">Fields</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-3 font-medium text-white">greenhouse.io (Stripe)</td>
                  <td className="py-3 text-slate-300">Software Engineering Intern</td>
                  <td className="py-3 text-slate-400">18 / 18 filled</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">Ready</span></td>
                  <td className="py-3 text-slate-500">Today</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">myworkdayjobs.com (Adobe)</td>
                  <td className="py-3 text-slate-300">Frontend Engineering Intern</td>
                  <td className="py-3 text-slate-400">22 / 24 filled</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded text-[10px] bg-amber-950/60 text-amber-400 border border-amber-800/40">Review</span></td>
                  <td className="py-3 text-slate-500">Yesterday</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
