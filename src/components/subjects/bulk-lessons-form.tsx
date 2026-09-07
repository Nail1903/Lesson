"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { bulkCreateLessonsAction } from "@/server/actions/lessons";
import { cn } from "@/lib/utils";

export function BulkLessonsForm({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"count" | "names">("count");
  const [count, setCount] = React.useState("15");
  const [names, setNames] = React.useState("");
  const [module, setModule] = React.useState("");
  const [pending, start] = React.useTransition();

  function run() {
    start(async () => {
      const res = await bulkCreateLessonsAction({
        subjectId,
        mode,
        count: mode === "count" ? Number(count) : undefined,
        names: mode === "names" ? names : undefined,
        module: module || undefined,
      });
      if (res.ok) {
        toast.success(`${res.data.created} dərs qaralaması yaradıldı`);
        setOpen(false);
        setNames("");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><ListPlus className="h-4 w-4" /> Toplu dərs</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Toplu dərs yaratma</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["count", "names"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  mode === m ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                {m === "count" ? "Say ilə" : "Ad siyahısı"}
              </button>
            ))}
          </div>

          {mode === "count" ? (
            <label className="block text-sm">
              Neçə boş dərs qaralaması?
              <Input type="number" min={1} max={60} value={count} onChange={(e) => setCount(e.target.value)} className="mt-1" />
            </label>
          ) : (
            <label className="block text-sm">
              Hər sətirdə bir dərs adı
              <Textarea rows={6} value={names} onChange={(e) => setNames(e.target.value)} className="mt-1" placeholder={"Giriş\nƏsas anlayışlar\nTətbiq"} />
            </label>
          )}

          <label className="block text-sm">
            Modul (opsional)
            <Input value={module} onChange={(e) => setModule(e.target.value)} className="mt-1" />
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Bağla</Button>
          <Button onClick={run} disabled={pending}>{pending ? "Yaradılır…" : "Yarat"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
