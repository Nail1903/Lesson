import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTerm } from "@/server/services/term-service";
import { TermForm } from "@/components/terms/term-form";
import { TermSubjectsEditor } from "@/components/terms/term-subjects-editor";

export const metadata = { title: "Termini redaktə et" };

export default async function EditTermPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const term = await getTerm(user.id, slug);
  if (!term) notFound();

  const [categories, subjects] = await Promise.all([
    db.category.findMany({ where: { userId: user.id, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.subject.findMany({ where: { userId: user.id, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">{term.name} — redaktə</h1>

      <TermForm
        mode="edit"
        categories={categories}
        initial={{
          id: term.id,
          name: term.name,
          aliases: term.aliases.map((a) => a.value).join(", "),
          shortDef: term.shortDef ?? "",
          longDef: term.longDef ?? "",
          inMyWords: term.inMyWords ?? "",
          practicalUse: term.practicalUse ?? "",
          categoryId: term.categoryId ?? "",
          subcategory: term.subcategory ?? "",
          difficulty: term.difficulty,
          status: term.status,
          confidence: term.confidence,
          importance: term.importance,
          tags: term.tags.map((t) => t.name).join(", "),
        }}
      />

      <TermSubjectsEditor
        termId={term.id}
        allSubjects={subjects}
        selectedIds={term.subjects.map((s) => s.id)}
      />
    </div>
  );
}
