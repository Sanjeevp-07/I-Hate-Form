import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { deleteUserDocument, setPreferredDocument, getDocumentById } from "@internship-copilot/database";
import fs from "fs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getAuthenticatedUser(req);
    const userIdOrEmail = sessionUser?.id || sessionUser?.email || "sanjeev1803t@gmail.com";

    const doc = getDocumentById(userIdOrEmail, id);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.fileData) {
      const buffer = Buffer.from(doc.fileData, "base64");
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": doc.mimeType || "application/pdf",
          "Content-Disposition": `inline; filename="${doc.filename}"`,
        },
      });
    }

    if (doc.filePath && fs.existsSync(doc.filePath)) {
      const fileBuffer = fs.readFileSync(doc.filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": doc.mimeType || "application/pdf",
          "Content-Disposition": `inline; filename="${doc.filename}"`,
        },
      });
    }

    return NextResponse.json({ document: doc });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load document" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getAuthenticatedUser(req);
    const userIdOrEmail = sessionUser?.id || sessionUser?.email || "sanjeev1803t@gmail.com";

    const deleted = deleteUserDocument(userIdOrEmail, id);
    if (!deleted) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Document deleted" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getAuthenticatedUser(req);
    const userIdOrEmail = sessionUser?.id || sessionUser?.email || "sanjeev1803t@gmail.com";

    const updated = setPreferredDocument(userIdOrEmail, id);
    if (!updated) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Preferred resume updated" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}
