export interface DispatchResult {
  success: boolean;
  valueRegistered: boolean;
  errorCode?: "FRAMEWORK_BLOCKED" | "CSP_BLOCKED" | "TYPE_MISMATCH";
}

/**
 * Sets input/textarea/select values by bypassing React/Vue synthetic wrapper overrides
 * and dispatching full bubbling and composed event chains (§8.6).
 */
export function setNativeValue(
  element: HTMLElement,
  value: string | boolean
): DispatchResult {
  try {
    let expectedValue = "";

    if (element instanceof HTMLInputElement) {
      if (element.type === "checkbox" || element.type === "radio") {
        const booleanVal =
          typeof value === "boolean" ? value : value === "true" || value === "1";
        const descriptor = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "checked"
        );
        if (descriptor && descriptor.set) {
          descriptor.set.call(element, booleanVal);
        } else {
          element.checked = booleanVal;
        }
      } else {
        expectedValue = String(value);
        const descriptor = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        );
        if (descriptor && descriptor.set) {
          descriptor.set.call(element, expectedValue);
        } else {
          element.value = expectedValue;
        }
      }
    } else if (element instanceof HTMLTextAreaElement) {
      expectedValue = String(value);
      const descriptor = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      );
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, expectedValue);
      } else {
        element.value = expectedValue;
      }
    } else if (element instanceof HTMLSelectElement) {
      expectedValue = String(value);
      const descriptor = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        "value"
      );
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, expectedValue);
      } else {
        element.value = expectedValue;
      }
    }

    // Dispatch full bubbling & composed event pipeline
    try {
      element.dispatchEvent(new FocusEvent("focus", { bubbles: true, composed: true }));

      // Dispatch InputEvent with insertText metadata for React 18/19 & modern web components
      const inputEvent = typeof InputEvent === "function"
        ? new InputEvent("input", {
            bubbles: true,
            composed: true,
            data: expectedValue,
            inputType: "insertText",
          })
        : new Event("input", { bubbles: true, composed: true });

      element.dispatchEvent(inputEvent);
      element.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      element.dispatchEvent(new FocusEvent("blur", { bubbles: true, composed: true }));
    } catch {
      // If synthetic event construction fails under strict CSP
      return {
        success: false,
        valueRegistered: false,
        errorCode: "CSP_BLOCKED",
      };
    }

    // Post-fill verification: Check if value registered on DOM element
    let registered = true;
    if (element instanceof HTMLInputElement) {
      if (element.type !== "checkbox" && element.type !== "radio" && expectedValue) {
        registered = element.value === expectedValue;
      }
    } else if (element instanceof HTMLTextAreaElement && expectedValue) {
      registered = element.value === expectedValue;
    }

    return {
      success: true,
      valueRegistered: registered,
      errorCode: registered ? undefined : "FRAMEWORK_BLOCKED",
    };
  } catch (err) {
    console.error("setNativeValue encountered an error:", err);
    return {
      success: false,
      valueRegistered: false,
      errorCode: "FRAMEWORK_BLOCKED",
    };
  }
}
