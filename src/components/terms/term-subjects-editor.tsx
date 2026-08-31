"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { setTermSubjectsAction } from "@/server/actions/subjects";
import { cn } from "@/lib/utils";

export function TermSubjectsEditor({
  termId,
  allSubjects,
  selectedIds,
}: {
  termId: string;
  allSubjects: { id: string; name: string }[];
  selectedIds: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set(selectedIds));
  const [pending, start] = React.useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function save() {
    start(async () => {
      const res = await setTermSubjectsAction({ termId, subjectIds: [...selected] });
      if (res.ok) {
        toast.success("Fənn təyinatları saxlanıldı");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fənnlər</CardTitle>
        <p className="text-sm text-muted-foreground">
          Bir termin bir neçə fənndə görünə bilər, lakin həmişə eyni izah səhifəsinə yönəlir.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {allSubjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hələ fənn yoxdur. “Fənnlər və mövzular” bölməsində yaradın.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allSubjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  selected.has(s.id)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "Saxlanılır…" : "Fənnləri saxla"}
        </Button>
      </CardContent>
    </Card>
  );
}
