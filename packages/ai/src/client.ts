import OpenAI from "openai";
import { AI_CONFIG } from "@internship-copilot/config";
import { ModelTier } from "@internship-copilot/types";

let openaiClientInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClientInstance) {
    openaiClientInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-dev",
    });
  }
  return openaiClientInstance;
}

export function getModelForTier(tier: ModelTier): string {
  switch (tier) {
    case "fast":
      return process.env.OPENAI_FAST_MODEL || AI_CONFIG.DEFAULT_FAST_MODEL;
    case "workhorse":
      return process.env.OPENAI_WORKHORSE_MODEL || AI_CONFIG.DEFAULT_WORKHORSE_MODEL;
    case "reasoning":
      return process.env.OPENAI_REASONING_MODEL || AI_CONFIG.DEFAULT_REASONING_MODEL;
    default:
      return AI_CONFIG.DEFAULT_FAST_MODEL;
  }
}

export async function callStructuredModel<T>(params: {
  tier: ModelTier;
  systemPrompt: string;
  userPrompt: string;
  schema: Record<string, unknown>;
  schemaName: string;
  maxRetries?: number;
}): Promise<{ data: T; tokens: { input: number; output: number }; model: string }> {
  const client = getOpenAIClient();
  const model = getModelForTier(params.tier);
  const maxRetries = params.maxRetries ?? 1;

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: params.schemaName,
            strict: true,
            schema: params.schema,
          },
        },
      });

      const messageContent = response.choices[0]?.message?.content;
      if (!messageContent) {
        throw new Error("Empty response from AI provider");
      }

      const parsed = JSON.parse(messageContent) as T;
      return {
        data: parsed,
        tokens: {
          input: response.usage?.prompt_tokens ?? 0,
          output: response.usage?.completion_tokens ?? 0,
        },
        model: response.model,
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
