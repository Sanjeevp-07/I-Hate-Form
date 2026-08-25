import { FieldDescriptor, FormElementType, FormSelectOption } from "@internship-copilot/types";
import { FrameRegistry } from "./frame-registry";

function computeHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

function findLabelForElement(element: HTMLElement): string {
  // 1. Associated label via htmlFor within the same root node (document or ShadowRoot)
  const id = element.getAttribute("id");
  const rootNode = element.getRootNode() as Document | ShadowRoot;
  if (id && rootNode && typeof rootNode.querySelector === "function") {
    const labelEl = rootNode.querySelector(`label[for="${id}"]`);
    if (labelEl && labelEl.textContent) {
      return labelEl.textContent.trim();
    }
  }

  // 2. Parent label element
  const parentLabel = element.closest("label");
  if (parentLabel && parentLabel.textContent) {
    return parentLabel.textContent.replace(element.textContent || "", "").trim();
  }

  // 3. aria-label or aria-labelledby (handles space-separated IDs like Google Forms "i1 i4")
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel.trim();

  const ariaLabelledBy = element.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const ids = ariaLabelledBy.split(/\s+/).filter(Boolean);
    const textPieces = ids
      .map((id) => {
        const el = document.getElementById(id);
        return el ? el.textContent?.trim() : "";
      })
      .filter(Boolean);
    if (textPieces.length > 0) {
      return textPieces.join(" ");
    }
  }

  // 4. Placeholder (if not a generic placeholder like "Please Select" or "Enter value")
  const placeholder = element.getAttribute("placeholder");
  if (placeholder && !/^please[\s_-]?select/i.test(placeholder) && !/^select/i.test(placeholder)) {
    return placeholder.trim();
  }

  // 5. Container / Field-group label / Google Forms Question Title search
  const container = element.closest(
    '.form-group, .field-wrapper, .field, .form-field, [role="listitem"], .Qr7Oae, .geS5n, div[class*="form"], div[class*="field"], div[class*="group"], div[class*="select"], div[class*="item"]'
  );
  if (container) {
    const headingEl = container.querySelector('[role="heading"], .M7eMe, span.M7eMe, div.HoPnR, label, .label');
    if (headingEl && headingEl.textContent) {
      return headingEl.textContent.trim();
    }
  }

  // 6. Preceding sibling label search
  let prev = element.previousElementSibling || element.parentElement?.previousElementSibling;
  if (prev) {
    const lbl = prev.tagName.toLowerCase() === "label" ? prev : prev.querySelector("label");
    if (lbl && lbl.textContent) {
      return lbl.textContent.trim();
    }
  }

  // 7. Title, data-testid, data-automation-id
  const testId = element.getAttribute("data-automation-id") || element.getAttribute("data-testid") || element.getAttribute("title");
  if (testId) {
    return testId.replace(/[_-]/g, " ").trim();
  }

  // 8. Name or ID attribute fallback
  const name = element.getAttribute("name");
  if (name) return name.replace(/[_-]/g, " ").trim();

  return id ? id.replace(/[_-]/g, " ").trim() : "Unknown Field";
}

function findNearbyText(element: HTMLElement): string {
  const parent = element.parentElement;
  if (!parent) return "";
  const prevSibling = element.previousElementSibling;
  if (prevSibling && prevSibling.textContent) {
    return prevSibling.textContent.slice(0, 100).trim();
  }
  return parent.textContent ? parent.textContent.slice(0, 100).trim() : "";
}

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[*:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function determineElementType(element: HTMLElement): FormElementType {
  const tag = element.tagName.toLowerCase();
  if (tag === "textarea") return "textarea";
  if (tag === "select") return "select";
  if (tag === "input") {
    const type = (element.getAttribute("type") || "text").toLowerCase();
    if (["email", "tel", "number", "radio", "checkbox", "file", "hidden"].includes(type)) {
      return type as FormElementType;
    }
    return "text";
  }
  return "unknown";
}

export function extractFieldDescriptor(element: HTMLElement, index: number): FieldDescriptor {
  const tag = element.tagName.toLowerCase();
  const type = determineElementType(element);
  const rawLabel = findLabelForElement(element);
  const normalizedLabel = normalizeLabel(rawLabel);
  const nearbyText = findNearbyText(element);
  const name = element.getAttribute("name") || undefined;
  const placeholder = element.getAttribute("placeholder") || undefined;
  const ariaLabel = element.getAttribute("aria-label") || undefined;
  const autocomplete = element.getAttribute("autocomplete") || undefined;
  const required = element.hasAttribute("required") || element.getAttribute("aria-required") === "true";
  const disabled = element.hasAttribute("disabled");

  const selector = element.id
    ? `#${element.id}`
    : name
    ? `${tag}[name="${name}"]`
    : `${tag}:nth-of-type(${index + 1})`;

  const frameId = FrameRegistry.getFrameId();
  const id = `f_${frameId}_${index}_${computeHash(selector + rawLabel)}`;

  let options: FormSelectOption[] | undefined;
  if (type === "select" && element instanceof HTMLSelectElement) {
    options = Array.from(element.options).map((opt) => ({
      value: opt.value,
      label: opt.text.trim(),
    }));
  }

  return {
    id,
    frameId,
    tag,
    type,
    name,
    rawLabel,
    normalizedLabel,
    placeholder,
    ariaLabel,
    autocomplete,
    nearbyText,
    options,
    required,
    disabled,
    domSelector: selector,
    domSelectorHash: computeHash(selector),
  };
}
