import { FieldDescriptor } from "@internship-copilot/types";
import { querySelectorAllDeepWithStats } from "./shadow-dom-walker";
import { extractFieldDescriptor } from "./field-detector";
import { FrameRegistry } from "./frame-registry";
import { isFileInputActive } from "./resume-uploader";

export interface ScanResultWithStats {
  frameId: number;
  isTopFrame: boolean;
  isCrossOriginFrame: boolean;
  fields: FieldDescriptor[];
  closedShadowRootsDetected: number;
}

const FORM_ELEMENTS_SELECTOR = [
  "input",
  "select",
  "textarea",
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="searchbox"]',
  '[role="spinbutton"]',
  '[contenteditable="true"]',
  '[contenteditable=""]',
  '[role="button"][aria-label*="Add file" i]',
  '[role="button"][aria-label*="Add File" i]',
  '[role="button"][aria-label*="Upload" i]',
  '.Qr7Oae [role="button"]',
  'div[class*="dropzone"]',
  'div[class*="file-upload"]',
].join(", ");

export function scanFormFieldsWithStats(): ScanResultWithStats {
  const frameMeta = FrameRegistry.initialize();
  const { matchedElements, closedShadowRootsDetected } = querySelectorAllDeepWithStats(
    FORM_ELEMENTS_SELECTOR
  );
  const descriptors: FieldDescriptor[] = [];
  const visitedElements = new Set<HTMLElement>();

  matchedElements.forEach((element) => {
    if (visitedElements.has(element)) {
      return;
    }
    visitedElements.add(element);

    // Skip non-data input types (except file inputs)
    if (element instanceof HTMLInputElement) {
      const type = (element.type || "text").toLowerCase();
      if (["hidden", "submit", "button", "reset", "image"].includes(type)) {
        return;
      }
    }

    // Filter out non-file buttons that matched generic selectors
    if (element.getAttribute("role") === "button" || element.tagName.toLowerCase() === "button") {
      const ariaLabel = (element.getAttribute("aria-label") || "").toLowerCase();
      const text = (element.textContent || "").toLowerCase();
      const parentListItem = element.closest('.Qr7Oae, [role="listitem"], .geS5n');
      const isGoogleFormsAddFile = parentListItem && (
        ariaLabel.includes("add file") ||
        text.includes("add file") ||
        parentListItem.textContent?.toLowerCase().includes("upload 1 supported file") ||
        parentListItem.textContent?.toLowerCase().includes("supported file")
      );
      const isUploadBtn = ariaLabel.includes("add file") || ariaLabel.includes("upload") || text.includes("add file") || text.includes("upload resume") || text.includes("upload cv");
      
      if (!isGoogleFormsAddFile && !isUploadBtn) {
        return;
      }
    }

    const isInsideModal = Boolean(
      element.closest(
        '[role="dialog"], dialog, .modal, .popup, [aria-modal="true"], div[class*="modal"], div[class*="popup"], div[class*="dialog"], div[class*="drawer"], div[class*="sheet"], div[class*="floating"], div[class*="window"], div[class*="portal"], div[class*="overlay"]'
      )
    );

    const isFileInput = element instanceof HTMLInputElement && element.type === "file";

    // For file inputs: custom ATS forms hide native <input type="file"> via display:none or opacity:0.
    // As long as the file input is active (not inside a hidden wizard step), don't discard it.
    if (isFileInput) {
      if (!isFileInputActive(element)) {
        return;
      }
    } else {
      // Check visibility for standard elements
      const style = window.getComputedStyle(element);
      const isStrictlyHidden = style.display === "none" || style.visibility === "hidden";

      if (isStrictlyHidden) {
        const rects = element.getClientRects();
        if (rects.length === 0 && !isInsideModal && !element.getAttribute("aria-hidden")) {
          return;
        }
        if (element.getAttribute("aria-hidden") === "true" && rects.length === 0) {
          return;
        }
      }
    }

    const descriptor = extractFieldDescriptor(element, descriptors.length);
    try {
      element.setAttribute("data-ihateform-id", descriptor.id);
    } catch {}
    descriptors.push(descriptor);
  });

  return {
    frameId: frameMeta.frameId,
    isTopFrame: frameMeta.isTop,
    isCrossOriginFrame: frameMeta.isCrossOrigin,
    fields: descriptors,
    closedShadowRootsDetected,
  };
}

export function scanFormFields(): FieldDescriptor[] {
  return scanFormFieldsWithStats().fields;
}

