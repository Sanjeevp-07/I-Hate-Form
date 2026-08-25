import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserDocuments, addDocumentToUser } from "@internship-copilot/database";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getAuthenticatedUser(req);
    const userIdOrEmail = sessionUser?.id || sessionUser?.email || "sanjeev1803t@gmail.com";

    const documents = getUserDocuments(userIdOrEmail);
    return NextResponse.json({ documents });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getAuthenticatedUser(req);
    const userIdOrEmail = sessionUser?.id || sessionUser?.email || "sanjeev1803t@gmail.com";

    const contentType = req.headers.get("content-type") || "";

    let title = "";
    let filename = "";
    let sizeBytes = 0;
    let mimeType = "application/pdf";
    let category = "resume";
    let tags: string[] = [];
    let fileData: string | undefined = undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided in form data" }, { status: 400 });
      }

      filename = file.name;
      title = (formData.get("title") as string) || file.name;
      category = (formData.get("category") as string) || "resume";
      sizeBytes = file.size;
      mimeType = file.type || "application/pdf";

      const rawTags = formData.get("tags") as string | null;
      if (rawTags) {
        try {
          tags = JSON.parse(rawTags);
        } catch {
          tags = rawTags.split(",").map((t) => t.trim()).filter(Boolean);
        }
      }

      const buffer = await file.arrayBuffer();
      fileData = Buffer.from(buffer).toString("base64");
    } else {
      const body = await req.json();
      title = body.title || body.filename || "";
      filename = body.filename || "";
      category = body.category || "resume";
      sizeBytes = body.sizeBytes || 0;
      mimeType = body.mimeType || "application/pdf";
      tags = body.tags || [];
      fileData = body.fileData || body.fileBufferBase64;
    }

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    // Auto extract/generate tags based on category & filename if none provided
    const extractedTags = tags && tags.length > 0 ? tags : [];
    if (category === "secondaryMarksheet") extractedTags.push("10th", "Marksheet");
    else if (category === "higherSecondaryMarksheet") extractedTags.push("12th", "Marksheet");
    else if (category === "collegeTranscript") extractedTags.push("Transcript", "College");
    else if (category === "coverLetter") extractedTags.push("Cover Letter");
    else extractedTags.push("Resume");

    const lowerName = filename.toLowerCase();
    if (lowerName.includes("swe") || lowerName.includes("fullstack")) extractedTags.push("Fullstack", "TypeScript");
    if (lowerName.includes("ml") || lowerName.includes("ai")) extractedTags.push("Machine Learning", "Python");
    if (lowerName.includes("front") || lowerName.includes("react")) extractedTags.push("React", "Frontend");

    const newDoc = addDocumentToUser(userIdOrEmail, {
      title: title || filename,
      filename,
      category,
      sizeBytes: sizeBytes || 250000,
      mimeType: mimeType || "application/pdf",
      tags: Array.from(new Set(extractedTags)),
      fileData,
    });

    return NextResponse.json({ success: true, document: newDoc }, { status: 201 });
  } catch (err) {
    console.error("Document upload error:", err);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
