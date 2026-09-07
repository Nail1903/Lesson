"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X, Printer, Building2, Trash2, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  upsertPlannerUniversityAction,
  deletePlannerUniversityAction,
  upsertPlannerSubjectAction,
  deletePlannerSubjectAction,
  upsertWeeklyClassAction,
  deleteWeeklyClassAction,
} from "@/server/actions/planner";

const DAYS = [
  { n: 1, short: "B.E", full: "Bazar ertəsi" },
  { n: 2, short: "Ç.A", full: "Çərşənbə axşamı" },
  { n: 3, short: "ÇƏR", full: "Çərşənbə" },
  { n: 4, short: "C.A", full: "Cümə axşamı" },
  { n: 5, short: "CÜM", full: "Cümə" },
  { n: 6, short: "ŞNB", full: "Şənbə" },
  { n: 7, short: "BZR", full: "Bazar" },
];
const PALETTE = ["#6d28d9", "#2563eb", "#0891b2", "#15803d", "#b45309", "#be123c", "#4b5563"];

interface Uni {
  id: string;
  name: string;
  shortName: string | null;
  logoEmoji: string | null;
}
interface Subj {
  id: string;
  name: string;
  universityId: string | null;
  color: string | null;
  slug: string;
}
interface Cls {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  groupLabel: string | null;
  room: string | null;
  color: string | null;
  subject: { id: string; name: string; slug: string; color: string | null };
  university: { id: string; name: string; shortName: string | null; logoEmoji: string | null } | null;
}

