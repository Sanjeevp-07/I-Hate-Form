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
      expectedValue = String(value).trim();
      const lowerVal = expectedValue.toLowerCase();

      // Advanced prioritized option matching
      let matchedOption: HTMLOptionElement | null = null;
      let highestScore = -1;

      for (let i = 0; i < element.options.length; i++) {
        const opt = element.options[i];
        const optVal = opt.value.toLowerCase().trim();
        const optText = opt.text.toLowerCase().trim();

        // Skip placeholder options like "Please Select", "Select Country", "--"
        if (i === 0 && (optText.includes("select") || optText === "-" || optText === "")) {
          continue;
        }

        let score = 0;

        // 1. Exact match on value or text
        if (optVal === lowerVal || optText === lowerVal) {
          score = 100;
        }
        // 2. Dial / Country code specific matching
        else if (lowerVal === "+91" || lowerVal === "91") {
          if (optText.includes("(+91)") || optText.includes("+91") || optVal === "+91" || optVal === "91") {
            score = 95;
          } else if (optText.includes("india")) {
            score = 90;
          }
        }
        // 3. Gender matching
        else if (lowerVal === "male") {
          if (optText === "male" || optVal === "male" || optVal === "m") {
            score = 95;
          } else if (optText.startsWith("male")) {
            score = 90;
          }
        } else if (lowerVal === "female") {
          if (optText === "female" || optVal === "female" || optVal === "f") {
            score = 95;
          }
        }
        // 4. Title matching
        else if (lowerVal === "mr." || lowerVal === "mr") {
          if (optText === "mr." || optText === "mr" || optVal === "mr." || optVal === "mr") {
            score = 95;
          }
        }
        // 5. Nationality & Country matching
        else if (lowerVal === "indian" || lowerVal === "india") {
          if (optText === "india" || optText === "indian" || optVal === "india" || optVal === "indian" || optVal === "ind" || optVal === "in") {
            score = 95;
          } else if (optText.includes("india") || optText.includes("indian")) {
            score = 80;
          }
        }
        // 6. State matching
        else if (lowerVal === "uttar pradesh") {
          if (optText === "uttar pradesh" || optVal === "uttar pradesh" || optVal === "up") {
            score = 95;
          } else if (optText.includes("uttar pradesh")) {
            score = 85;
          }
        }
        // 7. General word boundary / inclusion match
        else if (optText.includes(lowerVal) || optVal.includes(lowerVal)) {
          score = 50;
        }

        if (score > highestScore) {
          highestScore = score;
          matchedOption = opt;
        }
      }

      if (matchedOption && highestScore > 0) {
        for (let i = 0; i < element.options.length; i++) {
          element.options[i].selected = element.options[i] === matchedOption;
        }
        element.selectedIndex = matchedOption.index;
        expectedValue = matchedOption.value;

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

      if (element instanceof HTMLSelectElement) {
        element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
        element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
        element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      }

      element.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
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
      registered = element.selectedIndex >= 0;
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
