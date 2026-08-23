import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { deleteUserDocument, setPreferredDocument } from "@internship-copilot/database";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getAuthenticatedUser(req);
    const userIdOrEmail = sessionUser?.id || sessionUser?.email || "user_admin";

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
    const userIdOrEmail = sessionUser?.id || sessionUser?.email || "user_admin";

    const updated = setPreferredDocument(userIdOrEmail, id);
    if (!updated) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Preferred resume updated" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}
