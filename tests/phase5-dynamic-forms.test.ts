import { describe, it, expect, vi, beforeEach } from "vitest";
import { FormMutationWatcher } from "../apps/extension/src/content/mutation-observer";

describe("Phase 5 Acceptance: Dynamic Multi-Step Forms & MutationObserver (§16)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("Triggers rescan callback when new input elements are added to DOM", async () => {
    const callback = vi.fn();
    const watcher = new FormMutationWatcher(callback, 50);
    watcher.start();

    // Dynamically insert step 2 of a multi-step job application form
    const dynamicStep = document.createElement("div");
    dynamicStep.innerHTML = `
      <label for="step2-github">GitHub Profile</label>
      <input type="url" id="step2-github" name="github" />
    `;
    document.body.appendChild(dynamicStep);

    // Wait for MutationObserver microtask and debounce timeout
    await new Promise((r) => setTimeout(r, 150));

    expect(callback).toHaveBeenCalled();

    watcher.stop();
  });

  it("Ignores non-form DOM mutations (e.g. style/text updates) to avoid wasteful rescans", async () => {
    const callback = vi.fn();
    const watcher = new FormMutationWatcher(callback, 50);
    watcher.start();

    // Dynamically update a non-form element
    const p = document.createElement("p");
    p.textContent = "Random text update";
    document.body.appendChild(p);

    await new Promise((r) => setTimeout(r, 150));

    // Mutation observer ignores non-form node additions
    expect(callback).not.toHaveBeenCalled();

    watcher.stop();
  });
});
