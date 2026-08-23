import React, { useState, useEffect } from "react";
import { FieldDescriptor, FieldError, FieldMapping } from "@internship-copilot/types";
import { CONFIDENCE_THRESHOLDS } from "@internship-copilot/config";
import { mapFieldDeterministically } from "../content/field-mapper";
import { getSessionState, setSessionState } from "../storage/chrome-storage";
import { Shield, Play, RefreshCw, Sparkles, Lock, Layers, AlertCircle, CheckCircle2, LogIn } from "lucide-react";

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
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [fillSummary, setFillSummary] = useState<{ filled: number; skipped: number } | null>(null);

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
      if (typeof chrome === "undefined" || !chrome.scripting) return true;
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: ["content.js"],
      });
      return true;
    } catch {
      return false;
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

                // Map fields deterministically and populate real user values
                const initialMappings = detected.map((f) => {
                  const m = mapFieldDeterministically(f, null);
                  const realVal = resolveProfileValue(m.profilePath);
                  return {
                    ...m,
                    valueToFill: realVal,
                  };
                });

                setMappings(initialMappings);

                await setSessionState({
                  detectedFields: detected,
                  currentMappings: initialMappings,
                });
              }
              setIsScanning(false);
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

    // Update mappings with latest profile values before autofilling
    const enrichedMappings = mappings.map((m) => ({
      ...m,
      valueToFill: resolveProfileValue(m.profilePath) || m.valueToFill,
    }));

    try {
      if (typeof chrome !== "undefined" && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          await ensureContentScriptInjected(tab.id);

          chrome.tabs.sendMessage(
            tab.id,
            {
              type: "FILL_FIELDS",
              payload: { mappings: enrichedMappings },
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
                });
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
    (m) => m.confidence >= CONFIDENCE_THRESHOLDS.AUTO_FILL
  ).length;
  const reviewCount = mappings.filter(
    (m) =>
      m.confidence >= CONFIDENCE_THRESHOLDS.AUTO_FILL_REVIEW &&
      m.confidence < CONFIDENCE_THRESHOLDS.AUTO_FILL
  ).length;
  const askCount = mappings.filter(
    (m) =>
      m.confidence >= CONFIDENCE_THRESHOLDS.ASK_USER &&
      m.confidence < CONFIDENCE_THRESHOLDS.AUTO_FILL_REVIEW
  ).length;
  const unsupportedCount = mappings.filter(
    (m) => m.confidence < CONFIDENCE_THRESHOLDS.ASK_USER
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

      {/* Fill Summary Alert */}
      {fillSummary && (
        <div className="mt-2.5 p-2.5 bg-emerald-950/50 border border-emerald-800/50 rounded-lg text-xs flex items-center justify-between text-emerald-300">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Filled {fillSummary.filled} fields with your saved data</span>
          </div>
          <span className="text-slate-400">({fillSummary.skipped} skipped)</span>
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
              const valueToFill = mapping?.valueToFill || resolveProfileValue(mapping?.profilePath);

              return (
                <div
                  key={field.id}
                  className="p-2.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 rounded-lg text-xs transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-slate-200 truncate flex-1">
                      {field.rawLabel || field.name || "Unnamed field"}
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                        confidence >= 0.95
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                          : confidence >= 0.8
                          ? "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                          : confidence >= 0.5
                          ? "bg-blue-950/60 text-blue-400 border border-blue-800/40"
                          : "bg-rose-950/60 text-rose-400 border border-rose-800/40"
                      }`}
                    >
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 truncate max-w-[180px]">
                      {valueToFill ? (
                        <span className="text-emerald-400 font-mono">"{valueToFill}"</span>
                      ) : (
                        <span className="text-slate-600 italic">No saved value</span>
                      )}
                    </span>
                    <span className="capitalize text-[10px] text-slate-500">
                      {field.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
