import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPreferredDocument } from "@internship-copilot/database";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getAuthenticatedUser(req);
    const userIdOrEmail = sessionUser?.id || sessionUser?.email || "sanjeev1803t@gmail.com";

    const document = getPreferredDocument(userIdOrEmail);
    if (!document) {
      return NextResponse.json({ document: null }, { status: 200 });
    }

    return NextResponse.json({
      document: {
        id: document.id,
        title: document.title,
        filename: document.filename,
        sizeBytes: document.sizeBytes,
        mimeType: document.mimeType,
        isPreferred: document.isPreferred,
        fileData: document.fileData,
        createdAt: document.createdAt,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch preferred document" }, { status: 500 });
  }
}
