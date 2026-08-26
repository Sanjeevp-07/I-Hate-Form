import { FieldDescriptor } from "@internship-copilot/types";
import { querySelectorAllDeepWithStats } from "./shadow-dom-walker";
import {
  extractFieldDescriptor,
  getQuestionCardContainer,
  findQuestionHeadingInContainer,
  extractOptionsFromContainer,
  normalizeLabel,
} from "./field-detector";
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
  '[role="radiogroup"]',
  '[role="group"]',
  '[role="radio"]',
  '[role="checkbox"]',
  '.SGkqec',
  '.Y62e3c',
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
  const scannedGroupContainers = new Set<HTMLElement>();

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

    const role = element.getAttribute("role");

    // 1. Unified Radio and Checkbox Question Card Handling
    const isRadioOrCheckbox =
      (element instanceof HTMLInputElement && (element.type === "radio" || element.type === "checkbox")) ||
      role === "radio" ||
      role === "checkbox" ||
      role === "radiogroup" ||
      role === "group" ||
      element.classList.contains("SGkqec") ||
      element.classList.contains("Y62e3c");

    if (isRadioOrCheckbox) {
      const questionCard = getQuestionCardContainer(element);

      if (scannedGroupContainers.has(questionCard)) {
        return;
      }
      scannedGroupContainers.add(questionCard);

      const radioCount = questionCard.querySelectorAll('[role="radio"], input[type="radio"]').length;
      const checkboxCount = questionCard.querySelectorAll('[role="checkbox"], input[type="checkbox"]').length;

      // Mark all inner option elements and toggle containers as visited
      questionCard
        .querySelectorAll(
          '[role="radio"], [role="checkbox"], input[type="radio"], input[type="checkbox"], .docssharedWizTogglelabeledContainer, .nWQGrd, .e3Duub, .appsMaterialWizToggleRadiogroupEl, .appsMaterialWizToggleCheckboxEl, .uHMk8b'
        )
        .forEach((child) => {
          if (child instanceof HTMLElement) visitedElements.add(child);
        });

      const targetGroupEl = (questionCard.querySelector('[role="radiogroup"], [role="group"], .SGkqec, .Y62e3c') || questionCard) as HTMLElement;
      const descriptor = extractFieldDescriptor(targetGroupEl, descriptors.length);

      if (radioCount > 0) {
        descriptor.type = "radio";
      } else if (checkboxCount > 0) {
        descriptor.type = "checkbox";
      }

      const questionTitle = findQuestionHeadingInContainer(questionCard);
      if (questionTitle) {
        descriptor.rawLabel = questionTitle;
        descriptor.normalizedLabel = normalizeLabel(questionTitle);
      }

      descriptor.options = extractOptionsFromContainer(questionCard, descriptor.type);

      try {
        targetGroupEl.setAttribute("data-ihateform-id", descriptor.id);
        questionCard.setAttribute("data-ihateform-id", descriptor.id);
        questionCard
          .querySelectorAll('[role="radio"], [role="checkbox"], input[type="radio"], input[type="checkbox"]')
          .forEach((c) => c.setAttribute("data-ihateform-id", descriptor.id));
      } catch {}

      descriptors.push(descriptor);
      return;
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

