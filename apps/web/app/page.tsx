import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Cpu, FileText, Lock, UserPlus, LogIn } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto py-12">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-800/50 text-indigo-400 text-xs font-medium mb-6">
        <Sparkles className="w-3.5 h-3.5" />
        <span>I Hate Form — Modern Form Automation Platform</span>
      </div>

      {/* Hero Headline */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-tight">
        Never Fill Out a Boring <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Job Form</span> Again
      </h1>

      <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
        <strong>I Hate Form</strong> is your private autofill engine. Set up your profile once, and let the Chrome extension automatically populate Workday, Greenhouse, Lever, and custom application forms in 1 click.
      </p>

      {/* CTA Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm transition shadow-lg shadow-indigo-900/40 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Get Started Free</span>
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-medium text-sm transition cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In to Dashboard</span>
        </Link>
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 text-left w-full">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <ShieldCheck className="w-6 h-6 text-indigo-400 mb-3" />
          <h3 className="text-sm font-semibold text-white">Privacy-First & Secure</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Your personal data stays strictly in your own account. AI models only see schema paths, never private user data.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <Cpu className="w-6 h-6 text-purple-400 mb-3" />
          <h3 className="text-sm font-semibold text-white">Deterministic + AI Pipeline</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Instant rule engine matches known fields with zero latency; intelligent AI handles ambiguous questions.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <FileText className="w-6 h-6 text-emerald-400 mb-3" />
          <h3 className="text-sm font-semibold text-white">Deep DOM & Framework Support</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Handles React controlled inputs, open Shadow DOM, and iframes across 50+ concurrent users with zero lag.
          </p>
        </div>
      </div>
    </main>
  );
}
