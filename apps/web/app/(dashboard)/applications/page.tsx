"use client";

import React, { useState, useEffect } from "react";
import { ExternalLink, Filter } from "lucide-react";

export default function ApplicationsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-6xl space-y-6 text-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Application Tracker</h1>
          <p className="text-xs text-slate-500 mt-1">Audit log of all autofilled and submitted internship applications.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-xs">
            <Filter className="w-3.5 h-3.5 text-[#0066FF]" />
            Filter
          </button>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="h-4 bg-slate-200 rounded w-48"></div>
                <div className="h-4 bg-slate-200 rounded w-28"></div>
                <div className="h-4 bg-slate-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 text-slate-500 pb-2">
              <tr>
                <th className="py-2.5 font-bold">Company & Role</th>
                <th className="py-2.5 font-bold">Domain</th>
                <th className="py-2.5 font-bold">Status</th>
                <th className="py-2.5 font-bold">Fields Mapped</th>
                <th className="py-2.5 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3.5 font-bold text-slate-900">Stripe — Software Engineering Intern</td>
                <td className="py-3.5 text-slate-500">boards.greenhouse.io</td>
                <td className="py-3.5"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-[#0066FF] border border-blue-200">Applied</span></td>
                <td className="py-3.5 text-slate-500">18 fields (100% rule/AI verified)</td>
                <td className="py-3.5"><ExternalLink className="w-4 h-4 text-slate-400 hover:text-[#0066FF] cursor-pointer" /></td>
              </tr>
              <tr>
                <td className="py-3.5 font-bold text-slate-900">Jakson Group — Full Stack Engineer</td>
                <td className="py-3.5 text-slate-500">careers.jakson.com</td>
                <td className="py-3.5"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Autofilled</span></td>
                <td className="py-3.5 text-slate-500">12 fields (100% accurate)</td>
                <td className="py-3.5"><ExternalLink className="w-4 h-4 text-slate-400 hover:text-[#0066FF] cursor-pointer" /></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
