import { NextRequest, NextResponse } from "next/server";
import { generateDynamicFieldAnswers } from "@internship-copilot/ai";
import { getOrCreateUser } from "@internship-copilot/database";
import { logAIInteraction } from "@internship-copilot/database";
import { getAuthenticatedUser } from "@/lib/auth";
import { FieldDescriptor, UserProfile } from "@internship-copilot/types";

const DEFAULT_CANDIDATE_PROFILE: UserProfile = {
  id: "user_default",
  userId: "user_default",
  personal: {
    firstName: "Sanjeev",
    lastName: "Kumar",
    email: "sanjeev1803t@gmail.com",
    phone: "8825171882",
    countryCode: "+91",
    country: "India",
    state: "Uttar Pradesh",
    city: "Greater Noida",
    postalCode: "201306",
    address: "Knowledge Park III",
    gender: "Male",
  },
  links: {
    linkedin: "https://linkedin.com/in/sanjeev-kumar",
    github: "https://github.com/sanjeevp-07",
  },
  education: [
    {
      id: "edu_1",
      institution: "Bennett University",
      degree: "B.Tech",
      fieldOfStudy: "Computer Science",
      startDate: "2022-08-01",
      endDate: "2026-06-01",
      isCurrent: true,
    },
  ],
  experience: [],
  projects: [
    {
      id: "proj_1",
      name: "I Hate Form",
      description: "AI job application autofill platform with NVIDIA NIM",
      technologies: ["React", "TypeScript", "Next.js", "NVIDIA NIM"],
    },
  ],
  skills: [
    { id: "sk_1", category: "Languages", name: "TypeScript" },
    { id: "sk_2", category: "Frameworks", name: "React" },
    { id: "sk_3", category: "AI", name: "NVIDIA NIM" },
  ],
};

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { fields, profile: payloadProfile, fieldWarnings } = body as {
      fields: FieldDescriptor[];
      profile?: UserProfile;
      fieldWarnings?: Array<{ fieldId: string; attemptedValue: string | boolean; warningMessage: string }>;
    };

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: "Missing or invalid fields array" }, { status: 400 });
    }

    // Retrieve active profile
    let activeProfile: UserProfile = payloadProfile || DEFAULT_CANDIDATE_PROFILE;
    let userId = "user_default";

    try {
      const sessionUser = await getAuthenticatedUser(req);
      if (sessionUser) {
        userId = sessionUser.id;
        const stored = getOrCreateUser(sessionUser.email);
        if (stored?.profile) {
          activeProfile = {
            ...DEFAULT_CANDIDATE_PROFILE,
            personal: { ...DEFAULT_CANDIDATE_PROFILE.personal, ...stored.profile.personal },
            links: { ...DEFAULT_CANDIDATE_PROFILE.links, ...stored.profile.links },
          };
        }
      }
    } catch {}

    // Generate dynamic answers using NVIDIA NIM (with optional validation error self-correction)
    const result = await generateDynamicFieldAnswers(fields, activeProfile, fieldWarnings);
    const latencyMs = Date.now() - startTime;

    // Log telemetry
    if (result.tokens.input > 0 || result.tokens.output > 0) {
      await logAIInteraction({
        userId,
        operation: "ANSWER_GEN",
        inputTokens: result.tokens.input,
        outputTokens: result.tokens.output,
        model: result.model || "meta/llama-3.1-70b-instruct",
        latencyMs,
        success: true,
      });
    }

    return NextResponse.json({ mappings: result.mappings, model: result.model }, { status: 200 });
  } catch (err) {
    console.error("Error generating dynamic answers:", err);
    return NextResponse.json({ error: "Failed to generate dynamic answers" }, { status: 500 });
  }
}
