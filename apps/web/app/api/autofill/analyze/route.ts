import { NextRequest, NextResponse } from "next/server";
import { analyzeFieldsRequestSchema } from "@internship-copilot/validation";
import { classifyField } from "@internship-copilot/ai";
import { FieldMapping } from "@internship-copilot/types";
import { CONFIDENCE_THRESHOLDS } from "@internship-copilot/config";

const CANDIDATE_PROFILE_PATHS = [
  "personal.firstName",
  "personal.lastName",
  "personal.email",
  "personal.phone",
  "personal.address",
  "personal.city",
  "personal.state",
  "personal.postalCode",
  "personal.country",
  "personal.authorizedInCountry",
  "personal.requiresSponsorship",
  "links.linkedin",
  "links.github",
  "links.portfolio",
  "education.0.institution",
  "education.0.degree",
  "education.0.fieldOfStudy",
  "education.0.gpa",
  "education.0.startDate",
  "education.0.endDate",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = analyzeFieldsRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid analysis payload", details: parsed.error.format() }, { status: 400 });
    }

    const { fields } = parsed.data;
    const mappings: FieldMapping[] = [];

    for (const field of fields) {
      try {
        const classification = await classifyField(
          {
            label: field.rawLabel,
            type: field.type,
            name: field.name,
            nearbyText: field.nearbyText,
          },
          CANDIDATE_PROFILE_PATHS
        );

        let action: FieldMapping["action"] = "unsupported";
        if (classification.confidence >= CONFIDENCE_THRESHOLDS.AUTO_FILL) {
          action = "fill";
        } else if (classification.confidence >= CONFIDENCE_THRESHOLDS.AUTO_FILL_REVIEW) {
          action = "fill";
        } else if (classification.confidence >= CONFIDENCE_THRESHOLDS.ASK_USER) {
          action = "review";
        }

        mappings.push({
          fieldId: field.id,
          rawLabel: field.rawLabel,
          normalizedLabel: field.normalizedLabel,
          profilePath: classification.profilePath,
          valueToFill: null, // Value populated from authorized user profile
          confidence: classification.confidence,
          action,
          source: "ai_fast",
          reason: classification.reasoning,
        });
      } catch (classifyErr) {
        // Fallback to safe review state
        mappings.push({
          fieldId: field.id,
          rawLabel: field.rawLabel,
          normalizedLabel: field.normalizedLabel,
          profilePath: null,
          valueToFill: null,
          confidence: 0.0,
          action: "review",
          source: "rule_fallback",
          reason: "AI classification unavailable",
        });
      }
    }

    return NextResponse.json({ mappings }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to analyze fields" }, { status: 500 });
  }
}
