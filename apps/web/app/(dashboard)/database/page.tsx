"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Database, FileCode, RefreshCw, HardDrive, Terminal, Copy, Check, ShieldAlert, ArrowLeft } from "lucide-react";

export default function DatabaseViewerPage() {
  const [dbData, setDbData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isDenied, setIsDenied] = useState(false);

  const fetchDatabase = () => {
    setLoading(true);
    fetch("/api/database")
      .then((res) => {
        if (res.status === 403) {
          setIsDenied(true);
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setDbData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDatabase();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isDenied) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 bg-amber-950/60 border border-amber-800/60 rounded-full flex items-center justify-center mx-auto text-amber-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white">Admin Access Restricted</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The Database & Storage Inspector is restricted exclusively to the Master Administrator (<strong>sanjeev1803t@gmail.com</strong>).
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

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Database & Storage Inspector</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950/70 border border-amber-800/50 text-amber-400 text-xs font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Admin Restricted • Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Inspect raw database records, disk file persistence, and real-time saved user profile data.
          </p>
        </div>

        <button
          onClick={fetchDatabase}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Database
        </button>
      </div>

      {/* Storage Cards (with Skeleton Loading) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 animate-pulse">
              <div className="h-3 bg-slate-800 rounded w-24"></div>
              <div className="h-5 bg-slate-800 rounded w-40"></div>
              <div className="h-3 bg-slate-800 rounded w-32"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Storage Type</span>
              <HardDrive className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-sm font-semibold text-white">Local Disk Persistence + Prisma</div>
            <p className="text-[11px] text-slate-500 truncate">
              {dbData?.filePath || "data/ihateform-database.json"}
            </p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Registered Real Users</span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm font-semibold text-white">{dbData?.totalUsers || 1} Real User(s)</div>
            <p className="text-[11px] text-emerald-400">Syncs live with /profile & Chrome Extension</p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Prisma Studio Command</span>
              <Terminal className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-center justify-between">
              <code className="text-xs text-indigo-300 font-mono bg-slate-950 px-2 py-1 rounded">
                npx prisma studio
              </code>
              <button
                onClick={() => copyToClipboard("npx prisma studio")}
                className="text-slate-400 hover:text-white transition p-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">Opens GUI viewer on port 5555</p>
          </div>
        </div>
      )}

      {/* Raw Database Explorer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>Raw Database Records (`ihateform-database.json`)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">JSON Format</span>
        </div>

        <div className="p-4 bg-slate-950/90 overflow-x-auto max-h-[500px] custom-scrollbar">
          {loading ? (
            <div className="p-8 space-y-3 animate-pulse">
              <div className="h-3 bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-800 rounded w-1/2"></div>
              <div className="h-3 bg-slate-800 rounded w-2/3"></div>
              <div className="h-3 bg-slate-800 rounded w-4/5"></div>
            </div>
          ) : (
            <pre className="text-[11px] font-mono text-indigo-300 whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(dbData?.data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
