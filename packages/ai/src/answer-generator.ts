import { GenerateAnswerRequest, GenerateAnswerResponse } from "@internship-copilot/types";
import { callStructuredModel } from "./client";
import { buildGenerateAnswerPrompt } from "./prompts/generate-answer";

const generateAnswerJsonSchema = {
  type: "object",
  properties: {
    draftAnswer: {
      type: "string",
      description: "Concise, professionally written response to the question",
    },
    confidence: {
      type: "number",
      description: "Confidence score between 0.0 and 1.0 based on evidence in highlights",
    },
  },
  required: ["draftAnswer", "confidence"],
  additionalProperties: false,
};

export async function generateAnswer(request: GenerateAnswerRequest): Promise<GenerateAnswerResponse> {
  const { system, user } = buildGenerateAnswerPrompt({
    questionText: request.questionText,
    questionCategory: request.questionCategory,
    relevantProfileSnippets: request.relevantProfileFields,
  });

  const result = await callStructuredModel<GenerateAnswerResponse>({
    tier: "workhorse",
    systemPrompt: system,
    userPrompt: user,
    schema: generateAnswerJsonSchema,
    schemaName: "answer_generation",
  });

  return {
    draftAnswer: result.data.draftAnswer,
    confidence: Math.max(0, Math.min(1, result.data.confidence)),
  };
}
