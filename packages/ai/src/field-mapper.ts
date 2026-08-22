import { FieldClassificationInput, FieldClassificationResult } from "@internship-copilot/types";
import { callStructuredModel } from "./client";
import { buildClassifyFieldPrompt } from "./prompts/classify-field";

const fieldClassificationJsonSchema = {
  type: "object",
  properties: {
    profilePath: {
      type: ["string", "null"],
      description: "Matching profile path from allowed candidates or null if no confident match",
    },
    confidence: {
      type: "number",
      description: "Confidence score between 0.0 and 1.0",
    },
    reasoning: {
      type: "string",
      description: "Short explanation for this classification",
    },
  },
  required: ["profilePath", "confidence", "reasoning"],
  additionalProperties: false,
};

/**
 * Classifies an unknown or ambiguous form field against a candidate list of profile paths.
 * Enforces Data Minimization: accepts only schema paths, never the user's actual profile data.
 */
export async function classifyField(
  field: FieldClassificationInput,
  candidateProfilePaths: string[]
): Promise<FieldClassificationResult> {
  const { system, user } = buildClassifyFieldPrompt({
    rawLabel: field.label,
    fieldType: field.type,
    name: field.name,
    nearbyText: field.nearbyText,
    candidateProfilePaths,
  });

  const result = await callStructuredModel<FieldClassificationResult>({
    tier: "fast",
    systemPrompt: system,
    userPrompt: user,
    schema: fieldClassificationJsonSchema,
    schemaName: "field_classification",
  });

  // Defense-in-depth: Ensure suggested path is strictly within candidateProfilePaths
  if (result.data.profilePath && !candidateProfilePaths.includes(result.data.profilePath)) {
    return {
      profilePath: null,
      confidence: 0.0,
      reasoning: "AI suggested path outside allowed candidates list",
    };
  }

  // Ensure confidence score is strictly bounded [0, 1]
  const boundedConfidence = Math.max(0, Math.min(1, result.data.confidence));

  return {
    profilePath: result.data.profilePath,
    confidence: boundedConfidence,
    reasoning: result.data.reasoning,
  };
}
