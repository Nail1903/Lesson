"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  createTermSchema,
  updateTermSchema,
} from "@/lib/validations/term";
import {
  createTerm,
  updateTerm,
  softDeleteTerm,
  restoreTerm,
  hardDeleteTerm,
} from "@/server/services/term-service";
import { ok, fail, fromError, type ActionResult } from "@/server/actions/_result";

export async function createTermAction(
  raw: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const user = await requireUser();
    const parsed = createTermSchema.safeParse(raw);
    if (!parsed.success) {
      return fail("Formada xəta var", parsed.error.flatten().fieldErrors);
    }
    const term = await createTerm(user.id, parsed.data);
    revalidatePath("/terms");
    revalidatePath("/dashboard");
    return ok({ id: term.id, slug: term.slug });
  } catch (e) {
    return fromError(e);
  }
}

export async function updateTermAction(raw: unknown): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const user = await requireUser();
    const parsed = updateTermSchema.safeParse(raw);
    if (!parsed.success) {
      return fail("Formada xəta var", parsed.error.flatten().fieldErrors);
    }
    const term = await updateTerm(user.id, parsed.data);
    revalidatePath("/terms");
    revalidatePath(`/terms/${term.slug}`);
    revalidatePath("/dashboard");
    return ok({ id: term.id, slug: term.slug });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteTermAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await softDeleteTerm(user.id, id);
    revalidatePath("/terms");
    revalidatePath("/trash");
    revalidatePath("/dashboard");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function restoreTermAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await restoreTerm(user.id, id);
    revalidatePath("/terms");
    revalidatePath("/trash");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function purgeTermAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await hardDeleteTerm(user.id, id);
    revalidatePath("/trash");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}
