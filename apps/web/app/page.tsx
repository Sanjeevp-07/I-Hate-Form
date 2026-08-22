import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Cpu, FileText, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/50 text-indigo-400 text-xs font-medium mb-6">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Next-Gen Internship Copilot v2.0</span>
      </div>

      {/* Hero Headline */}
      <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white max-w-3xl">
        Stop Repeating Yourself on <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Job Forms</span>
      </h1>

      <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
        High-precision autofill engine, multi-tiered AI field mapping, and tailored answer drafting with zero prompt-injection risks and zero auto-submission.
      </p>

      {/* CTA Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-900/40"
        >
          <span>Open Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-medium text-sm transition"
        >
          Manage Profile
        </Link>
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 text-left w-full">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <ShieldCheck className="w-6 h-6 text-indigo-400 mb-3" />
          <h3 className="text-sm font-semibold text-white">Privacy & Least Privilege</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Data minimization enforced by TypeScript signature constraints. Session-scoped tokens and deterministic rules before AI.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <Cpu className="w-6 h-6 text-purple-400 mb-3" />
          <h3 className="text-sm font-semibold text-white">Tiered AI Routing</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Fast/cheap model routing for classification, workhorse tier for subjective answers, and opt-in reasoning tiers.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <FileText className="w-6 h-6 text-emerald-400 mb-3" />
          <h3 className="text-sm font-semibold text-white">Deep DOM Piercing</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Pierces open Shadow DOM, tracks iframe frame IDs, and dispatches native events compatible with React, Vue, and Workday.
          </p>
        </div>
      </div>
    </main>
  );
}
