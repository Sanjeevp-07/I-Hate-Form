import { MatchResumeRequest, MatchResumeResponse } from "@internship-copilot/types";
import { callStructuredModel } from "./client";
import { buildResumeMatcherPrompt } from "./prompts/resume-matcher";

const resumeMatcherJsonSchema = {
  type: "object",
  properties: {
    recommendedDocumentId: { type: "string" },
    matchScore: { type: "number" },
    reasoning: { type: "string" },
  },
  required: ["recommendedDocumentId", "matchScore", "reasoning"],
  additionalProperties: false,
};

export async function matchResume(
  request: MatchResumeRequest,
  resumes: Array<{ id: string; filename: string; tags: string[]; summarySnippet?: string }>
): Promise<MatchResumeResponse> {
  const { system, user } = buildResumeMatcherPrompt({
    jobDescriptionSummary: request.jobDescription,
    resumes,
  });

  const result = await callStructuredModel<MatchResumeResponse>({
    tier: "workhorse",
    systemPrompt: system,
    userPrompt: user,
    schema: resumeMatcherJsonSchema,
    schemaName: "resume_matching",
  });

  return {
    recommendedDocumentId: result.data.recommendedDocumentId,
    matchScore: Math.max(0, Math.min(1, result.data.matchScore)),
    reasoning: result.data.reasoning,
  };
}
