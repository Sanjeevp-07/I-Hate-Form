import { FieldDescriptor, FieldMapping, UserProfile } from "@internship-copilot/types";
import { CONFIDENCE_THRESHOLDS } from "@internship-copilot/config";

interface RuleDefinition {
  profilePath: string;
  patterns: RegExp[];
  getValue: (profile: UserProfile) => string | boolean | string[] | null;
  confidence: number;
}

const DETERMINISTIC_RULES: RuleDefinition[] = [
  // 1. Composite Full Location (High Priority before individual city/state/country)
  {
    profilePath: "personal.location",
    patterns: [
      /current[\s_-]?location/i,
      /location[\s_-]?\(.*\)/i,
      /where[\s_-]?are[\s_-]?you[\s_-]?located/i,
      /city[\s,]+state[\s,]+country/i,
      /city[\s,]+state/i,
      /^(\*|\s)*location(\*|\s)*$/i,
      /\byour[\s_-]?location\b/i,
      /\bcurrent[\s_-]?location\b/i,
      /\bpresent[\s_-]?location\b/i,
      /\blocation\b/i,
    ],
    getValue: (p) => {
      const city = p.personal?.city || "Greater Noida";
      const state = (p.personal as any)?.state || "Uttar Pradesh";
      const country = p.personal?.country || "India";
      return [city, state, country].filter(Boolean).join(", ");
    },
    confidence: 0.99,
  },
  {
    profilePath: "personal.countryCode",
    patterns: [/country[\s_-]?code/i, /dial[\s_-]?code/i, /isd[\s_-]?code/i],
    getValue: (p) => (p.personal as any)?.countryCode || "+91",
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
    profilePath: "personal.email",
    patterns: [/e[\s_-]?mail/i, /email[\s_-]?address/i, /email[\s_-]?id/i, /\bmail[\s_-]?id\b/i, /\be-mail\b/i, /\be[\s_-]?mail[\s_-]?address\b/i],
    getValue: (p) => p.personal.email || null,
    confidence: 0.99,
  },
  {
    profilePath: "personal.postalCode",
    patterns: [/pincode/i, /pin[\s_-]?code/i, /postal[\s_-]?code/i, /zip[\s_-]?code/i, /\bzip\b/i],
    getValue: (p) => p.personal.postalCode || null,
    confidence: 0.98,
  },
  {
    profilePath: "personal.address",
    patterns: [/current[\s_-]?street/i, /locality/i, /area\b/i, /street[\s_-]?address/i, /address[\s_-]?1/i, /permanent[\s_-]?address/i, /home[\s_-]?address/i, /physical[\s_-]?address/i, /residential[\s_-]?address/i, /mailing[\s_-]?address/i, /^(\*|\s)*address(\*|\s)*$/i, /\b(street|home|physical|residential)[\s_-]?address\b/i, /^(\*|\s)*addr(\*|\s)*$/i],
    getValue: (p) => p.personal.address || null,
    confidence: 0.98,
  },
  {
    profilePath: "personal.phone",
    patterns: [/mobile[\s_-]?number/i, /mobile/i, /phone/i, /telephone/i, /contact[\s_-]?number/i, /cell/i],
    getValue: (p) => p.personal.phone || null,
    confidence: 0.98,
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
    patterns: [
      /^(\*|\s)*(full[\s_-]?name|your[\s_-]?name|candidate[\s_-]?name|applicant[\s_-]?name|legal[\s_-]?name)(\*|\s)*$/i,
      /\bfull[\s_-]?name\b/i,
      /\bcomplete[\s_-]?name\b/i,
      /^(\*|\s)*name(\*|\s)*$/i,
    ],
    getValue: (p) => `${p.personal.firstName || ""} ${p.personal.lastName || ""}`.trim() || null,
    confidence: 0.95,
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
  {
    profilePath: "education.institution",
    patterns: [/college/i, /university/i, /institution/i, /institute/i, /school[\s_-]?of/i],
    getValue: (p) => (p as any)?.education?.institution || (p as any)?.currentEducation?.institution || p.education?.[0]?.institution || null,
    confidence: 0.98,
  },
  {
    profilePath: "education.degree",
    patterns: [/\bdegree\b/i, /qualification/i, /current[\s_-]?degree/i, /degree[\s_-]?name/i, /undergraduate[\s_-]?degree/i],
    getValue: (p) => (p as any)?.education?.degree || (p as any)?.currentEducation?.degree || p.education?.[0]?.degree || "B.Tech",
    confidence: 0.98,
  },
  {
    profilePath: "education.major",
    patterns: [/\bbranch\b/i, /\bmajor\b/i, /field[\s_-]?of[\s_-]?study/i, /discipline/i, /department/i, /course[\s_-]?name/i],
    getValue: (p) => (p as any)?.education?.major || (p as any)?.currentEducation?.major || p.education?.[0]?.fieldOfStudy || "Computer Science and Engineering",
    confidence: 0.98,
  },
  {
    profilePath: "education.specialization",
    patterns: [/specialization/i, /specialisation/i],
    getValue: (p) => (p as any)?.education?.specialization || (p as any)?.currentEducation?.specialization || "Artificial Intelligence",
    confidence: 0.98,
  },
  {
    profilePath: "education.currentYear",
    patterns: [/current[\s_-]?year/i, /year[\s_-]?of[\s_-]?study/i, /which[\s_-]?year/i, /studying[\s_-]?in/i],
    getValue: (p) => (p as any)?.education?.currentYear || (p as any)?.currentEducation?.currentYear || "3rd Year",
    confidence: 0.98,
  },
  {
    profilePath: "education.currentSemester",
    patterns: [/current[\s_-]?semester/i, /semester/i, /\bsem\b/i],
    getValue: (p) => (p as any)?.education?.currentSemester || (p as any)?.currentEducation?.currentSemester || "6th Semester",
    confidence: 0.98,
  },
  {
    profilePath: "education.graduationYear",
    patterns: [/graduation[\s_-]?year/i, /pass[\s_-]?out[\s_-]?year/i, /year[\s_-]?of[\s_-]?graduation/i, /expected[\s_-]?graduation/i, /passing[\s_-]?year/i, /batch\b/i],
    getValue: (p) => (p as any)?.education?.graduationYear || (p as any)?.currentEducation?.graduationYear || "2026",
    confidence: 0.98,
  },
  {
    profilePath: "education.cgpa",
    patterns: [/college[\s_-]?cgpa/i, /current[\s_-]?cgpa/i, /university[\s_-]?cgpa/i, /^(\*|\s)*(cgpa|gpa)(\*|\s)*$/i, /\bcgpa\b/i, /\bgpa\b/i],
    getValue: (p) => (p as any)?.education?.cgpa || (p as any)?.currentEducation?.cgpa || "8.9",
    confidence: 0.98,
  },
  {
    profilePath: "education.cgpaScale",
    patterns: [/cgpa[\s_-]?scale/i, /gpa[\s_-]?scale/i, /maximum[\s_-]?cgpa/i, /out[\s_-]?of/i],
    getValue: (p) => (p as any)?.education?.cgpaScale || (p as any)?.currentEducation?.cgpaScale || "10.0",
    confidence: 0.98,
  },
  {
    profilePath: "secondary.percentageOrCgpa",
    patterns: [/10th.*(percentage|cgpa|marks|score|grade|%)/i, /10th[\s_-]?%/i, /secondary.*(percentage|cgpa|marks|score|grade|%)/i, /matriculation.*(percentage|cgpa|marks)/i, /class[\s_-]?10.*(percentage|cgpa|marks|%)/i, /xth.*(percentage|marks|%)/i],
    getValue: (p) => (p as any)?.secondary?.percentageOrCgpa || "92.4",
    confidence: 0.98,
  },
  {
    profilePath: "secondary.passingYear",
    patterns: [/10th.*(year|passing|passout)/i, /secondary.*(year|passing|passout)/i, /matriculation.*(year|passing)/i, /class[\s_-]?10.*(year|passing)/i],
    getValue: (p) => (p as any)?.secondary?.passingYear || "2020",
    confidence: 0.98,
  },
  {
    profilePath: "secondary.schoolName",
    patterns: [/10th.*(school|board|institution)/i, /secondary.*(school|board|institution)/i, /matriculation.*school/i, /class[\s_-]?10.*school/i],
    getValue: (p) => (p as any)?.secondary?.schoolName || "St. Xavier's High School",
    confidence: 0.98,
  },
  {
    profilePath: "higherSecondary.percentageOrCgpa",
    patterns: [/12th.*(percentage|cgpa|marks|score|grade|%)/i, /12th[\s_-]?%/i, /higher[\s_-]?secondary.*(percentage|cgpa|marks|score|grade|%)/i, /intermediate.*(percentage|cgpa|marks)/i, /class[\s_-]?12.*(percentage|cgpa|marks|%)/i, /hsc.*(percentage|marks|%)/i, /xiith.*(percentage|marks|%)/i],
    getValue: (p) => (p as any)?.higherSecondary?.percentageOrCgpa || "94.8",
    confidence: 0.98,
  },
  {
    profilePath: "higherSecondary.passingYear",
    patterns: [/12th.*(year|passing|passout)/i, /higher[\s_-]?secondary.*(year|passing|passout)/i, /intermediate.*(year|passing)/i, /class[\s_-]?12.*(year|passing)/i, /hsc.*(year|passing)/i],
    getValue: (p) => (p as any)?.higherSecondary?.passingYear || "2022",
    confidence: 0.98,
  },
  {
    profilePath: "higherSecondary.schoolName",
    patterns: [/12th.*(school|board|institution|junior[\s_-]?college)/i, /higher[\s_-]?secondary.*(school|board|institution)/i, /intermediate.*school/i, /class[\s_-]?12.*school/i, /hsc.*school/i],
    getValue: (p) => (p as any)?.higherSecondary?.schoolName || "DPS International School",
    confidence: 0.98,
  },
  {
    profilePath: "higherSecondary.stream",
    patterns: [/12th.*(stream|subject|branch)/i, /higher[\s_-]?secondary.*stream/i, /intermediate.*stream/i, /class[\s_-]?12.*stream/i, /senior[\s_-]?secondary.*stream/i],
    getValue: (p) => (p as any)?.higherSecondary?.stream || "Science (PCM)",
    confidence: 0.98,
  },
  {
    profilePath: "skills",
    patterns: [
      /skills[\s_-]?you[\s_-]?have/i,
      /skills[\s_-]?you[\s_-]?currently[\s_-]?have/i,
      /what[\s_-]?skills/i,
      /list[\s_-]?your[\s_-]?skills/i,
      /technical[\s_-]?skills/i,
      /key[\s_-]?skills/i,
      /core[\s_-]?skills/i,
      /programming[\s_-]?skills/i,
      /technologies/i,
      /tools[\s_-]?and[\s_-]?technologies/i,
      /programming[\s_-]?languages/i,
      /it[\s_-]?skills/i,
      /\bskills?\b/i,
    ],
    getValue: (p) => {
      const sk = (p as any)?.skills || (p as any)?.skillsList || [];
      if (Array.isArray(sk) && sk.length > 0) {
        return sk.map((s: any) => typeof s === "string" ? s : s?.name || "").filter(Boolean).join(", ");
      }
      return "React, TypeScript, Next.js, Node.js, Python, Tailwind CSS, Docker, PostgreSQL";
    },
    confidence: 0.98,
  },
  {
    profilePath: "work.experienceYears",
    patterns: [/^(\*|\s)*years?(\*|\s)*$/i, /total[\s_-]?years/i, /experience[\s_-]?years/i, /work[\s_-]?exp.*years/i],
    getValue: () => "0",
    confidence: 0.98,
  },
  {
    profilePath: "work.experienceMonths",
    patterns: [/^(\*|\s)*months?(\*|\s)*$/i, /experience[\s_-]?months/i, /work[\s_-]?exp.*months/i],
    getValue: () => "0 months",
    confidence: 0.98,
  },
  {
    profilePath: "work.currentCtc",
    patterns: [/current[\s_-]?ctc/i, /present[\s_-]?ctc/i, /current[\s_-]?salary/i, /cost[\s_-]?to[\s_-]?company/i],
    getValue: () => "0",
    confidence: 0.98,
  },
  {
    profilePath: "work.expectedCtc",
    patterns: [/expected[\s_-]?ctc/i, /desired[\s_-]?ctc/i, /expected[\s_-]?salary/i],
    getValue: () => "3",
    confidence: 0.98,
  },
  {
    profilePath: "work.noticePeriod",
    patterns: [/notice[\s_-]?period/i, /availability[\s_-]?to[\s_-]?join/i, /joining[\s_-]?time/i, /when[\s_-]?can[\s_-]?you[\s_-]?join/i],
    getValue: () => "Immediate Joiner",
    confidence: 0.98,
  },
  {
    profilePath: "personal.confirmPassword",
    patterns: [/confirm[\s_-]?passwor/i, /re[\s_-]?enter[\s_-]?passwor/i, /repeat[\s_-]?passwor/i, /verify[\s_-]?passwor/i],
    getValue: (p) => (p?.personal as any)?.password || "Password@12345",
    confidence: 0.95,
  },
  {
    profilePath: "personal.password",
    patterns: [/create[\s_-]?passwor/i, /new[\s_-]?passwor/i, /^(\*|\s)*password(\*|\s)*$/i, /\bpassword\b/i],
    getValue: (p) => (p?.personal as any)?.password || "Password@12345",
    confidence: 0.95,
  },
];

export function mapFieldDeterministically(
  field: FieldDescriptor,
  profile: UserProfile | null
): FieldMapping {
  const cleanLabel = (field.rawLabel || "").replace(/[*:]/g, " ").trim();
  const directLabel = `${cleanLabel} ${field.normalizedLabel || ""}`.trim();
  const fullContext = `${directLabel} ${field.name || ""} ${field.autocomplete || ""} ${field.nearbyText || ""}`.trim();
  const isEmailContext = field.type === "email" || /e[\s_-]?mail/i.test(directLabel) || /e[\s_-]?mail/i.test(field.name || "") || field.autocomplete === "email";

  // Fast path for explicit email type or label
  if (isEmailContext) {
    const val = profile ? profile.personal.email || null : null;
    return {
      fieldId: field.id,
      rawLabel: field.rawLabel,
      normalizedLabel: field.normalizedLabel,
      profilePath: "personal.email",
      valueToFill: val,
      confidence: 0.99,
      action: "fill",
      source: "rule",
      reason: "Matched explicit email field",
    };
  }

  // 1. First pass: Match directly against clean label & normalized label
  for (const rule of DETERMINISTIC_RULES) {
    if (rule.profilePath === "personal.address" && isEmailContext) {
      continue;
    }

    for (const pattern of rule.patterns) {
      if (pattern.test(directLabel)) {
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

  // 2. Second pass: Match against full context (attributes, nearbyText)
  for (const rule of DETERMINISTIC_RULES) {
    if (rule.profilePath === "personal.address" && isEmailContext) {
      continue;
    }

    for (const pattern of rule.patterns) {
      if (pattern.test(fullContext)) {
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

/**
 * Question-Answer Anti-Hallucination & Relevance Guard
 * Audits generated or filled answers to ensure they directly answer what the form field asked.
 * If a factual field (Location, Skills, Degree, Experience, Contact) contains a hallucinated narrative cover letter,
 * it replaces it with the exact candidate truth.
 */
export function verifyAndCorrectFieldAnswers(
  fields: FieldDescriptor[],
  answers: Record<string, string | boolean | string[]>,
  profile: UserProfile | null
): Record<string, string | boolean | string[]> {
  const correctedAnswers = { ...answers };
  if (!fields || !profile) return correctedAnswers;

  const personal = profile.personal || {};
  const education = (profile as any).education?.institution
    ? (profile as any).education
    : (profile as any).currentEducation || profile.education?.[0] || {};
  const secondary = (profile as any).secondary || {};
  const higherSecondary = (profile as any).higherSecondary || {};
  const rawSkills = (profile as any).skills || (profile as any).skillsList || profile.skills || [];
  const skillsListStr = Array.isArray(rawSkills) && rawSkills.length > 0
    ? rawSkills.map((s: any) => (typeof s === "string" ? s : s?.name || "")).filter(Boolean).join(", ")
    : "React, TypeScript, Next.js, Python, Node.js, Tailwind CSS, Docker, PostgreSQL";

  const defaultLocation = [
    personal.city || "Greater Noida",
    (personal as any).state || "Uttar Pradesh",
    personal.country || "India",
  ].filter(Boolean).join(", ");

  const isNarrativeParagraph = (text: string): boolean => {
    if (!text || typeof text !== "string") return false;
    const t = text.toLowerCase();
    return (
      t.length > 75 ||
      t.includes("i am excited") ||
      t.includes("throughout my academic") ||
      t.includes("academic journey") ||
      t.includes("problem-solving skills") ||
      t.includes("passion for innovation") ||
      t.includes("drive growth") ||
      t.includes("aligns with my skills") ||
      t.includes("contribute to the") ||
      t.includes("experience in building") ||
      t.includes("nvidia nim") ||
      (t.includes(" i ") && t.includes(" am "))
    );
  };

  for (const field of fields) {
    const rawVal = correctedAnswers[field.id];
    if (rawVal === undefined || rawVal === null) continue;
    const strVal = String(rawVal).trim();
    const cleanLabel = `${field.rawLabel || ""} ${field.normalizedLabel || ""} ${field.name || ""}`.toLowerCase();

    // 1. Location / City, State, Country
    if (
      /location|where[\s_-]?are[\s_-]?you[\s_-]?located|city[\s,]+state|city[\s,]+country/i.test(cleanLabel) ||
      (cleanLabel.includes("city") && cleanLabel.includes("country"))
    ) {
      if (isNarrativeParagraph(strVal) || !strVal || strVal.toLowerCase().includes("excited")) {
        correctedAnswers[field.id] = defaultLocation;
      }
      continue;
    }

    // 2. Skills / Technologies
    if (/skills?|technolog|languages?[\s_-]?known|tools?[\s_-]?used|programming[\s_-]?languages?/i.test(cleanLabel)) {
      if (isNarrativeParagraph(strVal) || strVal.toLowerCase().startsWith("i ") || strVal.toLowerCase().startsWith("throughout")) {
        correctedAnswers[field.id] = skillsListStr;
      }
      continue;
    }

    // 3. College / University
    if (/college|university|institution|institute/i.test(cleanLabel) && !/cgpa|gpa|marks|percentage|year/i.test(cleanLabel)) {
      if (isNarrativeParagraph(strVal)) {
        correctedAnswers[field.id] = education.institution || "Bennett University";
      }
      continue;
    }

    // 4. Degree / Branch / Major
    if (/\bdegree\b|\bmajor\b|\bbranch\b|field[\s_-]?of[\s_-]?study/i.test(cleanLabel)) {
      if (isNarrativeParagraph(strVal)) {
        correctedAnswers[field.id] = /major|branch/i.test(cleanLabel)
          ? education.major || "Computer Science and Engineering"
          : education.degree || "B.Tech";
      }
      continue;
    }

    // 5. 10th Education
    if (/10th|secondary|matriculation|class[\s_-]?10/i.test(cleanLabel)) {
      if (/percentage|cgpa|marks|score|%/i.test(cleanLabel)) {
        if (isNarrativeParagraph(strVal)) correctedAnswers[field.id] = String(secondary.percentageOrCgpa || "92.4");
      } else if (/year|passing/i.test(cleanLabel)) {
        if (isNarrativeParagraph(strVal)) correctedAnswers[field.id] = String(secondary.passingYear || "2020");
      } else if (/school|board/i.test(cleanLabel)) {
        if (isNarrativeParagraph(strVal)) correctedAnswers[field.id] = secondary.schoolName || "St. Xavier's High School";
      }
      continue;
    }

    // 6. 12th Education
    if (/12th|higher[\s_-]?secondary|intermediate|class[\s_-]?12/i.test(cleanLabel)) {
      if (/percentage|cgpa|marks|score|%/i.test(cleanLabel)) {
        if (isNarrativeParagraph(strVal)) correctedAnswers[field.id] = String(higherSecondary.percentageOrCgpa || "94.8");
      } else if (/year|passing/i.test(cleanLabel)) {
        if (isNarrativeParagraph(strVal)) correctedAnswers[field.id] = String(higherSecondary.passingYear || "2022");
      } else if (/school|board/i.test(cleanLabel)) {
        if (isNarrativeParagraph(strVal)) correctedAnswers[field.id] = higherSecondary.schoolName || "DPS International School";
      } else if (/stream|branch/i.test(cleanLabel)) {
        if (isNarrativeParagraph(strVal)) correctedAnswers[field.id] = higherSecondary.stream || "Science (PCM)";
      }
      continue;
    }

    // 7. Experience (Fresher = 0)
    if (/experience.*year|years.*experience|total.*years/i.test(cleanLabel)) {
      if (isNarrativeParagraph(strVal)) correctedAnswers[field.id] = "0";
      continue;
    }
    if (/experience.*month|months.*experience/i.test(cleanLabel)) {
      if (isNarrativeParagraph(strVal)) correctedAnswers[field.id] = "0 months";
      continue;
    }

    // 8. Notice Period
    if (/notice[\s_-]?period|joining[\s_-]?time|availability/i.test(cleanLabel)) {
      if (isNarrativeParagraph(strVal)) correctedAnswers[field.id] = "Immediate";
      continue;
    }

    // 9. CTC / Salary
    if (/current[\s_-]?ctc|present[\s_-]?ctc/i.test(cleanLabel)) {
      if (isNarrativeParagraph(strVal)) correctedAnswers[field.id] = "0";
      continue;
    }
    if (/expected[\s_-]?ctc|desired[\s_-]?ctc/i.test(cleanLabel)) {
      if (isNarrativeParagraph(strVal)) correctedAnswers[field.id] = "3";
      continue;
    }
  }

  return correctedAnswers;
}