export function WeeklyPlanner({
  universities,
  subjects,
  classes,
}: {
  universities: Uni[];
  subjects: Subj[];
  classes: Cls[];
}) {
  const router = useRouter();
  const [uniFilter, setUniFilter] = React.useState<string | null>(null);
  const [manageOpen, setManageOpen] = React.useState(universities.length === 0);
  const [dialog, setDialog] = React.useState<{ weekday: number; edit?: Cls } | null>(null);
  const [, start] = React.useTransition();

  const shown = uniFilter ? classes.filter((c) => c.university?.id === uniFilter) : classes;

  function colorFor(c: Cls) {
    return c.color || c.subject.color || PALETTE[c.subject.name.length % PALETTE.length];
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setUniFilter(null)}
            className={cn("rounded-full border px-2.5 py-1 text-xs", !uniFilter && "border-primary bg-primary text-primary-foreground")}
          >
            Hamısı
          </button>
          {universities.map((u) => (
            <button
              key={u.id}
              onClick={() => setUniFilter((f) => (f === u.id ? null : u.id))}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
                uniFilter === u.id && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {u.logoEmoji && <span>{u.logoEmoji}</span>}
              {u.shortName || u.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setManageOpen((o) => !o)}>
            <Building2 className="h-4 w-4" /> Universitetlər və fənlər
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Çap et
          </Button>
        </div>
      </div>

      {manageOpen && (
        <UniversitiesManager
          universities={universities}
          subjects={subjects}
          onChange={() => router.refresh()}
        />
      )}

      {/* Weekly grid */}
      <div className="overflow-x-auto">
        <div className="grid min-w-[900px] grid-cols-7 gap-2">
          {DAYS.map((d) => {
            const dayClasses = shown.filter((c) => c.weekday === d.n);
            return (
              <div key={d.n} className="min-w-0">
                <div className="border-b pb-1 text-center">
                  <p className="text-sm font-semibold">{d.short}</p>
                  <p className="text-[10px] text-muted-foreground">{d.full}</p>
                </div>
                <div className="mt-2 space-y-1.5">
                  {dayClasses.map((c) => (
                    <div
                      key={c.id}
                      className="group relative rounded-md border-l-4 bg-card p-2 text-xs shadow-sm"
                      style={{ borderLeftColor: colorFor(c) }}
                    >
                      <button
                        onClick={() => setDialog({ weekday: c.weekday, edit: c })}
                        className="block w-full pr-4 text-left"
                      >
                        <span className="font-medium leading-tight">{c.subject.name}</span>
                        <span className="mt-0.5 block text-muted-foreground">
                          {c.startTime}–{c.endTime}
                          {c.groupLabel && ` · ${c.groupLabel}`}
                          {c.room && ` · ${c.room}`}
                        </span>
                        {c.university && (
                          <span className="text-[10px] text-muted-foreground">
                            {c.university.logoEmoji} {c.university.shortName || c.university.name}
                          </span>
                        )}
                      </button>
                      <button
                        className="absolute right-1 top-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 print:hidden"
                        onClick={() =>
                          start(async () => {
                            const res = await deleteWeeklyClassAction(c.id);
                            if (res.ok) router.refresh();
                            else toast.error(res.error);
                          })
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setDialog({ weekday: d.n })}
                    className="w-full rounded-md border border-dashed py-1.5 text-xs text-muted-foreground hover:bg-muted print:hidden"
                  >
                    <Plus className="mr-1 inline h-3 w-3" /> Əlavə et
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {dialog && (
        <AddClassDialog
          weekday={dialog.weekday}
          edit={dialog.edit}
          universities={universities}
          subjects={subjects}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/* ── Add / edit class dialog ────────────────────────────────────────────── */

function AddClassDialog({
  weekday,
  edit,
  universities,
  subjects,
  onClose,
  onDone,
}: {
  weekday: number;
  edit?: Cls;
  universities: Uni[];
  subjects: Subj[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [uniId, setUniId] = React.useState(edit?.university?.id ?? universities[0]?.id ?? "");
  const [subjectId, setSubjectId] = React.useState(edit?.subject.id ?? "");
  const [newSubject, setNewSubject] = React.useState("");
  const [startTime, setStartTime] = React.useState(edit?.startTime ?? "");
  const [endTime, setEndTime] = React.useState(edit?.endTime ?? "");
  const [groupLabel, setGroupLabel] = React.useState(edit?.groupLabel ?? "");
  const [room, setRoom] = React.useState(edit?.room ?? "");
  const [pending, start] = React.useTransition();

  const uniSubjects = subjects.filter((s) => (uniId ? s.universityId === uniId : !s.universityId));

  function save() {
    if (!startTime || !endTime) {
      toast.error("Başlama və bitmə saatı vacibdir");
      return;
    }
    if (!subjectId && !newSubject.trim()) {
      toast.error("Fənn seçin və ya yeni ad daxil edin");
      return;
    }
    start(async () => {
      const res = await upsertWeeklyClassAction({
        ...(edit ? { id: edit.id } : {}),
        subjectId: subjectId || undefined,
        newSubjectName: subjectId ? undefined : newSubject,
        universityId: uniId || null,
        weekday,
        startTime,
        endTime,
        groupLabel,
        room,
      });
      if (res.ok) {
        toast.success(edit ? "Yeniləndi" : "Dərs əlavə edildi");
        onDone();
      } else toast.error(res.error);
    });
  }

  const day = DAYS.find((d) => d.n === weekday)!;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="uppercase">{day.full} — {edit ? "dərsi redaktə et" : "dərs əlavə et"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground">
            Universitet
            <select
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={uniId}
              onChange={(e) => { setUniId(e.target.value); setSubjectId(""); }}
            >
              <option value="">— (universitetsiz) —</option>
              {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>

          <label className="block text-xs font-medium text-muted-foreground">
            Fənn
            <select
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">— yeni fənn —</option>
              {uniSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {!subjectId && (
              <Input
                className="mt-1"
                placeholder="Yeni fənnin adı (məs. Frontend proqramlaşdırma (II) - 351)"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-muted-foreground">
              Başlama
              <Input type="time" className="mt-1" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">
              Bitmə
              <Input type="time" className="mt-1" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-muted-foreground">
              Qrup
              <Input className="mt-1" placeholder="məs. 351" value={groupLabel} onChange={(e) => setGroupLabel(e.target.value)} />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">
              Auditoriya
              <Input className="mt-1" placeholder="məs. 214 / Zoom" value={room} onChange={(e) => setRoom(e.target.value)} />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Ləğv et</Button>
          <Button onClick={save} disabled={pending}>{pending ? "…" : edit ? "Saxla" : "Əlavə et"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Universities & subjects management ─────────────────────────────────── */

function UniversitiesManager({
  universities,
  subjects,
  onChange,
}: {
  universities: Uni[];
  subjects: Subj[];
  onChange: () => void;
}) {
  const [pending, start] = React.useTransition();
  const [newUni, setNewUni] = React.useState("");
  const [newUniShort, setNewUniShort] = React.useState("");

  const run = (p: Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const r = await p;
      if (r.ok) { toast.success(msg); onChange(); } else toast.error(r.error);
    });

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {universities.map((u) => (
          <UniversityCard
            key={u.id}
            uni={u}
            subjects={subjects.filter((s) => s.universityId === u.id)}
            onRun={run}
            pending={pending}
          />
        ))}
        {/* general (no university) subjects */}
        <UniversityCard
          uni={null}
          subjects={subjects.filter((s) => !s.universityId)}
          onRun={run}
          pending={pending}
        />
        {/* new university */}
        <div className="flex flex-col justify-center rounded-lg border border-dashed p-3">
          <p className="mb-2 text-sm font-medium">+ Yeni universitet</p>
          <Input className="mb-1.5" placeholder="Universitetin adı" value={newUni} onChange={(e) => setNewUni(e.target.value)} />
          <Input className="mb-1.5" placeholder="Qısa ad (opsional)" value={newUniShort} onChange={(e) => setNewUniShort(e.target.value)} />
          <Button
            size="sm"
            disabled={pending || !newUni.trim()}
            onClick={() => {
              run(upsertPlannerUniversityAction({ name: newUni, shortName: newUniShort }), "Universitet əlavə edildi");
              setNewUni("");
              setNewUniShort("");
            }}
          >
            Əlavə et
          </Button>
        </div>
      </div>
    </div>
  );
}

function UniversityCard({
  uni,
  subjects,
  onRun,
  pending,
}: {
  uni: Uni | null;
  subjects: Subj[];
  onRun: (p: Promise<{ ok: boolean; error?: string }>, m: string) => void;
  pending: boolean;
}) {
  const [newSubj, setNewSubj] = React.useState("");
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 flex items-start justify-between">
        <p className="text-sm font-semibold">
          {uni ? (
            <>
              {uni.logoEmoji} {uni.name} {uni.shortName && <span className="text-muted-foreground">({uni.shortName})</span>}
            </>
          ) : (
            <span className="text-muted-foreground">Universitetsiz fənlər</span>
          )}
        </p>
        {uni && (
          <button
            className="text-xs text-muted-foreground hover:text-destructive"
            onClick={() => onRun(deletePlannerUniversityAction(uni.id), "Silindi")}
          >
            Sil
          </button>
        )}
      </div>

      <div className="space-y-1">
        {subjects.map((s) =>
          editId === s.id ? (
            <div key={s.id} className="flex gap-1">
              <Input className="h-8" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
              <button
                onClick={() => {
                  onRun(upsertPlannerSubjectAction({ id: s.id, name: editName, universityId: s.universityId }), "Yeniləndi");
                  setEditId(null);
                }}
              >
                <Check className="h-4 w-4 text-emerald-600" />
              </button>
            </div>
          ) : (
            <div key={s.id} className="group flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-muted">
              <Link href={`/subjects/${s.slug}`} className="hover:text-primary">{s.name}</Link>
              <span className="flex gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => { setEditId(s.id); setEditName(s.name); }}>
                  <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
                <button onClick={() => onRun(deletePlannerSubjectAction(s.id), "Silindi")}>
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </span>
            </div>
          ),
        )}
      </div>

      <div className="mt-1.5 flex gap-1">
        <Input
          className="h-8 text-xs"
          placeholder="Yeni fənn adı"
          value={newSubj}
          onChange={(e) => setNewSubj(e.target.value)}
        />
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 shrink-0"
          disabled={pending || !newSubj.trim()}
          onClick={() => {
            onRun(upsertPlannerSubjectAction({ name: newSubj, universityId: uni?.id ?? null }), "Fənn əlavə edildi");
            setNewSubj("");
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
