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
  DEFAULT_FAST_MODEL: "gpt-4o-mini",
  DEFAULT_WORKHORSE_MODEL: "gpt-4o",
  DEFAULT_REASONING_MODEL: "o3-mini",
} as const;
