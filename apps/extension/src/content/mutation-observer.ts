export class FormMutationWatcher {
  private observer: MutationObserver | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private onFormMutated: () => void, private debounceMs = 500) {}

  public start(): void {
    if (this.observer) return;

    this.observer = new MutationObserver((mutations) => {
      let hasRelevantChange = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node instanceof HTMLElement) {
              if (
                node.tagName === "INPUT" ||
                node.tagName === "SELECT" ||
                node.tagName === "TEXTAREA" ||
                node.querySelector("input, select, textarea")
              ) {
                hasRelevantChange = true;
                break;
              }
            }
          }
        }
        if (hasRelevantChange) break;
      }

      if (hasRelevantChange) {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.onFormMutated();
        }, this.debounceMs);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  public stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
