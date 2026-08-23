import { FormSelectOption } from "@internship-copilot/types";

export interface OptionCandidate {
  index: number;
  value: string;
  text: string;
  label: string;
  disabled?: boolean;
}

export interface OptionMatchResult {
  matchedIndex: number;
  matchedValue: string;
  matchedText: string;
  score: number;
}

// Synonyms, aliases, and ISO codes knowledge base
const ALIAS_DICTIONARY: Record<string, string[]> = {
  // Gender
  male: [
    "male",
    "m",
    "man",
    "men",
    "male (m)",
    "he/him",
    "he / him",
    "purush",
    "1",
    "male/man",
    "cis male",
    "cisgender male",
    "m - male",
    "1 - male",
    "male / man",
    "male/men",
  ],
  female: [
    "female",
    "f",
    "woman",
    "women",
    "female (f)",
    "she/her",
    "she / her",
    "mahila",
    "2",
    "female/woman",
    "cis female",
    "cisgender female",
    "f - female",
    "2 - female",
    "female / woman",
    "female/women",
  ],
  other: [
    "other",
    "non-binary",
    "non binary",
    "transgender",
    "prefer not to say",
    "third gender",
    "3",
    "trans",
    "others",
    "decline to state",
    "not specified",
  ],
  m: ["male", "m", "man", "men", "1"],
  f: ["female", "f", "woman", "women", "2"],

  // Salutations / Titles
  "mr.": ["mr.", "mr", "mister", "shri", "dr.", "dr", "sir"],
  "ms.": ["ms.", "ms", "miss", "mrs.", "mrs", "shrimati", "shree"],
  "mrs.": ["mrs.", "mrs", "ms.", "ms", "shrimati"],
  "dr.": ["dr.", "dr", "doctor"],

  // Dial / Country Codes
  "+91": ["+91", "91", "india (+91)", "india(+91)", "(+91)", "+91 (india)", "india (91)"],
  "+1": ["+1", "1", "usa (+1)", "united states (+1)", "(+1)", "canada (+1)", "+1 (usa)"],
  "+44": ["+44", "44", "uk (+44)", "united kingdom (+44)", "(+44)"],

  // Countries & Nationalities
  india: [
    "india",
    "ind",
    "in",
    "republic of india",
    "indian",
    "citizen of india",
    "india (+91)",
    "356",
    "101",
    "asian - indian",
    "asian (indian)",
    "asian indian",
    "indian national",
    "nationality: indian",
  ],
  indian: [
    "indian",
    "india",
    "citizen of india",
    "ind",
    "in",
    "republic of india",
    "asian - indian",
    "asian (indian)",
    "asian indian",
    "indian national",
    "nationality: indian",
    "356",
    "101",
  ],
  "united states": ["united states", "usa", "us", "united states of america", "american", "840"],
  american: ["american", "united states", "usa", "us", "citizen of united states", "840"],
  "united kingdom": ["united kingdom", "uk", "great britain", "british", "gb", "gbr"],
  british: ["british", "united kingdom", "uk", "great britain"],
  canada: ["canada", "can", "ca", "canadian"],
  canadian: ["canadian", "canada", "can", "ca"],
  australia: ["australia", "aus", "au", "australian"],
  australian: ["australian", "australia", "aus", "au"],
  germany: ["germany", "de", "deu", "german", "deutschland"],
  singapore: ["singapore", "sg", "sgp", "singaporean"],
  "united arab emirates": ["united arab emirates", "uae", "ae", "are", "emirati"],

  // Indian States & UTs
  "uttar pradesh": ["uttar pradesh", "up", "u.p.", "uttarpradesh", "uttaranchal"],
  maharashtra: ["maharashtra", "mh", "m.h."],
  delhi: ["delhi", "new delhi", "ncr", "national capital territory of delhi", "dl", "d.l."],
  karnataka: ["karnataka", "ka", "k.a.", "bangalore", "bengaluru"],
  "tamil nadu": ["tamil nadu", "tn", "t.n.", "tamilnadu", "chennai"],
  haryana: ["haryana", "hr", "h.r.", "gurgaon", "gurugram"],
  punjab: ["punjab", "pb", "p.b."],
  gujarat: ["gujarat", "gj", "g.j."],
  rajasthan: ["rajasthan", "rj", "r.j."],
  "west bengal": ["west bengal", "wb", "w.b.", "kolkata"],
  telangana: ["telangana", "ts", "tg", "hyderabad"],
  "andhra pradesh": ["andhra pradesh", "ap", "a.p."],
  kerala: ["kerala", "kl", "k.l."],
  bihar: ["bihar", "br", "b.r."],
  "madhya pradesh": ["madhya pradesh", "mp", "m.p."],
  odisha: ["odisha", "orissa", "or", "od"],
  assam: ["assam", "as"],
  jharkhand: ["jharkhand", "jh"],
  chhattisgarh: ["chhattisgarh", "cg"],
  uttarakhand: ["uttarakhand", "uk"],
  "himachal pradesh": ["himachal pradesh", "hp"],
  chandigarh: ["chandigarh", "ch"],
  goa: ["goa", "ga"],

  // Boolean / Yes / No
  yes: ["yes", "y", "true", "1", "authorized", "eligible", "agreed"],
  no: ["no", "n", "false", "0", "not authorized", "not eligible", "disagree"],
};

