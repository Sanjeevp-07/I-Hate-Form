import { FieldDescriptor } from "@internship-copilot/types";
import { querySelectorAllDeepWithStats } from "./shadow-dom-walker";
import { extractFieldDescriptor } from "./field-detector";
import { FrameRegistry } from "./frame-registry";

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
].join(", ");

export function scanFormFieldsWithStats(): ScanResultWithStats {
  const frameMeta = FrameRegistry.initialize();
  const { matchedElements, closedShadowRootsDetected } = querySelectorAllDeepWithStats(
    FORM_ELEMENTS_SELECTOR
  );
  const descriptors: FieldDescriptor[] = [];
  const visitedElements = new Set<HTMLElement>();

  matchedElements.forEach((element, index) => {
    if (visitedElements.has(element)) {
      return;
    }
    visitedElements.add(element);

    // Skip non-data input types
    if (element instanceof HTMLInputElement) {
      const type = (element.type || "text").toLowerCase();
      if (["hidden", "submit", "button", "reset", "image"].includes(type)) {
        return;
      }
    }

    const isInsideModal = Boolean(
      element.closest(
        '[role="dialog"], dialog, .modal, .popup, [aria-modal="true"], div[class*="modal"], div[class*="popup"], div[class*="dialog"], div[class*="drawer"], div[class*="sheet"], div[class*="floating"], div[class*="window"], div[class*="portal"], div[class*="overlay"]'
      )
    );

    // Check visibility
    const style = window.getComputedStyle(element);
    const isStrictlyHidden = style.display === "none" || style.visibility === "hidden";

    if (isStrictlyHidden) {
      // If it's strictly hidden and has no dimensions, check if it's aria-hidden or truly inactive
      const rects = element.getClientRects();
      if (rects.length === 0 && !isInsideModal && !element.getAttribute("aria-hidden")) {
        return;
      }
      if (element.getAttribute("aria-hidden") === "true" && rects.length === 0) {
        return;
      }
    }

    const descriptor = extractFieldDescriptor(element, index);
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

