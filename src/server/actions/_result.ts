export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

export function fromError(e: unknown): ActionResult<never> {
  if (e instanceof Error) {
    if (e.message === "UNAUTHORIZED") return fail("Sessiya bitib. Yenidən daxil olun.");
    if (e.message === "NOT_FOUND") return fail("Tapılmadı.");
    return fail(e.message);
  }
  return fail("Naməlum xəta baş verdi.");
}
