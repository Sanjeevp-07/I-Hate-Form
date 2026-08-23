import { NextRequest, NextResponse } from "next/server";
import { analyzeFieldsRequestSchema } from "@internship-copilot/validation";
import { classifyFieldsBatch, BatchFieldInput } from "@internship-copilot/ai";
import { FieldMapping, FieldDescriptor } from "@internship-copilot/types";
import { CONFIDENCE_THRESHOLDS } from "@internship-copilot/config";
import { logAIInteraction } from "@internship-copilot/database";

const CANDIDATE_PROFILE_PATHS = [
  "personal.title",
  "personal.firstName",
  "personal.middleName",
  "personal.lastName",
  "personal.fullName",
  "personal.email",
  "personal.phone",
  "personal.countryCode",
  "personal.gender",
  "personal.dob",
  "personal.nationality",
  "personal.country",
  "personal.state",
  "personal.city",
  "personal.postalCode",
  "personal.address",
  "personal.authorizedInCountry",
  "personal.requiresSponsorship",
  "links.linkedin",
  "links.github",
  "links.portfolio",
  "education.0.institution",
  "education.0.degree",
  "education.0.fieldOfStudy",
  "education.0.gpa",
  "education.0.startDate",
  "education.0.endDate",
];

// Comprehensive deterministic rules mapping labels and attributes with maximum confidence
const DETERMINISTIC_PATTERNS: Array<{ pattern: RegExp; path: string; confidence: number }> = [
  { pattern: /country[\s_-]?code|dial[\s_-]?code|isd[\s_-]?code/i, path: "personal.countryCode", confidence: 0.98 },
  { pattern: /^country\b|current[\s_-]?country|nation\b/i, path: "personal.country", confidence: 0.98 },
  { pattern: /^state\b|province|region|state[\s_-]?\/?[\s_-]?province/i, path: "personal.state", confidence: 0.98 },
  { pattern: /^city\b|current[\s_-]?city|town\b/i, path: "personal.city", confidence: 0.98 },
  { pattern: /pincode|pin[\s_-]?code|postal[\s_-]?code|zip[\s_-]?code|zip\b/i, path: "personal.postalCode", confidence: 0.98 },
  { pattern: /current[\s_-]?street|locality|area|street[\s_-]?address|address[\s_-]?1|address|addr/i, path: "personal.address", confidence: 0.98 },
  { pattern: /e[\s_-]?mail/i, path: "personal.email", confidence: 0.99 },
  { pattern: /phone|mobile|telephone|contact[\s_-]?number|cell\b/i, path: "personal.phone", confidence: 0.98 },
  { pattern: /gender|sex\b/i, path: "personal.gender", confidence: 0.98 },
  { pattern: /date[\s_-]?of[\s_-]?birth|d[\s_-]?o[\s_-]?b|birth[\s_-]?date|dob/i, path: "personal.dob", confidence: 0.98 },
  { pattern: /nationality|citizenship/i, path: "personal.nationality", confidence: 0.98 },
  { pattern: /^title\b|salutation|prefix/i, path: "personal.title", confidence: 0.98 },
  { pattern: /first[\s_-]?name|given[\s_-]?name|fname/i, path: "personal.firstName", confidence: 0.99 },
  { pattern: /middle[\s_-]?name|mname/i, path: "personal.middleName", confidence: 0.96 },
  { pattern: /last[\s_-]?name|surname|family[\s_-]?name|lname/i, path: "personal.lastName", confidence: 0.99 },
  { pattern: /^(\*|\s)*(full[\s_-]?name|your[\s_-]?name|candidate[\s_-]?name|applicant[\s_-]?name|legal[\s_-]?name|name)(\*|\s)*$|\bfull[\s_-]?name\b/i, path: "personal.fullName", confidence: 0.95 },
  { pattern: /linkedin/i, path: "links.linkedin", confidence: 0.98 },
  { pattern: /github/i, path: "links.github", confidence: 0.98 },
  { pattern: /portfolio|personal[\s_-]?website|website/i, path: "links.portfolio", confidence: 0.98 },
  { pattern: /sponsorship|require[\s_-]?visa/i, path: "personal.requiresSponsorship", confidence: 0.95 },
  { pattern: /authorized[\s_-]?to[\s_-]?work|legal[\s_-]?right[\s_-]?to[\s_-]?work/i, path: "personal.authorizedInCountry", confidence: 0.95 },
];

