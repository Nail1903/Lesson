"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { upsertSubjectAction, deleteSubjectAction } from "@/server/actions/subjects";

export interface SubjectDialogData {
  id: string;
  name: string;
  description: string;
  color: string;
  code?: string | null;
  faculty?: string | null;
  department?: string | null;
  specialty?: string | null;
  level?: string | null;
  courseYear?: number | null;
  objective?: string | null;
  prerequisites?: string | null;
  relatedCourses?: string | null;
  contentLanguage?: string | null;
}

const SEL = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";
const LEVELS = ["", "Bakalavr", "Magistr", "Doktorantura"];

export function SubjectDialog({
  mode,
  subject,
}: {
  mode: "create" | "edit";
  subject?: SubjectDialogData;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, start] = React.useTransition();
  const [showMore, setShowMore] = React.useState(false);

  const [f, setF] = React.useState({
    name: subject?.name ?? "",
    description: subject?.description ?? "",
    color: subject?.color || "#6d28d9",
    code: subject?.code ?? "",
    faculty: subject?.faculty ?? "",
    department: subject?.department ?? "",
    specialty: subject?.specialty ?? "",
    level: subject?.level ?? "",
    courseYear: subject?.courseYear?.toString() ?? "",
    objective: subject?.objective ?? "",
    prerequisites: subject?.prerequisites ?? "",
    relatedCourses: subject?.relatedCourses ?? "",
    contentLanguage: subject?.contentLanguage ?? "az",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  function save() {
    start(async () => {
      const res = await upsertSubjectAction({
        ...(subject ? { id: subject.id } : {}),
        name: f.name,
        description: f.description,
        color: f.color,
        code: f.code,
        faculty: f.faculty,
        department: f.department,
        specialty: f.specialty,
        level: f.level as never,
        courseYear: f.courseYear ? Number(f.courseYear) : null,
        objective: f.objective,
        prerequisites: f.prerequisites,
        relatedCourses: f.relatedCourses,
        contentLanguage: f.contentLanguage as never,
      });
      if (res.ok) {
        toast.success(mode === "create" ? "Fənn yaradıldı" : "Yeniləndi");
        setOpen(false);
        if (mode === "create") setF((p) => ({ ...p, name: "" }));
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button size="sm"><Plus className="h-4 w-4" /> Yeni fənn</Button>
        ) : (
          <Button size="icon" variant="ghost"><Pencil className="h-3.5 w-3.5" /></Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Yeni fənn" : "Fənni redaktə et"}</DialogTitle>
          <p className="text-xs text-muted-foreground">Yalnız ad kifayətdir — qalanını sonra doldura bilərsiniz.</p>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">Ad *</Label>
              <Input id="s-name" value={f.name} onChange={(e) => set("name", e.target.value)} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-code">Kod</Label>
              <Input id="s-code" value={f.code} onChange={(e) => set("code", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="s-desc">Qısa təsvir</Label>
            <Textarea id="s-desc" value={f.description} onChange={(e) => set("description", e.target.value)} rows={2} />
          </div>

          <button
            type="button"
            onClick={() => setShowMore((s) => !s)}
            className="text-xs font-medium text-primary"
          >
            {showMore ? "− Az göstər" : "+ Kafedra, ixtisas, pillə, məqsəd…"}
          </button>

          {showMore && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Fakültə</Label>
                  <Input value={f.faculty} onChange={(e) => set("faculty", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Kafedra</Label>
                  <Input value={f.department} onChange={(e) => set("department", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>İxtisas</Label>
                  <Input value={f.specialty} onChange={(e) => set("specialty", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Təhsil pilləsi</Label>
                  <select className={SEL} value={f.level} onChange={(e) => set("level", e.target.value)}>
                    {LEVELS.map((l) => <option key={l} value={l}>{l || "—"}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Kurs</Label>
                  <Input type="number" min={1} max={6} value={f.courseYear} onChange={(e) => set("courseYear", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Məzmun dili</Label>
                  <select className={SEL} value={f.contentLanguage} onChange={(e) => set("contentLanguage", e.target.value)}>
                    <option value="az">Azərbaycan</option>
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Ümumi məqsəd</Label>
                <Textarea value={f.objective} onChange={(e) => set("objective", e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>İlkin bilik tələbləri</Label>
                <Textarea value={f.prerequisites} onChange={(e) => set("prerequisites", e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Əlaqəli fənlər</Label>
                <Input value={f.relatedCourses} onChange={(e) => set("relatedCourses", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-color">Rəng</Label>
                <input id="s-color" type="color" value={f.color} onChange={(e) => set("color", e.target.value)} className="h-9 w-16 rounded border" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {mode === "edit" && subject && (
            <Button
              variant="ghost"
              className="mr-auto text-destructive"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await deleteSubjectAction(subject.id);
                  if (res.ok) {
                    toast.success("Fənn səbətə göndərildi");
                    setOpen(false);
                    router.refresh();
                  } else toast.error(res.error);
                })
              }
            >
              <Trash2 className="h-4 w-4" /> Sil
            </Button>
          )}
          <Button variant="ghost" onClick={() => setOpen(false)}>Bağla</Button>
          <Button onClick={save} disabled={pending || !f.name.trim()}>
            {pending ? "Saxlanılır…" : "Saxla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
