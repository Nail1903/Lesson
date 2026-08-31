"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

import { db } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { registerSchema, loginSchema } from "@/lib/validations/misc";
import { logActivity } from "@/server/services/activity";
import { ok, fail, fromError, type ActionResult } from "@/server/actions/_result";
import { seedStarterContent } from "@/server/services/starter-content";

export async function registerAction(raw: unknown): Promise<ActionResult<{ email: string }>> {
  try {
    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) return fail("Formada xəta var", parsed.error.flatten().fieldErrors);

    const { name, email, password } = parsed.data;
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return fail("Bu email artıq qeydiyyatdan keçib");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: { name, email, passwordHash },
    });

    // Give every new account a small starter set so the app is never empty.
    await seedStarterContent(user.id).catch(() => undefined);
    await logActivity({ userId: user.id, type: "user.registered" });

    return ok({ email });
  } catch (e) {
    return fromError(e);
  }
}

export async function loginAction(raw: unknown): Promise<ActionResult<undefined>> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return fail("Email və ya şifrə düzgün deyil");
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return ok(undefined);
  } catch (e) {
    if (e instanceof AuthError) return fail("Email və ya şifrə yanlışdır");
    throw e; // NEXT_REDIRECT etc.
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
