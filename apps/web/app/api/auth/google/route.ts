import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@internship-copilot/database";
import { createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email") || "sanjeev@example.com";
    const name = url.searchParams.get("name") || "Sanjeev Kumar";
    const normalizedEmail = email.toLowerCase().trim();

    let userId = "user_google_" + Buffer.from(normalizedEmail).toString("hex").substring(0, 12);

    try {
      let user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: normalizedEmail,
            name,
            authProvider: "google",
            profile: {
              create: {
                personal: {
                  firstName: name.split(" ")[0] || "Sanjeev",
                  lastName: name.split(" ").slice(1).join(" ") || "Kumar",
                  email: normalizedEmail,
                  phone: "+91 9876543210",
                  countryCode: "+91",
                  city: "New Delhi",
                  state: "Delhi",
                  country: "India",
                  postalCode: "110001",
                  address: "",
                  authorizedInCountry: true,
                  requiresSponsorship: false,
                },
                links: {
                  linkedin: "https://linkedin.com/in/sanjeev-dev",
                  github: "https://github.com/sanjeev-dev",
                  portfolio: "",
                },
              },
            },
          },
          select: { id: true, email: true, name: true },
        });
      }
      userId = user.id;
    } catch {
      // Database offline fallback: continue with session creation
    }

    const sessionUser = {
      id: userId,
      email: normalizedEmail,
      name,
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
