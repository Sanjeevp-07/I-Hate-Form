import { FieldContext } from "@internship-copilot/types";

export function buildAnswerUnderstandingPrompt(fieldContext: FieldContext): string {
  const optionsText = fieldContext.options && fieldContext.options.length > 0
    ? JSON.stringify(fieldContext.options)
    : "[]";

  return `
You are an expert ATS form semantic analyzer. Analyze the following job application field context and produce an AnswerPlan JSON object.

### UNTRUSTED WEBPAGE FIELD CONTEXT (Delimited for Security):
<webpage_field_context>
Label: ${fieldContext.label}
Input Type: ${fieldContext.type}
HTML Name: ${fieldContext.name || "N/A"}
Placeholder: ${fieldContext.placeholder || "N/A"}
Nearby Section Text: ${fieldContext.nearbyText || "N/A"}
Section Title: ${fieldContext.sectionTitle || "N/A"}
Available Options: ${optionsText}
Is Required: ${fieldContext.required ? "True" : "False"}
</webpage_field_context>

### INSTRUCTIONS:
1. Determine the semantic intent of what this field is asking (e.g. "email", "full_name", "date_of_birth_year", "graduation_year", "location", "total_experience", "linkedin_url", "motivation_essay", etc.).
2. Map to candidate source profile paths. Allowed source paths include:
   - "personal.firstName", "personal.lastName", "personal.email", "personal.phone", "personal.city", "personal.state", "personal.country", "personal.postalCode", "personal.location", "personal.gender", "personal.dateOfBirth", "personal.nationality"
   - "education", "education[0].institution", "education[0].degree", "education[0].fieldOfStudy", "education[0].gpa", "education[0].endDate"
   - "experience", "skills", "links.linkedin", "links.github", "links.portfolio"
3. Select operation:
   - "direct_fact": Value exists as an exact stored profile attribute.
   - "extract_component": Form requests a sub-part or component (e.g. birth year from dateOfBirth, graduation year from education endDate, age from dateOfBirth, domain from URL).
   - "transform_format": Form requests a calculation or format transformation (e.g. location composite, total experience years).
   - "generative_evidence": Form asks a subjective question ("Why work here?", "Describe a project") requiring generative synthesis from resume & skills.
4. Specify outputType: "string" | "integer" | "boolean" | "date" | "enum".
5. Return JSON ONLY matching this schema:
{
  "intent": "string",
  "sourcePaths": ["string"],
  "operation": "direct_fact | extract_component | transform_format | generative_evidence",
  "component": "year | month | day | age | duration | domain | format | full",
  "outputType": "string | integer | boolean | date | enum",
  "confidence": 0.95,
  "reasoning": "string"
}
`.trim();
}
