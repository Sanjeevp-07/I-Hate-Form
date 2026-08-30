"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  UploadCloud,
  Trash2,
  CheckCircle2,
  Star,
  AlertCircle,
  RefreshCw,
  Download,
  Sparkles,
  FileCheck2,
  Plus,
} from "lucide-react";

interface StoredDocumentItem {
  id: string;
  title: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
  category?: string;
  tags?: string[];
  isPreferred?: boolean;
  fileData?: string;
  createdAt: string;
}

const DOCUMENT_DEFINITIONS = [
  {
    category: "resume",
    title: "Resume / CV",
    acceptedText: "PDF (recommended), DOCX",
    accept: ".pdf,.docx,.doc",
    priority: "Required",
    priorityColor: "bg-indigo-950/80 text-indigo-300 border-indigo-700/60",
    description: "Primary candidate resume used for automatic upload across application portals.",
  },
  {
    category: "secondaryMarksheet",
    title: "10th Marksheet",
    acceptedText: "PDF, PNG, JPG",
    accept: ".pdf,.png,.jpg,.jpeg",
    priority: "Common",
    priorityColor: "bg-blue-950/80 text-blue-300 border-blue-700/60",
    description: "Secondary school certificate and matriculation grade sheet.",
  },
  {
    category: "higherSecondaryMarksheet",
    title: "12th Marksheet",
    acceptedText: "PDF, PNG, JPG",
    accept: ".pdf,.png,.jpg,.jpeg",
    priority: "Common",
    priorityColor: "bg-blue-950/80 text-blue-300 border-blue-700/60",
    description: "Senior secondary / intermediate marksheet and passing certificate.",
  },
  {
    category: "collegeTranscript",
    title: "College Transcript / Marksheet",
    acceptedText: "PDF",
    accept: ".pdf",
    priority: "Common",
    priorityColor: "bg-blue-950/80 text-blue-300 border-blue-700/60",
    description: "Cumulative semester grade cards / official academic transcript.",
  },
  {
    category: "coverLetter",
    title: "Cover Letter",
    acceptedText: "PDF, DOCX",
    accept: ".pdf,.docx,.doc",
    priority: "Optional",
    priorityColor: "bg-slate-800 text-slate-300 border-slate-700",
    description: "Statement of interest or custom cover letter.",
  },
];

