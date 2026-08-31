import { db } from "@/lib/db";

export async function buildFullExport(userId: string) {
  const [terms, categories, collections, subjects, chats] = await Promise.all([
    db.term.findMany({
      where: { userId, deletedAt: null },
      include: {
        aliases: true,
        tags: { select: { name: true } },
        category: { select: { name: true } },
        subjects: { select: { name: true } },
        notes: { where: { deletedAt: null } },
        examples: { where: { deletedAt: null } },
        codeExamples: { where: { deletedAt: null } },
        formulas: { where: { deletedAt: null } },
        sources: { where: { deletedAt: null } },
        relationsFrom: { where: { deletedAt: null }, include: { to: { select: { name: true } } } },
      },
    }),
    db.category.findMany({ where: { userId, deletedAt: null } }),
    db.collection.findMany({ where: { userId, deletedAt: null } }),
    db.subject.findMany({
      where: { userId, deletedAt: null },
      include: { topics: { where: { deletedAt: null }, include: { terms: { include: { term: { select: { name: true } } } } } } },
    }),
    db.chat.findMany({
      where: { userId, deletedAt: null },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    }),
  ]);

  return {
    meta: { exportedAt: new Date().toISOString(), version: 1, app: "MyLesson" },
    categories,
    collections,
    subjects,
    terms,
    chats,
  };
}

export function termsToCsv(exp: Awaited<ReturnType<typeof buildFullExport>>): string {
  const rows = [
    ["name", "aliases", "category", "subjects", "status", "difficulty", "confidence", "importance", "shortDef", "inMyWords"],
    ...exp.terms.map((t) => [
      t.name,
      t.aliases.map((a) => a.value).join("; "),
      t.category?.name ?? "",
      t.subjects.map((s) => s.name).join("; "),
      t.status,
      t.difficulty,
      String(t.confidence),
      String(t.importance),
      (t.shortDef ?? "").replace(/\s+/g, " "),
      (t.inMyWords ?? "").replace(/\s+/g, " "),
    ]),
  ];
  return rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function termsToMarkdown(exp: Awaited<ReturnType<typeof buildFullExport>>): string {
  return exp.terms
    .map((t) => {
      const lines = [`# ${t.name}`];
      if (t.aliases.length) lines.push(`*Sinonimlər: ${t.aliases.map((a) => a.value).join(", ")}*`);
      if (t.category) lines.push(`**Kateqoriya:** ${t.category.name}`);
      if (t.subjects.length) lines.push(`**Fənnlər:** ${t.subjects.map((s) => s.name).join(", ")}`);
      lines.push(`**Status:** ${t.status} · **Çətinlik:** ${t.difficulty} · **Əminlik:** ${t.confidence}/5`);
      if (t.shortDef) lines.push(`\n## Qısa izah\n${t.shortDef}`);
      if (t.longDef) lines.push(`\n## Geniş izah\n${t.longDef}`);
      if (t.inMyWords) lines.push(`\n## Öz sözlərimlə\n${t.inMyWords}`);
      if (t.practicalUse) lines.push(`\n## Praktiki tətbiq\n${t.practicalUse}`);
      if (t.examples.length) {
        lines.push(`\n## Nümunələr`);
        t.examples.forEach((e) => lines.push(`- **(${e.kind})** ${e.body}`));
      }
      if (t.formulas.length) {
        lines.push(`\n## Düsturlar`);
        t.formulas.forEach((f) => lines.push(`- $$${f.latex}$$ ${f.caption ? `— ${f.caption}` : ""}`));
      }
      if (t.relationsFrom.length) {
        lines.push(`\n## Əlaqələr`);
        t.relationsFrom.forEach((r) => lines.push(`- ${r.type} → [[${r.to.name}]]${r.note ? ` (${r.note})` : ""}`));
      }
      return lines.join("\n");
    })
    .join("\n\n---\n\n");
}
