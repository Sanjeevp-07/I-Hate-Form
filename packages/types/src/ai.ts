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
