import { NextRequest, NextResponse } from "next/server";
import { ApplicationRepository } from "@internship-copilot/database";
import { z } from "zod";

const createManualApplicationSchema = z.object({
  jobTitle: z.string().min(1),
  domain: z.string().min(1),
  url: z.string().url(),
});

export async function GET(_req: NextRequest) {
  try {
    const mockUserId = "user_default";
    const applications = await ApplicationRepository.listByUser(mockUserId);
    return NextResponse.json({ applications }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createManualApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid application data", details: parsed.error.format() }, { status: 400 });
    }

    const mockUserId = "user_default";
    const sessionId = `manual_${Date.now()}`;

    const app = await ApplicationRepository.createSession(mockUserId, {
      sessionId,
      url: parsed.data.url,
      domain: parsed.data.domain,
      title: parsed.data.jobTitle,
    });

    return NextResponse.json({ application: app }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }
}
