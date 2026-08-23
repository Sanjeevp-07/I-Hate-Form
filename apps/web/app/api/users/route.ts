import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isAdminUser } from "@/lib/auth";
import { readDatabase } from "@internship-copilot/database";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getAuthenticatedUser(req);

    // Admin-only protection (§1 RBAC)
    if (!sessionUser || !isAdminUser(sessionUser.email)) {
      return NextResponse.json(
        { error: "Access Denied: Admin privileges required to view user directory." },
        { status: 403 }
      );
    }

    const db = readDatabase();
    const rawUsers = Object.values(db.users || {});

    const users = rawUsers.map((u) => {
      const personal = u.profile?.personal || {};
      const locationParts = [personal.city, personal.country].filter(Boolean);
      const location = locationParts.length > 0 ? locationParts.join(", ") : "Not set";

      return {
        id: u.id,
        name: u.name || `${personal.firstName || ""} ${personal.lastName || ""}`.trim() || u.email.split("@")[0],
        email: u.email,
        authProvider: u.authProvider || "google",
        role: isAdminUser(u.email) ? "Master Admin" : "Applicant",
        applicationsCount: u.applications?.length || 0,
        fieldsFilled: (u.applications?.length || 0) * 15,
        location,
        joinedAt: new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        status: "Active",
      };
    });

    return NextResponse.json({
      totalUsers: users.length,
      users,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load real users directory" }, { status: 500 });
  }
}
