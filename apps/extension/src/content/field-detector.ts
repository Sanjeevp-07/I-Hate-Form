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

function cleanLabelText(text: string): string {
  return text
    .replace(/[\n\r\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidLabelText(text: string, el?: Element | null): boolean {
  if (!text) return false;
  const clean = cleanLabelText(text);
  if (clean.length < 2 || clean.length > 120) return false;

  // Filter out pure icons/emojis or symbols (must contain at least 2 alphanumeric chars)
  const alphaChars = clean.match(/[a-zA-Z0-9]/g);
  if (!alphaChars || alphaChars.length < 2) return false;

  // Filter out generic placeholder and non-question phrases
  if (
    /^(your[\s_-]?answer|your[\s_-]?response|short[\s_-]?answer([\s_-]?text)?|long[\s_-]?answer([\s_-]?text)?|paragraph[\s_-]?text|enter[\s_-]?answer|type[\s_-]?answer|write[\s_-]?answer|answer|text|input|option[\s_-]?\d+|other:?|null|undefined)$/i.test(
      clean
    )
  ) {
    return false;
  }

  // Check element classes or tag if provided
  if (el) {
    const className = (el.className && typeof el.className === "string" ? el.className : "").toLowerCase();
    if (className.includes("icon") || className.includes("svg") || className.includes("badge") || className.includes("avatar")) {
      return false;
    }
  }

  // Filter out button/action words
  if (/^(submit|cancel|close|next|prev|back|ok|yes|no|register|login|sign up|sign in|clear form|switch accounts|switch account)$/i.test(clean)) {
    return false;
  }

  return true;
}

export function getQuestionCardContainer(element: HTMLElement): HTMLElement {
  const structuredCard = element.closest(
    '.Qr7Oae, [role="listitem"], .geS5n, .freebirdFormviewerViewNumberedItemContainer, fieldset, .form-group, .field-wrapper, .form-field'
  ) as HTMLElement | null;

  if (structuredCard) {
    return structuredCard;
  }

  const groupEl = element.closest(
    '[role="radiogroup"], [role="group"], .SGkqec, .Y62e3c'
  ) as HTMLElement | null;

  if (groupEl) {
    return groupEl;
  }

  return (element.closest('div[class*="form"], div[class*="field"]') || element) as HTMLElement;
}

export function findQuestionHeadingInContainer(container: HTMLElement): string | null {
  const headings = Array.from(
    container.querySelectorAll('.M7eMe, [role="heading"], legend, div.HoPnR, h1, h2, h3, h4, h5, h6, .label, [class*="title"], [class*="label"], [class*="header"], label')
  );
  for (const h of headings) {
    if (
      h.closest(
        '.docssharedWizTogglelabeledContainer, .nWQGrd, .e3Duub, .aDTYNe, .uHMk8b, .appsMaterialWizToggleRadiogroupEl, .appsMaterialWizToggleCheckboxEl, .select-option, .dropdown-menu'
      )
    ) {
      continue;
    }
    const txt = cleanLabelText(h.textContent || "");
    if (txt && isValidLabelText(txt, h as HTMLElement)) {
      return txt;
    }
  }
  return null;
}

function findLabelForElement(element: HTMLElement): string {
  // 1. Google Forms / Question Container Heading (Highest priority for structured forms)
  const container = getQuestionCardContainer(element);
  if (container) {
    const headingText = findQuestionHeadingInContainer(container);
    if (headingText) return headingText;
  }

  // 2. Associated label via htmlFor within the same root node (document or ShadowRoot)
  const id = element.getAttribute("id");
  const rootNode = element.getRootNode() as Document | ShadowRoot;
  if (id && rootNode && typeof rootNode.querySelector === "function") {
    const labelEl = rootNode.querySelector(`label[for="${id}"]`);
    if (labelEl && labelEl.textContent) {
      const txt = cleanLabelText(labelEl.textContent);
      if (isValidLabelText(txt, labelEl)) return txt;
    }
  }

  // 3. Parent label element
  const parentLabel = element.closest("label");
  if (parentLabel && parentLabel.textContent) {
    const txt = cleanLabelText(parentLabel.textContent.replace(element.textContent || "", ""));
    if (isValidLabelText(txt, parentLabel)) return txt;
  }

  // 4. aria-labelledby (filtering out generic IDs like "Your answer")
  const ariaLabelledBy = element.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const ids = ariaLabelledBy.split(/\s+/).filter(Boolean);
    const textPieces = ids
      .map((i) => {
        const el = document.getElementById(i);
        const txt = el ? el.textContent?.trim() : "";
        return txt && isValidLabelText(txt, el) ? cleanLabelText(txt) : "";
      })
      .filter(Boolean);
    if (textPieces.length > 0) {
      const combined = cleanLabelText(textPieces.join(" "));
      if (isValidLabelText(combined)) return combined;
    }
  }

  // 5. aria-label & aria-description
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel && isValidLabelText(ariaLabel)) {
    return cleanLabelText(ariaLabel);
  }

  const ariaDesc = element.getAttribute("aria-description");
  if (ariaDesc && isValidLabelText(ariaDesc)) {
    return cleanLabelText(ariaDesc);
  }

  // 6. Parent's preceding sibling
  let parentEl = element.parentElement;
  if (parentEl && parentEl !== document.body) {
    let parentPrev = parentEl.previousElementSibling;
    while (parentPrev) {
      const txt = cleanLabelText(parentPrev.textContent || "");
      if (isValidLabelText(txt, parentPrev)) {
        return txt;
      }
      parentPrev = parentPrev.previousElementSibling;
    }
  }

  // 7. Preceding sibling label or text element
  let prevEl: Element | null = element.previousElementSibling;
  while (prevEl) {
    const text = cleanLabelText(prevEl.textContent || "");
    if (isValidLabelText(text, prevEl)) {
      return text;
    }
    prevEl = prevEl.previousElementSibling;
  }

  // 8. Placeholder (with clean fallback)
  const placeholder = element.getAttribute("placeholder");
  if (placeholder && !/^please[\s_-]?select/i.test(placeholder) && !/^select/i.test(placeholder) && isValidLabelText(placeholder)) {
    const clean = cleanLabelText(placeholder);
    return clean;
  }

  // 8. Title, data-testid, data-automation-id, name, id
  const testId = element.getAttribute("data-automation-id") || element.getAttribute("data-testid") || element.getAttribute("title");
  if (testId) {
    return cleanLabelText(testId.replace(/[_-]/g, " "));
  }

  const name = element.getAttribute("name");
  if (name) return cleanLabelText(name.replace(/[_-]/g, " "));

  return id ? cleanLabelText(id.replace(/[_-]/g, " ")) : "Unknown Field";
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

export function normalizeLabel(label: string): string {
  let cleaned = label
    .toLowerCase()
    .replace(/[*:]/g, "")
    .replace(/^(enter|type|input|select|please enter|please provide)\s+(your\s+)?/i, "")
    .replace(/^your\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  // If after stripping it's empty, revert to original lowercased
  if (!cleaned) {
    cleaned = label.toLowerCase().replace(/[*:]/g, "").replace(/\s+/g, " ").trim();
  }
  return cleaned;
}

function determineElementType(element: HTMLElement): FormElementType {
  const tag = element.tagName.toLowerCase();
  if (tag === "textarea") return "textarea";
  if (tag === "select") return "select";
  if (tag === "input") {
    const type = (element.getAttribute("type") || "text").toLowerCase();
    if (["email", "tel", "number", "date", "url", "radio", "checkbox", "file", "hidden"].includes(type)) {
      return type as FormElementType;
    }
    return "text";
  }
  const role = element.getAttribute("role");
  if (role === "textbox" || role === "searchbox" || role === "spinbutton") return "text";
  if (role === "combobox" || role === "listbox") return "select";
  if (role === "radiogroup" || role === "radio" || element.classList.contains("SGkqec")) return "radio";
  if (role === "checkbox") return "checkbox";
  if (role === "group" || element.classList.contains("Y62e3c")) {
    if (element.querySelector('[role="radio"], input[type="radio"], .appsMaterialWizToggleRadiogroupEl')) {
      return "radio";
    }
    return "checkbox";
  }
  if (element.getAttribute("contenteditable") === "true" || element.getAttribute("contenteditable") === "") {
    return "textarea";
  }

  // Check for file upload button / dropzone / Google Forms Add file
  const ariaLabel = (element.getAttribute("aria-label") || "").toLowerCase();
  const text = (element.textContent || "").toLowerCase();
  const parentListItem = element.closest('.Qr7Oae, [role="listitem"], .geS5n');
  const isGoogleFormsAddFile = parentListItem && (
    ariaLabel.includes("add file") ||
    text.includes("add file") ||
    parentListItem.textContent?.toLowerCase().includes("upload 1 supported file") ||
    parentListItem.textContent?.toLowerCase().includes("supported file")
  );

  if (
    ariaLabel.includes("add file") ||
    ariaLabel.includes("upload") ||
    text.includes("add file") ||
    text.includes("upload resume") ||
    text.includes("upload cv") ||
    element.classList.contains("dropzone") ||
    isGoogleFormsAddFile
  ) {
    return "file";
  }

  // Check for radio or checkbox group inside list item
  if (parentListItem) {
    if (parentListItem.querySelector('[role="radiogroup"], [role="radio"], .SGkqec, .appsMaterialWizToggleRadiogroupEl')) {
      return "radio";
    }
    if (parentListItem.querySelector('[role="checkbox"], .Y62e3c, .uHMk8b, .appsMaterialWizToggleCheckboxEl')) {
      return "checkbox";
    }
  }

  return "unknown";
}

export function extractOptionsFromContainer(element: HTMLElement, type: FormElementType): FormSelectOption[] {
  const options: FormSelectOption[] = [];
  const visitedLabels = new Set<string>();

  if (type === "select" && element instanceof HTMLSelectElement) {
    return Array.from(element.options).map((opt) => ({
      value: opt.value,
      label: opt.text.trim(),
    }));
  }

  // Look in element or closest container / card
  const container = getQuestionCardContainer(element);

  // 1. Google Forms & ARIA Radio/Checkbox options
  const optionNodes = container.querySelectorAll(
    '[role="radio"], [role="checkbox"], input[type="radio"], input[type="checkbox"], .docssharedWizTogglelabeledContainer, .nWQGrd, .e3Duub, .appsMaterialWizToggleRadiogroupEl, .appsMaterialWizToggleCheckboxEl, .uHMk8b'
  );

  optionNodes.forEach((node) => {
    let val =
      node.getAttribute("data-value") ||
      node.getAttribute("data-answer-value") ||
      node.getAttribute("value") ||
      node.getAttribute("aria-label") ||
      "";

    const labelContainer = node.closest(".docssharedWizTogglelabeledContainer, label, .nWQGrd, .e3Duub, div") || node.parentElement;
    const labelText = (
      labelContainer?.querySelector(".aDTYNe, .M7eMe, span.M7eMe, span, label, p")?.textContent ||
      labelContainer?.textContent ||
      ""
    ).trim();

    const displayLabel = cleanLabelText(labelText || val);
    const finalVal = val.trim() || displayLabel;

    if (displayLabel && displayLabel.length >= 1 && displayLabel.length < 80 && !visitedLabels.has(displayLabel.toLowerCase())) {
      // Ignore non-option text like "Your answer", asterisks, or system buttons
      if (!/^(your[\s_-]?answer|\*|other:?|upload|submit|clear form)$/i.test(displayLabel)) {
        visitedLabels.add(displayLabel.toLowerCase());
        options.push({
          value: finalVal,
          label: displayLabel,
        });
      }
    }
  });

  return options;
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
  const disabled = element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true";

  let selector = "";
  if (element.id) {
    selector = `#${element.id}`;
  } else if (element.getAttribute("aria-labelledby")) {
    selector = `${tag}[aria-labelledby="${element.getAttribute("aria-labelledby")}"]`;
  } else if (name) {
    selector = `${tag}[name="${name}"]`;
  } else if (element.getAttribute("aria-label")) {
    selector = `${tag}[aria-label="${element.getAttribute("aria-label")}"]`;
  } else if (element.getAttribute("jsname")) {
    selector = `${tag}[jsname="${element.getAttribute("jsname")}"]`;
  } else if (placeholder) {
    selector = `${tag}[placeholder="${placeholder}"]`;
  } else {
    selector = `${tag}:nth-of-type(${index + 1})`;
  }

  const frameId = FrameRegistry.getFrameId();
  const id = `f_${frameId}_${index}_${computeHash(selector + rawLabel)}`;

  let options: FormSelectOption[] | undefined;
  if (type === "select" && element instanceof HTMLSelectElement) {
    options = Array.from(element.options).map((opt) => ({
      value: opt.value,
      label: opt.text.trim(),
    }));
  } else if (type === "radio" || type === "checkbox" || element.getAttribute("role") === "radiogroup" || element.getAttribute("role") === "group") {
    options = extractOptionsFromContainer(element, type);
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
    options: options && options.length > 0 ? options : undefined,
    required,
    disabled,
    domSelector: selector,
    domSelectorHash: computeHash(selector),
  };
}
