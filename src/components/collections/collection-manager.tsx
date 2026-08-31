"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCollectionAction, deleteCollectionAction } from "@/server/actions/misc";

export function CollectionManager({
  collections,
}: {
  collections: { id: string; name: string; slug: string; count: number }[];
}) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [pending, start] = React.useTransition();

  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          start(async () => {
            const res = await createCollectionAction(name);
            if (res.ok) {
              toast.success("Kolleksiya yaradıldı");
              setName("");
              router.refresh();
            } else toast.error(res.error);
          });
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Yeni kolleksiya adı…" />
        <Button type="submit" disabled={pending || !name.trim()}><Plus className="h-4 w-4" /></Button>
      </form>

      <div className="space-y-1">
        {collections.length === 0 && <p className="text-sm text-muted-foreground">Hələ kolleksiya yoxdur.</p>}
        {collections.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <Link href={`/terms?collection=${c.id}`} className="hover:text-primary">{c.name}</Link>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{c.count} termin</span>
              <button
                className="text-muted-foreground hover:text-destructive"
                onClick={() =>
                  start(async () => {
                    const res = await deleteCollectionAction(c.id);
                    if (res.ok) {
                      toast.success("Silindi");
                      router.refresh();
                    } else toast.error(res.error);
                  })
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
