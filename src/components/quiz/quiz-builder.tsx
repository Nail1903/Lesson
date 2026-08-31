"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QUESTION_TYPE_LABEL } from "@/lib/labels";
import { generateQuizAction } from "@/server/actions/quiz";
import { cn } from "@/lib/utils";

const SOURCES = [
  { key: "RANDOM", label: "Təsadüfi terminlər" },
  { key: "THIS_WEEK", label: "Bu həftə əlavə olunanlar" },
  { key: "WEAK", label: "Zəif öyrənilən terminlər" },
  { key: "DUE", label: "Təkrar vaxtı çatmışlar" },
  { key: "CATEGORY", label: "Seçilmiş kateqoriyadan" },
  { key: "TERMS", label: "Seçilmiş terminlərdən" },
] as const;

const TYPES = ["OPEN", "MCQ", "TRUE_FALSE", "FILL_BLANK", "IDENTIFY_TERM"] as const;

export function QuizBuilder({
  categories,
  terms,
  preselectTermId,
  preselectCategoryId,
}: {
  categories: { id: string; name: string }[];
  terms: { id: string; name: string }[];
  preselectTermId?: string;
  preselectCategoryId?: string;
}) {
  const router = useRouter();
  const [source, setSource] = React.useState<(typeof SOURCES)[number]["key"]>(
    preselectTermId ? "TERMS" : preselectCategoryId ? "CATEGORY" : "RANDOM",
  );
  const [size, setSize] = React.useState(8);
  const [types, setTypes] = React.useState<string[]>(["OPEN", "MCQ", "TRUE_FALSE"]);
  const [categoryIds, setCategoryIds] = React.useState<string[]>(preselectCategoryId ? [preselectCategoryId] : []);
  const [termIds, setTermIds] = React.useState<string[]>(preselectTermId ? [preselectTermId] : []);
  const [pending, start] = React.useTransition();

  function toggle<T>(list: T[], v: T, set: (x: T[]) => void) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  function generate() {
    if (types.length === 0) {
      toast.error("Ən azı bir sual növü seçin");
      return;
    }
    start(async () => {
      const res = await generateQuizAction({ source, size, types, categoryIds, termIds });
      if (res.ok) {
        router.push(`/quizzes/${res.data.quizId}`);
      } else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Yeni test hazırla</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-medium">Mənbə</p>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <button
                key={s.key}
                onClick={() => setSource(s.key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  source === s.key ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {source === "CATEGORY" && (
          <MultiSelect items={categories} selected={categoryIds} onToggle={(id) => toggle(categoryIds, id, setCategoryIds)} />
        )}
        {source === "TERMS" && (
          <MultiSelect items={terms} selected={termIds} onToggle={(id) => toggle(termIds, id, setTermIds)} />
        )}

        <div>
          <p className="mb-1.5 text-sm font-medium">Sual növləri</p>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => toggle(types, t, setTypes)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  types.includes(t) ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                {QUESTION_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        <label className="block text-sm">
          Sual sayı: <b>{size}</b>
          <input type="range" min={3} max={20} value={size} onChange={(e) => setSize(Number(e.target.value))} className="mt-1 w-full accent-primary" />
        </label>

        <Button onClick={generate} disabled={pending}>
          <Sparkles className="h-4 w-4" /> {pending ? "Hazırlanır…" : "Test yarat"}
        </Button>
      </CardContent>
    </Card>
  );
}

function MultiSelect({
  items,
  selected,
  onToggle,
}: {
  items: { id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2">
      {items.map((it) => (
        <label key={it.id} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={selected.includes(it.id)} onChange={() => onToggle(it.id)} className="accent-primary" />
          {it.name}
        </label>
      ))}
    </div>
  );
}
