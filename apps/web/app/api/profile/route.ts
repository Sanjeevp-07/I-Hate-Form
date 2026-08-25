import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { readDatabase, updateUserProfile, StoredProfile } from "@internship-copilot/database";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getAuthenticatedUser(req);
    const db = readDatabase();

    let user = null;
    if (sessionUser) {
      user = db.users[sessionUser.id] || Object.values(db.users).find((u) => u.email.toLowerCase() === sessionUser.email.toLowerCase());
    }

    if (!user) {
      // Return first user or default user
      user = Object.values(db.users)[0];
    }

    if (user && user.profile) {
      return NextResponse.json({
        profile: user.profile,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    }

    return NextResponse.json({
      profile: { personal: {}, links: {} },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getAuthenticatedUser(req);
    const body = await req.json();
    const { personal, education, secondary, higherSecondary, skills, links, documents } = body;

    if (!personal) {
      return NextResponse.json({ error: "Personal information is required" }, { status: 400 });
    }

    const targetKey = sessionUser?.id || sessionUser?.email || personal.email || "user_sanjeev";
    const profileToSave: StoredProfile = {
      personal: personal || {},
      education: education || {},
      secondary: secondary || {},
      higherSecondary: higherSecondary || {},
      skills: Array.isArray(skills) ? skills : [],
      links: links || {},
      documents: documents || {},
    };

    const updatedUser = updateUserProfile(targetKey, profileToSave);

    return NextResponse.json({
      success: true,
      message: "Profile saved successfully to persistent database",
      profile: updatedUser.profile,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
      },
    });
  } catch (err) {
    console.error("Profile save error:", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
