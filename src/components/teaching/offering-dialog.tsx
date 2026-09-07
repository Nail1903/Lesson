"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { upsertOfferingAction } from "@/server/actions/teaching";
import { cn } from "@/lib/utils";

interface Props {
  mode: "create" | "edit";
  subjects: { id: string; name: string }[];
  universities: { id: string; name: string; faculties: { id: string; name: string }[] }[];
  groups: { id: string; name: string }[];
  initial?: {
    id: string;
    subjectId: string;
    universityId: string;
    facultyId: string | null;
    academicYear: string;
    term: string;
    language: string;
    status: string;
    teacherName: string | null;
    groupIds: string[];
  };
}

const SEL = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";
const TERMS = ["Payız", "Yaz", "Yay"];
const STATUSES = [
  { v: "draft", l: "Qaralama" },
  { v: "active", l: "Aktiv" },
  { v: "archived", l: "Arxiv" },
];

export function OfferingDialog({ mode, subjects, universities, groups, initial }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, start] = React.useTransition();

  const [f, setF] = React.useState({
    subjectId: initial?.subjectId ?? "",
    universityId: initial?.universityId ?? "",
    facultyId: initial?.facultyId ?? "",
    academicYear: initial?.academicYear ?? nextAcademicYear(),
    term: initial?.term ?? "Payız",
    language: initial?.language ?? "az",
    status: initial?.status ?? "draft",
    teacherName: initial?.teacherName ?? "",
  });
  const [groupIds, setGroupIds] = React.useState<string[]>(initial?.groupIds ?? []);

  const faculties = universities.find((u) => u.id === f.universityId)?.faculties ?? [];

  function save() {
    if (!f.subjectId || !f.universityId) {
      toast.error("Fənn və universitet seçin");
      return;
    }
    start(async () => {
      const res = await upsertOfferingAction({
        ...(initial?.id ? { id: initial.id } : {}),
        ...f,
        facultyId: f.facultyId || null,
        groupIds,
      });
      if (res.ok) {
        toast.success(mode === "create" ? "Tədris planı yaradıldı" : "Yeniləndi");
        setOpen(false);
        router.push(`/teaching/${res.data.id}`);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button size="sm"><Plus className="h-4 w-4" /> Yeni tədris planı</Button>
        ) : (
          <Button size="sm" variant="outline"><Pencil className="h-4 w-4" /> Redaktə</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Fənnin semestr üzrə tədrisi" : "Tədris planını redaktə et"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Row label="Fənn *">
            <select className={SEL} value={f.subjectId} onChange={(e) => setF({ ...f, subjectId: e.target.value })}>
              <option value="">— seç —</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Row>
          <Row label="Universitet *">
            <select className={SEL} value={f.universityId} onChange={(e) => setF({ ...f, universityId: e.target.value, facultyId: "" })}>
              <option value="">— seç —</option>
              {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Row>
          {faculties.length > 0 && (
            <Row label="Fakültə">
              <select className={SEL} value={f.facultyId} onChange={(e) => setF({ ...f, facultyId: e.target.value })}>
                <option value="">— seçilməyib —</option>
                {faculties.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </Row>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Row label="Tədris ili">
              <Input value={f.academicYear} onChange={(e) => setF({ ...f, academicYear: e.target.value })} placeholder="2025/2026" />
            </Row>
            <Row label="Semestr">
              <select className={SEL} value={f.term} onChange={(e) => setF({ ...f, term: e.target.value })}>
                {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Row>
            <Row label="Tədris dili">
              <select className={SEL} value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })}>
                <option value="az">az</option>
                <option value="en">en</option>
                <option value="ru">ru</option>
              </select>
            </Row>
            <Row label="Status">
              <select className={SEL} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
            </Row>
          </div>
          <Row label="Müəllim">
            <Input value={f.teacherName} onChange={(e) => setF({ ...f, teacherName: e.target.value })} />
          </Row>

          <div className="space-y-1.5">
            <Label>Qruplar</Label>
            {groups.length === 0 ? (
              <p className="text-xs text-muted-foreground">Əvvəlcə “Universitetlər və qruplar” bölməsində qrup yaradın.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() =>
                      setGroupIds((p) => (p.includes(g.id) ? p.filter((x) => x !== g.id) : [...p, g.id]))
                    }
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs",
                      groupIds.includes(g.id) ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                    )}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Bağla</Button>
          <Button onClick={save} disabled={pending}>{pending ? "Saxlanılır…" : "Saxla"}</Button>
        </DialogFooter>
      </DialogContent>

      
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function nextAcademicYear() {
  const now = new Date();
  const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}/${y + 1}`;
}
