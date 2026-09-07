"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QUESTION_TYPE_LABEL } from "@/lib/labels";
import { QUESTION_TYPES } from "@/lib/validations/question-bank";
import { upsertQuestionAction } from "@/server/actions/question-bank";

export interface QuestionDraft {
  id?: string;
  type: string;
  prompt: string;
  choices: string[];
  correctAnswer: string;
  explanation: string;
  criteria: string;
  difficulty: string;
  points: string;
  estimatedMinutes: string;
  topicId: string;
  termId: string;
  outcomeId: string;
}

const EMPTY: QuestionDraft = {
  type: "OPEN",
  prompt: "",
  choices: ["", "", "", ""],
  correctAnswer: "",
  explanation: "",
  criteria: "",
  difficulty: "medium",
  points: "1",
  estimatedMinutes: "",
  topicId: "",
  termId: "",
  outcomeId: "",
};

const SEL = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

export function QuestionEditor({
  initial,
  topics,
  terms,
  outcomes,
  onDone,
  onCancel,
}: {
  initial?: Partial<QuestionDraft>;
  topics: { id: string; name: string }[];
  terms: { id: string; name: string }[];
  outcomes: { id: string; label: string }[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [f, setF] = React.useState<QuestionDraft>({ ...EMPTY, ...initial, choices: initial?.choices?.length ? initial.choices : EMPTY.choices });
  const [pending, start] = React.useTransition();
  const set = <K extends keyof QuestionDraft>(k: K, v: QuestionDraft[K]) => setF((p) => ({ ...p, [k]: v }));
  const isChoice = f.type === "MCQ" || f.type === "TRUE_FALSE";

  function save() {
    if (!f.prompt.trim() || !f.correctAnswer.trim()) {
      toast.error("Sual mətni və düzgün cavab vacibdir");
      return;
    }
    start(async () => {
      const res = await upsertQuestionAction({
        ...(f.id ? { id: f.id } : {}),
        type: f.type,
        prompt: f.prompt,
        choices: isChoice
          ? (f.type === "TRUE_FALSE" ? ["Doğru", "Yanlış"] : f.choices.map((c) => c.trim()).filter(Boolean))
          : undefined,
        correctAnswer: f.correctAnswer,
        explanation: f.explanation,
        criteria: f.criteria,
        difficulty: f.difficulty as never,
        points: f.points ? Number(f.points) : null,
        estimatedMinutes: f.estimatedMinutes ? Number(f.estimatedMinutes) : null,
        topicId: f.topicId || null,
        termId: f.termId || null,
        outcomeId: f.outcomeId || null,
      });
      if (res.ok) {
        toast.success("Sual saxlanıldı");
        onDone();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="text-xs font-medium text-muted-foreground">
          Növ
          <select className={`${SEL} mt-1`} value={f.type} onChange={(e) => set("type", e.target.value)}>
            {QUESTION_TYPES.map((t) => <option key={t} value={t}>{QUESTION_TYPE_LABEL[t] ?? t}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Çətinlik
          <select className={`${SEL} mt-1`} value={f.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
            <option value="">—</option>
            <option value="easy">Asan</option>
            <option value="medium">Orta</option>
            <option value="hard">Çətin</option>
          </select>
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Bal
          <Input className="mt-1" type="number" value={f.points} onChange={(e) => set("points", e.target.value)} />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Təxmini dəq
          <Input className="mt-1" type="number" value={f.estimatedMinutes} onChange={(e) => set("estimatedMinutes", e.target.value)} />
        </label>
      </div>

      <div className="space-y-1.5">
        <Label>Sual mətni</Label>
        <Textarea value={f.prompt} onChange={(e) => set("prompt", e.target.value)} rows={2} />
      </div>

      {f.type === "MCQ" && (
        <div className="space-y-1.5">
          <Label>Seçimlər</Label>
          {f.choices.map((c, i) => (
            <Input
              key={i}
              value={c}
              placeholder={`Seçim ${i + 1}`}
              onChange={(e) => set("choices", f.choices.map((x, j) => (j === i ? e.target.value : x)))}
            />
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>{f.type === "MCQ" ? "Düzgün seçimin mətni" : f.type === "TRUE_FALSE" ? "Doğru / Yanlış" : "İstinad (düzgün) cavab"}</Label>
        <Textarea value={f.correctAnswer} onChange={(e) => set("correctAnswer", e.target.value)} rows={f.type === "OPEN" || f.type === "ESSAY" ? 3 : 1} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>İzah</Label>
          <Textarea value={f.explanation} onChange={(e) => set("explanation", e.target.value)} rows={2} />
        </div>
        <div className="space-y-1.5">
          <Label>Qiymətləndirmə meyarı</Label>
          <Textarea value={f.criteria} onChange={(e) => set("criteria", e.target.value)} rows={2} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-medium text-muted-foreground">
          Dərs
          <select className={`${SEL} mt-1`} value={f.topicId} onChange={(e) => set("topicId", e.target.value)}>
            <option value="">—</option>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Termin
          <select className={`${SEL} mt-1`} value={f.termId} onChange={(e) => set("termId", e.target.value)}>
            <option value="">—</option>
            {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Öyrənmə nəticəsi
          <select className={`${SEL} mt-1`} value={f.outcomeId} onChange={(e) => set("outcomeId", e.target.value)}>
            <option value="">—</option>
            {outcomes.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={pending}>{pending ? "Saxlanılır…" : "Saxla"}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Ləğv et</Button>
      </div>
    </div>
  );
}
