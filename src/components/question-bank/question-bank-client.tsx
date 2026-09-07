"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, FileStack, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QUESTION_TYPE_LABEL, DIFFICULTY3_LABEL } from "@/lib/labels";
import { QUESTION_TYPES } from "@/lib/validations/question-bank";
import { QuestionEditor } from "@/components/question-bank/question-editor";
import { deleteQuestionAction, generateExamAction } from "@/server/actions/question-bank";

interface Q {
  id: string;
  type: string;
  prompt: string;
  correctAnswer: string;
  difficulty: string | null;
  points: number | null;
  term: { name: string } | null;
  topic: { name: string } | null;
  outcome: { code: string | null; text: string } | null;
}

const SEL = "h-9 rounded-md border border-input bg-background px-2 text-sm";

export function QuestionBankClient({
  subjects,
  topics,
  terms,
  outcomes,
  questions,
  filters,
  diffCounts,
}: {
  subjects: { id: string; name: string }[];
  topics: { id: string; name: string; subjectId: string }[];
  terms: { id: string; name: string }[];
  outcomes: { id: string; label: string; subjectId: string | null }[];
  questions: Q[];
  filters: { subjectId?: string; topicId?: string; type?: string; difficulty?: string; q?: string };
  diffCounts: { easy: number; medium: number; hard: number; none: number } | null;
}) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  const subjectTopics = filters.subjectId ? topics.filter((t) => t.subjectId === filters.subjectId) : topics;
  const subjectOutcomes = filters.subjectId ? outcomes.filter((o) => o.subjectId === filters.subjectId) : outcomes;

  const setParam = (k: string, v: string) => {
    const sp = new URLSearchParams(window.location.search);
    if (v) sp.set(k, v);
    else sp.delete(k);
    if (k === "subject") sp.delete("topic");
    router.push(`/question-bank?${sp.toString()}`);
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select className={SEL} value={filters.subjectId ?? ""} onChange={(e) => setParam("subject", e.target.value)}>
          <option value="">Bütün fənlər</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className={SEL} value={filters.topicId ?? ""} onChange={(e) => setParam("topic", e.target.value)} disabled={!filters.subjectId}>
          <option value="">Bütün dərslər</option>
          {subjectTopics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className={SEL} value={filters.type ?? ""} onChange={(e) => setParam("type", e.target.value)}>
          <option value="">Bütün növlər</option>
          {QUESTION_TYPES.map((t) => <option key={t} value={t}>{QUESTION_TYPE_LABEL[t] ?? t}</option>)}
        </select>
        <select className={SEL} value={filters.difficulty ?? ""} onChange={(e) => setParam("difficulty", e.target.value)}>
          <option value="">Bütün çətinliklər</option>
          <option value="easy">Asan</option>
          <option value="medium">Orta</option>
          <option value="hard">Çətin</option>
        </select>
        <form
          className="flex gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            const v = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
            setParam("q", v);
          }}
        >
          <Input name="q" defaultValue={filters.q ?? ""} placeholder="Sual mətnində axtar" className="w-56" />
        </form>
        <Button size="sm" className="ml-auto" onClick={() => { setAdding(true); setEditId(null); }}>
          <Plus className="h-4 w-4" /> Yeni sual
        </Button>
      </div>

      {/* Exam generator */}
      {filters.subjectId && diffCounts && (
        <ExamPanel
          subjectId={filters.subjectId}
          topicId={filters.topicId}
          counts={diffCounts}
        />
      )}

      {adding && (
        <QuestionEditor
          topics={subjectTopics}
          terms={terms}
          outcomes={subjectOutcomes.map((o) => ({ id: o.id, label: o.label }))}
          initial={filters.topicId ? { topicId: filters.topicId } : undefined}
          onDone={() => { setAdding(false); router.refresh(); }}
          onCancel={() => setAdding(false)}
        />
      )}

      {/* List */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">{questions.length} sual</p>
        {questions.length === 0 && !adding && (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            Sual yoxdur. “Yeni sual” ilə əlavə et və ya dərs materialı idxalında gətir.
          </p>
        )}
        {questions.map((q) =>
          editId === q.id ? (
            <QuestionEditor
              key={q.id}
              topics={subjectTopics}
              terms={terms}
              outcomes={subjectOutcomes.map((o) => ({ id: o.id, label: o.label }))}
              initial={{ id: q.id, type: q.type, prompt: q.prompt, correctAnswer: q.correctAnswer, difficulty: q.difficulty ?? "", points: q.points?.toString() ?? "" }}
              onDone={() => { setEditId(null); router.refresh(); }}
              onCancel={() => setEditId(null)}
            />
          ) : (
            <div key={q.id} className="rounded-lg border p-3">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline">{QUESTION_TYPE_LABEL[q.type] ?? q.type}</Badge>
                {q.difficulty && <Badge variant="secondary">{DIFFICULTY3_LABEL[q.difficulty] ?? q.difficulty}</Badge>}
                {q.points != null && <span className="text-xs text-muted-foreground">{q.points} bal</span>}
                {q.topic && <span className="text-xs text-muted-foreground">· {q.topic.name}</span>}
                {q.term && <span className="text-xs text-muted-foreground">· {q.term.name}</span>}
                {q.outcome && <span className="text-xs text-primary">· nəticə {q.outcome.code || "✓"}</span>}
                <div className="ml-auto flex gap-1">
                  <button className="text-muted-foreground hover:text-foreground" onClick={() => { setEditId(q.id); setAdding(false); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      start(async () => {
                        const res = await deleteQuestionAction(q.id);
                        if (res.ok) { toast.success("Silindi"); router.refresh(); } else toast.error(res.error);
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm">{q.prompt}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Cavab: {q.correctAnswer.slice(0, 160)}</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function ExamPanel({
  subjectId,
  topicId,
  counts,
}: {
  subjectId: string;
  topicId?: string;
  counts: { easy: number; medium: number; hard: number; none: number };
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("Yoxlama işi");
  const [easy, setEasy] = React.useState(2);
  const [medium, setMedium] = React.useState(2);
  const [hard, setHard] = React.useState(1);
  const [pending, start] = React.useTransition();

  function gen() {
    start(async () => {
      const res = await generateExamAction({
        subjectId,
        title,
        topicIds: topicId ? [topicId] : undefined,
        easy,
        medium,
        hard,
      });
      if (res.ok) router.push(`/exams/${res.data.quizId}`);
      else toast.error(res.error);
    });
  }

  return (
    <Card className="border-primary/40 bg-accent/20">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileStack className="h-4 w-4" /> İmtahan bileti / yoxlama işi
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Bankda: {counts.easy} asan · {counts.medium} orta · {counts.hard} çətin
            {counts.none > 0 && ` · ${counts.none} çətinliksiz`}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
          {open ? "Bağla" : "Yarat"}
        </Button>
      </CardHeader>
      {open && (
        <CardContent className="space-y-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Başlıq" />
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["Asan", easy, setEasy, counts.easy],
                ["Orta", medium, setMedium, counts.medium],
                ["Çətin", hard, setHard, counts.hard],
              ] as const
            ).map(([label, val, setter, max]) => (
              <label key={label} className="text-xs font-medium text-muted-foreground">
                {label} (maks {max})
                <Input className="mt-1" type="number" min={0} max={max} value={val} onChange={(e) => setter(Number(e.target.value))} />
              </label>
            ))}
          </div>
          <Button size="sm" onClick={gen} disabled={pending || easy + medium + hard === 0}>
            <Sparkles className="h-3.5 w-3.5" /> {pending ? "Yaradılır…" : "Bilet yarat"}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
