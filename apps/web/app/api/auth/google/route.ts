import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@internship-copilot/database";
import { createSessionToken, AUTH_COOKIE_NAME, isAdminUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email") || "sanjeev1803t@gmail.com";
    const name = url.searchParams.get("name") || (isAdminUser(email) ? "Sanjeev (Admin)" : email.split("@")[0]);
    const normalizedEmail = email.toLowerCase().trim();

    const user = getOrCreateUser(normalizedEmail, name, "google");

    const sessionUser = {
      id: user.id,
      email: normalizedEmail,
      name: user.name,
      isAdmin: isAdminUser(normalizedEmail),
    };

    const token = createSessionToken(sessionUser);

    const redirectUrl = new URL("/profile", req.url);
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Google auth error:", err);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}
