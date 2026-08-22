import { Briefcase, CheckCircle2, Clock, AlertCircle, Sparkles } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Application Copilot Overview</h1>
        <p className="text-xs text-slate-400 mt-1">Track your active applications, field mapping statistics, and AI token utilization.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Applications</span>
            <Briefcase className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">12</div>
          <div className="text-[11px] text-emerald-400 mt-1">+3 this week</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Fields Auto-filled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">148</div>
          <div className="text-[11px] text-slate-400 mt-1">96.4% accuracy</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Time Saved</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">3.8 hrs</div>
          <div className="text-[11px] text-purple-400 mt-1">~19 min / application</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">AI Routing Tier</span>
            <Sparkles className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">Fast Tier</div>
          <div className="text-[11px] text-slate-400 mt-1">GPT-4o-mini / Workhorse</div>
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <h2 className="text-sm font-semibold text-white mb-4">Recent Autofill Sessions</h2>
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
      </div>
    </div>
  );
}
