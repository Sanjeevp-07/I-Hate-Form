import { z } from "zod";
import { fieldDescriptorSchema, fieldErrorSchema, fieldMappingSchema } from "./form";

export const extensionTokenRequestSchema = z.object({
  chromeIdentityToken: z.string().min(1, "Chrome identity token required"),
});

export const createAutofillSessionRequestSchema = z.object({
  url: z.string().url(),
  domain: z.string().min(1),
  title: z.string(),
});

export const analyzeFieldsRequestSchema = z.object({
  sessionId: z.string().uuid(),
  fields: z.array(fieldDescriptorSchema),
});

export const completeAutofillRequestSchema = z.object({
  sessionId: z.string().uuid(),
  filledFieldIds: z.array(z.string()),
  skippedFieldIds: z.array(z.string()),
  errors: z.array(fieldErrorSchema),
});

export const analyzeJobRequestSchema = z.object({
  jobUrl: z.string().url().optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  jobDescriptionText: z.string().min(10, "Job description text too short"),
});

export const fieldContextSchema = z.object({
  label: z.string().min(1, "Field label required"),
  type: z.string().default("text"),
  name: z.string().optional(),
  placeholder: z.string().optional(),
  options: z.union([
    z.array(z.object({ label: z.string(), value: z.string() })),
    z.array(z.string()),
  ]).optional(),
  nearbyText: z.string().optional(),
  required: z.boolean().optional(),
  pageStep: z.number().optional(),
  sectionTitle: z.string().optional(),
});

export const answerPlanSchema = z.object({
  intent: z.string(),
  sourcePaths: z.array(z.string()),
  operation: z.enum(["direct_fact", "extract_component", "transform_format", "generative_evidence"]),
  component: z.enum(["year", "month", "day", "age", "duration", "domain", "format", "full"]).optional(),
  outputType: z.enum(["string", "integer", "boolean", "date", "enum"]),
  format: z.string().optional(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
});

export const answerResultSchema = z.object({
  status: z.enum(["resolved", "review", "needs_user_input"]),
  answer: z.union([z.string(), z.boolean(), z.number(), z.array(z.string()), z.null()]),
  source: z.enum(["database", "derived", "nim"]),
  sourcePaths: z.array(z.string()),
  operation: z.string().optional(),
  confidence: z.number().min(0).max(1),
  formatValid: z.boolean(),
  evidence: z.array(z.string()).optional(),
  reasoning: z.string().optional(),
});

export const generateAnswerRequestSchema = z.object({
  questionText: z.string().min(5, "Question text required"),
  questionCategory: z.enum(["behavioral", "technical", "motivation", "background", "custom"]),
  relevantProfileFields: z.array(z.string()),
});

export const matchResumeRequestSchema = z.object({
  jobDescription: z.string().min(10),
  resumeDocumentIds: z.array(z.string().uuid()).min(1, "At least one resume required"),
});

export const understandQuestionRequestSchema = z.object({
  fieldContext: fieldContextSchema,
});

export const resolveAnswerRequestSchema = z.object({
  answerPlan: answerPlanSchema,
  userProfile: z.record(z.any()),
  jobDescription: z.string().optional(),
  resumeText: z.string().optional(),
});


