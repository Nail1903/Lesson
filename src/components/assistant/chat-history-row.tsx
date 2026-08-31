"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { relativeTime, truncate } from "@/lib/utils";
import { renameChatAction, deleteChatAction } from "@/server/actions/assistant";

export function ChatHistoryRow({
  id,
  title,
  preview,
  count,
  updatedAt,
}: {
  id: string;
  title: string;
  preview: string;
  count: number;
  updatedAt: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(title);
  const [pending, start] = React.useTransition();

  return (
    <div className="flex items-start justify-between gap-3 rounded-md border px-3 py-2.5">
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              className="h-8 flex-1 rounded border border-input bg-background px-2 text-sm"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
            <button
              onClick={() =>
                start(async () => {
                  await renameChatAction(id, value);
                  setEditing(false);
                  router.refresh();
                })
              }
            >
              <Check className="h-4 w-4 text-emerald-600" />
            </button>
            <button onClick={() => { setEditing(false); setValue(title); }}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <Link href={`/assistant?chat=${id}`} className="font-medium hover:text-primary">
            {title}
          </Link>
        )}
        <p className="truncate text-xs text-muted-foreground">{truncate(preview, 120)}</p>
        <p className="text-[11px] text-muted-foreground">{count} mesaj · {relativeTime(updatedAt)}</p>
      </div>
      {!editing && (
        <div className="flex shrink-0 gap-1">
          <button className="text-muted-foreground hover:text-foreground" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            className="text-muted-foreground hover:text-destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await deleteChatAction(id);
                if (res.ok) {
                  toast.success("Söhbət silindi");
                  router.refresh();
                }
              })
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
