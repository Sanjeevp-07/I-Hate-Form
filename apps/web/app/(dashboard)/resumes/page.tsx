import { FileText, Upload, Tag, Trash2 } from "lucide-react";

export default function ResumesPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Documents & Resumes</h1>
          <p className="text-xs text-slate-400 mt-1">Upload tagged resumes and cover letters for AI Resume Matching.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm">
          <Upload className="w-3.5 h-3.5" />
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span className="font-medium text-xs text-white">Fullstack_SWE_Resume_2026.pdf</span>
            </div>
            <span className="text-[10px] text-slate-500">142 KB</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">fullstack</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">typescript</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">react</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="font-medium text-xs text-white">AI_ML_Intern_Resume_2026.pdf</span>
            </div>
            <span className="text-[10px] text-slate-500">156 KB</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">ml</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">python</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">pytorch</span>
          </div>
        </div>
      </div>
    </div>
  );
}
