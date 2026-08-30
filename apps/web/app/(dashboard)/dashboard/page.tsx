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
    <div className="max-w-6xl space-y-6 text-slate-900">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">I Hate Form Overview</h1>
        <p className="text-xs text-slate-500 mt-1">Track your active applications, field mapping statistics, and AI token utilization.</p>
      </div>

      {/* Metrics Row */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2 animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-20"></div>
              <div className="h-7 bg-slate-200 rounded w-16"></div>
              <div className="h-2.5 bg-slate-200 rounded w-28"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Applications</span>
              <Briefcase className="w-4 h-4 text-[#0066FF]" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats.applications}</div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1">+3 this week</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Fields Auto-filled</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats.fieldsFilled}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-1">96.4% accuracy</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Time Saved</span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats.timeSaved}</div>
            <div className="text-[11px] font-semibold text-purple-600 mt-1">~18 min / form</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">AI Routing Engine</span>
              <Sparkles className="w-4 h-4 text-pink-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 mt-2 truncate">NVIDIA NIM</div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1">{stats.aiTier}</div>
          </div>
        </div>
      )}

      {/* Recent Applications Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Recent Autofill Sessions</h2>
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="h-4 bg-slate-200 rounded w-48"></div>
                <div className="h-4 bg-slate-200 rounded w-24"></div>
                <div className="h-4 bg-slate-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 text-slate-500 pb-2 font-semibold">
                <tr>
                  <th className="py-2.5 font-bold">Domain / Company</th>
                  <th className="py-2.5 font-bold">Job Title</th>
                  <th className="py-2.5 font-bold">Fields</th>
                  <th className="py-2.5 font-bold">Status</th>
                  <th className="py-2.5 font-bold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3.5 font-bold text-slate-900">greenhouse.io (Stripe)</td>
                  <td className="py-3.5 text-slate-700">Software Engineering Intern</td>
                  <td className="py-3.5 text-slate-500">18 / 18 filled</td>
                  <td className="py-3.5"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Ready</span></td>
                  <td className="py-3.5 text-slate-400">Today</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-bold text-slate-900">myworkdayjobs.com (Adobe)</td>
                  <td className="py-3.5 text-slate-700">Frontend Engineering Intern</td>
                  <td className="py-3.5 text-slate-500">22 / 24 filled</td>
                  <td className="py-3.5"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Review</span></td>
                  <td className="py-3.5 text-slate-400">Yesterday</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
