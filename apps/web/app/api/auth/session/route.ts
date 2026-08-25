import { NextRequest, NextResponse } from "next/server";
import { prisma, getOrCreateUser } from "@internship-copilot/database";
import { createSessionToken, AUTH_COOKIE_NAME, isAdminUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, email, displayName, photoURL } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const name = displayName?.trim() || normalizedEmail.split("@")[0];
    const isAdmin = isAdminUser(normalizedEmail);

    let userId = uid || "user_" + Buffer.from(normalizedEmail).toString("hex").substring(0, 12);
    let userName = name;

    // 1. Sync with JSON local store
    try {
      const storedUser = getOrCreateUser(normalizedEmail, userName, "google");
      if (storedUser) {
        userId = storedUser.id;
        userName = storedUser.name;
      }
    } catch (e) {
      console.warn("Local db store sync warning:", e);
    }

    // 2. Sync with Prisma if connected
    try {
      const user = await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
          name: userName,
        },
        create: {
          id: userId,
          email: normalizedEmail,
          name: userName,
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

      if (user) {
        userId = user.id;
        userName = user.name || userName;
      }
    } catch {
      // Prisma offline fallback is okay
    }

    const sessionUser = {
      id: userId,
      email: normalizedEmail,
      name: userName,
      isAdmin,
    };

    const token = createSessionToken(sessionUser);

    const response = NextResponse.json(
      {
        success: true,
        authenticated: true,
        user: sessionUser,
        token,
      },
      { status: 200 }
    );

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Firebase session sync error:", err);
    return NextResponse.json({ error: "Failed to establish authenticated session" }, { status: 500 });
  }
}
