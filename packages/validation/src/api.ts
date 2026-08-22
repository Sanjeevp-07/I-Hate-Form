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

export const generateAnswerRequestSchema = z.object({
  questionText: z.string().min(5, "Question text required"),
  questionCategory: z.enum(["behavioral", "technical", "motivation", "background", "custom"]),
  relevantProfileFields: z.array(z.string()), // Data minimization: only array of relevant profile field strings
});

export const matchResumeRequestSchema = z.object({
  jobDescription: z.string().min(10),
  resumeDocumentIds: z.array(z.string().uuid()).min(1, "At least one resume required"),
});
