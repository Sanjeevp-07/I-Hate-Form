import { findBestOptionMatch } from "./dropdown-matcher";

export interface DispatchResult {
  success: boolean;
  valueRegistered: boolean;
  errorCode?: "FRAMEWORK_BLOCKED" | "CSP_BLOCKED" | "TYPE_MISMATCH";
}

export function injectGoogleFormsHelperStyles() {
  try {
    const styleId = "__ihateform_gform_styles__";
    if (typeof document !== "undefined" && !document.getElementById(styleId)) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.textContent = `
        .CDNmEc .ndJi5d,
        .CDNmEc .wGQFbe,
        .CDNmEc div[class*="ndJi5d"],
        .CDNmEc [data-placeholder],
        .CDNmEc span.M7eMe + div,
        .Xb9hP input.whsOnd:not([value=""]) + .ndJi5d,
        .Xb9hP textarea.KHxj8b:not([value=""]) + .ndJi5d,
        .Xb9hP input.whsOnd:not(:placeholder-shown) + .ndJi5d,
        .Xb9hP textarea.KHxj8b:not(:placeholder-shown) + .ndJi5d,
        .rFrNMe.CDNmEc .ndJi5d {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        .CDNmEc .RBEWZc,
        .CDNmEc .snByac,
        .CDNmEc div[jsname="ty0drd"] {
          display: none !important;
        }
      `;
      (document.head || document.documentElement)?.appendChild(styleEl);
    }
  } catch {}
}

