import React, { useState, useEffect } from "react";
import { FieldDescriptor, FieldError, FieldMapping } from "@internship-copilot/types";
import { CONFIDENCE_THRESHOLDS } from "@internship-copilot/config";
import { mapFieldDeterministically } from "../content/field-mapper";
import { getSessionState, setSessionState } from "../storage/chrome-storage";
import { Shield, Play, RefreshCw, Sparkles, Lock, Layers, AlertCircle, CheckCircle2, LogIn, ChevronDown, FileText } from "lucide-react";

const BACKEND_BASE_URL = "http://localhost:3000";

export const App: React.FC = () => {
  const [authState, setAuthState] = useState<{
    loading: boolean;
    authenticated: boolean;
    user: { id: string; email: string; name: string | null } | null;
  }>({
    loading: true,
    authenticated: false,
    user: null,
  });

  const [userProfile, setUserProfile] = useState<any>(null);
  const [fields, setFields] = useState<FieldDescriptor[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isFilling, setIsFilling] = useState<boolean>(false);
  const [closedRootsCount, setClosedRootsCount] = useState<number>(0);
  const [hasResumeField, setHasResumeField] = useState<boolean>(false);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [fillSummary, setFillSummary] = useState<{
    filled: number;
    skipped: number;
    resumeUploaded?: boolean;
    resumeName?: string;
    corrections?: Array<{ fieldId: string; rawLabel: string; previousValue: any; correctedValue: any; warningMessage: string }>;
  } | null>(null);

  // Check authentication status and fetch user profile
  const checkAuthAndFetchProfile = async () => {
    setAuthState((prev) => ({ ...prev, loading: true }));
    try {
      const authRes = await fetch(`${BACKEND_BASE_URL}/api/auth/me`, {
        credentials: "include",
      });

      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.authenticated && authData.user) {
          setAuthState({
            loading: false,
            authenticated: true,
            user: authData.user,
          });

          // Fetch full profile data
          const profRes = await fetch(`${BACKEND_BASE_URL}/api/profile`, {
            credentials: "include",
          });
          if (profRes.ok) {
            const profData = await profRes.json();
            setUserProfile(profData.profile || null);
          }
          return;
        }
      }

      setAuthState({
        loading: false,
        authenticated: false,
        user: null,
      });
    } catch {
      // Local development fallback
      setAuthState({
        loading: false,
        authenticated: false,
        user: null,
      });
    }
  };

  useEffect(() => {
    checkAuthAndFetchProfile();
    getSessionState().then((state) => {
      if (state.detectedFields && state.detectedFields.length > 0) {
        setFields(state.detectedFields);
        setMappings(state.currentMappings || []);
      }
    });
  }, []);

  const openDashboardLogin = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: `${BACKEND_BASE_URL}/login` });
    } else {
      window.open(`${BACKEND_BASE_URL}/login`, "_blank");
    }
  };

  const openDashboardProfile = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: `${BACKEND_BASE_URL}/profile` });
    } else {
      window.open(`${BACKEND_BASE_URL}/profile`, "_blank");
    }
  };

  /**
   * Resolves value from user's real saved profile based on path
   */
  const resolveProfileValue = (path: string | null | undefined): string | null => {
    if (!path || !userProfile) return null;
    const personal = userProfile.personal || {};
    const links = userProfile.links || {};

    switch (path) {
      case "personal.title":
        return personal.gender?.toLowerCase() === "female" ? "Ms." : "Mr.";
      case "personal.firstName":
        return personal.firstName || null;
      case "personal.middleName":
        return personal.middleName || null;
      case "personal.lastName":
        return personal.lastName || null;
      case "personal.fullName":
        return `${personal.firstName || ""} ${personal.lastName || ""}`.trim() || null;
      case "personal.email":
        return personal.email || null;
      case "personal.phone":
        return personal.phone || null;
      case "personal.countryCode":
        return personal.countryCode || "+91";
      case "personal.gender":
        return personal.gender || "Male";
      case "personal.nationality":
        return personal.nationality || "Indian";
      case "personal.dob":
        return personal.dob || null;
      case "personal.country":
        return personal.country || "India";
      case "personal.state":
        return personal.state || null;
      case "personal.city":
        return personal.city || null;
      case "personal.postalCode":
        return personal.postalCode || null;
      case "personal.address":
        return personal.address || null;
      case "links.linkedin":
        return links.linkedin || null;
      case "links.github":
        return links.github || null;
      case "links.portfolio":
        return links.portfolio || null;
      default:
        return null;
    }
  };

  const ensureContentScriptInjected = async (tabId: number): Promise<boolean> => {
    try {
      if (typeof chrome !== "undefined" && chrome.scripting) return true;
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: ["content.js"],
      });
      return true;
    } catch {
      return false;
    }
  };

  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

  const handleOptionOverride = (fieldIndex: number, newValue: string) => {
    setMappings((prev) => {
      const updated = [...prev];
      if (updated[fieldIndex]) {
        updated[fieldIndex] = {
          ...updated[fieldIndex],
          valueToFill: newValue,
          action: "fill",
          confidence: Math.max(updated[fieldIndex].confidence, 0.95),
        };
      }
      return updated;
    });
  };

  const handleValueChange = (fieldIndex: number, newValue: string) => {
    setMappings((prev) => {
      const updated = [...prev];
      if (updated[fieldIndex]) {
        updated[fieldIndex] = {
          ...updated[fieldIndex],
          valueToFill: newValue,
          action: newValue.trim() ? "fill" : "review",
          confidence: newValue.trim() ? 0.95 : 0.5,
          source: "user_override",
        };
      }
      return updated;
    });
  };

  const handleGenerateAIAnswers = async (targetFields?: FieldDescriptor[], baseMappings?: FieldMapping[]) => {
    const fieldsToProcess = targetFields || fields;
    const existingMappings = baseMappings || mappings;

    if (!fieldsToProcess || fieldsToProcess.length === 0) return;

    setIsGeneratingAI(true);
    try {
      // Filter fields that do not have deterministic static values
      const unmappedFields = fieldsToProcess.filter((_, idx) => {
        const m = existingMappings[idx];
        return !m || m.valueToFill === null || m.valueToFill === undefined || m.valueToFill === "" || m.action === "unsupported" || m.action === "review";
      });

      if (unmappedFields.length === 0) {
        setIsGeneratingAI(false);
        return;
      }

      const res = await fetch(`${BACKEND_BASE_URL}/api/autofill/generate-answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fields: unmappedFields,
          profile: userProfile,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMappings: FieldMapping[] = data.mappings || [];

        const mergedMappings = fieldsToProcess.map((f, idx) => {
          const current = existingMappings[idx];
          const aiMatch = aiMappings.find((aim) => aim.fieldId === f.id);

          if (aiMatch && aiMatch.valueToFill !== null && aiMatch.valueToFill !== undefined) {
            return {
              ...current,
              ...aiMatch,
              action: "fill" as const,
              source: "ai_strong" as const,
            };
          }
          return current;
        });

        setMappings(mergedMappings);
        await setSessionState({
          detectedFields: fieldsToProcess,
          currentMappings: mergedMappings,
        });
      }
    } catch (err) {
      console.warn("AI generation failed or offline:", err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleScanForm = async () => {
    setIsScanning(true);
    setFillSummary(null);
    setErrors([]);

    try {
      if (typeof chrome !== "undefined" && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          await ensureContentScriptInjected(tab.id);

          chrome.tabs.sendMessage(
            tab.id,
            { type: "SCAN_FORM" },
            async (response) => {
              if (chrome.runtime.lastError) {
                setIsScanning(false);
                return;
              }

              if (response && response.fields) {
                const detected: FieldDescriptor[] = response.fields;
                setFields(detected);
                setClosedRootsCount(response.closedShadowRootsDetected || 0);
                setHasResumeField(Boolean(response.hasResumeField));

                // 1. Map fields deterministically from user profile
                const initialMappings: FieldMapping[] = detected.map((f) => {
                  const m = mapFieldDeterministically(f, null);
                  const realVal = resolveProfileValue(m.profilePath);
                  return {
                    ...m,
                    valueToFill: realVal,
                    action: realVal ? "fill" : m.action,
                    confidence: realVal ? 0.98 : m.confidence,
                  };
                });

                setMappings(initialMappings);

                await setSessionState({
                  detectedFields: detected,
                  currentMappings: initialMappings,
                });

                setIsScanning(false);

                // 2. Automatically generate NVIDIA NIM AI answers for remaining fields (experience, CTC, notice period, essays, etc.)
                handleGenerateAIAnswers(detected, initialMappings);
              } else {
                setIsScanning(false);
              }
            }
          );
        } else {
          setIsScanning(false);
        }
      } else {
        setIsScanning(false);
      }
    } catch {
      setIsScanning(false);
    }
  };

  const handleAutofill = async () => {
    setIsFilling(true);
    setErrors([]);

    // Update mappings with latest profile values or AI answers before autofilling
    const enrichedMappings = mappings.map((m) => {
      const profileVal = resolveProfileValue(m.profilePath);
      const targetVal = m.valueToFill !== undefined && m.valueToFill !== null ? m.valueToFill : profileVal;

      return {
        ...m,
        valueToFill: targetVal,
      };
    });

    try {
      if (typeof chrome !== "undefined" && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          await ensureContentScriptInjected(tab.id);

          chrome.tabs.sendMessage(
            tab.id,
            {
              type: "FILL_FIELDS",
              payload: { mappings: enrichedMappings, profile: userProfile },
            },
            (response) => {
              if (chrome.runtime.lastError) {
                setIsFilling(false);
                return;
              }

              if (response) {
                setFillSummary({
                  filled: response.filledFieldIds?.length || 0,
                  skipped: response.skippedFieldIds?.length || 0,
                  resumeUploaded: response.resumeUpload?.uploaded || false,
                  resumeName: response.resumeUpload?.fileName || "",
                  corrections: response.corrections || [],
                });

                if (response.corrections && response.corrections.length > 0) {
                  setMappings((prev) =>
                    prev.map((m) => {
                      const corr = response.corrections.find((c: any) => c.fieldId === m.fieldId);
                      if (corr) {
                        return {
                          ...m,
                          valueToFill: corr.correctedValue,
                          reason: `Auto-corrected (${corr.warningMessage})`,
                        };
                      }
                      return m;
                    })
                  );
                }

                if (response.errors) {
                  setErrors(response.errors);
                }
              }
              setIsFilling(false);
            }
          );
        } else {
          setIsFilling(false);
        }
      } else {
        setIsFilling(false);
      }
    } catch {
      setIsFilling(false);
    }
  };

  // If loading auth
  if (authState.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400 p-6 text-center">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mb-3" />
        <p className="text-xs">Connecting to I Hate Form...</p>
      </div>
    );
  }

  // If NOT authenticated, show clean login instruction popup
  if (!authState.authenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 p-5 select-none justify-between">
        {/* Header */}
        <header className="flex items-center gap-2 pb-4 border-b border-slate-800">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white">I Hate Form</h1>
            <p className="text-xs text-slate-400">Account Setup Required</p>
          </div>
        </header>

        {/* Lock Screen Body */}
        <div className="my-auto py-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-950/40 text-indigo-400 rounded-2xl border border-indigo-800/40 mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-white">Log In to I Hate Form</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Please sign in on the dashboard and configure your profile information to enable autofilling.
            </p>
          </div>

          <div className="space-y-2.5 pt-3">
            <button
              onClick={openDashboardLogin}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-98 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-950/50 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <LogIn className="w-4 h-4" />
              Open Dashboard & Sign In
            </button>

            <button
              onClick={checkAuthAndFetchProfile}
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Login Status
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-900 text-center text-[11px] text-slate-500">
          I Hate Form Cloud Engine • Secure Sync
        </div>
      </div>
    );
  }

  const highConfidenceCount = mappings.filter(
    (m) => (m.valueToFill !== null && m.valueToFill !== undefined && m.valueToFill !== "") && (m.confidence >= CONFIDENCE_THRESHOLDS.AUTO_FILL_REVIEW || m.action === "fill")
  ).length;
  const reviewCount = mappings.filter(
    (m) =>
      (!m.valueToFill || m.action === "review") &&
      m.confidence >= CONFIDENCE_THRESHOLDS.ASK_USER &&
      m.confidence < CONFIDENCE_THRESHOLDS.AUTO_FILL_REVIEW
  ).length;
  const askCount = mappings.filter(
    (m) =>
      (!m.valueToFill || m.action === "review") &&
      m.confidence >= CONFIDENCE_THRESHOLDS.ASK_USER &&
      m.confidence < CONFIDENCE_THRESHOLDS.AUTO_FILL_REVIEW
  ).length;
  const unsupportedCount = mappings.filter(
    (m) => (m.valueToFill === null || m.valueToFill === undefined || m.valueToFill === "") && m.confidence < CONFIDENCE_THRESHOLDS.ASK_USER
  ).length;

  const iframeFieldsCount = fields.filter((f) => f.frameId > 0).length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 p-4 select-none">
      {/* Header */}
      <header className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white">I Hate Form</h1>
            <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
              {authState.user?.name || authState.user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={openDashboardProfile}
          title="Edit Profile on Dashboard"
          className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-800/40 rounded-full text-xs font-medium transition cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Connected
        </button>
      </header>

      {/* Action Bar */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          onClick={handleScanForm}
          disabled={isScanning}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-98 transition text-slate-100 rounded-lg text-xs font-medium border border-slate-700 disabled:opacity-50 shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
          {isScanning ? "Scanning..." : "Scan Fields"}
        </button>

        <button
          onClick={handleAutofill}
          disabled={isFilling || fields.length === 0}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-98 transition text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-950/50 disabled:opacity-50 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {isFilling ? "Filling..." : "Autofill Valid"}
        </button>
      </div>

      {/* Dedicated NVIDIA NIM AI Answer Generation Button */}
      {fields.length > 0 && (
        <button
          onClick={() => handleGenerateAIAnswers()}
          disabled={isGeneratingAI}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-violet-700 via-indigo-600 to-cyan-600 hover:from-violet-600 hover:to-cyan-500 active:scale-98 transition text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-950/50 border border-indigo-400/30 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? "animate-spin text-amber-300" : "text-amber-300 fill-amber-300"}`} />
          <span>{isGeneratingAI ? "NVIDIA NIM Generating Answers..." : "✨ Auto-Generate with NVIDIA AI"}</span>
        </button>
      )}

      {/* Frame & Shadow DOM Badges */}
      {fields.length > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[11px]">
          {iframeFieldsCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-950/50 text-purple-300 border border-purple-800/40 rounded-md">
              <Layers className="w-3 h-3" />
              <span>{iframeFieldsCount} iframe fields</span>
            </div>
          )}
          {closedRootsCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-950/50 text-amber-300 border border-amber-800/40 rounded-md">
              <AlertCircle className="w-3 h-3" />
              <span>{closedRootsCount} closed shadow root</span>
            </div>
          )}
        </div>
      )}

      {/* Summary Metrics */}
      {fields.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5 mt-2.5 text-center">
          <div className="p-1.5 bg-emerald-950/30 border border-emerald-900/40 rounded-lg">
            <div className="text-sm font-bold text-emerald-400">{highConfidenceCount}</div>
            <div className="text-[10px] text-emerald-500 uppercase tracking-wider">Ready</div>
          </div>
          <div className="p-1.5 bg-amber-950/30 border border-amber-900/40 rounded-lg">
            <div className="text-sm font-bold text-amber-400">{reviewCount}</div>
            <div className="text-[10px] text-amber-500 uppercase tracking-wider">Review</div>
          </div>
          <div className="p-1.5 bg-blue-950/30 border border-blue-900/40 rounded-lg">
            <div className="text-sm font-bold text-blue-400">{askCount}</div>
            <div className="text-[10px] text-blue-500 uppercase tracking-wider">Ask</div>
          </div>
          <div className="p-1.5 bg-rose-950/30 border border-rose-900/40 rounded-lg">
            <div className="text-sm font-bold text-rose-400">{unsupportedCount}</div>
            <div className="text-[10px] text-rose-500 uppercase tracking-wider">Skip</div>
          </div>
        </div>
      )}

      {/* Resume PDF Auto-Upload Indicator (Only rendered when resume upload field is present on form) */}
      {hasResumeField && (
        <div className="mt-2.5 p-2 bg-indigo-950/40 border border-indigo-800/40 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-indigo-300 font-medium truncate">
            <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">
              {userProfile?.personal
                ? `${userProfile.personal.firstName}_${userProfile.personal.lastName}_Resume.pdf`
                : "Sanjeev_Kumar_Resume.pdf"}
            </span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 rounded font-medium shrink-0">
            Uploads 1st
          </span>
        </div>
      )}

      {/* Fill Summary Alert */}
      {fillSummary && (
        <div className="mt-2.5 p-2.5 bg-emerald-950/50 border border-emerald-800/50 rounded-lg text-xs space-y-1.5 text-emerald-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Autofilled {fillSummary.filled} fields</span>
            </div>
            <span className="text-slate-400">({fillSummary.skipped} skipped)</span>
          </div>
          {fillSummary.resumeUploaded && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/90 pl-5">
              <span>📄 Resume PDF "{fillSummary.resumeName}" uploaded</span>
            </div>
          )}
          {fillSummary.corrections && fillSummary.corrections.length > 0 && (
            <div className="mt-1.5 pt-1.5 border-t border-emerald-800/40 text-[11px] space-y-1 text-cyan-300">
              <div className="flex items-center gap-1.5 font-medium text-cyan-400">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Auto-corrected {fillSummary.corrections.length} field {fillSummary.corrections.length === 1 ? "warning" : "warnings"} with NVIDIA AI:</span>
              </div>
              {fillSummary.corrections.map((c, i) => (
                <div key={i} className="pl-5 text-slate-300">
                  • <strong className="text-white">{c.rawLabel || "Field"}</strong>: <span className="line-through text-slate-500">{String(c.previousValue)}</span> &rarr; <span className="font-semibold text-emerald-300">{String(c.correctedValue)}</span> <span className="text-[10px] text-amber-400/80">({c.warningMessage})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Warnings */}
      {errors.length > 0 && (
        <div className="mt-2.5 p-2.5 bg-amber-950/50 border border-amber-800/50 rounded-lg text-xs space-y-1">
          <div className="font-medium text-amber-300 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Manual Confirmation Needed:</span>
          </div>
          {errors.map((err, i) => (
            <p key={i} className="text-[11px] text-amber-400/90 pl-4">
              • {err.message}
            </p>
          ))}
        </div>
      )}

      {/* Detected Field List */}
      <div className="mt-3 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Detected Fields ({fields.length})</span>
          <span>Fill Preview</span>
        </div>

        {fields.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-500">
            <Shield className="w-8 h-8 mb-2 stroke-1 text-slate-600" />
            <p className="text-xs">No active scan</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Click "Scan Fields" on any job application form
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {fields.map((field, idx) => {
              const mapping = mappings[idx];
              const confidence = mapping ? mapping.confidence : 0;
              const valueToFill = mapping?.valueToFill !== undefined && mapping?.valueToFill !== null
                ? mapping.valueToFill
                : resolveProfileValue(mapping?.profilePath);
              const isAIMapped = mapping?.source?.includes("ai");

              return (
                <div
                  key={field.id}
                  className="p-2.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 rounded-lg text-xs transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-slate-200 truncate flex-1 flex items-center gap-1.5">
                      <span>{field.rawLabel || field.name || "Unnamed field"}</span>
                      {isAIMapped && (
                        <span className="text-[9px] px-1 py-0.2 bg-violet-950/80 text-violet-300 border border-violet-700/50 rounded font-semibold uppercase tracking-wider">
                          NVIDIA NIM
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                        confidence >= 0.9
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                          : confidence >= 0.7
                          ? "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                          : confidence >= 0.4
                          ? "bg-blue-950/60 text-blue-400 border border-blue-800/40"
                          : "bg-rose-950/60 text-rose-400 border border-rose-800/40"
                      }`}
                    >
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>

                  {/* Text / Number Input Editable Field */}
                  {field.type !== "select" && (
                    <div className="mt-1.5">
                      <input
                        type="text"
                        className="w-full bg-slate-950/90 text-emerald-300 border border-slate-700/70 rounded px-2 py-1 text-[11px] font-mono focus:border-indigo-500 focus:outline-none"
                        placeholder="No saved value"
                        value={valueToFill !== null && valueToFill !== undefined ? String(valueToFill) : ""}
                        onChange={(e) => handleValueChange(idx, e.target.value)}
                      />
                    </div>
                  )}

                  {/* Dropdown Options Selector */}
                  {field.type === "select" && field.options && field.options.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-slate-800/60">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>Dropdown Options ({field.options.length}):</span>
                      </div>
                      <div className="relative">
                        <select
                          className="w-full bg-slate-950/80 hover:bg-slate-950 text-slate-200 border border-slate-700/80 rounded px-2 py-1 text-[11px] appearance-none cursor-pointer focus:border-indigo-500 focus:outline-none pr-6 truncate"
                          value={
                            field.options.find(
                              (opt) =>
                                opt.value.toLowerCase() === String(valueToFill).toLowerCase() ||
                                opt.label.toLowerCase() === String(valueToFill).toLowerCase()
                            )?.value || ""
                          }
                          onChange={(e) => {
                            const selectedOpt = field.options?.find((o) => o.value === e.target.value);
                            handleOptionOverride(idx, selectedOpt ? (selectedOpt.label || selectedOpt.value) : e.target.value);
                          }}
                        >
                          <option value="" disabled>-- Select Option ({field.options.length} found) --</option>
                          {field.options.map((opt, optIdx) => (
                            <option key={optIdx} value={opt.value}>
                              {opt.label || opt.value || `Option ${optIdx + 1}`}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

