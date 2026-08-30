import { NextRequest, NextResponse } from "next/server";
import { resolveAnswerRequestSchema } from "@internship-copilot/validation";
import { resolveAnswer } from "@internship-copilot/ai";
import { logAIInteraction } from "@internship-copilot/database";
import { getStoredProfileData } from "@/lib/profile-helper";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const mockUserId = "user_default";

  try {
    const body = await req.json();
    const parsed = resolveAnswerRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid resolve answer payload", details: parsed.error.format() }, { status: 400 });
    }

    const storedProfile = await getStoredProfileData();
    const effectiveProfile = Object.keys(parsed.data.userProfile || {}).length > 0 ? parsed.data.userProfile : storedProfile;

    const result = await resolveAnswer({
      plan: parsed.data.answerPlan,
      profile: effectiveProfile as any,
      jobDescription: parsed.data.jobDescription,
      resumeText: parsed.data.resumeText,
    });

    const latencyMs = Date.now() - startTime;

    await logAIInteraction({
      userId: mockUserId,
      operation: "ANSWER_GEN",
      inputTokens: Math.ceil(JSON.stringify(parsed.data.answerPlan).length / 4) + 120,
      outputTokens: Math.ceil(JSON.stringify(result).length / 4),
      model: result.source === "nim" ? "nv-llama-3-70b-instruct" : "deterministic-code",
      latencyMs,
      success: true,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    await logAIInteraction({
      userId: mockUserId,
      operation: "ANSWER_GEN",
      inputTokens: 0,
      outputTokens: 0,
      model: "deterministic-code",
      latencyMs,
      success: false,
      errorCode: "RESOLVE_CALL_FAILED",
    });

    return NextResponse.json({ error: "Failed to resolve answer" }, { status: 500 });
  }
}
