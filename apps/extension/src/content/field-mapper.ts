import { FieldDescriptor, FieldMapping, UserProfile } from "@internship-copilot/types";
import { CONFIDENCE_THRESHOLDS } from "@internship-copilot/config";

interface RuleDefinition {
  profilePath: string;
  patterns: RegExp[];
  getValue: (profile: UserProfile) => string | boolean | string[] | null;
  confidence: number;
}

const DETERMINISTIC_RULES: RuleDefinition[] = [
  {
    profilePath: "personal.firstName",
    patterns: [/first[\s_-]?name/i, /given[\s_-]?name/i, /fname/i],
    getValue: (p) => p.personal.firstName || null,
    confidence: 0.98,
  },
  {
    profilePath: "personal.lastName",
    patterns: [/last[\s_-]?name/i, /surname/i, /family[\s_-]?name/i, /lname/i],
    getValue: (p) => p.personal.lastName || null,
    confidence: 0.98,
  },
  {
    profilePath: "personal.email",
    patterns: [/e[\s_-]?mail/i, /email[\s_-]?address/i],
    getValue: (p) => p.personal.email || null,
    confidence: 0.99,
  },
  {
    profilePath: "personal.phone",
    patterns: [/phone/i, /mobile/i, /telephone/i, /contact[\s_-]?number/i],
    getValue: (p) => p.personal.phone || null,
    confidence: 0.97,
  },
  {
    profilePath: "links.linkedin",
    patterns: [/linkedin/i, /linked[\s_-]?in[\s_-]?url/i, /linked[\s_-]?in[\s_-]?profile/i],
    getValue: (p) => p.links.linkedin || null,
    confidence: 0.98,
  },
  {
    profilePath: "links.github",
    patterns: [/github/i, /github[\s_-]?url/i, /github[\s_-]?profile/i],
    getValue: (p) => p.links.github || null,
    confidence: 0.98,
  },
  {
    profilePath: "links.portfolio",
    patterns: [/portfolio/i, /personal[\s_-]?website/i, /web[\s_-]?site/i],
    getValue: (p) => p.links.portfolio || null,
    confidence: 0.95,
  },
  {
    profilePath: "personal.city",
    patterns: [/^city$/i, /current[\s_-]?city/i],
    getValue: (p) => p.personal.city || null,
    confidence: 0.92,
  },
  {
    profilePath: "personal.country",
    patterns: [/^country$/i, /current[\s_-]?country/i],
    getValue: (p) => p.personal.country || null,
    confidence: 0.92,
  },
  {
    profilePath: "personal.requiresSponsorship",
    patterns: [/sponsorship/i, /visa/i, /require[\s_-]?visa/i],
    getValue: (p) => p.personal.requiresSponsorship ?? null,
    confidence: 0.85,
  },
];

export function mapFieldDeterministically(
  field: FieldDescriptor,
  profile: UserProfile | null
): FieldMapping {
  const labelToTest = `${field.normalizedLabel} ${field.name || ""} ${field.autocomplete || ""}`;

  for (const rule of DETERMINISTIC_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(labelToTest)) {
        const val = profile ? rule.getValue(profile) : null;
        const confidence = rule.confidence;

        let action: FieldMapping["action"] = "review";
        if (confidence >= CONFIDENCE_THRESHOLDS.AUTO_FILL) {
          action = "fill";
        } else if (confidence >= CONFIDENCE_THRESHOLDS.AUTO_FILL_REVIEW) {
          action = "fill";
        } else if (confidence >= CONFIDENCE_THRESHOLDS.ASK_USER) {
          action = "review";
        } else {
          action = "unsupported";
        }

        return {
          fieldId: field.id,
          rawLabel: field.rawLabel,
          normalizedLabel: field.normalizedLabel,
          profilePath: rule.profilePath,
          valueToFill: val,
          confidence,
          action,
          source: "rule",
          reason: `Matched pattern ${pattern.toString()}`,
        };
      }
    }
  }

  // Not matched deterministically
  return {
    fieldId: field.id,
    rawLabel: field.rawLabel,
    normalizedLabel: field.normalizedLabel,
    profilePath: null,
    valueToFill: null,
    confidence: 0.0,
    action: "unsupported",
    source: "rule",
    reason: "No deterministic rule matched; awaiting AI analysis",
  };
}
