import { db } from "@/lib/db";

async function ownedOffering(userId: string, offeringId: string) {
  const o = await db.semesterOffering.findFirst({
    where: { id: offeringId, userId, deletedAt: null },
    select: { id: true, startDate: true, endDate: true },
  });
  if (!o) throw new Error("NOT_FOUND");
  return o;
}

/* ── Offering status & semester dates ───────────────────────────────────── */

export async function setOfferingStatus(userId: string, id: string, status: string) {
  if (!["draft", "active", "archived"].includes(status)) throw new Error("Yanlış status");
  const r = await db.semesterOffering.updateMany({ where: { id, userId, deletedAt: null }, data: { status } });
  if (!r.count) throw new Error("NOT_FOUND");
}

export async function setOfferingDates(
  userId: string,
  id: string,
  input: { startDate: string | null; endDate: string | null },
) {
  await ownedOffering(userId, id);
  await db.semesterOffering.update({
    where: { id },
    data: {
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
    },
  });
}

/* ── Weekly class slots ─────────────────────────────────────────────────── */

export async function listSchedule(userId: string, offeringId: string) {
  await ownedOffering(userId, offeringId);
  const [slots, exceptions, meetings] = await Promise.all([
    db.classSlot.findMany({
      where: { offeringId, userId },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
      include: { group: { select: { id: true, name: true } } },
    }),
    db.offeringException.findMany({ where: { offeringId, userId }, orderBy: { date: "asc" } }),
    db.lessonMeeting.findMany({
      where: { offeringId, userId },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: {
        group: { select: { id: true, name: true } },
        topics: { include: { topic: { select: { id: true, name: true } } } },
      },
    }),
  ]);
  return { slots, exceptions, meetings };
}

export async function upsertSlot(
  userId: string,
  input: {
    id?: string;
    offeringId: string;
    groupId: string;
    weekday: number;
    startTime: string;
    endTime: string;
    kind?: string;
    room?: string;
    onlineUrl?: string;
  },
) {
  await ownedOffering(userId, input.offeringId);
  const link = await db.offeringGroup.findFirst({
    where: { offeringId: input.offeringId, groupId: input.groupId, userId },
    select: { id: true },
  });
  if (!link) throw new Error("Qrup bu tədris planına bağlı deyil.");

  const data = {
    weekday: input.weekday,
    startTime: input.startTime,
    endTime: input.endTime,
    kind: input.kind?.trim() || null,
    room: input.room?.trim() || null,
    onlineUrl: input.onlineUrl?.trim() || null,
  };
  if (input.id) return db.classSlot.update({ where: { id: input.id }, data });
  return db.classSlot.create({ data: { ...data, userId, offeringId: input.offeringId, groupId: input.groupId } });
}

export async function deleteSlot(userId: string, id: string) {
  const s = await db.classSlot.findFirst({ where: { id, userId }, select: { id: true } });
  if (!s) return;
  // detach generated meetings but keep them (teacher may have marked them held)
  await db.lessonMeeting.updateMany({ where: { slotId: id }, data: { slotId: null } });
  await db.classSlot.delete({ where: { id } });
}

/* ── Exception (holiday) dates ──────────────────────────────────────────── */

export async function addException(userId: string, offeringId: string, date: string, reason?: string) {
  await ownedOffering(userId, offeringId);
  return db.offeringException.upsert({
    where: { offeringId_date: { offeringId, date: new Date(date) } },
    create: { userId, offeringId, date: new Date(date), reason: reason?.trim() || null },
    update: { reason: reason?.trim() || null },
  });
}

export async function deleteException(userId: string, id: string) {
  await db.offeringException.deleteMany({ where: { id, userId } });
}

/* ── Generate dated meetings from the weekly schedule ───────────────────── */

export interface GenerateResult {
  created: number;
  skippedExisting: number;
  skippedException: number;
}

