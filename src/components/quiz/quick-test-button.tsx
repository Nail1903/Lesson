"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateQuizAction } from "@/server/actions/quiz";

/** Konfiqurasiyasız 10 suallıq test — vaxtı çatmış / zəif terminlərdən. */
export function QuickTestButton() {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  function run() {
    start(async () => {
      // əvvəl vaxtı çatmışlardan, olmasa təsadüfi
      let res = await generateQuizAction({
        source: "DUE",
        size: 10,
        types: ["OPEN", "MCQ", "TRUE_FALSE"],
      });
      if (!res.ok) {
        res = await generateQuizAction({
          source: "RANDOM",
          size: 10,
          types: ["OPEN", "MCQ", "TRUE_FALSE"],
        });
      }
      if (res.ok) router.push(`/quizzes/${res.data.quizId}`);
      else toast.error(res.error);
    });
  }

  return (
    <Button size="lg" onClick={run} disabled={pending}>
      <Zap className="h-4 w-4" /> {pending ? "Hazırlanır…" : "Sürətli test — 10 sual"}
    </Button>
  );
}
