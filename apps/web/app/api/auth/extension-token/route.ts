import { NextRequest, NextResponse } from "next/server";
import { extensionTokenRequestSchema } from "@internship-copilot/validation";
import { AUTH_CONFIG } from "@internship-copilot/config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = extensionTokenRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid token exchange payload", details: parsed.error.format() }, { status: 400 });
    }

    // In production, verify parsed.data.chromeIdentityToken with Google OAuth
    // Issue short-lived 15-minute token + refresh token
    const tokenResponse = {
      accessToken: `jwt_session_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      expiresIn: AUTH_CONFIG.EXTENSION_TOKEN_EXPIRY_SECONDS,
      refreshToken: `refresh_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    };

    return NextResponse.json(tokenResponse, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
