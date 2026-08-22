import { FieldDescriptor, FieldError, FieldMapping } from "@internship-copilot/types";
import { querySelectorAllDeep } from "./shadow-dom-walker";
import { setNativeValue } from "./event-dispatcher";

export interface AutofillResult {
  filledFieldIds: string[];
  skippedFieldIds: string[];
  errors: FieldError[];
}

export function executeAutofill(
  fields: FieldDescriptor[],
  mappings: FieldMapping[]
): AutofillResult {
  const result: AutofillResult = {
    filledFieldIds: [],
    skippedFieldIds: [],
    errors: [],
  };

  const allDOMElements = querySelectorAllDeep("input, select, textarea");

  for (const mapping of mappings) {
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

    // Locate element in DOM
    const targetElement = allDOMElements.find(
      (el) =>
        (el.id && `#${el.id}` === fieldDescriptor.domSelector) ||
        (el.getAttribute("name") &&
          `${el.tagName.toLowerCase()}[name="${el.getAttribute("name")}"]` ===
            fieldDescriptor.domSelector)
    );

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

  return result;
}
