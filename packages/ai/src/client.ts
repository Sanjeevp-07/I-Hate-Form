import OpenAI from "openai";
import { AI_CONFIG } from "@internship-copilot/config";
import { ModelTier } from "@internship-copilot/types";

let aiClientInstance: OpenAI | null = null;

export function getAIClient(): OpenAI {
  if (!aiClientInstance) {
    const apiKey =
      process.env.NVIDIA_API_KEY ||
      process.env.OPENAI_API_KEY ||
      "nvapi-dummy-key-for-dev";

    const baseURL =
      process.env.AI_BASE_URL ||
      AI_CONFIG.DEFAULT_BASE_URL;

    aiClientInstance = new OpenAI({
      apiKey,
      baseURL,
    });
  }
  return aiClientInstance;
}

export function getModelForTier(tier: ModelTier): string {
  switch (tier) {
    case "fast":
      return process.env.AI_FAST_MODEL || AI_CONFIG.DEFAULT_FAST_MODEL;
    case "workhorse":
      return process.env.AI_WORKHORSE_MODEL || AI_CONFIG.DEFAULT_WORKHORSE_MODEL;
    case "reasoning":
      return process.env.AI_REASONING_MODEL || AI_CONFIG.DEFAULT_REASONING_MODEL;
    default:
      return AI_CONFIG.DEFAULT_FAST_MODEL;
  }
}

/**
 * Extracts and parses JSON from raw LLM output, handling markdown fences and trailing text.
 */
function extractJSONFromText<T>(text: string): T {
  const trimmed = text.trim();

  // 1. Direct JSON parse
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Continue to pattern extraction
  }

  // 2. Extract from ```json ... ``` markdown block
  const markdownMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    try {
      return JSON.parse(markdownMatch[1]) as T;
    } catch {
      // Continue to bracket search
    }
  }

  // 3. Find first { or [ and matching last } or ]
  const firstBrace = trimmed.indexOf("{");
  const firstBracket = trimmed.indexOf("[");
  let startIdx = -1;
  let endIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = trimmed.lastIndexOf("}");
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = trimmed.lastIndexOf("]");
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const candidate = trimmed.substring(startIdx, endIdx + 1);
    return JSON.parse(candidate) as T;
  }

  throw new Error(`Failed to parse structured JSON from model output: ${trimmed.slice(0, 100)}...`);
}

export async function callStructuredModel<T>(params: {
  tier: ModelTier;
  systemPrompt: string;
  userPrompt: string;
  schema?: Record<string, unknown>;
  schemaName?: string;
  maxRetries?: number;
}): Promise<{ data: T; tokens: { input: number; output: number }; model: string }> {
  const client = getAIClient();
  const model = getModelForTier(params.tier);
  const maxRetries = params.maxRetries ?? 1;

  // Instruct model explicitly to output valid JSON matching schema
  const systemWithJsonInstruction = `${params.systemPrompt}\n\nIMPORTANT: You must return ONLY raw valid JSON adhering to the specified schema, without preamble or explanations.`;

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemWithJsonInstruction },
          { role: "user", content: params.userPrompt },
        ],
        temperature: 0.1, // Low temperature for deterministic classification
        max_tokens: 1024,
      });

      const messageContent = response.choices[0]?.message?.content;
      if (!messageContent) {
        throw new Error("Empty response from AI provider");
      }

      const parsed = extractJSONFromText<T>(messageContent);
      return {
        data: parsed,
        tokens: {
          input: response.usage?.prompt_tokens ?? 0,
          output: response.usage?.completion_tokens ?? 0,
        },
        model: response.model || model,
      };
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const backoffMs = (attempt + 1) * 1000;
        await new Promise((res) => setTimeout(res, backoffMs));
      }
    }
  }

  throw lastError;
}
