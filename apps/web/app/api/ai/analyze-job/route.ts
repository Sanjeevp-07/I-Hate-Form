import { NextRequest, NextResponse } from "next/server";
import { analyzeJobRequestSchema } from "@internship-copilot/validation";
import { analyzeJob } from "@internship-copilot/ai";
import { logAIInteraction } from "@internship-copilot/database";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const mockUserId = "user_default";

  try {
    const body = await req.json();
    const parsed = analyzeJobRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid job analysis payload", details: parsed.error.format() }, { status: 400 });
    }

    const result = await analyzeJob(parsed.data);
    const latencyMs = Date.now() - startTime;

    await logAIInteraction({
      userId: mockUserId,
      operation: "JOB_ANALYSIS",
      inputTokens: Math.ceil(parsed.data.jobDescriptionText.length / 4) + 100,
      outputTokens: 250,
      model: "gpt-4o",
      latencyMs,
      success: true,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    await logAIInteraction({
      userId: mockUserId,
      operation: "JOB_ANALYSIS",
      inputTokens: 0,
      outputTokens: 0,
      model: "gpt-4o",
      latencyMs,
      success: false,
      errorCode: "JOB_ANALYSIS_FAILED",
    });

    return NextResponse.json({ error: "Failed to analyze job description" }, { status: 500 });
  }
}
