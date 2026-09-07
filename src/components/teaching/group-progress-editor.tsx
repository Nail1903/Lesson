"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveGroupProgressAction } from "@/server/actions/teaching";

export function GroupProgressEditor({
  offeringId,
  groupId,
  lessons,
  initial,
}: {
  offeringId: string;
  groupId: string;
  lessons: { id: string; name: string }[];
  initial: { lastLessonId: string | null; note: string; nextStep: string };
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [lastLessonId, setLastLessonId] = React.useState(initial.lastLessonId ?? "");
  const [note, setNote] = React.useState(initial.note);
  const [nextStep, setNextStep] = React.useState(initial.nextStep);

  function save() {
    start(async () => {
      const res = await saveGroupProgressAction({ offeringId, groupId, lastLessonId: lastLessonId || null, note, nextStep });
      if (res.ok) {
        toast.success("Qrup irəliləyişi saxlanıldı");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-muted-foreground">
        Son keçilən mövzu
        <select
          className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
          value={lastLessonId}
          onChange={(e) => setLastLessonId(e.target.value)}
        >
          <option value="">— seçilməyib —</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-medium text-muted-foreground">
        Harada qaldım? / qrup qeydi
        <Textarea className="mt-1" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <label className="block text-xs font-medium text-muted-foreground">
        Növbəti addım
        <Textarea className="mt-1" rows={2} value={nextStep} onChange={(e) => setNextStep(e.target.value)} />
      </label>
      <Button size="sm" onClick={save} disabled={pending}>
        <Save className="h-3.5 w-3.5" /> {pending ? "Saxlanılır…" : "Saxla"}
      </Button>
    </div>
  );
}
