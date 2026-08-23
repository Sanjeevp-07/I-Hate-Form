import { findBestOptionMatch } from "./dropdown-matcher";

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

    let selectMatched = true;

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

        // Date input normalization (HTML5 type="date" requires YYYY-MM-DD)
        if (element.type === "date" && expectedValue) {
          const parts = expectedValue.split(/[/.-]/);
          if (parts.length === 3) {
            if (parts[2].length === 4) {
              // DD/MM/YYYY -> YYYY-MM-DD
              expectedValue = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
            } else if (parts[0].length === 4) {
              // YYYY/MM/DD -> YYYY-MM-DD
              expectedValue = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
            }
          }
        }

        const descriptor = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        );
        if (descriptor && descriptor.set) {
          descriptor.set.call(element, expectedValue);
        } else {
          element.value = expectedValue;
        }

        // Notify React's synthetic event system tracker if present
        const tracker = (element as any)._valueTracker;
        if (tracker && typeof tracker.setValue === "function") {
          tracker.setValue("");
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

      // Notify React's synthetic event system tracker if present
      const tracker = (element as any)._valueTracker;
      if (tracker && typeof tracker.setValue === "function") {
        tracker.setValue("");
      }
    } else if (element instanceof HTMLSelectElement) {
      const matchResult = findBestOptionMatch(
        Array.from(element.options),
        value
      );

      if (matchResult && matchResult.matchedIndex >= 0) {
        const targetIndex = matchResult.matchedIndex;
        const matchedOption = element.options[targetIndex];

        for (let i = 0; i < element.options.length; i++) {
          const isTarget = i === targetIndex;
          element.options[i].selected = isTarget;
          if (isTarget) {
            element.options[i].setAttribute("selected", "selected");
          } else {
            element.options[i].removeAttribute("selected");
          }
        }

        element.selectedIndex = targetIndex;
        expectedValue = matchedOption ? (matchedOption.value !== undefined ? matchedOption.value : matchedOption.text) : matchResult.matchedValue;

        const descriptor = Object.getOwnPropertyDescriptor(
          window.HTMLSelectElement.prototype,
          "value"
        );
        if (descriptor && descriptor.set) {
          descriptor.set.call(element, expectedValue);
        } else {
          element.value = expectedValue;
        }

        // Ensure selectedIndex didn't get reset
        if (element.selectedIndex !== targetIndex) {
          element.selectedIndex = targetIndex;
        }

        // Notify React's select value tracker
        const tracker = (element as any)._valueTracker;
        if (tracker && typeof tracker.setValue === "function") {
          tracker.setValue("");
        }
      } else {
        selectMatched = false;
        expectedValue = String(value);
      }
    }

    // Dispatch full bubbling & composed event pipeline
    try {
      element.dispatchEvent(new FocusEvent("focus", { bubbles: true, composed: true }));

      if (element instanceof HTMLSelectElement) {
        // Standard change and input events for select elements
        element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        element.dispatchEvent(new Event("change", { bubbles: true, composed: true }));

        const selOption = element.options[element.selectedIndex];
        if (selOption) {
          try {
            selOption.dispatchEvent(new Event("change", { bubbles: true }));
            selOption.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          } catch {}
        }
      } else {
        // Dispatch InputEvent with insertText metadata for input/textarea
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
      }

      // Trigger jQuery / Select2 / Chosen custom events if page uses them
      try {
        element.dispatchEvent(new CustomEvent("select2:select", { bubbles: true }));
        element.dispatchEvent(new CustomEvent("chosen:updated", { bubbles: true }));
      } catch {}

      element.dispatchEvent(new FocusEvent("blur", { bubbles: true, composed: true }));
    } catch {
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
        registered = Boolean(element.value);
      }
    } else if (element instanceof HTMLTextAreaElement && expectedValue) {
      registered = Boolean(element.value);
    } else if (element instanceof HTMLSelectElement) {
      const curOptText = element.options[element.selectedIndex]?.text || "";
      const curVal = element.value || "";
      const isPlaceholder = !curVal && (curOptText.toLowerCase().includes("select") || curOptText.toLowerCase().includes("choose") || curOptText.toLowerCase().includes("please"));
      registered = selectMatched && element.selectedIndex >= 0 && !isPlaceholder;
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
