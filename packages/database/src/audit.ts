import { prisma, ActorType, AIOperation } from "./client";

export interface LogAuditParams {
  userId: string;
  actorType: ActorType;
  action: string;
  targetType: string;
  targetId?: string;
}

export interface LogAIInteractionParams {
  userId: string;
  applicationId?: string;
  operation: AIOperation;
  inputTokens: number;
  outputTokens: number;
  model: string;
  latencyMs: number;
  success: boolean;
  errorCode?: string;
}

/**
 * Creates an immutable audit log entry for sensitive operations (PII access, profile updates, autofill actions).
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        actorType: params.actorType,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
      },
    });
  } catch (err: any) {
    console.warn("Could not write audit log to database:", err?.message || err);
  }
}

/**
 * Logs AI token usage, latency, and operation status.
 * CRITICAL DATA MINIMIZATION RULE (§5 / §7):
 * Never accepts or stores raw webpage HTML/DOM text in the database.
 */
export async function logAIInteraction(params: LogAIInteractionParams): Promise<void> {
  try {
    await prisma.aIInteraction.create({
      data: {
        userId: params.userId,
        applicationId: params.applicationId,
        operation: params.operation,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        model: params.model,
        latencyMs: params.latencyMs,
        success: params.success,
        errorCode: params.errorCode,
      },
    });
  } catch (err: any) {
    console.warn("Could not write AI interaction log to database:", err?.message || err);
  }
}
