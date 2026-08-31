"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { restoreTermAction, purgeTermAction } from "@/server/actions/terms";
import { restoreSubjectAction, purgeSubjectAction } from "@/server/actions/subjects";

export function TrashRow({
  id,
  name,
  type,
  deletedAt,
}: {
  id: string;
  name: string;
  type: "term" | "subject";
  deletedAt: string;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  const restore = type === "term" ? restoreTermAction : restoreSubjectAction;
  const purge = type === "term" ? purgeTermAction : purgeSubjectAction;

  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
      <div>
        <span className="font-medium">{name}</span>
        <span className="ml-2 text-xs text-muted-foreground">
          {type === "term" ? "termin" : "fənn"} · silinib {deletedAt}
        </span>
      </div>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await restore(id);
              if (res.ok) {
                toast.success("Bərpa edildi");
                router.refresh();
              } else toast.error(res.error);
            })
          }
        >
          <RotateCcw className="h-3.5 w-3.5" /> Bərpa et
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive"
          disabled={pending}
          onClick={() =>
            start(async () => {
              if (!confirm(`"${name}" birdəfəlik silinsin?`)) return;
              const res = await purge(id);
              if (res.ok) {
                toast.success("Birdəfəlik silindi");
                router.refresh();
              } else toast.error(res.error);
            })
          }
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
