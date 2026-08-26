export type FormElementType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "url"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "file"
  | "hidden"
  | "unknown";

export interface FormSelectOption {
  value: string;
  label: string;
}

export interface FieldDescriptor {
  id: string;
  frameId: number; // 0 for top frame, >0 for child/same-origin iframes
  tag: string;
  type: FormElementType;
  name?: string;
  rawLabel: string;
  normalizedLabel: string;
  placeholder?: string;
  ariaLabel?: string;
  autocomplete?: string;
  nearbyText?: string;
  options?: FormSelectOption[];
  required?: boolean;
  disabled?: boolean;
  domSelector: string;
  domSelectorHash: string;
}

export type MappingAction = "fill" | "review" | "skip" | "unsupported";

export type MappingSource =
  | "rule"
  | "ai_fast"
  | "ai_strong"
  | "ai_reasoning"
  | "rule_fallback"
  | "user_override"
  | "adapter";

export interface FieldMapping {
  fieldId: string;
  rawLabel: string;
  normalizedLabel: string;
  profilePath: string | null; // e.g. "personal.firstName", "education.0.institution"
  valueToFill: string | boolean | string[] | null;
  confidence: number; // 0.0 to 1.0
  action: MappingAction;
  source: MappingSource;
  reason?: string;
}

export interface FieldError {
  fieldId: string;
  errorCode: "FRAMEWORK_BLOCKED" | "CSP_BLOCKED" | "ELEMENT_NOT_FOUND" | "TYPE_MISMATCH" | "VALIDATION_FAILED";
  message: string;
}
