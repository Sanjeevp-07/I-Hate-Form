import { Briefcase, ExternalLink, Filter } from "lucide-react";

export default function ApplicationsPage() {
  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Application Tracker</h1>
          <p className="text-xs text-slate-400 mt-1">Audit log of all autofilled and submitted internship applications.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-800 transition">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="border-b border-slate-800 text-slate-400 pb-2">
            <tr>
              <th className="py-2 font-medium">Company & Role</th>
              <th className="py-2 font-medium">Domain</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Fields Mapped</th>
              <th className="py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            <tr>
              <td className="py-3 font-medium text-white">Stripe — Software Engineering Intern</td>
              <td className="py-3 text-slate-400">boards.greenhouse.io</td>
              <td className="py-3"><span className="px-2 py-0.5 rounded text-[10px] bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">Applied</span></td>
              <td className="py-3 text-slate-400">18 fields (100% rule/AI verified)</td>
              <td className="py-3"><ExternalLink className="w-3.5 h-3.5 text-slate-400 hover:text-white cursor-pointer" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
