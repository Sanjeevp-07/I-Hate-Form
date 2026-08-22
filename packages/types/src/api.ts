import { FieldDescriptor, FieldError, FieldMapping } from "./form";

export interface ExtensionTokenRequest {
  chromeIdentityToken: string;
}

export interface ExtensionTokenResponse {
  accessToken: string;
  expiresIn: number; // 900 seconds (15 min)
  refreshToken: string;
}

export interface CreateAutofillSessionRequest {
  url: string;
  domain: string;
  title: string;
}

export interface CreateAutofillSessionResponse {
  sessionId: string;
}

export interface AnalyzeFieldsRequest {
  sessionId: string;
  fields: FieldDescriptor[];
}

export interface AnalyzeFieldsResponse {
  mappings: FieldMapping[];
}

export interface CompleteAutofillRequest {
  sessionId: string;
  filledFieldIds: string[];
  skippedFieldIds: string[];
  errors: FieldError[];
}

export interface CompleteAutofillResponse {
  applicationId: string;
  status: "completed" | "partial" | "failed";
}

export interface AnalyzeJobRequest {
  jobUrl?: string;
  jobTitle?: string;
  companyName?: string;
  jobDescriptionText: string;
}

export interface AnalyzeJobResponse {
  title: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel?: string;
  summary: string;
}

export interface GenerateAnswerRequest {
  questionText: string;
  questionCategory: "behavioral" | "technical" | "motivation" | "background" | "custom";
  relevantProfileFields: string[]; // only relevant fields passed, data minimization
}

export interface GenerateAnswerResponse {
  draftAnswer: string;
  confidence: number;
}

export interface MatchResumeRequest {
  jobDescription: string;
  resumeDocumentIds: string[];
}

export interface MatchResumeResponse {
  recommendedDocumentId: string;
  matchScore: number;
  reasoning: string;
}
