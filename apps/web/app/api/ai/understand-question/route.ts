import { NextRequest, NextResponse } from "next/server";
import { understandQuestionRequestSchema } from "@internship-copilot/validation";
import { understandQuestion } from "@internship-copilot/ai";
import { logAIInteraction } from "@internship-copilot/database";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const mockUserId = "user_default";

  try {
    const body = await req.json();
    const parsed = understandQuestionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid field context payload", details: parsed.error.format() }, { status: 400 });
    }

    const answerPlan = await understandQuestion(parsed.data.fieldContext);
    const latencyMs = Date.now() - startTime;

    await logAIInteraction({
      userId: mockUserId,
      operation: "CLASSIFY",
      inputTokens: Math.ceil(parsed.data.fieldContext.label.length / 4) + 80,
      outputTokens: Math.ceil(JSON.stringify(answerPlan).length / 4),
      model: "nv-llama-3-70b-instruct",
      latencyMs,
      success: true,
    });

    return NextResponse.json(answerPlan, { status: 200 });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    await logAIInteraction({
      userId: mockUserId,
      operation: "CLASSIFY",
      inputTokens: 0,
      outputTokens: 0,
      model: "nv-llama-3-70b-instruct",
      latencyMs,
      success: false,
      errorCode: "AI_CALL_FAILED",
    });

    return NextResponse.json({ error: "Failed to understand question context" }, { status: 500 });
  }
}
