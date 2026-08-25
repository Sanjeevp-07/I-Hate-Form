import { FieldDescriptor } from "@internship-copilot/types";

/**
 * Robustly locates an element in the DOM matching a FieldDescriptor.
 * Supports:
 * - Direct tracking attribute (data-ihateform-id) stamped during scan
 * - DOM Selector / CSS selector
 * - ID and Name attributes
 * - Google Forms Question Container search (via question headings in .Qr7Oae, .geS5n, [role="listitem"])
 * - WAI-ARIA aria-labelledby resolution
 * - Placeholder match
 * - Aria-label match
 * - HTML <label> for / nesting match
 * - Filtered position index fallback within tag group
 */
export function locateElement(
  fieldDescriptor: FieldDescriptor,
  allElements: HTMLElement[],
  fields: FieldDescriptor[] = []
): HTMLElement | undefined {
  // 1. Direct tracking attribute match (highest precision)
  try {
    const byDataAttr = document.querySelector(`[data-ihateform-id="${fieldDescriptor.id}"]`);
    if (byDataAttr instanceof HTMLElement) {
      return byDataAttr;
    }
  } catch {}

  const inArrayByDataAttr = allElements.find(
    (el) => el.getAttribute("data-ihateform-id") === fieldDescriptor.id
  );
  if (inArrayByDataAttr) return inArrayByDataAttr;

  // 2. Query selector search
  if (fieldDescriptor.domSelector) {
    try {
      const found = document.querySelector(fieldDescriptor.domSelector);
      if (found instanceof HTMLElement) {
        return found;
      }
    } catch {}
  }

  // 3. Locate element by ID or Name attribute
  let target = allElements.find(
    (el) =>
      (el.id &&
        (`#${el.id}` === fieldDescriptor.domSelector ||
          el.id === fieldDescriptor.name ||
          el.id === fieldDescriptor.id)) ||
      (el.getAttribute("name") &&
        (`${el.tagName.toLowerCase()}[name="${el.getAttribute("name")}"]` === fieldDescriptor.domSelector ||
          el.getAttribute("name") === fieldDescriptor.name))
  );
  if (target) return target;

  // 4. Google Forms / Question Container search based on question heading and rawLabel
  if (fieldDescriptor.rawLabel) {
    const cleanTargetLabel = fieldDescriptor.rawLabel.replace(/[*:]/g, "").trim().toLowerCase();
    const normalizedTarget = (fieldDescriptor.normalizedLabel || cleanTargetLabel).toLowerCase();

    const questionContainers = Array.from(
      document.querySelectorAll(
        '.Qr7Oae, .geS5n, [role="listitem"], .freebirdFormviewerViewNumberedItemContainer, .freebirdFormviewerViewFormCard, .form-group, .field-wrapper'
      )
    );
    for (const q of questionContainers) {
      const heading = q.querySelector(
        '.M7eMe, [role="heading"], .HoPnR, [class*="title"], [class*="label"], div[dir="auto"], span'
      );
      if (heading && heading.textContent) {
        const headingText = heading.textContent.replace(/[*:]/g, "").trim().toLowerCase();
        if (
          headingText === cleanTargetLabel ||
          headingText.includes(cleanTargetLabel) ||
          cleanTargetLabel.includes(headingText) ||
          headingText === normalizedTarget
        ) {
          const inputInQ = q.querySelector(
            'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), textarea, select, [role="textbox"], [role="combobox"], [role="radiogroup"], [role="group"]'
          );
          if (inputInQ instanceof HTMLElement) {
            return inputInQ;
          }
        }
      }
    }
  }

  // 5. WAI-ARIA aria-labelledby lookup
  if (fieldDescriptor.rawLabel) {
    const cleanTargetLabel = fieldDescriptor.rawLabel.replace(/[*:]/g, "").trim().toLowerCase();
    const elementsWithAria = Array.from(document.querySelectorAll("[aria-labelledby]"));
    for (const el of elementsWithAria) {
      const labelledBy = el.getAttribute("aria-labelledby") || "";
      const ids = labelledBy.split(/\s+/).filter(Boolean);
      for (const refId of ids) {
        const refEl = document.getElementById(refId);
        if (refEl && refEl.textContent) {
          const refText = refEl.textContent.replace(/[*:]/g, "").trim().toLowerCase();
          if (
            refText === cleanTargetLabel ||
            refText.includes(cleanTargetLabel) ||
            cleanTargetLabel.includes(refText)
          ) {
            if (el instanceof HTMLElement) return el;
          }
        }
      }
    }
  }

  // 6. Placeholder match
  if (fieldDescriptor.placeholder) {
    target = allElements.find(
      (el) => el.getAttribute("placeholder")?.trim() === fieldDescriptor.placeholder?.trim()
    );
    if (target) return target;
  }

  // 7. Aria-label match
  if (fieldDescriptor.ariaLabel) {
    target = allElements.find(
      (el) => el.getAttribute("aria-label")?.trim() === fieldDescriptor.ariaLabel?.trim()
    );
    if (target) return target;
  }

  // 8. Label-based search (standard HTML <label>)
  if (fieldDescriptor.rawLabel) {
    const cleanTargetLabel = fieldDescriptor.rawLabel.replace(/[*:]/g, "").trim().toLowerCase();
    const labels = Array.from(document.querySelectorAll("label"));
    for (const lbl of labels) {
      const lblText = (lbl.textContent || "").replace(/[*:]/g, "").trim().toLowerCase();
      if (lblText === cleanTargetLabel || lblText.includes(cleanTargetLabel)) {
        const forId = lbl.getAttribute("for");
        if (forId) {
          const el = document.getElementById(forId);
          if (el && el.tagName.toLowerCase() === fieldDescriptor.tag.toLowerCase()) {
            return el;
          }
        }
        const childInput = lbl.querySelector(fieldDescriptor.tag);
        if (childInput instanceof HTMLElement) {
          return childInput;
        }
        const nextEl = lbl.nextElementSibling;
        if (nextEl) {
          if (nextEl.tagName.toLowerCase() === fieldDescriptor.tag.toLowerCase()) {
            return nextEl as HTMLElement;
          }
          const nested = nextEl.querySelector(fieldDescriptor.tag);
          if (nested instanceof HTMLElement) {
            return nested;
          }
        }
      }
    }
  }

  // 9. Fallback: match by index within tag group across active filtered data elements
  if (fields && fields.length > 0) {
    const sameTagElements = allElements.filter(
      (el) => el.tagName.toLowerCase() === fieldDescriptor.tag.toLowerCase()
    );
    const fieldIndexInTag = fields
      .filter((f) => f.tag.toLowerCase() === fieldDescriptor.tag.toLowerCase())
      .indexOf(fieldDescriptor);

    if (fieldIndexInTag >= 0 && sameTagElements[fieldIndexInTag]) {
      return sameTagElements[fieldIndexInTag];
    }

    // 10. Last fallback: match by position index across all form data elements
    const fieldIdx = fields.indexOf(fieldDescriptor);
    if (fieldIdx >= 0 && allElements[fieldIdx]) {
      return allElements[fieldIdx];
    }
  }

  return undefined;
}