function matchDeterministicRule(field: FieldDescriptor): { profilePath: string; confidence: number } | null {
  const directText = `${field.normalizedLabel} ${field.rawLabel}`.trim();
  for (const rule of DETERMINISTIC_PATTERNS) {
    if (rule.pattern.test(directText)) {
      return { profilePath: rule.path, confidence: rule.confidence };
    }
  }

  const fullText = `${directText} ${field.name || ""} ${field.autocomplete || ""} ${field.nearbyText || ""}`.trim();
  for (const rule of DETERMINISTIC_PATTERNS) {
    if (rule.pattern.test(fullText)) {
      return { profilePath: rule.path, confidence: rule.confidence };
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const mockUserId = "user_default";

  try {
    const body = await req.json();
    const parsed = analyzeFieldsRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid analysis payload", details: parsed.error.format() }, { status: 400 });
    }

    const { fields } = parsed.data;
    const mappings: FieldMapping[] = [];
    const ambiguousFields: BatchFieldInput[] = [];

    // Step 1: Deterministic rules run FIRST (§9 Pipeline)
    for (const field of fields) {
      const ruleMatch = matchDeterministicRule(field);

      if (ruleMatch && ruleMatch.confidence >= CONFIDENCE_THRESHOLDS.AUTO_FILL_REVIEW) {
        const action = ruleMatch.confidence >= CONFIDENCE_THRESHOLDS.AUTO_FILL ? "fill" : "fill";
        mappings.push({
          fieldId: field.id,
          rawLabel: field.rawLabel,
          normalizedLabel: field.normalizedLabel,
          profilePath: ruleMatch.profilePath,
          valueToFill: null,
          confidence: ruleMatch.confidence,
          action,
          source: "rule",
          reason: "Matched deterministic rule pattern",
        });
      } else {
        ambiguousFields.push({
          id: field.id,
          rawLabel: field.rawLabel,
          normalizedLabel: field.normalizedLabel,
          fieldType: field.type,
          name: field.name,
          nearbyText: field.nearbyText,
        });
      }
    }

    // Step 2: Batch AI classification for ambiguous fields with label caching (§10.1 & §10.3)
    if (ambiguousFields.length > 0) {
      const batchOutput = await classifyFieldsBatch(ambiguousFields, CANDIDATE_PROFILE_PATHS);
      const latencyMs = Date.now() - startTime;

      for (const field of ambiguousFields) {
        const classification = batchOutput.results.get(field.id) || {
          profilePath: null,
          confidence: 0.0,
          reasoning: "Classification unavailable",
        };

        let action: FieldMapping["action"] = "unsupported";
        if (classification.confidence >= CONFIDENCE_THRESHOLDS.AUTO_FILL) {
          action = "fill";
        } else if (classification.confidence >= CONFIDENCE_THRESHOLDS.AUTO_FILL_REVIEW) {
          action = "fill";
        } else if (classification.confidence >= CONFIDENCE_THRESHOLDS.ASK_USER) {
          action = "review";
        }

        mappings.push({
          fieldId: field.id,
          rawLabel: field.rawLabel,
          normalizedLabel: field.normalizedLabel,
          profilePath: classification.profilePath,
          valueToFill: null,
          confidence: classification.confidence,
          action,
          source: "ai_fast",
          reason: classification.reasoning,
        });
      }

      // Log AI telemetry
      if (batchOutput.tokens.input > 0) {
        await logAIInteraction({
          userId: mockUserId,
          operation: "CLASSIFY",
          inputTokens: batchOutput.tokens.input,
          outputTokens: batchOutput.tokens.output,
          model: "meta/llama-3.1-8b-instruct",
          latencyMs,
          success: true,
        });
      }
    }

    return NextResponse.json({ mappings }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to analyze fields" }, { status: 500 });
  }
}
