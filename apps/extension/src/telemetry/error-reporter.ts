function computeDomainHash(domain: string): string {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charCodeAt(i);
    hash |= 0;
  }
  return `d_${Math.abs(hash).toString(16)}`;
}

export interface ExtensionErrorPayload {
  domainHash: string;
  errorMessage: string;
  errorStack?: string;
  context: "SCANNER" | "AUTOFILL" | "FRAME_RELAY" | "STORAGE";
  timestamp: string;
}

/**
 * Reports content script exceptions keyed by anonymized domain hash.
 * Strict privacy: never includes full URL, query params, or form field values (§14).
 */
export function reportExtensionError(
  error: Error | string,
  context: ExtensionErrorPayload["context"]
): void {
  try {
    const rawDomain = window.location.hostname || "unknown_domain";
    const domainHash = computeDomainHash(rawDomain);
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    const payload: ExtensionErrorPayload = {
      domainHash,
      errorMessage: message,
      errorStack: stack,
      context,
      timestamp: new Date().toISOString(),
    };

    console.warn(`[Copilot Telemetry - ${context}]`, {
      domainHash: payload.domainHash,
      error: payload.errorMessage,
    });

    // In production, dispatch to backend telemetry API or Sentry
  } catch {
    // Failsafe: error reporter never throws
  }
}
