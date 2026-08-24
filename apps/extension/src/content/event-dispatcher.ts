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

        // Check for combobox / custom dropdown parent container and sibling elements
        const parentContainer = element.closest(
          'div[class*="select"], div[class*="dropdown"], div[class*="combobox"], .form-group, .field-wrapper, .custom-select, div[class*="input"], div[class*="field"]'
        );
        if (parentContainer) {
          const hiddenSelect = parentContainer.querySelector("select");
          if (hiddenSelect && (hiddenSelect as any) !== element) {
            setNativeValue(hiddenSelect, expectedValue);
          }
          const customTextSpan = parentContainer.querySelector(
            '.select-value, .dropdown-text, .selected-value, .filter-option-inner-inner, span[class*="label"], span[class*="text"], span[class*="value"], .selected-option'
          );
          if (customTextSpan) {
            customTextSpan.textContent = expectedValue.includes("months") ? expectedValue : (expectedValue === "0" ? "0 months" : expectedValue);
          }
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
        expectedValue = matchedOption ? (matchedOption.value !== undefined && matchedOption.value !== "" ? matchedOption.value : matchedOption.text) : matchResult.matchedValue;

        const descriptor = Object.getOwnPropertyDescriptor(
          window.HTMLSelectElement.prototype,
          "value"
        );
        if (descriptor && descriptor.set && expectedValue) {
          try {
            descriptor.set.call(element, expectedValue);
          } catch {}
        } else if (expectedValue) {
          element.value = expectedValue;
        }

        // Ensure selectedIndex didn't get reset
        element.selectedIndex = targetIndex;
        if (matchedOption) {
          matchedOption.selected = true;
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
        // Standard change, input and mouse events for select elements
        element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
        element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
        element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        element.dispatchEvent(new Event("change", { bubbles: true, composed: true }));

        const selOption = element.options[element.selectedIndex];
        if (selOption) {
          try {
            selOption.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
            selOption.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
            selOption.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
          } catch {}
        }

        // Update custom dropdown wrappers (e.g. Phenom People / custom styled select / Bootstrap)
        const parentContainer = element.closest(
          'div[class*="select"], div[class*="dropdown"], div[class*="combobox"], .form-group, .field-wrapper, .custom-select, div[class*="input"], div[class*="field"]'
        );
        if (parentContainer) {
          parentContainer.dispatchEvent(new Event("input", { bubbles: true }));
          parentContainer.dispatchEvent(new Event("change", { bubbles: true }));
          const customTextSpan = parentContainer.querySelector(
            '.select-value, .dropdown-text, .selected-value, .filter-option-inner-inner, span[class*="label"], span[class*="text"], span[class*="value"], .selected-option'
          );
          if (customTextSpan && selOption) {
            customTextSpan.textContent = selOption.text;
          }
          const siblingInput = parentContainer.querySelector("input");
          if (siblingInput && (siblingInput as any) !== element) {
            try {
              const inputDesc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
              if (inputDesc && inputDesc.set) {
                inputDesc.set.call(siblingInput, selOption?.text || expectedValue);
              } else {
                siblingInput.value = selOption?.text || expectedValue;
              }
              siblingInput.dispatchEvent(new Event("input", { bubbles: true }));
              siblingInput.dispatchEvent(new Event("change", { bubbles: true }));
            } catch {}
          }
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

        // Try clicking matching dropdown option item in DOM if popup is rendered
        const parentContainer = element.closest(
          'div[class*="select"], div[class*="dropdown"], div[class*="combobox"], .form-group, .field-wrapper, .custom-select, div[class*="input"], div[class*="field"]'
        );
        if (parentContainer) {
          const listItems = Array.from(
            document.querySelectorAll('[role="option"], .dropdown-item, .select-option, li[data-value], div[class*="option"]')
          ) as HTMLElement[];
          const targetOptText = expectedValue.includes("months") ? expectedValue : (expectedValue === "0" ? "0 months" : expectedValue);
          const matchedLi = listItems.find((li) => {
            const liText = (li.textContent || "").trim().toLowerCase();
            return liText === targetOptText.toLowerCase() || liText === expectedValue.toLowerCase();
          });
          if (matchedLi) {
            try {
              matchedLi.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
              matchedLi.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
              matchedLi.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
            } catch {}
          }
        }
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
