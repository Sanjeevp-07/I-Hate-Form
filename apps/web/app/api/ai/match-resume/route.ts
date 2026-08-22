import { NextRequest, NextResponse } from "next/server";
import { matchResumeRequestSchema } from "@internship-copilot/validation";
import { matchResume } from "@internship-copilot/ai";
import { logAIInteraction } from "@internship-copilot/database";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const mockUserId = "user_default";

  try {
    const body = await req.json();
    const parsed = matchResumeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid resume match payload", details: parsed.error.format() }, { status: 400 });
    }

    const mockResumes = parsed.data.resumeDocumentIds.map((id, index) => ({
      id,
      filename: `Resume_${index + 1}.pdf`,
      tags: index === 0 ? ["fullstack", "typescript", "react"] : ["ml", "python", "ai"],
    }));

    const result = await matchResume(parsed.data, mockResumes);
    const latencyMs = Date.now() - startTime;

    await logAIInteraction({
      userId: mockUserId,
      operation: "RESUME_MATCH",
      inputTokens: Math.ceil(parsed.data.jobDescription.length / 4) + 120,
      outputTokens: 150,
      model: "gpt-4o",
      latencyMs,
      success: true,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    await logAIInteraction({
      userId: mockUserId,
      operation: "RESUME_MATCH",
      inputTokens: 0,
      outputTokens: 0,
      model: "gpt-4o",
      latencyMs,
      success: false,
      errorCode: "RESUME_MATCH_FAILED",
    });

    return NextResponse.json({ error: "Failed to match resume" }, { status: 500 });
  }
}
