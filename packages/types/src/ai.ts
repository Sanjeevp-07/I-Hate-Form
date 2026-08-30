export interface FieldContext {
  label: string;
  type: string;
  name?: string;
  placeholder?: string;
  options?: Array<{ label: string; value: string }> | string[];
  nearbyText?: string;
  required?: boolean;
  pageStep?: number;
  sectionTitle?: string;
}

export type AnswerOperation =
  | "direct_fact"
  | "extract_component"
  | "transform_format"
  | "generative_evidence";

export interface AnswerPlan {
  intent: string;
  sourcePaths: string[];
  operation: AnswerOperation;
  component?: "year" | "month" | "day" | "age" | "duration" | "domain" | "format" | "full";
  outputType: "string" | "integer" | "boolean" | "date" | "enum";
  format?: string;
  confidence: number;
  reasoning?: string;
}

export type AnswerResultStatus = "resolved" | "review" | "needs_user_input";

export interface AnswerResult {
  status: AnswerResultStatus;
  answer: string | boolean | number | string[] | null;
  source: "database" | "derived" | "nim";
  sourcePaths: string[];
  operation?: string;
  confidence: number;
  formatValid: boolean;
  evidence?: string[];
  reasoning?: string;
}

export interface FieldClassificationInput {
  label: string;
  type: string;
  name?: string;
  nearbyText?: string;
  options?: string[];
}

export interface FieldClassificationResult {
  profilePath: string | null;
  confidence: number;
  reasoning: string;
}

export type ModelTier = "fast" | "workhorse" | "reasoning";

export interface AIModelConfig {
  fastModel: string;
  workhorseModel: string;
  reasoningModel: string;
}

