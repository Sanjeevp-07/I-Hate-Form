import { scanFormFieldsWithStats } from "./dom-scanner";
import { executeAutofill } from "./autofill-engine";
import { FrameRegistry } from "./frame-registry";
import { FormMutationWatcher } from "./mutation-observer";
import { ExtensionMessage, FillFieldsPayload, FillResultPayload, ScanResultPayload } from "../types";

// Initialize frame registry for this context
const frameMeta = FrameRegistry.initialize();
const currentFrameId = frameMeta.frameId;

// Listen for messages from background worker / sidepanel
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === "SCAN_FORM") {
    const scanStats = scanFormFieldsWithStats();
    const payload: ScanResultPayload & { closedShadowRootsDetected?: number } = {
      frameId: currentFrameId,
      fields: scanStats.fields,
      closedShadowRootsDetected: scanStats.closedShadowRootsDetected,
    };
    sendResponse(payload);
    return true;
  }

  if (message.type === "FILL_FIELDS") {
    const payload = message.payload as FillFieldsPayload;
    const scanStats = scanFormFieldsWithStats();
    const autofillResult = executeAutofill(scanStats.fields, payload.mappings);

    const resultPayload: FillResultPayload = {
      filledFieldIds: autofillResult.filledFieldIds,
      skippedFieldIds: autofillResult.skippedFieldIds,
      errors: autofillResult.errors,
    };
    sendResponse(resultPayload);
    return true;
  }
});

// Setup dynamic form watcher
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
    });
  } catch {
    // Ignore context invalidation on reload
  }
});

mutationWatcher.start();
