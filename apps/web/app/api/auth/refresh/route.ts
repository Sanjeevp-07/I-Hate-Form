import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_CONFIG } from "@internship-copilot/config";

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = refreshTokenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid refresh token payload", details: parsed.error.format() }, { status: 400 });
    }

    // In production, verify refresh token validity from session store/database
    const newAccessToken = `jwt_session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const rotatedRefreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    return NextResponse.json(
      {
        accessToken: newAccessToken,
        expiresIn: AUTH_CONFIG.EXTENSION_TOKEN_EXPIRY_SECONDS,
        refreshToken: rotatedRefreshToken,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
