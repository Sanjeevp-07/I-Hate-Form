import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isAdminUser } from "@/lib/auth";
import { prisma } from "@internship-copilot/database";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getAuthenticatedUser(req);

    if (!sessionUser) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const isAdmin = sessionUser.isAdmin ?? isAdminUser(sessionUser.email);

    let profile = null;
    try {
      const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: {
          id: true,
          email: true,
          name: true,
          profile: {
            select: { id: true, personal: true, links: true },
          },
        },
      });
      if (user) {
        profile = user.profile;
      }
    } catch {
      // Database offline fallback
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        isAdmin,
        profile,
      },
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false, error: "Auth verification failed" }, { status: 500 });
  }
}
