import { scanFormFieldsWithStats } from "./dom-scanner";
import { executeAutofill } from "./autofill-engine";
import { findResumeUploadInputs } from "./resume-uploader";
import { FrameRegistry } from "./frame-registry";
import { FormMutationWatcher } from "./mutation-observer";
import { ExtensionMessage, FillFieldsPayload, FillResultPayload, ScanResultPayload } from "../types";

// Wrap in self-invoking function and guard against duplicate injection
(() => {
  if ((window as any).__IHATEFORM_CONTENT_SCRIPT_INITIALIZED__) {
    return;
  }
  (window as any).__IHATEFORM_CONTENT_SCRIPT_INITIALIZED__ = true;

  // Initialize frame registry for this context
  const frameMeta = FrameRegistry.initialize();
  const currentFrameId = frameMeta.frameId;

  // Listen for messages from background worker / sidepanel
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === "SCAN_FORM") {
      try {
        const scanStats = scanFormFieldsWithStats();
        const resumeInputs = findResumeUploadInputs();
        const payload: ScanResultPayload & { closedShadowRootsDetected?: number; hasResumeField?: boolean } = {
          frameId: currentFrameId,
          fields: scanStats.fields,
          closedShadowRootsDetected: scanStats.closedShadowRootsDetected,
          hasResumeField: resumeInputs.length > 0,
        };
        sendResponse(payload);
      } catch (err) {
        sendResponse({ frameId: currentFrameId, fields: [], error: String(err) });
      }
      return true;
    }

    if (message.type === "FILL_FIELDS") {
      (async () => {
        try {
          const payload = message.payload as FillFieldsPayload & { profile?: any };
          const scanStats = scanFormFieldsWithStats();
          const autofillResult = await executeAutofill(scanStats.fields, payload.mappings, payload.profile || null);

          const resultPayload: FillResultPayload & { resumeUpload?: any } = {
            filledFieldIds: autofillResult.filledFieldIds,
            skippedFieldIds: autofillResult.skippedFieldIds,
            errors: autofillResult.errors,
            resumeUpload: autofillResult.resumeUpload,
          };
          sendResponse(resultPayload);
        } catch (err) {
          sendResponse({
            filledFieldIds: [],
            skippedFieldIds: [],
            errors: [{ fieldId: "global", errorCode: "FRAMEWORK_BLOCKED", message: String(err) }],
          });
        }
      })();
      return true;
    }
  });

  // Setup dynamic form watcher
  try {
    const mutationWatcher = new FormMutationWatcher(() => {
      try {
        const scanStats = scanFormFieldsWithStats();
        chrome.runtime.sendMessage({
          type: "SCAN_RESULT",
          payload: {
            frameId: currentFrameId,
            fields: scanStats.fields,
            closedShadowRootsDetected: scanStats.closedShadowRootsDetected,
          },
        }).catch(() => {
          // Ignore disconnected port errors
        });
      } catch {
        // Ignore context invalidation on reload
      }
    });

    mutationWatcher.start();
  } catch {
    // Ignore mutation observer errors
  }
})();
