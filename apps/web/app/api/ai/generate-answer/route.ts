import { NextRequest, NextResponse } from "next/server";
import { understandQuestion, resolveAnswer } from "@internship-copilot/ai";
import { logAIInteraction } from "@internship-copilot/database";
import { getStoredProfileData } from "@/lib/profile-helper";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const mockUserId = "user_default";

  try {
    const body = await req.json();
    const storedProfile = await getStoredProfileData();

    // Check if new FieldContext is provided
    if (body.fieldContext || body.label || body.questionText) {
      const fieldContext = body.fieldContext || {
        label: body.label || body.questionText || "Form Field",
        type: body.type || "text",
        name: body.name,
        placeholder: body.placeholder,
        options: body.options,
        nearbyText: body.nearbyText,
        required: body.required,
      };

      // Step 1: Understand Question -> AnswerPlan
      const plan = await understandQuestion(fieldContext);

      // Step 2: Resolve Answer -> AnswerResult (3-Level Pipeline)
      const result = await resolveAnswer({
        plan,
        profile: storedProfile as any,
        jobDescription: body.jobDescription || body.jobDescriptionText,
        resumeText: body.resumeText,
      });

      const latencyMs = Date.now() - startTime;

      await logAIInteraction({
        userId: mockUserId,
        operation: "ANSWER_GEN",
        inputTokens: Math.ceil(fieldContext.label.length / 4) + 150,
        outputTokens: Math.ceil(String(result.answer || "").length / 4),
        model: result.source === "nim" ? "nv-llama-3-70b-instruct" : "deterministic-code",
        latencyMs,
        success: true,
      });

      return NextResponse.json({
        draftAnswer: String(result.answer || ""),
        confidence: result.confidence,
        reasoning: result.reasoning || "Resolved via 3-tier semantic pipeline",
        source: result.source,
        sourcePaths: result.sourcePaths,
        status: result.status,
      }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid answer generation payload. FieldContext required." }, { status: 400 });
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
      errorCode: "AI_CALL_FAILED",
    });

    return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });
  }
}

