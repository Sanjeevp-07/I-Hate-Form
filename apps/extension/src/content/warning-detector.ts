import { FieldDescriptor } from "@internship-copilot/types";
import { locateElement } from "./element-locator";

export interface FieldValidationWarning {
  fieldId: string;
  rawLabel: string;
  domSelector: string;
  attemptedValue: string | boolean;
  warningMessage: string;
  fieldDescriptor: FieldDescriptor;
}

const ERROR_CLASS_PATTERN = /error|invalid|danger|warning|feedback|alert|help-block|form-text/i;
const ERROR_TEXT_PATTERN = /please enter|must be|invalid|required|only numbers|numbers only|digits|integer|enter a valid|in numbers|characters? allowed|this field is required|is a required property|cannot be blank|please select/i;

function isRedColor(colorStr: string): boolean {
  if (!colorStr) return false;
  const clean = colorStr.toLowerCase().trim();
  if (clean === "red" || clean.startsWith("#e") || clean.startsWith("#d") || clean.startsWith("#f") || clean.startsWith("#c")) {
    return true;
  }
  // Check rgb(2xx, <100, <100)
  const rgbMatch = clean.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    if (r > 150 && g < 120 && b < 120) {
      return true;
    }
  }
  return false;
}

/**
 * Inspects the DOM around a specific element to detect any rendered validation warning or error messages.
 */
export function detectElementWarning(element: HTMLElement): string | null {
  // 1. Native HTML5 validity check
  if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
    if (element.validity && !element.validity.valid && element.validationMessage) {
      return element.validationMessage;
    }
  }

  // 2. ARIA invalid / error message
  const isAriaInvalid = element.getAttribute("aria-invalid") === "true";
  const ariaErrorId = element.getAttribute("aria-errormessage") || element.getAttribute("aria-describedby");
  if (ariaErrorId) {
    const errorEl = document.getElementById(ariaErrorId);
    if (errorEl && errorEl.textContent?.trim()) {
      return errorEl.textContent.trim();
    }
  }

  // 3. Sibling inspection (immediate next or subsequent sibling)
  let sibling = element.nextElementSibling;
  let checks = 0;
  while (sibling && checks < 3) {
    const text = (sibling.textContent || "").trim();
    if (text) {
      const className = sibling.className ? String(sibling.className) : "";
      const isErrorClass = ERROR_CLASS_PATTERN.test(className) || sibling.getAttribute("role") === "alert";
      const isErrorText = ERROR_TEXT_PATTERN.test(text);

      let isRed = false;
      if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
        try {
          const style = window.getComputedStyle(sibling);
          isRed = isRedColor(style.color);
        } catch {}
      }

      if (isErrorClass || isErrorText || isRed || isAriaInvalid) {
        return text;
      }
    }
    sibling = sibling.nextElementSibling;
    checks++;
  }

  // 4. Parent container inspection
  const parent = element.parentElement;
  if (parent) {
    // Look for dedicated error elements inside parent
    const potentialErrorEls = Array.from(parent.querySelectorAll('*'));
    for (const subEl of potentialErrorEls) {
      if (subEl === element || subEl.contains(element)) continue;
      const text = (subEl.textContent || "").trim();
      if (!text || text.length > 200) continue;

      const className = subEl.className ? String(subEl.className) : "";
      const isErrorClass = ERROR_CLASS_PATTERN.test(className) || subEl.getAttribute("role") === "alert";
      const isErrorText = ERROR_TEXT_PATTERN.test(text);

      let isRed = false;
      if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
        try {
          const style = window.getComputedStyle(subEl);
          isRed = isRedColor(style.color);
        } catch {}
      }

      if (isErrorClass || isErrorText || isRed) {
        return text;
      }
    }
  }

  return null;
}

/**
 * Scans all fields in the form to detect if any field triggered a validation warning or is missing a required value.
 */
export function detectFieldValidationWarnings(
  fields: FieldDescriptor[],
  filledValues: Map<string, string | boolean>,
  allElements: HTMLElement[]
): FieldValidationWarning[] {
  const warnings: FieldValidationWarning[] = [];

  for (const field of fields) {
    const filledVal = filledValues.get(field.id) ?? "";

    const target = locateElement(field, allElements, fields);
    if (!target) continue;

    let warningText = detectElementWarning(target);

    // Check if required select dropdown is left unselected / placeholder
    if (!warningText && target instanceof HTMLSelectElement) {
      const curOptText = target.options[target.selectedIndex]?.text?.toLowerCase() || "";
      const curVal = target.value || "";
      if (target.selectedIndex <= 0 || !curVal || curOptText.includes("select") || curOptText.includes("choose")) {
        if (field.required || field.rawLabel.includes("*")) {
          warningText = "This field is required.";
        }
      }
    }

    if (warningText) {
      warnings.push({
        fieldId: field.id,
        rawLabel: field.rawLabel,
        domSelector: field.domSelector,
        attemptedValue: filledVal,
        warningMessage: warningText,
        fieldDescriptor: field,
      });
    }
  }

  return warnings;
}
