"use client";

import React, { useState, useEffect, useRef } from "react";
import { FileText, Upload, Trash2, CheckCircle2, Star, AlertCircle, RefreshCw } from "lucide-react";

interface ResumeDoc {
  id: string;
  title: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
  tags: string[];
  isPreferred: boolean;
  createdAt: string;
}

export default function ResumesPage() {
  const [documents, setDocuments] = useState<ResumeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = () => {
    setLoading(true);
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        setDocuments(data.documents || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const payload = {
        title: file.name,
        filename: file.name,
        sizeBytes: file.size,
        mimeType: file.type || "application/pdf",
        tags: [],
      };

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ type: "success", text: `"${file.name}" uploaded and parsed successfully!` });
        fetchDocuments();
      } else {
        setMessage({ type: "error", text: "Failed to upload resume document." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error uploading file." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSetPreferred = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "PUT" });
      if (res.ok) {
        setDocuments((prev) =>
          prev.map((d) => ({ ...d, isPreferred: d.id === id }))
        );
        setMessage({ type: "success", text: "Default resume updated for AI matching!" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update default resume." });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        setMessage({ type: "success", text: "Resume removed." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete resume." });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Documents & Resumes</h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload tailored resumes to allow the AI Copilot to match and answer job questions with real experiences.
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.doc"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white text-xs font-medium transition shadow-md shadow-indigo-950/50 cursor-pointer disabled:opacity-50"
          >
            {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{uploading ? "Uploading..." : "Upload Resume (PDF/DOCX)"}</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-950/50 border-emerald-800 text-emerald-300"
              : "bg-rose-950/50 border-rose-800 text-rose-300"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-800 rounded w-48"></div>
                <div className="h-4 bg-slate-800 rounded w-16"></div>
              </div>
              <div className="h-3 bg-slate-800 rounded w-24"></div>
              <div className="flex gap-2 pt-2">
                <div className="h-6 bg-slate-800 rounded-full w-20"></div>
                <div className="h-6 bg-slate-800 rounded-full w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl space-y-3">
          <div className="p-3 bg-slate-900 w-12 h-12 rounded-full mx-auto flex items-center justify-center text-slate-500">
            <FileText className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-white">No Resumes Uploaded</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload your resume so I Hate Form can draft tailored application answers.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`p-5 rounded-xl border transition space-y-3 ${
                doc.isPreferred
                  ? "bg-slate-900/90 border-indigo-500/50 shadow-lg shadow-indigo-950/30"
                  : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${doc.isPreferred ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" : "bg-slate-800 text-slate-400"}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white truncate max-w-[220px]">
                      {doc.title}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {formatFileSize(doc.sizeBytes)} • {new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {doc.isPreferred ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[10px] font-semibold">
                    <Star className="w-3 h-3 fill-current" />
                    Default AI Resume
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetPreferred(doc.id)}
                    title="Set as Default Resume for AI Matching"
                    className="text-slate-500 hover:text-indigo-400 text-[11px] font-medium transition cursor-pointer"
                  >
                    Set as Default
                  </button>
                )}
              </div>

              {/* Tags */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {doc.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[10px] text-slate-300 font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">Ready for Autofill</span>
                <button
                  onClick={() => handleDelete(doc.id, doc.title)}
                  className="flex items-center gap-1 text-slate-500 hover:text-rose-400 transition text-[11px] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
