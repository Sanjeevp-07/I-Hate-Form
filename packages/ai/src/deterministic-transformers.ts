import { UserProfile } from "@internship-copilot/types";

/**
 * Safely retrieve a value from nested profile object using a dot-notation path
 */
export function getNestedProfileValue(profile: any, path: string): any {
  if (!profile || !path) return null;
  const parts = path.split(".");
  let curr = profile;
  for (const part of parts) {
    if (curr === null || curr === undefined) return null;
    curr = curr[part];
  }
  return curr;
}

/**
 * Level A: Resolves exact direct profile facts (email, phone, name, github, linkedin, address, etc.)
 */
export function resolveDirectFact(profile: UserProfile, path: string): string | boolean | string[] | null {
  const val = getNestedProfileValue(profile, path);
  if (val !== null && val !== undefined && val !== "") {
    if (Array.isArray(val)) {
      return val.map((v) => (typeof v === "string" ? v : v?.name || String(v))).filter(Boolean);
    }
    return val;
  }
  return null;
}

/**
 * Level B: Extracts Date of Birth components (year, month, day, or current age)
 */
export function extractDOBComponent(dobStr?: string | null, component?: "year" | "month" | "day" | "age"): string | number | null {
  if (!dobStr) dobStr = "2003-07-18"; // Fallback default candidate DOB if unconfigured
  const clean = dobStr.trim();
  const dateObj = new Date(clean);

  if (isNaN(dateObj.getTime())) {
    // Attempt regex parsing for DD/MM/YYYY or YYYY-MM-DD
    const matchYr = clean.match(/\b(19\d\d|20\d\d)\b/);
    if (matchYr && component === "year") return matchYr[1];
    return null;
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  if (component === "year") return String(year);
  if (component === "month") return month;
  if (component === "day") return day;
  if (component === "age") {
    const today = new Date();
    let age = today.getFullYear() - year;
    const m = today.getMonth() - dateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dateObj.getDate())) {
      age--;
    }
    return Math.max(18, age);
  }

  return clean;
}

/**
 * Level B: Extracts graduation year or end date from candidate education history
 */
export function extractGraduationYear(educationRecords?: any[]): string | null {
  if (!educationRecords || educationRecords.length === 0) return "2026";
  const firstEdu = educationRecords[0];
  const endDate = firstEdu.endDate || firstEdu.endYear || firstEdu.graduationYear;
  if (!endDate) return "2026";
  const match = String(endDate).match(/\b(19\d\d|20\d\d)\b/);
  return match ? match[1] : String(endDate);
}

/**
 * Level B: Calculates total work experience duration in years or months
 */
export function calculateTotalExperience(experienceRecords?: any[], unit: "years" | "months" = "years"): string {
  if (!experienceRecords || experienceRecords.length === 0) return "0";
  let totalMonths = 0;
  for (const exp of experienceRecords) {
    if (exp.startDate && exp.endDate) {
      const start = new Date(exp.startDate);
      const end = exp.endDate.toLowerCase() === "present" ? new Date() : new Date(exp.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        totalMonths += Math.max(0, diffMonths);
      }
    }
  }
  if (unit === "months") return String(totalMonths);
  const years = Math.round((totalMonths / 12) * 10) / 10;
  return String(years === 0 ? "0" : years);
}

/**
 * Level B: Formats location string from profile (City, State, Country)
 */
export function formatCompositeLocation(profile: UserProfile): string {
  const city = profile.personal?.city || "Greater Noida";
  const state = (profile.personal as any)?.state || "Uttar Pradesh";
  const country = profile.personal?.country || "India";
  return [city, state, country].filter(Boolean).join(", ");
}

/**
 * Level B: Extracts hostname domain from full web URL
 */
export function extractURLDomain(url?: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
