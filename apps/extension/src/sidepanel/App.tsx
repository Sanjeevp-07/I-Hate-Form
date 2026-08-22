import React, { useState, useEffect } from "react";
import { FieldDescriptor, FieldError, FieldMapping } from "@internship-copilot/types";
import { CONFIDENCE_THRESHOLDS } from "@internship-copilot/config";
import { mapFieldDeterministically } from "../content/field-mapper";
import { getSessionState, setSessionState } from "../storage/chrome-storage";
import { Shield, Play, RefreshCw, Sparkles, Lock, Layers, AlertCircle, CheckCircle2 } from "lucide-react";

export const App: React.FC = () => {
  const [fields, setFields] = useState<FieldDescriptor[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isFilling, setIsFilling] = useState<boolean>(false);
  const [closedRootsCount, setClosedRootsCount] = useState<number>(0);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [fillSummary, setFillSummary] = useState<{ filled: number; skipped: number } | null>(null);

  useEffect(() => {
    getSessionState().then((state) => {
      if (state.detectedFields && state.detectedFields.length > 0) {
        setFields(state.detectedFields);
        setMappings(state.currentMappings || []);
      }
    });
  }, []);

  const requestHostPermission = async (url: string): Promise<boolean> => {
    try {
      if (typeof chrome !== "undefined" && chrome.permissions) {
        const urlObj = new URL(url);
        const originPattern = `${urlObj.protocol}//${urlObj.hostname}/*`;
        const hasPerm = await chrome.permissions.contains({ origins: [originPattern] });
        if (hasPerm) return true;

        const granted = await chrome.permissions.request({ origins: [originPattern] });
        return granted;
      }
    } catch (err) {
      console.warn("Permissions request error:", err);
    }
    return true;
  };

  const handleScanForm = async () => {
    setIsScanning(true);
    setFillSummary(null);
    setErrors([]);

    try {
      if (typeof chrome !== "undefined" && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id && tab.url) {
          await requestHostPermission(tab.url);

          // Dispatch scan message to content script across all active frames
          chrome.tabs.sendMessage(
            tab.id,
            { type: "SCAN_FORM" },
            async (response) => {
              if (response && response.fields) {
                const detected: FieldDescriptor[] = response.fields;
                setFields(detected);
                setClosedRootsCount(response.closedShadowRootsDetected || 0);

                // Run client-side deterministic rules
                const initialMappings = detected.map((f) =>
                  mapFieldDeterministically(f, null)
                );
                setMappings(initialMappings);

                await setSessionState({
                  detectedFields: detected,
                  currentMappings: initialMappings,
                });
              }
              setIsScanning(false);
            }
          );
        }
      }
    } catch (err) {
      console.error("Scan failed", err);
      setIsScanning(false);
    }
  };

  const handleAutofill = async () => {
    setIsFilling(true);
    setErrors([]);

    try {
      if (typeof chrome !== "undefined" && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.sendMessage(
            tab.id,
            {
              type: "FILL_FIELDS",
              payload: { mappings },
            },
            (response) => {
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
        }
      }
    } catch (err) {
      console.error("Autofill failed", err);
      setIsFilling(false);
    }
  };

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
      <header className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-white">Internship Copilot</h1>
            <p className="text-xs text-slate-400">MV3 Resilient Autofill</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Ready
        </div>
      </header>

      {/* Safety Notice */}
      <div className="mt-3 p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg flex items-start gap-2 text-xs text-slate-300">
        <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <span>
          <strong>Least-Privilege Security:</strong> Host permissions requested on-demand. Deterministic rules run first. No auto-submit.
        </span>
      </div>

      {/* Action Bar */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          onClick={handleScanForm}
          disabled={isScanning}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-98 transition text-slate-100 rounded-lg text-xs font-medium border border-slate-700 disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
          {isScanning ? "Scanning..." : "Scan Fields"}
        </button>

        <button
          onClick={handleAutofill}
          disabled={isFilling || fields.length === 0}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-98 transition text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-950/50 disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {isFilling ? "Filling..." : "Autofill Valid"}
        </button>
      </div>

      {/* Frame & Shadow DOM Badges */}
      {fields.length > 0 && (
        <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px]">
          {iframeFieldsCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-950/50 text-purple-300 border border-purple-800/40 rounded-md">
              <Layers className="w-3 h-3" />
              <span>{iframeFieldsCount} iframe fields</span>
            </div>
          )}
          {closedRootsCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-950/50 text-amber-300 border border-amber-800/40 rounded-md">
              <AlertCircle className="w-3 h-3" />
              <span>{closedRootsCount} closed shadow root (manual fill)</span>
            </div>
          )}
        </div>
      )}

      {/* Summary Metrics */}
      {fields.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5 mt-3 text-center">
          <div className="p-2 bg-emerald-950/30 border border-emerald-900/40 rounded-lg">
            <div className="text-sm font-bold text-emerald-400">{highConfidenceCount}</div>
            <div className="text-[10px] text-emerald-500 uppercase tracking-wider">Ready</div>
          </div>
          <div className="p-2 bg-amber-950/30 border border-amber-900/40 rounded-lg">
            <div className="text-sm font-bold text-amber-400">{reviewCount}</div>
            <div className="text-[10px] text-amber-500 uppercase tracking-wider">Review</div>
          </div>
          <div className="p-2 bg-blue-950/30 border border-blue-900/40 rounded-lg">
            <div className="text-sm font-bold text-blue-400">{askCount}</div>
            <div className="text-[10px] text-blue-500 uppercase tracking-wider">Ask</div>
          </div>
          <div className="p-2 bg-rose-950/30 border border-rose-900/40 rounded-lg">
            <div className="text-sm font-bold text-rose-400">{unsupportedCount}</div>
            <div className="text-[10px] text-rose-500 uppercase tracking-wider">Skip</div>
          </div>
        </div>
      )}

      {/* Fill Summary Alert */}
      {fillSummary && (
        <div className="mt-3 p-3 bg-emerald-950/50 border border-emerald-800/50 rounded-lg text-xs flex items-center justify-between text-emerald-300">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Filled {fillSummary.filled} fields</span>
          </div>
          <span className="text-slate-400">({fillSummary.skipped} skipped)</span>
        </div>
      )}

      {/* Error Warnings */}
      {errors.length > 0 && (
        <div className="mt-3 p-2.5 bg-amber-950/50 border border-amber-800/50 rounded-lg text-xs space-y-1">
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
      <div className="mt-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Detected Form Fields ({fields.length})</span>
          <span>Confidence</span>
        </div>

        {fields.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-500">
            <Shield className="w-8 h-8 mb-2 stroke-1 text-slate-600" />
            <p className="text-xs">No active scan</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Navigate to a job application form and click "Scan Fields"
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {fields.map((field, idx) => {
              const mapping = mappings[idx];
              const confidence = mapping ? mapping.confidence : 0;

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

                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-indigo-400 text-[10px]">
                      {mapping?.profilePath || "no match"}
                    </span>
                    <span className="capitalize text-[10px] text-slate-500">
                      {field.type} {field.frameId > 0 ? `(frame #${field.frameId})` : ""}
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
