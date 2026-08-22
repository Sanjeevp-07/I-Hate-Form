import { NextRequest, NextResponse } from "next/server";
import { completeAutofillRequestSchema } from "@internship-copilot/validation";
import { ApplicationRepository } from "@internship-copilot/database";

// In-memory idempotency deduplication cache with TTL
const idempotencyStore = new Map<string, { applicationId: string; status: "completed" | "partial" | "failed"; timestamp: number }>();
const IDEMPOTENCY_TTL_MS = 1000 * 60 * 15; // 15 minutes TTL

function cleanExpiredKeys() {
  const now = Date.now();
  for (const [key, val] of idempotencyStore.entries()) {
    if (now - val.timestamp > IDEMPOTENCY_TTL_MS) {
      idempotencyStore.delete(key);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    cleanExpiredKeys();

    const idempotencyKey = req.headers.get("Idempotency-Key");
    if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
      const cached = idempotencyStore.get(idempotencyKey)!;
      return NextResponse.json({ applicationId: cached.applicationId, status: cached.status }, { status: 200 });
    }

    const body = await req.json();
    const parsed = completeAutofillRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid completion payload", details: parsed.error.format() }, { status: 400 });
    }

    const { sessionId, filledFieldIds, skippedFieldIds, errors } = parsed.data;

    const completedApp = await ApplicationRepository.completeSession({
      sessionId,
      filledFieldIds,
      skippedFieldIds,
      errors,
    });

    const status = errors.length === 0 ? "completed" : filledFieldIds.length > 0 ? "partial" : "failed";
    const responsePayload = {
      applicationId: completedApp.id,
      status: status as "completed" | "partial" | "failed",
    };

    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, {
        ...responsePayload,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to record completion" }, { status: 500 });
  }
}
