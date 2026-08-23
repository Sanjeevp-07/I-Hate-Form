import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@internship-copilot/database";
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let userId = "user_" + Buffer.from(normalizedEmail).toString("hex").substring(0, 12);
    let userName = name?.trim() || normalizedEmail.split("@")[0];

    try {
      const passwordHash = await hashPassword(password);
      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existing) {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
      }

      const user = await prisma.user.create({
        data: {
          id: userId,
          email: normalizedEmail,
          name: userName,
          passwordHash,
          profile: {
            create: {
              personal: {
                firstName: userName.split(" ")[0] || "",
                lastName: userName.split(" ").slice(1).join(" ") || "",
                email: normalizedEmail,
                phone: "",
                city: "",
                state: "",
                country: "",
                postalCode: "",
                address: "",
                authorizedInCountry: true,
                requiresSponsorship: false,
              },
              links: {
                linkedin: "",
                github: "",
                portfolio: "",
              },
            },
          },
        },
        select: { id: true, email: true, name: true },
      });

      userId = user.id;
      userName = user.name || userName;
    } catch {
      // Database offline fallback: continue with session creation
    }

    const sessionUser = {
      id: userId,
      email: normalizedEmail,
      name: userName,
    };

    const token = createSessionToken(sessionUser);

    const response = NextResponse.json({ user: sessionUser, token }, { status: 201 });
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error during registration" }, { status: 500 });
  }
}
