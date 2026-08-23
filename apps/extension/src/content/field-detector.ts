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

  // 3. aria-label or aria-labelledby
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel.trim();

  const ariaLabelledBy = element.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const labelledEl = document.getElementById(ariaLabelledBy);
    if (labelledEl && labelledEl.textContent) return labelledEl.textContent.trim();
  }

  // 4. Placeholder
  const placeholder = element.getAttribute("placeholder");
  if (placeholder) return placeholder.trim();

  // 5. Name or ID attribute fallback
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
