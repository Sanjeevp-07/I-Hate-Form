import { z } from "zod";

export const formElementTypeSchema = z.enum([
  "text",
  "email",
  "tel",
  "number",
  "textarea",
  "select",
  "radio",
  "checkbox",
  "file",
  "hidden",
  "unknown",
]);

export const formSelectOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const fieldDescriptorSchema = z.object({
  id: z.string(),
  frameId: z.number().int().nonnegative(),
  tag: z.string(),
  type: formElementTypeSchema,
  name: z.string().optional(),
  rawLabel: z.string(),
  normalizedLabel: z.string(),
  placeholder: z.string().optional(),
  ariaLabel: z.string().optional(),
  autocomplete: z.string().optional(),
  nearbyText: z.string().optional(),
  options: z.array(formSelectOptionSchema).optional(),
  required: z.boolean().optional(),
  disabled: z.boolean().optional(),
  domSelector: z.string(),
  domSelectorHash: z.string(),
});

export const mappingActionSchema = z.enum(["fill", "review", "skip", "unsupported"]);

export const mappingSourceSchema = z.enum([
  "rule",
  "ai_fast",
  "ai_strong",
  "ai_reasoning",
  "rule_fallback",
  "user_override",
  "adapter",
]);

export const fieldMappingSchema = z.object({
  fieldId: z.string(),
  rawLabel: z.string(),
  normalizedLabel: z.string(),
  profilePath: z.string().nullable(),
  valueToFill: z.union([z.string(), z.boolean(), z.array(z.string()), z.null()]),
  confidence: z.number().min(0).max(1),
  action: mappingActionSchema,
  source: mappingSourceSchema,
  reason: z.string().optional(),
});

export const fieldErrorSchema = z.object({
  fieldId: z.string(),
  errorCode: z.enum([
    "FRAMEWORK_BLOCKED",
    "CSP_BLOCKED",
    "ELEMENT_NOT_FOUND",
    "TYPE_MISMATCH",
    "VALIDATION_FAILED",
  ]),
  message: z.string(),
});
