import { NextRequest, NextResponse } from "next/server";
import { createAutofillSessionRequestSchema } from "@internship-copilot/validation";
import { ApplicationRepository } from "@internship-copilot/database";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createAutofillSessionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid session request", details: parsed.error.format() }, { status: 400 });
    }

    const sessionId = randomUUID();
    const mockUserId = "user_default"; // In production, extracted from verified JWT

    await ApplicationRepository.createSession(mockUserId, {
      sessionId,
      url: parsed.data.url,
      domain: parsed.data.domain,
      title: parsed.data.title,
    });

    return NextResponse.json({ sessionId }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to initialize session" }, { status: 500 });
  }
}
