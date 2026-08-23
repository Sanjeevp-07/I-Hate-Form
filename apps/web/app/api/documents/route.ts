import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserDocuments, addDocumentToUser } from "@internship-copilot/database";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getAuthenticatedUser(req);
    const userIdOrEmail = sessionUser?.id || sessionUser?.email || "user_admin";

    const documents = getUserDocuments(userIdOrEmail);
    return NextResponse.json({ documents });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getAuthenticatedUser(req);
    const userIdOrEmail = sessionUser?.id || sessionUser?.email || "user_admin";

    const body = await req.json();
    const { title, filename, sizeBytes, mimeType, tags } = body;

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    // Auto extract/generate tags based on filename if none provided
    const extractedTags = tags && tags.length > 0 ? tags : [];
    const lowerName = filename.toLowerCase();
    if (lowerName.includes("swe") || lowerName.includes("fullstack")) extractedTags.push("Fullstack", "TypeScript");
    if (lowerName.includes("ml") || lowerName.includes("ai")) extractedTags.push("Machine Learning", "Python");
    if (lowerName.includes("front") || lowerName.includes("react")) extractedTags.push("React", "Frontend");
    if (extractedTags.length === 0) extractedTags.push("Resume", "General");

    const newDoc = addDocumentToUser(userIdOrEmail, {
      title: title || filename,
      filename,
      sizeBytes: sizeBytes || 250000,
      mimeType: mimeType || "application/pdf",
      tags: extractedTags,
    });

    return NextResponse.json({ success: true, document: newDoc }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
