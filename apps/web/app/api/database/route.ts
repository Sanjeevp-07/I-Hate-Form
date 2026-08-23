import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isAdminUser } from "@/lib/auth";
import { readDatabase } from "@internship-copilot/database";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getAuthenticatedUser(req);

    // Admin-only protection (§1 RBAC)
    if (!sessionUser || !isAdminUser(sessionUser.email)) {
      return NextResponse.json(
        { error: "Access Denied: Admin privileges required to inspect database." },
        { status: 403 }
      );
    }

    const db = readDatabase();
    const dataPath = path.resolve(process.cwd(), "..", "..", "data", "ihateform-database.json");

    return NextResponse.json({
      storageType: "Persistent File Store (JSON / PostgreSQL Ready)",
      filePath: dataPath,
      totalUsers: Object.keys(db.users || {}).length,
      data: db,
      schema: {
        models: ["User", "Profile", "Application", "Document", "FieldMapping", "AIInteraction", "AuditLog"],
        url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/internship_copilot",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to read database inspector" }, { status: 500 });
  }
}
