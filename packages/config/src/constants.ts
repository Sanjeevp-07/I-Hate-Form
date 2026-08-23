export const CONFIDENCE_THRESHOLDS = {
  AUTO_FILL: 0.95, // >= 0.95 auto-fill
  AUTO_FILL_REVIEW: 0.80, // 0.80 - 0.94 auto-fill + flag for review
  ASK_USER: 0.50, // 0.50 - 0.79 ask user (do not fill)
  UNSUPPORTED: 0.0, // < 0.50 unsupported
} as const;

export const AUTH_CONFIG = {
  EXTENSION_TOKEN_EXPIRY_SECONDS: 900, // 15 minutes
  REFRESH_TOKEN_EXPIRY_DAYS: 30,
} as const;

export const AI_CONFIG = {
  // NVIDIA NIM OpenAI-compatible endpoint (free tier available at build.nvidia.com)
  DEFAULT_BASE_URL: "https://integrate.api.nvidia.com/v1",

  // Tier 1: Fast/cheap model tier (simple field classification, normalization)
  DEFAULT_FAST_MODEL: "meta/llama-3.1-8b-instruct",

  // Tier 2: Workhorse model tier (job parsing, subjective answers, resume matching)
  DEFAULT_WORKHORSE_MODEL: "meta/llama-3.1-70b-instruct",

  // Tier 3: Top reasoning tier (opt-in escalation for hard ambiguous cases)
  DEFAULT_REASONING_MODEL: "deepseek-ai/deepseek-r1",
} as const;
