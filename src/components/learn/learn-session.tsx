"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Check, RotateCcw, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { reviewGradeAction } from "@/server/actions/review";
import type { LearnCard } from "@/server/services/learn-service";

const REASON_LABEL: Record<string, string> = {
  due: "Təkrar vaxtı çatıb",
  new: "Yeni termin",
  weak: "Zəif bildiyin termin",
};

/** 3 seçim — sadə. SM-2 arxada işləyir. */
const GRADES = [
  { key: "FORGOT", label: "Yenidən", hint: "bilmədim", icon: RotateCcw, cls: "bg-rose-600 hover:bg-rose-600/90 text-white" },
  { key: "HARD", label: "Çətin", hint: "güclə xatırladım", icon: Sparkles, cls: "bg-amber-500 hover:bg-amber-500/90 text-white" },
  { key: "GOOD", label: "Bildim", hint: "rahat", icon: Check, cls: "bg-emerald-600 hover:bg-emerald-600/90 text-white" },
] as const;

export function LearnSession({ cards }: { cards: LearnCard[] }) {
  const router = useRouter();
  const [deck] = React.useState(cards);
  const [idx, setIdx] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [pending, start] = React.useTransition();
  const [tally, setTally] = React.useState({ FORGOT: 0, HARD: 0, GOOD: 0 });
  const [finished, setFinished] = React.useState(false);

  const card = deck[idx];

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!card || pending) return;
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && ["1", "2", "3"].includes(e.key)) {
        grade(GRADES[Number(e.key) - 1]!.key);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, revealed, pending]);

  function grade(key: (typeof GRADES)[number]["key"]) {
    if (!card || pending) return;
    start(async () => {
      const res = await reviewGradeAction({ termId: card.id, grade: key, source: "flashcard" });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setTally((t) => ({ ...t, [key]: t[key] + 1 }));
      setRevealed(false);
      if (idx + 1 < deck.length) setIdx((i) => i + 1);
      else setFinished(true);
    });
  }

  if (finished || !card) {
    const done = tally.FORGOT + tally.HARD + tally.GOOD;
    return (
      <Card>
        <CardContent className="space-y-4 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
            <Check className="h-7 w-7 text-emerald-600" />
          </div>
          <div>
            <p className="text-lg font-semibold">Seans bitdi 🎉</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {done} termin təkrarlandı — {tally.GOOD} rahat · {tally.HARD} çətin · {tally.FORGOT} bilmədin
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => router.refresh()}>Davam et</Button>
            <Button variant="outline" asChild>
              <Link href="/quizzes">Özünü test et</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/dashboard">İdarə panelinə qayıt</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{idx + 1} / {deck.length}</span>
        <span className="rounded-full bg-muted px-2 py-0.5">{REASON_LABEL[card.reason]}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${(idx / deck.length) * 100}%` }} />
      </div>

      <Card key={card.id} className="min-h-[320px]">
        <CardContent className="flex min-h-[320px] flex-col p-6">
          <div className="text-center">
            {card.categoryName && (
              <span
                className="inline-block rounded-md px-2 py-0.5 text-[11px]"
                style={{
                  background: `${card.categoryColor ?? "#6d28d9"}20`,
                  color: card.categoryColor ?? "#6d28d9",
                }}
              >
                {card.categoryName}
              </span>
            )}
            <h2 className="mt-2 text-2xl font-bold">{card.name}</h2>
          </div>

          {!revealed ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <p className="text-sm text-muted-foreground">Bu termin nə deməkdir? Yadına sal, sonra yoxla.</p>
              <Button size="lg" onClick={() => setRevealed(true)}>
                Cavabı göstər <span className="ml-1 text-xs opacity-70">(Boşluq)</span>
              </Button>
            </div>
          ) : (
            <div className="mt-4 flex-1 space-y-3 border-t pt-4">
              {card.shortDef && <p className="text-[15px] leading-relaxed">{card.shortDef}</p>}
              {card.inMyWords && (
                <div className="rounded-lg bg-accent/40 p-3">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-primary">Öz sözlərinlə</p>
                  <Markdown>{card.inMyWords}</Markdown>
                </div>
              )}
              {card.example && (
                <div className="rounded-lg border p-3">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Nümunə</p>
                  <Markdown>{card.example}</Markdown>
                </div>
              )}
              <Link href={`/terms/${card.slug}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-primary underline">
                Tam səhifə <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {revealed ? (
        <div>
          <p className="mb-2 text-center text-xs text-muted-foreground">Nə qədər yaxşı bilirdin?</p>
          <div className="grid grid-cols-3 gap-2">
            {GRADES.map((g, i) => (
              <button
                key={g.key}
                disabled={pending}
                onClick={() => grade(g.key)}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-sm font-medium transition-opacity disabled:opacity-50 ${g.cls}`}
              >
                <g.icon className="h-4 w-4" />
                {g.label}
                <span className="text-[10px] font-normal opacity-80">{g.hint} · {i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Klaviatura: Boşluq — göstər · 1/2/3 — qiymətləndir
        </p>
      )}
    </div>
  );
}
