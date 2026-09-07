"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import * as svc from "@/server/services/schedule-service";
import { ok, fail, fromError, type ActionResult } from "@/server/actions/_result";

const rev = (offeringId: string) => {
  revalidatePath(`/teaching/${offeringId}`);
  revalidatePath("/teaching");
  revalidatePath("/dashboard");
};

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Saat HH:MM formatında");
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarix YYYY-MM-DD formatında");

export async function setOfferingStatusAction(offeringId: string, status: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.setOfferingStatus(user.id, offeringId, status);
    rev(offeringId);
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function setOfferingDatesAction(raw: unknown): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    const p = z
      .object({ offeringId: z.string().cuid(), startDate: dateStr.nullable(), endDate: dateStr.nullable() })
      .safeParse(raw);
    if (!p.success) return fail("Tarix formatı yanlışdır");
    await svc.setOfferingDates(user.id, p.data.offeringId, { startDate: p.data.startDate, endDate: p.data.endDate });
    rev(p.data.offeringId);
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function upsertSlotAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = z
      .object({
        id: z.string().cuid().optional(),
        offeringId: z.string().cuid(),
        groupId: z.string().cuid(),
        weekday: z.coerce.number().int().min(1).max(7),
        startTime: time,
        endTime: time,
        kind: z.string().trim().max(40).optional().or(z.literal("")),
        room: z.string().trim().max(80).optional().or(z.literal("")),
        onlineUrl: z.string().trim().max(400).optional().or(z.literal("")),
      })
      .safeParse(raw);
    if (!p.success) return fail(p.error.errors[0]?.message ?? "Formada xəta var");
    if (p.data.endTime <= p.data.startTime) return fail("Bitmə saatı başlama saatından sonra olmalıdır.");
    const s = await svc.upsertSlot(user.id, {
      ...p.data,
      kind: p.data.kind || undefined,
      room: p.data.room || undefined,
      onlineUrl: p.data.onlineUrl || undefined,
    });
    rev(p.data.offeringId);
    return ok({ id: s.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteSlotAction(id: string, offeringId: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deleteSlot(user.id, id);
    rev(offeringId);
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function addExceptionAction(raw: unknown): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    const p = z
      .object({ offeringId: z.string().cuid(), date: dateStr, reason: z.string().trim().max(120).optional() })
      .safeParse(raw);
    if (!p.success) return fail("Tarix yanlışdır");
    await svc.addException(user.id, p.data.offeringId, p.data.date, p.data.reason);
    rev(p.data.offeringId);
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteExceptionAction(id: string, offeringId: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deleteException(user.id, id);
    rev(offeringId);
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function generateMeetingsAction(offeringId: string): Promise<ActionResult<svc.GenerateResult>> {
  try {
    const user = await requireUser();
    const r = await svc.generateMeetings(user.id, offeringId);
    rev(offeringId);
    return ok(r);
  } catch (e) {
    return fromError(e);
  }
}

export async function clearPlannedMeetingsAction(offeringId: string): Promise<ActionResult<{ removed: number }>> {
  try {
    const user = await requireUser();
    const removed = await svc.clearPlannedMeetings(user.id, offeringId);
    rev(offeringId);
    return ok({ removed });
  } catch (e) {
    return fromError(e);
  }
}

export async function upsertMeetingAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = z
      .object({
        id: z.string().cuid().optional(),
        offeringId: z.string().cuid(),
        groupId: z.string().cuid(),
        date: dateStr.nullable(),
        startTime: time.optional().or(z.literal("")),
        endTime: time.optional().or(z.literal("")),
        room: z.string().trim().max(80).optional().or(z.literal("")),
        onlineUrl: z.string().trim().max(400).optional().or(z.literal("")),
        status: z.enum(["planned", "held", "postponed", "cancelled"]).optional(),
        note: z.string().trim().max(4000).optional(),
      })
      .safeParse(raw);
    if (!p.success) return fail(p.error.errors[0]?.message ?? "Formada xəta var");
    const m = await svc.upsertMeeting(user.id, {
      ...p.data,
      startTime: p.data.startTime || undefined,
      endTime: p.data.endTime || undefined,
      room: p.data.room || undefined,
      onlineUrl: p.data.onlineUrl || undefined,
    });
    rev(p.data.offeringId);
    return ok({ id: m.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function setMeetingStatusAction(id: string, offeringId: string, status: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.setMeetingStatus(user.id, id, status);
    rev(offeringId);
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteMeetingAction(id: string, offeringId: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deleteMeeting(user.id, id);
    rev(offeringId);
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function setMeetingTopicsAction(raw: unknown): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    const p = z
      .object({ meetingId: z.string().cuid(), offeringId: z.string().cuid(), topicIds: z.array(z.string().cuid()).max(20) })
      .safeParse(raw);
    if (!p.success) return fail("Formada xəta var");
    await svc.setMeetingTopics(user.id, p.data.meetingId, p.data.topicIds);
    rev(p.data.offeringId);
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}