export async function generateMeetings(userId: string, offeringId: string): Promise<GenerateResult> {
  const offering = await ownedOffering(userId, offeringId);
  if (!offering.startDate || !offering.endDate) {
    throw new Error("Əvvəlcə semestrin başlama və bitmə tarixlərini daxil edin.");
  }
  if (offering.endDate < offering.startDate) throw new Error("Bitmə tarixi başlama tarixindən əvvəldir.");

  const [slots, exceptions, existing] = await Promise.all([
    db.classSlot.findMany({ where: { offeringId, userId } }),
    db.offeringException.findMany({ where: { offeringId, userId }, select: { date: true } }),
    db.lessonMeeting.findMany({ where: { offeringId, userId, slotId: { not: null } }, select: { slotId: true, date: true } }),
  ]);
  if (slots.length === 0) throw new Error("Həftəlik cədvəl slotu yoxdur.");

  const exceptionKeys = new Set(exceptions.map((e) => e.date.toISOString().slice(0, 10)));
  const existingKeys = new Set(existing.map((m) => `${m.slotId}:${m.date?.toISOString().slice(0, 10)}`));

  const start = new Date(offering.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(offering.endDate);
  end.setHours(0, 0, 0, 0);

  let created = 0;
  let skippedExisting = 0;
  let skippedException = 0;
  const toCreate: {
    userId: string;
    offeringId: string;
    groupId: string;
    slotId: string;
    date: Date;
    startTime: string;
    endTime: string;
    room: string | null;
    onlineUrl: string | null;
    status: string;
  }[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const isoWeekday = d.getDay() === 0 ? 7 : d.getDay(); // 1..7, Mon..Sun
    const key = d.toISOString().slice(0, 10);
    for (const slot of slots) {
      if (slot.weekday !== isoWeekday) continue;
      if (exceptionKeys.has(key)) {
        skippedException++;
        continue;
      }
      if (existingKeys.has(`${slot.id}:${key}`)) {
        skippedExisting++;
        continue;
      }
      toCreate.push({
        userId,
        offeringId,
        groupId: slot.groupId,
        slotId: slot.id,
        date: new Date(d),
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: slot.room,
        onlineUrl: slot.onlineUrl,
        status: "planned",
      });
      created++;
    }
  }

  if (toCreate.length) await db.lessonMeeting.createMany({ data: toCreate });
  return { created, skippedExisting, skippedException };
}

export async function clearPlannedMeetings(userId: string, offeringId: string) {
  await ownedOffering(userId, offeringId);
  const r = await db.lessonMeeting.deleteMany({
    where: { offeringId, userId, status: "planned", slotId: { not: null } },
  });
  return r.count;
}

/* ── Individual meeting edits ───────────────────────────────────────────── */

export async function upsertMeeting(
  userId: string,
  input: {
    id?: string;
    offeringId: string;
    groupId: string;
    date: string | null;
    startTime?: string;
    endTime?: string;
    room?: string;
    onlineUrl?: string;
    status?: string;
    note?: string;
  },
) {
  await ownedOffering(userId, input.offeringId);
  const data = {
    date: input.date ? new Date(input.date) : null,
    startTime: input.startTime?.trim() || null,
    endTime: input.endTime?.trim() || null,
    room: input.room?.trim() || null,
    onlineUrl: input.onlineUrl?.trim() || null,
    ...(input.status ? { status: input.status } : {}),
    ...(input.note !== undefined ? { note: input.note.trim() || null } : {}),
  };
  if (input.id) {
    const owned = await db.lessonMeeting.findFirst({ where: { id: input.id, userId }, select: { id: true } });
    if (!owned) throw new Error("NOT_FOUND");
    return db.lessonMeeting.update({ where: { id: input.id }, data });
  }
  return db.lessonMeeting.create({
    data: { ...data, userId, offeringId: input.offeringId, groupId: input.groupId, status: input.status ?? "planned" },
  });
}

export async function setMeetingStatus(userId: string, id: string, status: string) {
  if (!["planned", "held", "postponed", "cancelled"].includes(status)) throw new Error("Yanlış status");
  const r = await db.lessonMeeting.updateMany({ where: { id, userId }, data: { status } });
  if (!r.count) throw new Error("NOT_FOUND");
}

export async function deleteMeeting(userId: string, id: string) {
  await db.lessonMeeting.deleteMany({ where: { id, userId } });
}

/** Attach / detach a topic covered in a meeting. */
export async function setMeetingTopics(userId: string, meetingId: string, topicIds: string[]) {
  const m = await db.lessonMeeting.findFirst({ where: { id: meetingId, userId }, select: { id: true } });
  if (!m) throw new Error("NOT_FOUND");
  const owned = await db.topic.findMany({
    where: { id: { in: topicIds }, userId, deletedAt: null },
    select: { id: true },
  });
  await db.meetingTopic.deleteMany({ where: { meetingId } });
  if (owned.length) {
    await db.meetingTopic.createMany({
      data: owned.map((t) => ({ userId, meetingId, topicId: t.id })),
    });
  }
}
