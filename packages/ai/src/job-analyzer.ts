import { AnalyzeJobRequest, AnalyzeJobResponse } from "@internship-copilot/types";
import { callStructuredModel } from "./client";
import { buildAnalyzeJobPrompt } from "./prompts/analyze-job";

const analyzeJobJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    company: { type: "string" },
    requiredSkills: {
      type: "array",
      items: { type: "string" },
    },
    preferredSkills: {
      type: "array",
      items: { type: "string" },
    },
    experienceLevel: { type: "string" },
    summary: { type: "string" },
  },
  required: ["title", "company", "requiredSkills", "preferredSkills", "experienceLevel", "summary"],
  additionalProperties: false,
};

export async function analyzeJob(request: AnalyzeJobRequest): Promise<AnalyzeJobResponse> {
  const { system, user } = buildAnalyzeJobPrompt({
    jobTitle: request.jobTitle,
    companyName: request.companyName,
    jobDescriptionText: request.jobDescriptionText,
  });

  const result = await callStructuredModel<AnalyzeJobResponse>({
    tier: "workhorse",
    systemPrompt: system,
    userPrompt: user,
    schema: analyzeJobJsonSchema,
    schemaName: "job_analysis",
  });

  return result.data;
}
