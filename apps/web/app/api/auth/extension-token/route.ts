import { NextRequest, NextResponse } from "next/server";
import { extensionTokenRequestSchema } from "@internship-copilot/validation";
import { createExtensionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = extensionTokenRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid token exchange payload", details: parsed.error.format() }, { status: 400 });
    }

    // In production, verify parsed.data.chromeIdentityToken with Google/OAuth provider
    const userId = "user_default";
    const tokens = createExtensionToken(userId);

    return NextResponse.json(tokens, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
