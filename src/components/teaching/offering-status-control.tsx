"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setOfferingStatusAction } from "@/server/actions/schedule";
import { cn } from "@/lib/utils";

const OPTS = [
  { v: "draft", l: "Qaralama" },
  { v: "active", l: "Aktiv" },
  { v: "archived", l: "Arxiv" },
];

export function OfferingStatusControl({ offeringId, status }: { offeringId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  return (
    <div className="inline-flex overflow-hidden rounded-md border text-xs">
      {OPTS.map((o) => (
        <button
          key={o.v}
          disabled={pending || o.v === status}
          onClick={() =>
            start(async () => {
              const res = await setOfferingStatusAction(offeringId, o.v);
              if (res.ok) {
                toast.success(`Status: ${o.l}`);
                router.refresh();
              } else toast.error(res.error);
            })
          }
          className={cn(
            "px-2.5 py-1 transition-colors disabled:cursor-default",
            o.v === status ? "bg-primary text-primary-foreground" : "hover:bg-muted",
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
