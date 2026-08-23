import { FieldClassificationInput, FieldClassificationResult } from "@internship-copilot/types";
import { callStructuredModel } from "./client";
import { buildClassifyFieldPrompt, buildBatchClassifyPrompt } from "./prompts/classify-field";

/**
 * In-memory LRU/Map cache for normalized field labels (§10.3 Cost Controls).
 * Prevents redundant LLM calls for recurring labels across forms.
 */
const normalizedLabelCache = new Map<string, FieldClassificationResult>();
const MAX_CACHE_SIZE = 500;

function normalizeLabelKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[*:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Classifies an individual field, checking the normalized label cache first.
 * Enforces Data Minimization: accepts only schema paths, never the user's actual profile data.
 */
export async function classifyField(
  field: FieldClassificationInput,
  candidateProfilePaths: string[]
): Promise<FieldClassificationResult> {
  const cacheKey = normalizeLabelKey(field.label);

  if (normalizedLabelCache.has(cacheKey)) {
    return normalizedLabelCache.get(cacheKey)!;
  }

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
    schemaName: "field_classification",
  });

  // Defense-in-depth: Ensure suggested path is strictly within candidateProfilePaths
  let finalPath = result.data.profilePath;
  let finalConfidence = Math.max(0, Math.min(1, typeof result.data.confidence === "number" ? result.data.confidence : 0));

  if (finalPath && !candidateProfilePaths.includes(finalPath)) {
    finalPath = null;
    finalConfidence = 0.0;
  }

  const boundedResult: FieldClassificationResult = {
    profilePath: finalPath,
    confidence: finalConfidence,
    reasoning: result.data.reasoning || "Classified via fast model",
  };

  // Cache normalized result
  if (normalizedLabelCache.size >= MAX_CACHE_SIZE) {
    const firstKey = normalizedLabelCache.keys().next().value;
    if (firstKey) normalizedLabelCache.delete(firstKey);
  }
  normalizedLabelCache.set(cacheKey, boundedResult);

  return boundedResult;
}

export interface BatchFieldInput {
  id: string;
  rawLabel: string;
  normalizedLabel: string;
  fieldType: string;
  name?: string;
  nearbyText?: string;
}

export interface BatchClassificationOutput {
  results: Map<string, FieldClassificationResult>;
  tokens: { input: number; output: number };
}

/**
 * Classifies a batch of ambiguous fields from the same page in a single model call (§10.3).
 * Skips fields already present in normalizedLabelCache.
 */
export async function classifyFieldsBatch(
  fields: BatchFieldInput[],
  candidateProfilePaths: string[]
): Promise<BatchClassificationOutput> {
  const results = new Map<string, FieldClassificationResult>();
  const unhandledFields: BatchFieldInput[] = [];

  // 1. Check cache first
  for (const field of fields) {
    const cacheKey = normalizeLabelKey(field.normalizedLabel || field.rawLabel);
    if (normalizedLabelCache.has(cacheKey)) {
      results.set(field.id, normalizedLabelCache.get(cacheKey)!);
    } else {
      unhandledFields.push(field);
    }
  }

  if (unhandledFields.length === 0) {
    return { results, tokens: { input: 0, output: 0 } };
  }

  // 2. Batch call model for remaining unhandled fields
  const { system, user } = buildBatchClassifyPrompt({
    fields: unhandledFields,
    candidateProfilePaths,
  });

  try {
    const response = await callStructuredModel<{
      classifications: Array<{
        fieldId: string;
        profilePath: string | null;
        confidence: number;
        reasoning: string;
      }>;
    }>({
      tier: "fast",
      systemPrompt: system,
      userPrompt: user,
      schemaName: "batch_field_classification",
    });

    const classifications = response.data.classifications || [];

    for (const item of classifications) {
      let finalPath = item.profilePath;
      if (finalPath && !candidateProfilePaths.includes(finalPath)) {
        finalPath = null;
      }

      const bounded: FieldClassificationResult = {
        profilePath: finalPath,
        confidence: Math.max(0, Math.min(1, typeof item.confidence === "number" ? item.confidence : 0)),
        reasoning: item.reasoning || "Classified via batch AI routing",
      };

      results.set(item.fieldId, bounded);

      // Cache result by normalized label
      const matchedField = unhandledFields.find((f) => f.id === item.fieldId);
      if (matchedField) {
        const cacheKey = normalizeLabelKey(matchedField.normalizedLabel || matchedField.rawLabel);
        normalizedLabelCache.set(cacheKey, bounded);
      }
    }

    // Fill in defaults for any fields the model missed
    for (const field of unhandledFields) {
      if (!results.has(field.id)) {
        results.set(field.id, {
          profilePath: null,
          confidence: 0.0,
          reasoning: "Field omitted from batch response",
        });
      }
    }

    return { results, tokens: response.tokens };
  } catch (err) {
    // If batch call fails, fallback to unsupported state
    for (const field of unhandledFields) {
      results.set(field.id, {
        profilePath: null,
        confidence: 0.0,
        reasoning: "AI batch call failed; fallback to manual entry",
      });
    }
    return { results, tokens: { input: 0, output: 0 } };
  }
}
