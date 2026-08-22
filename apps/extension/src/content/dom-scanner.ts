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

export function scanFormFieldsWithStats(): ScanResultWithStats {
  const frameMeta = FrameRegistry.initialize();
  const { matchedElements, closedShadowRootsDetected } = querySelectorAllDeepWithStats(
    "input, select, textarea"
  );
  const descriptors: FieldDescriptor[] = [];

  matchedElements.forEach((element, index) => {
    // Skip hidden inputs unless useful
    if (element instanceof HTMLInputElement && element.type === "hidden") {
      return;
    }

    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      if (!element.getAttribute("aria-hidden")) {
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
