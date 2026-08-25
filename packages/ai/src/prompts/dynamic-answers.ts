import { FieldDescriptor, UserProfile } from "@internship-copilot/types";

export interface DynamicFieldWarningParam {
  fieldId: string;
  attemptedValue: string | boolean;
  warningMessage: string;
}

export function buildDynamicFieldAnswerPrompt(params: {
  fields: FieldDescriptor[];
  profile: UserProfile;
  fieldWarnings?: DynamicFieldWarningParam[];
}): { system: string; user: string } {
  const system = `You are an intelligent job application autofill assistant powered by NVIDIA NIM.
Your task is to analyze unscored / custom form fields on job application forms and generate the accurate, relevant, and concise values based on the candidate's genuine background.

CRITICAL DATABASE ISOLATION & ACCURACY RULES:
1. STRICT DATABASE ISOLATION: DO NOT generate or suggest values for static candidate database fields (such as Title/Salutation, First Name, Last Name, Gender, Country Code, Email, Phone Number, Country, State, City, Address, Postal Code). Static identity and contact details are strictly retrieved from the database records.
2. SCOPE & ANTI-HALLUCINATION:
   - If the field is asking for Location, City, State, or Country (e.g. "Current Location (City, State, Country)", "Location", "Where are you located?"):
     OUTPUT ONLY the candidate's location formatted cleanly as "City, State, Country" (e.g. "Greater Noida, Uttar Pradesh, India"). NEVER write a cover letter, paragraph, or essay!
   - If the field is asking for Skills or Technologies (e.g. "Skills You Currently Have", "Technical Skills", "Key Skills", "What skills do you have?"):
     OUTPUT ONLY a clean, comma-separated list of the candidate's technical skills (e.g. "React, TypeScript, Next.js, Python, Node.js, Tailwind CSS, Docker, PostgreSQL"). NEVER write an essay or narrative paragraph!
   - If the field is asking for College / Degree / Major / Branch / Specialization:
     OUTPUT ONLY the exact degree or institution (e.g. "Bennett University", "B.Tech", "Computer Science and Engineering").
   - If the field is asking for 10th or 12th Marks / Year / School:
     OUTPUT ONLY the factual percentage or year.
3. FRESHER & STUDENT DEFAULTS:
   - If asking for "Total Years of Work Experience", "Experience in Years", or "Months" (Freshers enter 0): return "0" or "0 months".
   - If asking for "Current CTC" or "Salary": return "0".
   - If asking for "Expected CTC": return "3" or "3.5".
   - If asking for "Notice Period": return "Immediate".
4. ESSAY & BEHAVIORAL QUESTIONS ONLY:
   - ONLY for explicitly open-ended essay questions (e.g. "Why do you want to join this company?", "Tell us about a technical challenge you solved"):
     Write a focused, professional 1-2 sentence response grounded in the candidate's software development projects and enthusiasm to contribute. DO NOT invent ungrounded claims.
5. VALIDATION ERROR SELF-CORRECTION:
   - If validation warnings are provided, output corrected values that strictly obey the field constraints (e.g., if a number field with float "3.5" shows "Please enter in numbers", output integer "3").
6. OUTPUT FORMAT:
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

  const personal = params.profile.personal || {};
  const education: any = params.profile.education?.[0] || (params.profile as any).currentEducation || {};
  const rawSkills = (params.profile as any).skills || params.profile.skillsList || [];
  const skillsString = Array.isArray(rawSkills)
    ? rawSkills.map((s: any) => (typeof s === "string" ? s : s?.name || "")).filter(Boolean).join(", ")
    : "React, TypeScript, Next.js, Python, Node.js, Tailwind CSS, Docker, PostgreSQL";

  const profileSummary = {
    name: personal.fullName || `${personal.firstName || ""} ${personal.lastName || ""}`.trim() || "Sanjeev Kumar",
    email: personal.email || "sanjeev1803t@gmail.com",
    phone: personal.phone ? `${personal.countryCode || "+91"} ${personal.phone}` : "+91 8825171882",
    location: [personal.city || "Greater Noida", (personal as any).state || "Uttar Pradesh", personal.country || "India"].filter(Boolean).join(", "),
    city: personal.city || "Greater Noida",
    state: (personal as any).state || "Uttar Pradesh",
    country: personal.country || "India",
    college: education.institution || "Bennett University",
    degree: education.degree || "B.Tech",
    branch: education.major || education.fieldOfStudy || "Computer Science and Engineering",
    graduationYear: education.graduationYear || "2026",
    cgpa: education.cgpa || "8.9",
    skills: skillsString,
    projects: [
      {
        name: "Full-Stack Web & Cloud Applications",
        technologies: "React, TypeScript, Next.js, Node.js, Python, PostgreSQL",
      },
    ],
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

  const warningsBlock = params.fieldWarnings && params.fieldWarnings.length > 0
    ? `\n<validation_warnings>\n${JSON.stringify(params.fieldWarnings, null, 2)}\n</validation_warnings>\n`
    : "";

  const user = `<applicant_profile>
${JSON.stringify(profileSummary, null, 2)}
</applicant_profile>

<fields_to_fill>
${JSON.stringify(fieldsForPrompt, null, 2)}
</fields_to_fill>
${warningsBlock}
Generate intelligent, tailored, factual answers for each field. Remember: For location questions, output City, State, Country. For skill questions, output comma-separated skills list. Do NOT write cover letters for structured fields. Return JSON.`;

  return { system, user };
}
