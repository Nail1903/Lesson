"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  universitySchema,
  facultySchema,
  groupSchema,
  offeringSchema,
  groupProgressSchema,
  cloneOfferingSchema,
} from "@/lib/validations/teaching";
import * as svc from "@/server/services/teaching-service";
import { ok, fail, fromError, type ActionResult } from "@/server/actions/_result";

export async function upsertUniversityAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = universitySchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var", p.error.flatten().fieldErrors);
    const u = await svc.upsertUniversity(user.id, p.data);
    revalidatePath("/teaching");
    return ok({ id: u.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteUniversityAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deleteUniversity(user.id, id);
    revalidatePath("/teaching");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function upsertFacultyAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = facultySchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var", p.error.flatten().fieldErrors);
    const f = await svc.upsertFaculty(user.id, {
      ...p.data,
      department: p.data.department || undefined,
    });
    revalidatePath("/teaching");
    return ok({ id: f.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteFacultyAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deleteFaculty(user.id, id);
    revalidatePath("/teaching");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function upsertGroupAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = groupSchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var", p.error.flatten().fieldErrors);
    const g = await svc.upsertGroup(user.id, {
      ...p.data,
      specialty: p.data.specialty || undefined,
      contactInfo: p.data.contactInfo || undefined,
    });
    revalidatePath("/teaching");
    return ok({ id: g.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteGroupAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deleteGroup(user.id, id);
    revalidatePath("/teaching");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function upsertOfferingAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = offeringSchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var", p.error.flatten().fieldErrors);
    const res = await svc.upsertOffering(user.id, p.data);
    revalidatePath("/teaching");
    revalidatePath(`/teaching/${res.id}`);
    return ok(res);
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteOfferingAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deleteOffering(user.id, id);
    revalidatePath("/teaching");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function saveGroupProgressAction(raw: unknown): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    const p = groupProgressSchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var");
    await svc.saveGroupProgress(user.id, {
      ...p.data,
      note: p.data.note || undefined,
      nextStep: p.data.nextStep || undefined,
    });
    revalidatePath(`/teaching/${p.data.offeringId}`);
    revalidatePath("/dashboard");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function cloneOfferingAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = cloneOfferingSchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var");
    const res = await svc.cloneOfferingToSemester(user.id, p.data.offeringId, {
      academicYear: p.data.academicYear,
      term: p.data.term,
      groupIds: p.data.groupIds,
      keepCourseVersion: p.data.keepCourseVersion,
    });
    revalidatePath("/teaching");
    return ok(res);
  } catch (e) {
    return fromError(e);
  }
}