export default function ResumesPage() {
  const [documents, setDocuments] = useState<StoredDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [uploadingGeneral, setUploadingGeneral] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const generalFileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleCategoryUpload = async (category: string, file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      setMessage({ type: "error", text: "File is too large. Maximum allowed size is 15MB." });
      return;
    }

    setUploadingCategory(category);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      formData.append("category", category);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({
          type: "success",
          text: `"${file.name}" uploaded successfully! Extension will automatically attach it for ${category === "resume" ? "Resume" : category} fields.`,
        });
        setDocuments((prev) => [data.document, ...prev.filter((d) => d.id !== data.document?.id)]);
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to upload document." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error uploading document." });
    } finally {
      setUploadingCategory(null);
    }
  };

  const handleGeneralUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setMessage({ type: "error", text: "File is too large. Maximum allowed size is 15MB." });
      return;
    }

    setUploadingGeneral(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      formData.append("category", "resume");

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({
          type: "success",
          text: `"${file.name}" added to document library.`,
        });
        fetchDocuments();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to upload document." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error uploading document." });
    } finally {
      setUploadingGeneral(false);
      if (generalFileInputRef.current) generalFileInputRef.current.value = "";
    }
  };

  const handleSetPreferred = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "PUT" });
      if (res.ok) {
        setDocuments((prev) =>
          prev.map((d) => ({ ...d, isPreferred: d.id === id }))
        );
        setMessage({ type: "success", text: "Default resume updated for Chrome Extension autofill!" });
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
        setMessage({ type: "success", text: `Deleted "${name}".` });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete document." });
    }
  };

  const downloadDocument = (doc: StoredDocumentItem) => {
    if (!doc.fileData) return;
    try {
      const byteCharacters = atob(doc.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: doc.mimeType || "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setMessage({ type: "error", text: "Could not generate download link for document." });
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 bg-slate-200 rounded w-56"></div>
            <div className="h-3 bg-slate-200 rounded w-96"></div>
          </div>
          <div className="h-9 bg-slate-200 rounded-lg w-32"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-44 bg-white border border-slate-200 rounded-2xl shadow-sm"></div>
          <div className="h-44 bg-white border border-slate-200 rounded-2xl shadow-sm"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6 pb-12 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Resumes & Application Documents</h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0066FF] border border-blue-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#0066FF]" />
              Auto-Upload Enabled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Category B Document Slots: Whenever an application form requests any specific document (Resume, 10th, 12th, Transcript, Cover Letter), the Chrome Extension automatically uploads the exact matching file.
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={generalFileInputRef}
            onChange={handleGeneralUpload}
            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
            className="hidden"
          />
          <button
            onClick={() => generalFileInputRef.current?.click()}
            disabled={uploadingGeneral}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0066FF] hover:bg-[#0052CC] active:scale-98 text-white text-xs font-semibold transition shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
          >
            {uploadingGeneral ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {uploadingGeneral ? "Uploading..." : "Add Additional File"}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-3 shadow-sm ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Section: Category B — Dedicated Document Upload Slots */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-[#0066FF]" />
            <span>Category B — Dedicated Document Slots</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">
            {documents.length} document{documents.length === 1 ? "" : "s"} ready for autofill
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOCUMENT_DEFINITIONS.map((def) => {
            const uploadedDoc = documents.find(
              (d) => d.category === def.category || (def.category === "resume" && (!d.category || d.tags?.includes("Resume")))
            );
            const isUploadingThis = uploadingCategory === def.category;

            return (
              <div
                key={def.category}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  uploadedDoc
                    ? "bg-white border-emerald-200 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2.5 rounded-xl ${
                          uploadedDoc
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 tracking-tight">{def.title}</h3>
                        <span className="text-[10px] text-slate-400 font-medium">{def.acceptedText}</span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                      def.priority === "Required"
                        ? "bg-orange-50 text-orange-600 border-orange-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {def.priority}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">{def.description}</p>

                  {uploadedDoc && (
                    <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2">
                      <div className="truncate">
                        <div className="font-bold text-emerald-800 truncate text-[11px] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>{uploadedDoc.filename}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {(uploadedDoc.sizeBytes / 1024).toFixed(0)} KB • Uploaded {new Date(uploadedDoc.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {uploadedDoc.fileData && (
                          <button
                            type="button"
                            onClick={() => downloadDocument(uploadedDoc)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                            title="Download file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(uploadedDoc.id, uploadedDoc.filename)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                          title="Delete file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <input
                    type="file"
                    accept={def.accept}
                    ref={(el) => {
                      fileInputRefs.current[def.category] = el;
                    }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCategoryUpload(def.category, file);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={isUploadingThis}
                    onClick={() => fileInputRefs.current[def.category]?.click()}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs ${
                      uploadedDoc
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                        : "bg-[#0066FF] hover:bg-[#0052CC] text-white"
                    }`}
                  >
                    {isUploadingThis ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{uploadedDoc ? "Replace Document" : `Upload ${def.title}`}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section: All Stored Documents Library */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Document Library ({documents.length})
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">
            Starred resume is preferred by default on generic form inputs
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500 shadow-sm">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            No documents uploaded yet. Upload your Resume and Marksheets above to enable 1-click auto-upload across internship portals!
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                  doc.isPreferred
                    ? "bg-blue-50/60 border-blue-200 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl ${
                      doc.isPreferred
                        ? "bg-[#0066FF] text-white"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 truncate">{doc.filename}</span>
                      {doc.category && (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {doc.category}
                        </span>
                      )}
                      {doc.isPreferred && (
                        <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          Default Resume
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {(doc.sizeBytes / 1024).toFixed(0)} KB • Added {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!doc.isPreferred && (
                    <button
                      type="button"
                      onClick={() => handleSetPreferred(doc.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 border border-slate-200"
                    >
                      <Star className="w-3 h-3 text-slate-400" />
                      Set as Default
                    </button>
                  )}
                  {doc.fileData && (
                    <button
                      type="button"
                      onClick={() => downloadDocument(doc)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer border border-slate-200"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id, doc.filename)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition cursor-pointer border border-slate-200"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
