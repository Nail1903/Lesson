"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { reviewGradeAction } from "@/server/actions/review";
import { formatDate } from "@/lib/utils";

interface Cardio {
  id: string;
  name: string;
  slug: string;
  shortDef: string | null;
  longDef: string | null;
  inMyWords: string | null;
  example: string | null;
  categoryName: string | null;
}

const GRADES = [
  { key: "FORGOT", label: "Xatırlamadım", cls: "bg-destructive text-destructive-foreground" },
  { key: "HARD", label: "Çətin idi", cls: "bg-amber-500 text-white" },
  { key: "GOOD", label: "Normal idi", cls: "bg-primary text-primary-foreground" },
  { key: "EASY", label: "Asan idi", cls: "bg-emerald-600 text-white" },
] as const;

export function ReviewSession({ cards }: { cards: Cardio[] }) {
  const router = useRouter();
  const [idx, setIdx] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [done, setDone] = React.useState(0);
  const [pending, start] = React.useTransition();

  const card = cards[idx];

  function grade(key: (typeof GRADES)[number]["key"]) {
    if (!card) return;
    start(async () => {
      const res = await reviewGradeAction({ termId: card.id, grade: key, source: "flashcard" });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Növbəti təkrar: ${formatDate(res.data.dueAt)}${res.data.mastered ? " · tam öyrənildi 🎉" : ""}`);
      setDone((d) => d + 1);
      setRevealed(false);
      if (idx + 1 < cards.length) setIdx((i) => i + 1);
      else {
        toast.success("Bütün kartlar bitdi!");
        router.refresh();
      }
    });
  }

  if (!card) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="font-medium">Sessiya tamamlandı — {done} kart təkrar edildi.</p>
          <Button className="mt-4" onClick={() => router.refresh()}>Yenilə</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{idx + 1} / {cards.length}</span>
        <span>{done} tamamlandı</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${(idx / cards.length) * 100}%` }} />
      </div>

      <Card className="min-h-[280px]">
        <CardContent className="space-y-4 p-6">
          <div className="text-center">
            {card.categoryName && <p className="text-xs text-muted-foreground">{card.categoryName}</p>}
            <h2 className="mt-1 text-2xl font-bold">{card.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Bu termini öz sözlərinlə izah et.</p>
          </div>

          {!revealed ? (
            <div className="flex justify-center pt-6">
              <Button size="lg" onClick={() => setRevealed(true)}>Cavabı göstər</Button>
            </div>
          ) : (
            <div className="space-y-3 border-t pt-4">
              {card.shortDef && <p className="text-sm">{card.shortDef}</p>}
              {card.inMyWords && (
                <div className="rounded-lg bg-accent/40 p-3">
                  <p className="mb-1 text-xs font-medium text-primary">Öz sözlərinlə (qeyd):</p>
                  <Markdown>{card.inMyWords}</Markdown>
                </div>
              )}
              {card.example && (
                <div className="rounded-lg border p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Nümunə:</p>
                  <Markdown>{card.example}</Markdown>
                </div>
              )}
              <Link href={`/terms/${card.slug}`} className="text-xs text-primary underline">
                Tam termin səhifəsi →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {revealed && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GRADES.map((g) => (
            <button
              key={g.key}
              disabled={pending}
              onClick={() => grade(g.key)}
              className={`rounded-lg px-3 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 ${g.cls}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