export function applyGoogleFormsState(element: HTMLElement, expectedValue: string) {
  if (!expectedValue) return;

  injectGoogleFormsHelperStyles();

  // 1. Mark all ancestor Google Form containers with CDNmEc (content present) and k3XOCb
  let curr: HTMLElement | null = element;
  while (curr && curr !== document.body) {
    curr.classList.add("CDNmEc", "k3XOCb");
    curr.classList.remove("T2vT6b", "has-error", "is-invalid", "N0PJr");
    if (
      curr.classList.contains("Qr7Oae") ||
      curr.classList.contains("freebirdFormviewerViewNumberedItemContainer") ||
      curr.classList.contains("freebirdFormviewerViewFormCard")
    ) {
      break;
    }
    curr = curr.parentElement;
  }

  // 2. Hide Google Forms placeholder text element ("Your answer" / .ndJi5d / .wGQFbe)
  const questionCard =
    element.closest(
      '.Qr7Oae, [role="listitem"], .freebirdFormviewerViewNumberedItemContainer, .freebirdFormviewerViewFormCard, .geS5n'
    ) || element.parentElement;

  if (questionCard) {
    // Target Google Forms placeholder elements
    const placeholderEls = questionCard.querySelectorAll(
      '.ndJi5d, .wGQFbe, div[class*="ndJi5d"], div[class*="placeholder"], span[class*="placeholder"], [data-placeholder]'
    );
    placeholderEls.forEach((p) => {
      (p as HTMLElement).style.display = "none";
      (p as HTMLElement).style.visibility = "hidden";
      (p as HTMLElement).style.opacity = "0";
      (p as HTMLElement).style.pointerEvents = "none";
      p.setAttribute("aria-hidden", "true");
    });

    // Target any node containing "Your answer" directly
    const allDivs = questionCard.querySelectorAll("div, span, p");
    allDivs.forEach((d) => {
      if (d !== element && d.childElementCount === 0 && d.textContent?.trim().toLowerCase() === "your answer") {
        (d as HTMLElement).style.display = "none";
        (d as HTMLElement).style.visibility = "hidden";
        (d as HTMLElement).style.opacity = "0";
        (d as HTMLElement).style.pointerEvents = "none";
        d.setAttribute("aria-hidden", "true");
      }
    });

    // Remove Google Form error messages ("This is a required question")
    const errorAlerts = questionCard.querySelectorAll(
      '.RBEWZc, .snByac, .LXRPh, [role="alert"], div[jsname="ty0drd"]'
    );
    errorAlerts.forEach((ea) => {
      (ea as HTMLElement).style.display = "none";
    });
  }
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

        // Simulate user click & focus on the input element
        try {
          element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, composed: true }));
          element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, composed: true }));
          element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, composed: true }));
          element.focus();
        } catch {}

        // Try document.execCommand to simulate real keyboard text insertion
        try {
          if (typeof document !== "undefined" && typeof document.execCommand === "function") {
            element.focus();
            element.select();
            document.execCommand("insertText", false, expectedValue);
          }
        } catch {}

        const descriptor = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        );
        if (descriptor && descriptor.set) {
          descriptor.set.call(element, expectedValue);
        } else {
          element.value = expectedValue;
        }

        try {
          element.setAttribute("value", expectedValue);
          element.setAttribute("data-initial-value", expectedValue);
          (element as any).defaultValue = expectedValue;
        } catch {}

        // Apply Google Forms state (hide placeholder, remove error, add CDNmEc)
        applyGoogleFormsState(element, expectedValue);

        // Notify React's synthetic event system tracker if present
        const tracker = (element as any)._valueTracker;
        if (tracker && typeof tracker.setValue === "function") {
          tracker.setValue("");
        }

        // Invoke React internal onChange/onInput handler if present on fiber
        try {
          const reactKey = Object.keys(element).find(
            (k) => k.startsWith("__reactProps$") || k.startsWith("__reactEvents$") || k.startsWith("__reactFiber$")
          );
          if (reactKey) {
            const reactProps = (element as any)[reactKey];
            if (reactProps) {
              if (typeof reactProps.onChange === "function") {
                reactProps.onChange({ target: element, currentTarget: element, type: "change", bubbles: true });
              }
              if (typeof reactProps.onInput === "function") {
                reactProps.onInput({ target: element, currentTarget: element, type: "input", bubbles: true });
              }
            }
          }
        } catch {}

        // Check for combobox / custom dropdown parent container and sibling elements
        const parentContainer = element.closest(
          'div[class*="select"], div[class*="dropdown"], div[class*="combobox"], .form-group, .field-wrapper, .custom-select, div[class*="input"], div[class*="field"], div[class*="form-group"]'
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

      // Simulate user click & focus on the textarea element
      try {
        element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, composed: true }));
        element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, composed: true }));
        element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, composed: true }));
        element.focus();
      } catch {}

      // Try document.execCommand to simulate real keyboard text insertion
      try {
        if (typeof document !== "undefined" && typeof document.execCommand === "function") {
          element.focus();
          element.select();
          document.execCommand("insertText", false, expectedValue);
        }
      } catch {}

      const descriptor = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      );
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, expectedValue);
      } else {
        element.value = expectedValue;
      }

      try {
        element.setAttribute("value", expectedValue);
        element.setAttribute("data-initial-value", expectedValue);
        (element as any).defaultValue = expectedValue;
      } catch {}

      // Auto-grow textarea height for Google Forms & dynamic textareas
      try {
        element.style.height = "auto";
        if (element.scrollHeight) {
          element.style.height = `${element.scrollHeight}px`;
        }
      } catch {}

      // Apply Google Forms state (hide placeholder, remove error, add CDNmEc)
      applyGoogleFormsState(element, expectedValue);

      // Notify React's synthetic event system tracker if present
      const tracker = (element as any)._valueTracker;
      if (tracker && typeof tracker.setValue === "function") {
        tracker.setValue("");
      }
    } else if (
      element.getAttribute("role") === "radiogroup" ||
      element.getAttribute("role") === "group" ||
      element.getAttribute("role") === "radio" ||
      element.getAttribute("role") === "checkbox"
    ) {
      const strVal = String(value).toLowerCase().trim();
      const options = Array.from(
        element.querySelectorAll(
          '[role="radio"], [role="checkbox"], .docssharedWizToggleLabeledContainer, .appsMaterialWizToggleRadiogroupEl, .appsMaterialWizToggleCheckboxEl'
        )
      );
      const matchingOpt = options.find((opt) => {
        const optVal = (
          opt.getAttribute("data-value") ||
          opt.getAttribute("data-answer-value") ||
          opt.getAttribute("aria-label") ||
          opt.textContent ||
          ""
        ).toLowerCase().trim();
        return optVal === strVal || optVal.includes(strVal) || strVal.includes(optVal);
      });
      if (matchingOpt instanceof HTMLElement) {
        matchingOpt.click();
        matchingOpt.setAttribute("aria-checked", "true");
        matchingOpt.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
        matchingOpt.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
        matchingOpt.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        matchingOpt.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
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

        // Invoke React internal onChange on select fiber
        try {
          const reactKey = Object.keys(element).find(
            (k) => k.startsWith("__reactProps$") || k.startsWith("__reactEvents$") || k.startsWith("__reactFiber$")
          );
          if (reactKey) {
            const reactProps = (element as any)[reactKey];
            if (reactProps) {
              if (typeof reactProps.onChange === "function") {
                reactProps.onChange({ target: element, currentTarget: element, type: "change", bubbles: true });
              }
            }
          }
        } catch {}
      } else {
        selectMatched = false;
        expectedValue = String(value);
      }
    }

    // Dispatch full bubbling & composed event pipeline
    try {
      element.dispatchEvent(new FocusEvent("focusin", { bubbles: true, composed: true }));
      element.dispatchEvent(new FocusEvent("focus", { bubbles: true, composed: true }));

      if (element instanceof HTMLSelectElement) {
        // Standard change, input and mouse events for select elements
        element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
        element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
        element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        element.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
        element.dispatchEvent(new CustomEvent("ngModelChange", { bubbles: true, detail: expectedValue }));

        const selOption = element.options[element.selectedIndex];
        if (selOption) {
          try {
            selOption.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
            selOption.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
            selOption.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
          } catch {}
        }

        // Update custom dropdown wrappers
        const parentContainer = element.closest(
          'div[class*="select"], div[class*="dropdown"], div[class*="combobox"], .form-group, .field-wrapper, .custom-select, div[class*="input"], div[class*="field"], div[class*="form-group"]'
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
        // Dispatch Keyboard & Input events for input/textarea (including space key simulation)
        try {
          const keyChar = expectedValue ? expectedValue[0] : " ";
          element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: keyChar }));
          element.dispatchEvent(new KeyboardEvent("keypress", { bubbles: true, cancelable: true, key: keyChar }));
          element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: " ", code: "Space", keyCode: 32, which: 32 }));
          element.dispatchEvent(new KeyboardEvent("keypress", { bubbles: true, cancelable: true, key: " ", code: "Space", keyCode: 32, which: 32 }));
        } catch {}

        try {
          if (typeof InputEvent === "function") {
            element.dispatchEvent(
              new InputEvent("beforeinput", {
                bubbles: true,
                composed: true,
                cancelable: true,
                data: expectedValue,
                inputType: "insertText",
              })
            );
          }
        } catch {}

        const inputEvent = typeof InputEvent === "function"
          ? new InputEvent("input", {
              bubbles: true,
              composed: true,
              cancelable: true,
              data: expectedValue,
              inputType: "insertText",
            })
          : new Event("input", { bubbles: true, composed: true });

        element.dispatchEvent(inputEvent);

        try {
          if (typeof CompositionEvent === "function") {
            element.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: expectedValue }));
          }
        } catch {}

        try {
          const keyChar = expectedValue ? expectedValue[0] : " ";
          element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, cancelable: true, key: " ", code: "Space", keyCode: 32, which: 32 }));
          element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, cancelable: true, key: keyChar }));
        } catch {}

        element.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
        element.dispatchEvent(new CustomEvent("ngModelChange", { bubbles: true, detail: expectedValue }));

        // Try clicking matching dropdown option item in DOM if popup is rendered
        const parentContainer = element.closest(
          'div[class*="select"], div[class*="dropdown"], div[class*="combobox"], .form-group, .field-wrapper, .custom-select, div[class*="input"], div[class*="field"], div[class*="form-group"]'
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
      element.dispatchEvent(new FocusEvent("focusout", { bubbles: true, composed: true }));

      // Clear any validation error classes or message nodes and hide Google Forms placeholders
      if (expectedValue !== "") {
        applyGoogleFormsState(element, expectedValue);

        const parentField = element.closest('.form-group, .field-wrapper, div[class*="field"], div[class*="form-control"], div[class*="input"], div[class*="group"]') || element.parentElement;
        if (parentField) {
          parentField.classList.remove("has-error", "is-invalid", "invalid", "error");
          element.classList.remove("is-invalid", "invalid", "error");
          element.removeAttribute("aria-invalid");
          const errorNodes = parentField.querySelectorAll('.help-block, .invalid-feedback, .error-message, [role="alert"], span[class*="error"], div[class*="error"]');
          errorNodes.forEach((node) => {
            const txt = (node.textContent || "").toLowerCase();
            if (txt.includes("required") || txt.includes("property") || txt.includes("blank") || txt.includes("enter")) {
              (node as HTMLElement).style.display = "none";
            }
          });
        }
      }
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
