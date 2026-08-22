export interface AdapterOverride {
  domainPattern: string; // e.g. "*.myworkday.com"
  reason: string; // required — documents WHY generic detection failed
  fieldOverrides?: Record<string, string>; // rawLabel -> profilePath, last resort only
  frameStrategy?: "pierce-shadow" | "cross-origin-postmessage";
}

export const SITE_ADAPTER_OVERRIDES: AdapterOverride[] = [
  {
    domainPattern: "*.myworkdayjobs.com",
    reason: "Workday uses custom web components with nested shadow DOM boundaries and synthetic event tracking",
    frameStrategy: "pierce-shadow",
  },
  {
    domainPattern: "*.greenhouse.io",
    reason: "Greenhouse embedded widgets frequently load inside same-origin iframe wrappers",
    frameStrategy: "pierce-shadow",
  },
];

export function findAdapterOverride(domain: string): AdapterOverride | undefined {
  return SITE_ADAPTER_OVERRIDES.find((adapter) => {
    if (adapter.domainPattern.startsWith("*.")) {
      const baseDomain = adapter.domainPattern.slice(2);
      return domain.endsWith(baseDomain) || domain === baseDomain;
    }
    return domain === adapter.domainPattern;
  });
}
