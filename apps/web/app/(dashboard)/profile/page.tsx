import { User, Mail, Phone, MapPin, Globe, GraduationCap, Briefcase, Plus, Save } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Applicant Profile</h1>
          <p className="text-xs text-slate-400 mt-1">Single source of truth for deterministic & AI-assisted autofill operations.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm">
          <Save className="w-3.5 h-3.5" />
          Save Changes
        </button>
      </div>

      {/* Personal Info Card */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-semibold text-white">
          <User className="w-4 h-4 text-indigo-400" />
          <span>Personal Information</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">First Name</label>
            <input
              type="text"
              defaultValue="Sanjeev"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Last Name</label>
            <input
              type="text"
              defaultValue="Kumar"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Email</label>
            <input
              type="email"
              defaultValue="sanjeev@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Phone</label>
            <input
              type="tel"
              defaultValue="+1 (555) 019-2834"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Links Card */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-semibold text-white">
          <Globe className="w-4 h-4 text-purple-400" />
          <span>Online Profiles & Links</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">LinkedIn URL</label>
            <input
              type="url"
              defaultValue="https://linkedin.com/in/sanjeev-dev"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">GitHub URL</label>
            <input
              type="url"
              defaultValue="https://github.com/sanjeev-dev"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
