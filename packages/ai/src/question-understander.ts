import { FieldContext, AnswerPlan } from "@internship-copilot/types";
import { callStructuredModel } from "./client";
import { buildAnswerUnderstandingPrompt } from "./prompts/answer-understanding";

const answerPlanJsonSchema = {
  type: "object",
  properties: {
    intent: { type: "string" },
    sourcePaths: { type: "array", items: { type: "string" } },
    operation: {
      type: "string",
      enum: ["direct_fact", "extract_component", "transform_format", "generative_evidence"],
    },
    component: {
      type: "string",
      enum: ["year", "month", "day", "age", "duration", "domain", "format", "full"],
    },
    outputType: {
      type: "string",
      enum: ["string", "integer", "boolean", "date", "enum"],
    },
    confidence: { type: "number" },
    reasoning: { type: "string" },
  },
  required: ["intent", "sourcePaths", "operation", "outputType", "confidence"],
};

/**
 * Fast deterministic analysis for common form questions (0ms AI latency)
 */
function analyzeDeterministicPlan(ctx: FieldContext): AnswerPlan | null {
  const combined = `${ctx.label} ${ctx.name || ""} ${ctx.placeholder || ""} ${ctx.nearbyText || ""}`.toLowerCase();

  // 1. Birth Year / DOB Year
  if (/birth[\s_-]?year|year[\s_-]?of[\s_-]?birth|\byob\b/i.test(combined) || (combined.includes("birth") && combined.includes("year"))) {
    return {
      intent: "date_of_birth_year",
      sourcePaths: ["personal.dateOfBirth"],
      operation: "extract_component",
      component: "year",
      outputType: "integer",
      confidence: 0.99,
      reasoning: "Matched birth year component extraction pattern",
    };
  }

  // 2. Age
  if (/\bage\b|your[\s_-]?age/i.test(combined) && !/stage|message|package/i.test(combined)) {
    return {
      intent: "applicant_age",
      sourcePaths: ["personal.dateOfBirth"],
      operation: "extract_component",
      component: "age",
      outputType: "integer",
      confidence: 0.98,
      reasoning: "Matched applicant age calculation pattern",
    };
  }

  // 3. Graduation Year / End Year
  if (/graduat(ion|ed)[\s_-]?year|pass(ing|out)[\s_-]?year|end[\s_-]?year/i.test(combined)) {
    return {
      intent: "graduation_year",
      sourcePaths: ["education[0].endDate"],
      operation: "extract_component",
      component: "year",
      outputType: "integer",
      confidence: 0.98,
      reasoning: "Matched graduation year extraction pattern",
    };
  }

  // 4. Full Location
  if (/location|city[\s,]+state|city[\s,]+country|where[\s_-]?are[\s_-]?you[\s_-]?located/i.test(combined)) {
    return {
      intent: "applicant_location",
      sourcePaths: ["personal.city", "personal.state", "personal.country"],
      operation: "transform_format",
      component: "full",
      outputType: "string",
      confidence: 0.99,
      reasoning: "Matched location composite transformation pattern",
    };
  }

  // 5. Total Experience (Years)
  if (/total[\s_-]?experience|years[\s_-]?of[\s_-]?experience/i.test(combined)) {
    return {
      intent: "work_experience_years",
      sourcePaths: ["experience"],
      operation: "transform_format",
      component: "duration",
      outputType: "integer",
      confidence: 0.98,
      reasoning: "Matched work experience years calculation pattern",
    };
  }

  // 6. Direct Facts (Email, Name, Phone, LinkedIn, GitHub)
  if (/e[\s_-]?mail/i.test(combined)) {
    return {
      intent: "email_address",
      sourcePaths: ["personal.email"],
      operation: "direct_fact",
      outputType: "string",
      confidence: 0.99,
    };
  }
  if (/phone|mobile|contact/i.test(combined)) {
    return {
      intent: "phone_number",
      sourcePaths: ["personal.phone"],
      operation: "direct_fact",
      outputType: "string",
      confidence: 0.99,
    };
  }
  if (/linkedin/i.test(combined)) {
    return {
      intent: "linkedin_url",
      sourcePaths: ["links.linkedin"],
      operation: "direct_fact",
      outputType: "string",
      confidence: 0.99,
    };
  }
  if (/github/i.test(combined)) {
    return {
      intent: "github_url",
      sourcePaths: ["links.github"],
      operation: "direct_fact",
      outputType: "string",
      confidence: 0.99,
    };
  }

  // 7. Generative Subjective Essays ("Why join us?", "Describe a project", "Tell us about yourself")
  if (/why[\s_-]?(do[\s_-]?you[\s_-]?want|join|work|apply)|cover[\s_-]?letter|describe[\s_-]?a[\s_-]?project|about[\s_-]?yourself|tell[\s_-]?us/i.test(combined)) {
    return {
      intent: "subjective_motivation_essay",
      sourcePaths: ["skills", "experience", "education"],
      operation: "generative_evidence",
      outputType: "string",
      confidence: 0.90,
      reasoning: "Matched subjective application essay pattern",
    };
  }

  return null;
}

/**
 * Understands form field question using 0ms deterministic rules with NIM LLM fallback
 */
export async function understandQuestion(ctx: FieldContext): Promise<AnswerPlan> {
  const deterministicPlan = analyzeDeterministicPlan(ctx);
  if (deterministicPlan) {
    return deterministicPlan;
  }

  // Fallback to NVIDIA NIM AI Semantic Understanding
  try {
    const userPrompt = buildAnswerUnderstandingPrompt(ctx);
    const result = await callStructuredModel<AnswerPlan>({
      systemPrompt: "You are an ATS form question analyzer. Produce raw JSON adhering to the specified schema.",
      userPrompt,
      schema: answerPlanJsonSchema,
      tier: "fast",
    });

    if (result && result.data && result.data.intent) {
      return {
        ...result.data,
        confidence: Math.min(0.99, Math.max(0.5, result.data.confidence || 0.85)),
      };
    }
  } catch (err) {
    console.warn("NIM question understanding fallback error:", err);
  }

  // Safe fallback plan
  return {
    intent: "general_field_question",
    sourcePaths: ["skills", "experience"],
    operation: "generative_evidence",
    outputType: "string",
    confidence: 0.6,
    reasoning: "Fallback generic semantic plan",
  };
}
