"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTerm } from "@/server/services/term-service";
import { reindexAll } from "@/lib/rag/indexer";
import { logActivity } from "@/server/services/activity";
import { ok, fail, fromError, type ActionResult } from "@/server/actions/_result";

const importRowSchema = z.object({
  name: z.string().trim().min(1),
  shortDef: z.string().optional(),
  longDef: z.string().optional(),
  inMyWords: z.string().optional(),
  practicalUse: z.string().optional(),
  category: z.string().optional(),
  aliases: z.union([z.array(z.string()), z.string()]).optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  status: z.enum(["NEW", "LEARNING", "UNDERSTOOD", "NEEDS_REVIEW"]).optional(),
  confidence: z.coerce.number().min(1).max(5).optional(),
  importance: z.coerce.number().min(1).max(5).optional(),
});

function toList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") return v.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

/** Import terms from a JSON array, a full MyLesson backup, or CSV text. */
export async function importTermsAction(input: {
  raw: string;
  kind: "json" | "csv";
}): Promise<ActionResult<{ imported: number; skipped: number }>> {
  try {
    const user = await requireUser();
    let rows: unknown[] = [];

    if (input.kind === "csv") {
      rows = parseCsv(input.raw);
    } else {
      const parsed = JSON.parse(input.raw);
      rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.terms) ? parsed.terms : [];
    }

    if (rows.length === 0) return fail("İdxal ediləcək sətir tapılmadı");
    if (rows.length > 2000) return fail("Bir dəfəyə maksimum 2000 termin");

    let imported = 0;
    let skipped = 0;

    for (const rawRow of rows) {
      const parsed = importRowSchema.safeParse(rawRow);
      if (!parsed.success) {
        skipped++;
        continue;
      }
      const r = parsed.data;

      const exists = await db.term.findFirst({
        where: { userId: user.id, name: { equals: r.name, mode: "insensitive" }, deletedAt: null },
        select: { id: true },
      });
      if (exists) {
        skipped++;
        continue;
      }

      let categoryId: string | null = null;
      if (r.category) {
        const slug = r.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const cat = await db.category.upsert({
          where: { userId_slug: { userId: user.id, slug } },
          create: { userId: user.id, name: r.category, slug },
          update: {},
          select: { id: true },
        });
        categoryId = cat.id;
      }

      await createTerm(user.id, {
        name: r.name,
        shortDef: r.shortDef ?? "",
        longDef: r.longDef ?? "",
        inMyWords: r.inMyWords ?? "",
        practicalUse: r.practicalUse ?? "",
        categoryId,
        subcategory: "",
        difficulty: r.difficulty ?? "BEGINNER",
        status: r.status ?? "NEW",
        confidence: r.confidence ?? 1,
        importance: r.importance ?? 3,
        aliases: toList(r.aliases),
        tags: toList(r.tags),
        collectionIds: [],
      });
      imported++;
    }

    await logActivity({ userId: user.id, type: "data.imported", meta: { imported, skipped } });
    revalidatePath("/terms");
    revalidatePath("/dashboard");
    return ok({ imported, skipped });
  } catch (e) {
    return fromError(e);
  }
}

export async function reindexAllAction(): Promise<ActionResult<{ terms: number; created: number; updated: number }>> {
  try {
    const user = await requireUser();
    const r = await reindexAll(user.id);
    return ok({ terms: r.terms, created: r.created, updated: r.updated });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteAllDataAction(confirm: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    if (confirm !== "SİL") return fail('Təsdiq üçün "SİL" yazın');
    // cascades remove everything owned by the user except the account itself
    await db.$transaction([
      db.embedding.deleteMany({ where: { userId: user.id } }),
      db.term.deleteMany({ where: { userId: user.id } }),
      db.subject.deleteMany({ where: { userId: user.id } }),
      db.category.deleteMany({ where: { userId: user.id } }),
      db.collection.deleteMany({ where: { userId: user.id } }),
      db.tag.deleteMany({ where: { userId: user.id } }),
      db.chat.deleteMany({ where: { userId: user.id } }),
      db.quiz.deleteMany({ where: { userId: user.id } }),
      db.question.deleteMany({ where: { userId: user.id } }),
      db.userActivity.deleteMany({ where: { userId: user.id } }),
    ]);
    revalidatePath("/dashboard");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]!);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h.trim()] = (cells[i] ?? "").trim()));
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (c === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}
