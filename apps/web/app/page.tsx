import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Cpu, FileText, Lock, UserPlus, LogIn } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto py-16 text-slate-900">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0066FF] text-xs font-semibold mb-6 shadow-2xs">
        <Sparkles className="w-3.5 h-3.5 text-[#0066FF]" />
        <span>I Hate Form — Modern Form Automation Platform</span>
      </div>

      {/* Hero Headline */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-3xl leading-tight">
        Never Fill Out a Boring <span className="bg-gradient-to-r from-[#0066FF] via-indigo-600 to-purple-600 bg-clip-text text-transparent">Job Form</span> Again
      </h1>

      <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed font-medium">
        <strong>I Hate Form</strong> is your private autofill engine. Set up your profile once, and let the Chrome extension automatically populate Workday, Greenhouse, Lever, and custom application forms in 1 click.
      </p>

      {/* CTA Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-sm transition shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Get Started Free</span>
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold text-sm transition shadow-xs cursor-pointer"
        >
          <LogIn className="w-4 h-4 text-[#0066FF]" />
          <span>Sign In to Dashboard</span>
        </Link>
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left w-full">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <ShieldCheck className="w-6 h-6 text-[#0066FF] mb-3" />
          <h3 className="text-sm font-bold text-slate-900">Privacy-First & Secure</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
            Your personal data stays strictly in your own account. AI models only see schema paths, never private user data.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <Cpu className="w-6 h-6 text-purple-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-900">Deterministic + AI Pipeline</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
            Instant rule engine matches known fields with zero latency; intelligent AI handles ambiguous questions.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <FileText className="w-6 h-6 text-emerald-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-900">Deep DOM & Framework Support</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
            Handles React controlled inputs, open Shadow DOM, and iframes across 50+ concurrent users with zero lag.
          </p>
        </div>
      </div>
    </main>
  );
}
