"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { importLessonAction } from "@/server/actions/data";

export function LessonImportPanel() {
  const router = useRouter();
  const [raw, setRaw] = React.useState("");
  const [pending, start] = React.useTransition();
  const [summary, setSummary] = React.useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) file.text().then(setRaw);
  }

  function run() {
    if (!raw.trim()) return;
    setSummary(null);
    start(async () => {
      const res = await importLessonAction({ raw });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const d = res.data;
      const parts = [
        `${d.termsCreated} yeni termin`,
        d.termsSkipped ? `${d.termsSkipped} mövcud` : null,
        d.topic ? `“${d.topic}” mövzusuna ${d.termsLinked} bağlantı` : null,
        d.questionsCreated ? `${d.questionsCreated} sual` : null,
        d.flashcardsCreated ? `${d.flashcardsCreated} flashcard` : null,
      ].filter(Boolean);
      setSummary(parts.join(" · "));
      toast.success("Dərs materialı idxal edildi");
      setRaw("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input type="file" accept=".json" onChange={onFile} className="text-sm" />
      </div>
      <Textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={8}
        placeholder='{"subject":"…","topic":"…","terms":[…],"questions":[…],"flashcards":[…]}'
        className="font-mono text-xs"
      />
      <Button onClick={run} disabled={pending || !raw.trim()}>
        <BookOpen className="h-4 w-4" /> {pending ? "İdxal edilir…" : "Dərsi idxal et"}
      </Button>
      {summary && <p className="text-sm text-emerald-600">✓ {summary}</p>}

      <details className="rounded-lg border bg-muted/30 p-3 text-xs">
        <summary className="cursor-pointer select-none font-medium">Format (JSON)</summary>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{`{
  "subject": "Machine Learning Fundamentals",   // opsional — yoxdursa yaradılır
  "subjectColor": "#7c3aed",                     // opsional
  "topic": "Nəzarətli öyrənmə (səh. 2-6)",       // opsional — subject tələb edir
  "topicDescription": "…",                        // opsional
  "terms": [                                      // MƏCBURİ
    {
      "name": "Supervised Learning",             // ingiliscə kanonik ad
      "aliases": ["Nəzarətli öyrənmə"],
      "shortDef": "Sadə izah…",
      "longDef": "Akademik izah…\\n\\n**Nümunə:** …\\n\\n_Mənbə: …, səh. 2-6._",
      "category": "Machine Learning",
      "tags": ["kitab-fəsil-1"],
      "difficulty": "BEGINNER",                  // BEGINNER|INTERMEDIATE|ADVANCED
      "importance": 5                            // 1-5
    }
  ],
  "questions": [                                  // opsional — sual bankına
    { "term": "Classification", "type": "MCQ",
      "prompt": "…", "choices": ["A","B","C","D"],
      "correctAnswer": "B", "explanation": "…" },
    { "term": "Regression analysis", "type": "OPEN",
      "prompt": "…", "correctAnswer": "…" }
  ],
  "flashcards": [                                 // opsional
    { "term": "Decision boundary", "front": "…", "back": "…" }
  ]
}

// type: OPEN | MCQ | TRUE_FALSE | FILL_BLANK | IDENTIFY_TERM
// LaTeX-də hər \\ işarəsini JSON-da \\\\ kimi yaz.
// Mövcud (eyni adlı) terminlər təkrar yaranmır, sadəcə mövzuya bağlanır.`}</pre>
      </details>
    </div>
  );
}
