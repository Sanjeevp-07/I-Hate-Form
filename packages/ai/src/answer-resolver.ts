import { AnswerPlan, AnswerResult, UserProfile } from "@internship-copilot/types";
import {
  resolveDirectFact,
  extractDOBComponent,
  extractGraduationYear,
  calculateTotalExperience,
  formatCompositeLocation,
  extractURLDomain,
} from "./deterministic-transformers";
import { callStructuredModel } from "./client";

const generativeAnswerJsonSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
    hasSufficientEvidence: { type: "boolean" },
    evidenceUsed: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
    reasoning: { type: "string" },
  },
  required: ["answer", "hasSufficientEvidence", "confidence"],
};

export interface ResolveAnswerOptions {
  plan: AnswerPlan;
  profile: UserProfile;
  jobDescription?: string;
  resumeText?: string;
}

/**
 * Executes the 3-Level Answer Resolution Pipeline:
 * Level A (Direct Fact) -> Level B (Derived Transformation) -> Level C (Generative Evidence Grounding)
 */
export async function resolveAnswer(options: ResolveAnswerOptions): Promise<AnswerResult> {
  const { plan, profile, jobDescription, resumeText } = options;

  // Level A: Direct Answer (No LLM Call)
  if (plan.operation === "direct_fact") {
    for (const path of plan.sourcePaths) {
      const fact = resolveDirectFact(profile, path);
      if (fact !== null && fact !== undefined) {
        return {
          status: "resolved",
          answer: fact,
          source: "database",
          sourcePaths: [path],
          operation: "direct_fact",
          confidence: plan.confidence || 0.99,
          formatValid: true,
          evidence: [path],
          reasoning: `Retrieved direct stored profile fact for '${path}'`,
        };
      }
    }
  }

  // Level B: Derived Answer (NIM Understands Intent, Pure Code Computes/Transforms)
  if (plan.operation === "extract_component" || plan.operation === "transform_format") {
    // 1. Date of Birth Component / Age
    if (plan.intent.includes("birth") || plan.intent.includes("dob") || plan.intent.includes("age")) {
      const dobStr = (profile.personal as any)?.dateOfBirth || (profile.personal as any)?.dob;
      const targetComponent = (plan.component === "year" || plan.component === "month" || plan.component === "day" || plan.component === "age") ? plan.component : "year";
      const derived = extractDOBComponent(dobStr, targetComponent);
      if (derived !== null) {
        return {
          status: "resolved",
          answer: derived,
          source: "derived",
          sourcePaths: ["personal.dateOfBirth"],
          operation: `extract_component_${targetComponent}`,
          confidence: 0.99,
          formatValid: true,
          evidence: ["personal.dateOfBirth"],
          reasoning: `Deterministically derived ${targetComponent} from candidate date of birth`,
        };
      }
    }

    // 2. Graduation Year
    if (plan.intent.includes("graduation") || plan.intent.includes("passout")) {
      const gradYear = extractGraduationYear(profile.education);
      if (gradYear) {
        return {
          status: "resolved",
          answer: gradYear,
          source: "derived",
          sourcePaths: ["education[0].endDate"],
          operation: "extract_component_graduation_year",
          confidence: 0.98,
          formatValid: true,
          evidence: ["education[0].endDate"],
          reasoning: "Deterministically extracted graduation year from education end date",
        };
      }
    }

    // 3. Location Composite
    if (plan.intent.includes("location") || plan.intent.includes("city")) {
      const loc = formatCompositeLocation(profile);
      return {
        status: "resolved",
        answer: loc,
        source: "derived",
        sourcePaths: ["personal.city", "personal.state", "personal.country"],
        operation: "transform_format_composite_location",
        confidence: 0.99,
        formatValid: true,
        evidence: ["personal.city", "personal.state", "personal.country"],
        reasoning: "Deterministically formatted candidate city/state/country",
      };
    }

    // 4. Total Experience
    if (plan.intent.includes("experience")) {
      const expYears = calculateTotalExperience(profile.experience, "years");
      return {
        status: "resolved",
        answer: expYears,
        source: "derived",
        sourcePaths: ["experience"],
        operation: "transform_format_total_experience",
        confidence: 0.98,
        formatValid: true,
        evidence: ["experience"],
        reasoning: "Deterministically computed total work experience duration",
      };
    }

    // 5. URL Domain Extraction
    if (plan.intent.includes("domain")) {
      const domain = extractURLDomain(profile.links?.portfolio || profile.links?.linkedin);
      if (domain) {
        return {
          status: "resolved",
          answer: domain,
          source: "derived",
          sourcePaths: ["links"],
          operation: "extract_component_domain",
          confidence: 0.98,
          formatValid: true,
          evidence: ["links"],
          reasoning: "Deterministically extracted domain from website link",
        };
      }
    }
  }

  // Level C: Missing / Generative Answer (NIM Uses Resume + User Context)
  const skillsList = Array.isArray(profile.skills)
    ? profile.skills.map((s: any) => (typeof s === "string" ? s : s?.name || "")).filter(Boolean).join(", ")
    : "React, TypeScript, Next.js, Python, Node.js, Tailwind CSS";

  const expSummary = profile.experience && profile.experience.length > 0
    ? profile.experience.map((e: any) => `${e.title || "Role"} at ${e.company || "Company"}`).join("; ")
    : "Fresher / Student projects";

  const userPrompt = `
You are an AI Application Assistant generating a grounded, truthful response for a job application form question.

### QUESTION INTENT: ${plan.intent}
### TARGET OUTPUT TYPE: ${plan.outputType}

### AVAILABLE CANDIDATE EVIDENCE (Delimited for Security):
<candidate_evidence>
Name: ${profile.personal?.firstName || "Sanjeev"} ${profile.personal?.lastName || "Kumar"}
Skills: ${skillsList}
Experience Summary: ${expSummary}
Resume Highlights: ${resumeText ? resumeText.slice(0, 1000) : "Built full-stack AI applications, Next.js dashboard, Chrome extensions"}
Job Description Context: ${jobDescription ? jobDescription.slice(0, 1000) : "Software Engineering Role"}
</candidate_evidence>

### MANDATORY TRUTHFULNESS & GROUNDING RULES:
1. Base your draft strictly on the candidate evidence provided. Do NOT fabricate fake employers, unearned degrees, fake dates, or ungrounded achievements.
2. If evidence is insufficient to formulate a truthful answer, set "hasSufficientEvidence": false.
3. Return JSON ONLY matching this schema:
{
  "answer": "string",
  "hasSufficientEvidence": true | false,
  "evidenceUsed": ["string"],
  "confidence": 0.90,
  "reasoning": "string"
}
`.trim();

  try {
    const aiResult = await callStructuredModel<{
      answer: string;
      hasSufficientEvidence: boolean;
      evidenceUsed?: string[];
      confidence?: number;
      reasoning?: string;
    }>({
      systemPrompt: "You are an ATS answer generator. Produce raw JSON adhering to the specified schema.",
      userPrompt,
      schema: generativeAnswerJsonSchema,
      tier: "workhorse",
    });

    if (aiResult && aiResult.data && aiResult.data.hasSufficientEvidence && aiResult.data.answer) {
      return {
        status: "review", // Generative subjective answers require user review per v2.0 policy
        answer: aiResult.data.answer,
        source: "nim",
        sourcePaths: plan.sourcePaths,
        operation: "generative_evidence",
        confidence: Math.min(0.95, aiResult.data.confidence || 0.88),
        formatValid: true,
        evidence: aiResult.data.evidenceUsed || plan.sourcePaths,
        reasoning: aiResult.data.reasoning || "Generated grounded response from candidate evidence",
      };
    }
  } catch (err) {
    console.warn("NIM generative answer resolution fallback:", err);
  }

  // Insufficient evidence gate -> NEEDS_USER_INPUT (prevents hallucinating)
  return {
    status: "needs_user_input",
    answer: null,
    source: "nim",
    sourcePaths: plan.sourcePaths,
    operation: "generative_evidence",
    confidence: 0.0,
    formatValid: false,
    reasoning: "Insufficient candidate evidence to generate factual answer without hallucination",
  };
}
