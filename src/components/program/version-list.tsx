"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, FileCheck2, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import {
  createVersionAction,
  publishVersionAction,
  deleteVersionAction,
} from "@/server/actions/course-version";

interface V {
  id: string;
  label: string;
  kind: string;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
  sections: number;
  offerings: number;
}

export function VersionList({
  subjectId,
  subjectSlug,
  versions,
  activeId,
}: {
  subjectId: string;
  subjectSlug: string;
  versions: V[];
  activeId: string | null;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState("");
  const [kind, setKind] = React.useState<"program" | "syllabus">("program");
  const [fromId, setFromId] = React.useState("");

  function create() {
    if (!label.trim()) return;
    start(async () => {
      const res = await createVersionAction({ subjectId, label, kind, fromVersionId: fromId || undefined });
      if (res.ok) {
        toast.success("Versiya yaradıldı");
        setOpen(false);
        setLabel("");
        router.push(`/subjects/${subjectSlug}/program?v=${res.data.id}`);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Versiyalar</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="h-4 w-4" /> Yeni</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yeni proqram / sillabus versiyası</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <label className="block text-sm">
                Ad
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="məs. 2025 Payız v1" className="mt-1" />
              </label>
              <div className="flex gap-2">
                {(["program", "syllabus"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setKind(k)}
                    className={cn("rounded-full border px-3 py-1 text-xs", kind === k && "border-primary bg-primary text-primary-foreground")}
                  >
                    {k === "program" ? "Fənn proqramı" : "Sillabus"}
                  </button>
                ))}
              </div>
              <label className="block text-sm">
                Mövcud versiyadan yarat (opsional)
                <select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={fromId} onChange={(e) => setFromId(e.target.value)}>
                  <option value="">— boş skelet —</option>
                  {versions.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
              </label>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Bağla</Button>
              <Button onClick={create} disabled={pending}>Yarat</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {versions.length === 0 && <p className="text-sm text-muted-foreground">Hələ versiya yoxdur.</p>}
      {versions.map((v) => (
        <div
          key={v.id}
          className={cn(
            "rounded-lg border p-2.5 text-sm",
            v.id === activeId ? "border-primary bg-accent/30" : "",
          )}
        >
          <div className="flex items-center justify-between">
            <Link href={`/subjects/${subjectSlug}/program?v=${v.id}`} className="font-medium hover:text-primary">
              {v.label}
            </Link>
            <Badge variant={v.status === "published" ? "success" : "secondary"}>
              {v.status === "published" ? "Dərc edilib" : "Qaralama"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {v.kind === "program" ? "Fənn proqramı" : "Sillabus"} · {v.sections} bölmə · {v.offerings} tədris planı
            {v.publishedAt ? ` · ${formatDate(v.publishedAt)}` : ""}
          </p>
          <div className="mt-1.5 flex gap-1">
            {v.status !== "published" && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await publishVersionAction(v.id);
                    if (res.ok) {
                      toast.success("Dərc edildi");
                      router.refresh();
                    } else toast.error(res.error);
                  })
                }
              >
                <FileCheck2 className="h-3.5 w-3.5" /> Dərc et
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() =>
                start(async () => {
                  const res = await createVersionAction({ subjectId, label: `${v.label} (nüsxə)`, kind: v.kind as "program", fromVersionId: v.id });
                  if (res.ok) {
                    toast.success("Nüsxə yaradıldı");
                    router.push(`/subjects/${subjectSlug}/program?v=${res.data.id}`);
                    router.refresh();
                  } else toast.error(res.error);
                })
              }
            >
              <Copy className="h-3.5 w-3.5" /> Nüsxə
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-destructive"
              onClick={() =>
                start(async () => {
                  if (!confirm(`"${v.label}" silinsin?`)) return;
                  const res = await deleteVersionAction(v.id);
                  if (res.ok) {
                    toast.success("Silindi");
                    router.push(`/subjects/${subjectSlug}/program`);
                    router.refresh();
                  } else toast.error(res.error);
                })
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
