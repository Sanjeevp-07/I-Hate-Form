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
    profilePath: "personal.title",
    patterns: [/\btitle\b/i, /salutation/i, /prefix/i],
    getValue: (p) => {
      const g = (p.personal as any)?.gender?.toLowerCase();
      return g === "female" ? "Ms." : "Mr.";
    },
    confidence: 0.98,
  },
  {
    profilePath: "personal.firstName",
    patterns: [/first[\s_-]?name/i, /given[\s_-]?name/i, /fname/i],
    getValue: (p) => p.personal.firstName || null,
    confidence: 0.99,
  },
  {
    profilePath: "personal.middleName",
    patterns: [/middle[\s_-]?name/i, /mname/i],
    getValue: (p) => (p.personal as any)?.middleName || "",
    confidence: 0.96,
  },
  {
    profilePath: "personal.lastName",
    patterns: [/last[\s_-]?name/i, /surname/i, /family[\s_-]?name/i, /lname/i],
    getValue: (p) => p.personal.lastName || null,
    confidence: 0.99,
  },
  {
    profilePath: "personal.fullName",
    patterns: [/\bfull[\s_-]?name\b/i, /\bname\b/i],
    getValue: (p) => `${p.personal.firstName || ""} ${p.personal.lastName || ""}`.trim() || null,
    confidence: 0.95,
  },
  {
    profilePath: "personal.countryCode",
    patterns: [/country[\s_-]?code/i, /dial[\s_-]?code/i, /isd[\s_-]?code/i],
    getValue: (p) => (p.personal as any)?.countryCode || "+91",
    confidence: 0.98,
  },
  {
    profilePath: "personal.phone",
    patterns: [/mobile[\s_-]?number/i, /mobile/i, /phone/i, /telephone/i, /contact[\s_-]?number/i, /cell/i],
    getValue: (p) => p.personal.phone || null,
    confidence: 0.98,
  },
  {
    profilePath: "personal.email",
    patterns: [/e[\s_-]?mail/i, /email[\s_-]?address/i],
    getValue: (p) => p.personal.email || null,
    confidence: 0.99,
  },
  {
    profilePath: "personal.gender",
    patterns: [/\bgender\b/i, /\bsex\b/i],
    getValue: (p) => (p.personal as any)?.gender || "Male",
    confidence: 0.98,
  },
  {
    profilePath: "personal.dob",
    patterns: [/date[\s_-]?of[\s_-]?birth/i, /\bd[\s_-]?o[\s_-]?b\b/i, /birth[\s_-]?date/i, /\bdob\b/i],
    getValue: (p) => (p.personal as any)?.dob || "06/07/2005",
    confidence: 0.98,
  },
  {
    profilePath: "personal.nationality",
    patterns: [/nationality/i, /citizenship/i],
    getValue: (p) => (p.personal as any)?.nationality || "Indian",
    confidence: 0.98,
  },
  {
    profilePath: "personal.country",
    patterns: [/\bcountry\b/i, /nation\b/i, /current[\s_-]?country/i],
    getValue: (p) => p.personal.country || "India",
    confidence: 0.98,
  },
  {
    profilePath: "personal.state",
    patterns: [/\bstate\b/i, /province/i, /region/i, /state[\s_-]?\/?[\s_-]?province/i],
    getValue: (p) => (p.personal as any)?.state || "Uttar Pradesh",
    confidence: 0.98,
  },
  {
    profilePath: "personal.city",
    patterns: [/\bcity\b/i, /town/i, /current[\s_-]?city/i],
    getValue: (p) => p.personal.city || null,
    confidence: 0.98,
  },
  {
    profilePath: "personal.postalCode",
    patterns: [/pincode/i, /pin[\s_-]?code/i, /postal[\s_-]?code/i, /zip[\s_-]?code/i, /\bzip\b/i],
    getValue: (p) => p.personal.postalCode || null,
    confidence: 0.98,
  },
  {
    profilePath: "personal.address",
    patterns: [/current[\s_-]?street/i, /locality/i, /area\b/i, /street[\s_-]?address/i, /address[\s_-]?1/i, /\baddress\b/i, /\baddr\b/i],
    getValue: (p) => p.personal.address || null,
    confidence: 0.98,
  },
  {
    profilePath: "links.linkedin",
    patterns: [/linkedin/i, /linked[\s_-]?in/i],
    getValue: (p) => p.links.linkedin || null,
    confidence: 0.98,
  },
  {
    profilePath: "links.github",
    patterns: [/github/i, /git[\s_-]?hub/i],
    getValue: (p) => p.links.github || null,
    confidence: 0.98,
  },
  {
    profilePath: "links.portfolio",
    patterns: [/portfolio/i, /personal[\s_-]?website/i, /web[\s_-]?site/i],
    getValue: (p) => p.links.portfolio || null,
    confidence: 0.98,
  },
  {
    profilePath: "personal.requiresSponsorship",
    patterns: [/sponsorship/i, /require[\s_-]?visa/i, /visa/i],
    getValue: (p) => p.personal.requiresSponsorship ?? null,
    confidence: 0.95,
  },
];

export function mapFieldDeterministically(
  field: FieldDescriptor,
  profile: UserProfile | null
): FieldMapping {
  const cleanLabel = (field.rawLabel || "").replace(/[*:]/g, " ");
  const labelToTest = `${cleanLabel} ${field.normalizedLabel || ""} ${field.name || ""} ${field.autocomplete || ""} ${field.nearbyText || ""}`;

  for (const rule of DETERMINISTIC_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(labelToTest)) {
        const val = profile ? rule.getValue(profile) : null;
        const confidence = rule.confidence;

        let action: FieldMapping["action"] = "fill";
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
