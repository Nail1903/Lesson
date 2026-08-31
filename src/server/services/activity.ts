import { db } from "@/lib/db";

export async function logActivity(input: {
  userId: string;
  type: string;
  entity?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    await db.userActivity.create({
      data: {
        userId: input.userId,
        type: input.type,
        entity: input.entity,
        entityId: input.entityId,
        meta: input.meta as object | undefined,
      },
    });
  } catch {
    // activity logging must never break the main flow
  }
}
