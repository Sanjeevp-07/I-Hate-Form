import { FieldDescriptor, FieldError, FieldMapping, UserProfile } from "@internship-copilot/types";
import { querySelectorAllDeep } from "./shadow-dom-walker";
import { setNativeValue } from "./event-dispatcher";
import { autoUploadResume, ResumeUploadResult } from "./resume-uploader";

export interface AutofillResult {
  filledFieldIds: string[];
  skippedFieldIds: string[];
  errors: FieldError[];
  resumeUpload?: ResumeUploadResult;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function executeAutofill(
  fields: FieldDescriptor[],
  mappings: FieldMapping[],
  profile: UserProfile | null = null
): Promise<AutofillResult> {
  const result: AutofillResult = {
    filledFieldIds: [],
    skippedFieldIds: [],
    errors: [],
  };

  // STEP 1: Scan and upload Resume PDF as the VERY FIRST task before filling any field
  try {
    const resumeRes = autoUploadResume(profile);
    result.resumeUpload = resumeRes;
  } catch (err) {
    console.warn("Resume auto-upload encountered an error:", err);
  }

  // STEP 2: Sort mappings so primary country/dial fields fill before dependent state/nationality fields
  const prioritizedMappings = [...mappings].sort((a, b) => {
    const isPrimaryCountryA =
      a.profilePath === "personal.country" ||
      a.profilePath === "personal.countryCode" ||
      a.rawLabel?.toLowerCase() === "country*" ||
      a.rawLabel?.toLowerCase() === "country" ||
      a.rawLabel?.toLowerCase().includes("country code");

    const isPrimaryCountryB =
      b.profilePath === "personal.country" ||
      b.profilePath === "personal.countryCode" ||
      b.rawLabel?.toLowerCase() === "country*" ||
      b.rawLabel?.toLowerCase() === "country" ||
      b.rawLabel?.toLowerCase().includes("country code");

    const isDependentA =
      a.profilePath === "personal.state" ||
      a.profilePath === "personal.nationality" ||
      a.rawLabel?.toLowerCase().includes("state") ||
      a.rawLabel?.toLowerCase().includes("province");

    const isDependentB =
      b.profilePath === "personal.state" ||
      b.profilePath === "personal.nationality" ||
      b.rawLabel?.toLowerCase().includes("state") ||
      b.rawLabel?.toLowerCase().includes("province");

    if (isPrimaryCountryA && isDependentB) return -1;
    if (isDependentA && isPrimaryCountryB) return 1;
    return 0;
  });

  const pendingSelectRetries: Array<{ fieldDescriptor: FieldDescriptor; mapping: FieldMapping }> = [];

  const locateElement = (fieldDescriptor: FieldDescriptor, allElements: HTMLElement[]): HTMLElement | undefined => {
    // 1. Locate element by ID or Name attribute
    let target = allElements.find(
      (el) =>
        (el.id && (`#${el.id}` === fieldDescriptor.domSelector || el.id === fieldDescriptor.name || el.id === fieldDescriptor.id)) ||
        (el.getAttribute("name") &&
          (`${el.tagName.toLowerCase()}[name="${el.getAttribute("name")}"]` ===
            fieldDescriptor.domSelector ||
            el.getAttribute("name") === fieldDescriptor.name))
    );

    // 2. Query selector search
    if (!target && fieldDescriptor.domSelector) {
      try {
        const found = document.querySelector(fieldDescriptor.domSelector);
        if (found instanceof HTMLElement) {
          target = found;
        }
      } catch {}
    }

    // 3. Label-based search
    if (!target && fieldDescriptor.rawLabel) {
      const cleanTargetLabel = fieldDescriptor.rawLabel.replace(/[*:]/g, "").trim().toLowerCase();
      const labels = Array.from(document.querySelectorAll("label"));
      for (const lbl of labels) {
        const lblText = (lbl.textContent || "").replace(/[*:]/g, "").trim().toLowerCase();
        if (lblText === cleanTargetLabel || lblText.includes(cleanTargetLabel)) {
          // Check for label htmlFor
          const forId = lbl.getAttribute("for");
          if (forId) {
            const el = document.getElementById(forId);
            if (el && el.tagName.toLowerCase() === fieldDescriptor.tag.toLowerCase()) {
              target = el;
              break;
            }
          }
          // Check child inputs
          const childInput = lbl.querySelector(fieldDescriptor.tag);
          if (childInput instanceof HTMLElement) {
            target = childInput;
            break;
          }
          // Check next sibling
          const nextEl = lbl.nextElementSibling;
          if (nextEl) {
            if (nextEl.tagName.toLowerCase() === fieldDescriptor.tag.toLowerCase()) {
              target = nextEl as HTMLElement;
              break;
            }
            const nested = nextEl.querySelector(fieldDescriptor.tag);
            if (nested instanceof HTMLElement) {
              target = nested;
              break;
            }
          }
        }
      }
    }

    // 4. Fallback: match by index within tag group
    if (!target) {
      const sameTagElements = allElements.filter(
        (el) => el.tagName.toLowerCase() === fieldDescriptor.tag.toLowerCase()
      );
      const fieldIndexInTag = fields
        .filter((f) => f.tag.toLowerCase() === fieldDescriptor.tag.toLowerCase())
        .indexOf(fieldDescriptor);

      if (fieldIndexInTag >= 0 && sameTagElements[fieldIndexInTag]) {
        target = sameTagElements[fieldIndexInTag];
      }
    }

    // 5. Last fallback: match by position index across all form elements
    if (!target) {
      const fieldIdx = fields.indexOf(fieldDescriptor);
      if (fieldIdx >= 0 && allElements[fieldIdx]) {
        target = allElements[fieldIdx];
      }
    }

    return target;
  };

  const allDOMElements = querySelectorAllDeep("input, select, textarea");

  // First pass: fill fields
  for (const mapping of prioritizedMappings) {
    const fieldDescriptor = fields.find((f) => f.id === mapping.fieldId);
    if (!fieldDescriptor) {
      result.errors.push({
        fieldId: mapping.fieldId,
        errorCode: "ELEMENT_NOT_FOUND",
        message: "Field descriptor not found in active session",
      });
      continue;
    }

    if (mapping.action !== "fill" || mapping.valueToFill === null || mapping.valueToFill === undefined) {
      result.skippedFieldIds.push(mapping.fieldId);
      continue;
    }

    const targetElement = locateElement(fieldDescriptor, allDOMElements);

    if (!targetElement) {
      result.errors.push({
        fieldId: mapping.fieldId,
        errorCode: "ELEMENT_NOT_FOUND",
        message: `Could not locate DOM element for selector ${fieldDescriptor.domSelector}`,
      });
      continue;
    }

    const dispatchResult = setNativeValue(targetElement, mapping.valueToFill as string | boolean);

    if (dispatchResult.success && dispatchResult.valueRegistered) {
      result.filledFieldIds.push(mapping.fieldId);
    } else {
      if (targetElement instanceof HTMLSelectElement) {
        // Queue for multi-stage retry
        pendingSelectRetries.push({ fieldDescriptor, mapping });
      } else {
        result.errors.push({
          fieldId: mapping.fieldId,
          errorCode: dispatchResult.errorCode || "FRAMEWORK_BLOCKED",
          message:
            dispatchResult.errorCode === "CSP_BLOCKED"
              ? "Content Security Policy blocked synthetic event dispatch"
              : "Framework synthetic state rejected programmatic input; manual review required",
        });
      }
    }
  }

  // Immediate retry pass for dropdowns that populated synchronously
  if (pendingSelectRetries.length > 0) {
    const refreshed = querySelectorAllDeep("input, select, textarea");
    const stillPending: Array<{ fieldDescriptor: FieldDescriptor; mapping: FieldMapping }> = [];
    for (const item of pendingSelectRetries) {
      const el = locateElement(item.fieldDescriptor, refreshed);
      if (el && el instanceof HTMLSelectElement) {
        const retry = setNativeValue(el, item.mapping.valueToFill as string | boolean);
        if (retry.success && retry.valueRegistered) {
          result.filledFieldIds.push(item.mapping.fieldId);
          continue;
        }
      }
      stillPending.push(item);
    }
    pendingSelectRetries.length = 0;
    pendingSelectRetries.push(...stillPending);
  }

  // STEP 3: Multi-stage retry for dependent select dropdowns that loaded options asynchronously
  if (pendingSelectRetries.length > 0) {
    await sleep(200); // Wait for AJAX/DOM option updates
    const refreshedElements = querySelectorAllDeep("input, select, textarea");
    const stillPending: Array<{ fieldDescriptor: FieldDescriptor; mapping: FieldMapping }> = [];

    for (const item of pendingSelectRetries) {
      const targetElement = locateElement(item.fieldDescriptor, refreshedElements);
      if (targetElement && targetElement instanceof HTMLSelectElement) {
        const retryResult = setNativeValue(targetElement, item.mapping.valueToFill as string | boolean);
        if (retryResult.success && retryResult.valueRegistered) {
          if (!result.filledFieldIds.includes(item.mapping.fieldId)) {
            result.filledFieldIds.push(item.mapping.fieldId);
          }
          continue;
        }
      }
      stillPending.push(item);
    }

    if (stillPending.length > 0) {
      await sleep(300); // Second wait for slower AJAX calls
      const lateElements = querySelectorAllDeep("input, select, textarea");
      for (const { fieldDescriptor, mapping } of stillPending) {
        const targetElement = locateElement(fieldDescriptor, lateElements);
        if (targetElement && targetElement instanceof HTMLSelectElement) {
          const lateRetry = setNativeValue(targetElement, mapping.valueToFill as string | boolean);
          if (lateRetry.success && lateRetry.valueRegistered) {
            if (!result.filledFieldIds.includes(mapping.fieldId)) {
              result.filledFieldIds.push(mapping.fieldId);
            }
            continue;
          }
        }

        result.errors.push({
          fieldId: mapping.fieldId,
          errorCode: "FRAMEWORK_BLOCKED",
          message: "Dropdown options could not be matched after DOM update; manual selection required",
        });
      }
    }
  }

  // STEP 4: Final verification & reconciliation across ALL select fields to ensure no field was reset by cascade
  const finalElements = querySelectorAllDeep("select");
  for (const mapping of mappings) {
    if (mapping.action !== "fill" || !mapping.valueToFill) continue;
    const fieldDescriptor = fields.find((f) => f.id === mapping.fieldId);
    if (!fieldDescriptor || fieldDescriptor.tag.toLowerCase() !== "select") continue;

    const selectEl = locateElement(fieldDescriptor, finalElements);
    if (selectEl && selectEl instanceof HTMLSelectElement) {
      const curOptText = selectEl.options[selectEl.selectedIndex]?.text || "";
      const curVal = selectEl.value || "";
      const isPlaceholder = !curVal && (curOptText.toLowerCase().includes("select") || curOptText.toLowerCase().includes("choose") || curOptText.toLowerCase().includes("please"));
      if (selectEl.selectedIndex <= 0 || isPlaceholder) {
        // Re-apply select value
        const reconcilRes = setNativeValue(selectEl, mapping.valueToFill as string | boolean);
        if (reconcilRes.success && reconcilRes.valueRegistered) {
          if (!result.filledFieldIds.includes(mapping.fieldId)) {
            result.filledFieldIds.push(mapping.fieldId);
          }
        }
      }
    }
  }

  return result;
}
