import Link from "next/link";
import { User, FileText, Briefcase, LayoutDashboard, Settings, Sparkles } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">Internship Copilot</span>
          </div>

          <nav className="mt-6 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              Overview
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <User className="w-4 h-4 text-slate-400" />
              Profile Details
            </Link>
            <Link
              href="/applications"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <Briefcase className="w-4 h-4 text-slate-400" />
              Applications
            </Link>
            <Link
              href="/resumes"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              Resumes & Docs
            </Link>
          </nav>
        </div>

        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Extension Bridge</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">MV3 Connected</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/20">
          <div className="text-xs text-slate-400">Workspace / Student Baseline</div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span>Local Database Active</span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
