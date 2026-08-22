import { NextRequest, NextResponse } from "next/server";
import { generateAnswerRequestSchema } from "@internship-copilot/validation";
import { generateAnswer } from "@internship-copilot/ai";
import { logAIInteraction } from "@internship-copilot/database";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const mockUserId = "user_default";

  try {
    const body = await req.json();
    const parsed = generateAnswerRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid answer generation payload", details: parsed.error.format() }, { status: 400 });
    }

    const result = await generateAnswer(parsed.data);
    const latencyMs = Date.now() - startTime;

    // Log AI interaction (NEVER store raw text/PII in log, only token metrics)
    await logAIInteraction({
      userId: mockUserId,
      operation: "ANSWER_GEN",
      inputTokens: Math.ceil(parsed.data.questionText.length / 4) + 150,
      outputTokens: Math.ceil(result.draftAnswer.length / 4),
      model: "gpt-4o",
      latencyMs,
      success: true,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    await logAIInteraction({
      userId: mockUserId,
      operation: "ANSWER_GEN",
      inputTokens: 0,
      outputTokens: 0,
      model: "gpt-4o",
      latencyMs,
      success: false,
      errorCode: "AI_CALL_FAILED",
    });

    return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });
  }
}
