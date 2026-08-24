import { FieldDescriptor, UserProfile } from "@internship-copilot/types";

export function buildDynamicFieldAnswerPrompt(params: {
  fields: FieldDescriptor[];
  profile: UserProfile;
}): { system: string; user: string } {
  const system = `You are an intelligent job application autofill assistant powered by NVIDIA NIM.
Your task is to analyze unscored / custom form fields on job application forms and generate the best, most accurate, and professional values based on the candidate's genuine background.

CRITICAL GUIDELINES:
1. Candidate Experience & Freshness:
   - Check the applicant's education (current graduation year) and work experience.
   - If the applicant is a student or fresher (or has 0 full-time corporate experience), and the field asks for "Total Years of Work Experience", "Experience in Years", or "Months" with notes like "Freshers enter 0": return "0".
   - If asking for "Current CTC" or "Cost to Company" for freshers/students: return "0" or "0.0".
   - If asking for "Expected CTC" for freshers/interns: return a reasonable entry like "3" or "3.5" (or "0" if internship stipend is unspecified) unless the profile indicates otherwise.
   - If asking for "Notice Period": For students/freshers, choose "Immediate", "0 days", or "15 days" matching the available select options.
2. Select / Dropdown Fields:
   - When the field has options provided in <options>, you MUST select the exact option value or label that best matches the candidate's profile.
3. Open-Ended Questions:
   - For essay, behavioral, or technical questions (e.g. "Why join us?", "Describe your experience with Python"): write a concise, compelling, professional response (1-3 sentences or 50-100 words) strictly based on the applicant's projects and skills.
4. Output Format:
   - Return ONLY raw valid JSON adhering to the specified schema:
   {
     "answers": [
       {
         "fieldId": "string",
         "valueToFill": "string | number | boolean",
         "confidence": number (between 0.0 and 1.0),
         "reasoning": "brief explanation"
       }
     ]
   }`;

  const profileSummary = {
    name: `${params.profile.personal?.firstName || ""} ${params.profile.personal?.lastName || ""}`.trim(),
    email: params.profile.personal?.email,
    phone: params.profile.personal?.phone,
    country: params.profile.personal?.country,
    state: params.profile.personal?.state,
    city: params.profile.personal?.city,
    education: params.profile.education || [],
    experience: params.profile.experience || [],
    projects: params.profile.projects || [],
    skills: params.profile.skills || [],
    achievements: params.profile.achievements || [],
    certifications: params.profile.certifications || [],
  };

  const fieldsForPrompt = params.fields.map((f) => ({
    id: f.id,
    label: f.rawLabel,
    normalizedLabel: f.normalizedLabel,
    type: f.type,
    name: f.name,
    placeholder: f.placeholder,
    nearbyText: f.nearbyText,
    options: f.options ? f.options.map((o) => ({ value: o.value, label: o.label })) : undefined,
    required: f.required,
  }));

  const user = `<applicant_profile>
${JSON.stringify(profileSummary, null, 2)}
</applicant_profile>

<fields_to_fill>
${JSON.stringify(fieldsForPrompt, null, 2)}
</fields_to_fill>

Generate intelligent, tailored answers for each field based on the applicant's profile and form context. Return JSON.`;

  return { system, user };
}
