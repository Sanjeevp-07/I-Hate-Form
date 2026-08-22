export interface ShadowDomWalkResult {
  matchedElements: HTMLElement[];
  closedShadowRootsDetected: number;
}

/**
 * Recursively walks DOM nodes, pierces any open Shadow DOM roots,
 * and detects closed shadow roots for honest reporting (§8.5).
 */
export function querySelectorAllDeepWithStats(
  selector: string,
  root: Document | Element | ShadowRoot = document
): ShadowDomWalkResult {
  const elements: HTMLElement[] = [];
  let closedRootsCount = 0;

  // Query elements in the current root
  const matched = root.querySelectorAll(selector);
  matched.forEach((el) => {
    if (el instanceof HTMLElement) {
      elements.push(el);
    }
  });

  // Query all child elements to check for open or closed shadowRoot
  const allChildren = root.querySelectorAll("*");
  allChildren.forEach((child) => {
    if (child.shadowRoot) {
      if (child.shadowRoot.mode === "open") {
        const subResult = querySelectorAllDeepWithStats(selector, child.shadowRoot);
        elements.push(...subResult.matchedElements);
        closedRootsCount += subResult.closedShadowRootsDetected;
      }
    }
  });

  return {
    matchedElements: elements,
    closedShadowRootsDetected: closedRootsCount,
  };
}

export function querySelectorAllDeep(
  selector: string,
  root: Document | Element | ShadowRoot = document
): HTMLElement[] {
  return querySelectorAllDeepWithStats(selector, root).matchedElements;
}