/**
 * Checks if option text represents a placeholder / empty prompt.
 */
export function isPlaceholderOption(text: string, value: string): boolean {
  const normText = text.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  const normVal = value.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

  if (!normText || normText === "-" || normText === "--" || normText === "none") {
    return true;
  }
  if (!normVal && (normText.includes("select") || normText.includes("choose") || normText.includes("please"))) {
    return true;
  }
  if (normText.startsWith("pleaseselect") || normText.startsWith("select") || normText.startsWith("choose")) {
    return true;
  }
  return false;
}

/**
 * Normalizes text for robust comparison.
 */
function cleanText(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/[\u00a0\r\n\t]+/g, " ")
    .replace(/[^\w\s+.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates string similarity using Dice coefficient / bigrams.
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  if (str1.includes(str2) || str2.includes(str1)) return 0.85;

  const pairs1 = getBigrams(str1);
  const pairs2 = getBigrams(str2);
  const union = pairs1.size + pairs2.size;
  if (union === 0) return 0.0;

  let intersection = 0;
  for (const pair of pairs1) {
    if (pairs2.has(pair)) intersection++;
  }

  return (2.0 * intersection) / union;
}

function getBigrams(str: string): Set<string> {
  const bigrams = new Set<string>();
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.add(str.substring(i, i + 2));
  }
  return bigrams;
}

/**
 * Finds the best matching option for a given target string from a list of options.
 */
export function findBestOptionMatch(
  options: Array<OptionCandidate | HTMLOptionElement | FormSelectOption>,
  targetValue: string | boolean | string[]
): OptionMatchResult | null {
  if (!options || options.length === 0) return null;

  const targetStr = String(targetValue);
  const cleanTarget = cleanText(targetStr);
  if (!cleanTarget) return null;

  // Retrieve alias list for the target if available
  const aliases = ALIAS_DICTIONARY[cleanTarget] || [];

  let bestMatch: OptionMatchResult | null = null;
  let highestScore = -1;

  for (let i = 0; i < options.length; i++) {
    const rawOpt = options[i];
    const index = "index" in rawOpt && typeof rawOpt.index === "number" ? rawOpt.index : i;
    const value = "value" in rawOpt ? String(rawOpt.value || "") : "";
    const text = "text" in rawOpt ? String(rawOpt.text || "") : "label" in rawOpt ? String(rawOpt.label || "") : "";
    const label = "label" in rawOpt ? String(rawOpt.label || "") : "";

    const cleanOptVal = cleanText(value);
    const cleanOptText = cleanText(text || label);

    // Skip disabled options
    if ("disabled" in rawOpt && rawOpt.disabled) {
      continue;
    }

    // Skip placeholder options (e.g. "Please Select", "-- Select --", etc.)
    const isPlaceholder = isPlaceholderOption(text || label, value);
    if (isPlaceholder) {
      continue;
    }

    let score = 0;

    // 1. Exact string match on Value or Text/Label
    if (cleanOptVal === cleanTarget || cleanOptText === cleanTarget) {
      score = 100;
    }
    // 2. Direct match against known aliases/synonyms
    else if (aliases.includes(cleanOptVal) || aliases.includes(cleanOptText)) {
      score = 95;
    }
    // 3. Reverse alias search (e.g. cleanOptText matches alias key whose list includes target)
    else if (
      ALIAS_DICTIONARY[cleanOptText]?.includes(cleanTarget) ||
      ALIAS_DICTIONARY[cleanOptVal]?.includes(cleanTarget)
    ) {
      score = 94;
    }
    // 4. Whole word boundary match in Text (e.g. "India (+91)" matches "India" or "+91")
    else if (
      new RegExp(`(^|\\b|\\()${cleanTarget.replace(/[+.*^$?(){}|[\]\\]/g, "\\$&")}(\\b|\\)|$)`, "i").test(cleanOptText) ||
      new RegExp(`(^|\\b|\\()${cleanTarget.replace(/[+.*^$?(){}|[\]\\]/g, "\\$&")}(\\b|\\)|$)`, "i").test(cleanOptVal)
    ) {
      score = 90;
    }
    // 5. Text starts with target or target starts with text
    else if (
      cleanOptText.startsWith(cleanTarget) ||
      cleanTarget.startsWith(cleanOptText)
    ) {
      score = 85;
    }
    // 6. Substring containment
    else if (
      cleanOptText.includes(cleanTarget) ||
      (cleanOptVal && cleanOptVal.includes(cleanTarget))
    ) {
      score = 75;
    }
    // 7. Fuzzy bigram string similarity
    else {
      const similarity = Math.max(
        calculateSimilarity(cleanOptText, cleanTarget),
        calculateSimilarity(cleanOptVal, cleanTarget)
      );
      if (similarity >= 0.7) {
        score = Math.round(similarity * 70);
      }
    }

    // If it's a placeholder and we only got a weak match, drop score
    if (isPlaceholder && score < 90) {
      score = 0;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = {
        matchedIndex: index,
        matchedValue: value,
        matchedText: text || label || value,
        score,
      };
    }
  }

  // Only return matches with meaningful confidence score (> 40)
  return highestScore > 40 ? bestMatch : null;
}
