import { FieldDescriptor } from "@internship-copilot/types";
import { querySelectorAllDeep } from "./shadow-dom-walker";

export interface ValidationSummary {
  totalRequired: number;
  filledRequired: number;
  emptyRequiredFields: FieldDescriptor[];
}

export function validateFormState(fields: FieldDescriptor[]): ValidationSummary {
  const allElements = querySelectorAllDeep("input, select, textarea");
  const requiredFields = fields.filter((f) => f.required);
  const emptyRequired: FieldDescriptor[] = [];

  for (const reqField of requiredFields) {
    const el = allElements.find(
      (e) =>
        (e.id && `#${e.id}` === reqField.domSelector) ||
        (e.getAttribute("name") &&
          `${e.tagName.toLowerCase()}[name="${e.getAttribute("name")}"]` === reqField.domSelector)
    );

    if (!el) {
      emptyRequired.push(reqField);
      continue;
    }

    if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox" || el.type === "radio") {
        if (!el.checked) emptyRequired.push(reqField);
      } else if (!el.value.trim()) {
        emptyRequired.push(reqField);
      }
    } else if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
      if (!el.value.trim()) {
        emptyRequired.push(reqField);
      }
    }
  }

  return {
    totalRequired: requiredFields.length,
    filledRequired: requiredFields.length - emptyRequired.length,
    emptyRequiredFields: emptyRequired,
  };
}
