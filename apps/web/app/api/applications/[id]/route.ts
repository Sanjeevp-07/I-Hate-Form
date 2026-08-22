import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApplicationRepository, ApplicationStatus } from "@internship-copilot/database";

const updateApplicationSchema = z.object({
  jobTitle: z.string().optional(),
  status: z.enum(["IN_PROGRESS", "APPLIED", "INTERVIEWING", "OFFER", "REJECTED", "ARCHIVED"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update payload", details: parsed.error.format() }, { status: 400 });
    }

    const updated = await ApplicationRepository.updateApplication(id, {
      jobTitle: parsed.data.jobTitle,
      status: parsed.data.status as ApplicationStatus | undefined,
    });

    return NextResponse.json({ application: updated }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
