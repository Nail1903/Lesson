"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarRange, Plus, Trash2, Sparkles, RotateCcw, CalendarX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  setOfferingDatesAction,
  upsertSlotAction,
  deleteSlotAction,
  addExceptionAction,
  deleteExceptionAction,
  generateMeetingsAction,
  clearPlannedMeetingsAction,
} from "@/server/actions/schedule";

const WEEKDAYS = ["", "B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"]; // 1..7
const WEEKDAY_FULL = ["", "Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə", "Cümə axşamı", "Cümə", "Şənbə", "Bazar"];
const KINDS = ["", "mühazirə", "seminar", "laboratoriya", "praktika"];

interface Slot {
  id: string;
  groupId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  kind: string | null;
  room: string | null;
  group: { name: string };
}
interface Exc {
  id: string;
  date: string;
  reason: string | null;
}

export function ScheduleEditor({
  offeringId,
  startDate,
  endDate,
  slots,
  exceptions,
  groups,
  meetingsCount,
}: {
  offeringId: string;
  startDate: string | null;
  endDate: string | null;
  slots: Slot[];
  exceptions: Exc[];
  groups: { id: string; name: string }[];
  meetingsCount: number;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [sd, setSd] = React.useState(startDate ?? "");
  const [ed, setEd] = React.useState(endDate ?? "");
  const [addingFor, setAddingFor] = React.useState<string | null>(null);
  const [excDate, setExcDate] = React.useState("");
  const [excReason, setExcReason] = React.useState("");

  const run = (p: Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const r = await p;
      if (r.ok) {
        toast.success(msg);
        router.refresh();
      } else toast.error(r.error);
    });

  function saveDates() {
    run(
      setOfferingDatesAction({ offeringId, startDate: sd || null, endDate: ed || null }),
      "Semestr tarixləri saxlanıldı",
    );
  }

  function generate() {
    start(async () => {
      const r = await generateMeetingsAction(offeringId);
      if (r.ok) {
        toast.success(`${r.data.created} görüş yaradıldı (${r.data.skippedExisting} mövcud, ${r.data.skippedException} istisna günü)`);
        router.refresh();
      } else toast.error(r.error);
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarRange className="h-4 w-4" /> Həftəlik cədvəl
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Semestr tarixləri + hər qrup üçün həftəlik gün və saat → görüşlər avtomatik yaranır.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Semester dates */}
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Semestr başlanğıcı
            <Input type="date" value={sd} onChange={(e) => setSd(e.target.value)} className="mt-1" />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Semestr sonu
            <Input type="date" value={ed} onChange={(e) => setEd(e.target.value)} className="mt-1" />
          </label>
          <Button size="sm" variant="outline" onClick={saveDates} disabled={pending}>Tarixləri saxla</Button>
        </div>

        {/* Per-group weekly slots */}
        <div className="space-y-3">
          {groups.length === 0 && <p className="text-sm text-muted-foreground">Əvvəlcə qrup bağlayın.</p>}
          {groups.map((g) => {
            const gSlots = slots.filter((s) => s.groupId === g.id);
            return (
              <div key={g.id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">{g.name}</span>
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => setAddingFor(addingFor === g.id ? null : g.id)}>
                    <Plus className="h-3.5 w-3.5" /> Slot
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {gSlots.length === 0 && <span className="text-xs text-muted-foreground">Slot yoxdur.</span>}
                  {gSlots.map((s) => (
                    <span key={s.id} className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2.5 py-1 text-xs">
                      {WEEKDAY_FULL[s.weekday]} {s.startTime}–{s.endTime}
                      {s.kind && ` · ${s.kind}`}
                      {s.room && ` · ${s.room}`}
                      <button
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => run(deleteSlotAction(s.id, offeringId), "Slot silindi")}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                {addingFor === g.id && (
                  <SlotForm
                    offeringId={offeringId}
                    groupId={g.id}
                    onDone={() => {
                      setAddingFor(null);
                      router.refresh();
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Exception dates */}
        <div className="rounded-lg border p-3">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <CalendarX className="h-3.5 w-3.5" /> İstisna günlər (bayram / dərs yoxdur)
          </p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {exceptions.length === 0 && <span className="text-xs text-muted-foreground">Yoxdur.</span>}
            {exceptions.map((x) => (
              <span key={x.id} className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2.5 py-1 text-xs">
                {x.date.slice(0, 10)}{x.reason && ` · ${x.reason}`}
                <button className="text-muted-foreground hover:text-destructive" onClick={() => run(deleteExceptionAction(x.id, offeringId), "Silindi")}>
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Input type="date" value={excDate} onChange={(e) => setExcDate(e.target.value)} className="w-40" />
            <Input placeholder="Səbəb (opsional)" value={excReason} onChange={(e) => setExcReason(e.target.value)} className="w-48" />
            <Button
              size="sm"
              variant="outline"
              disabled={!excDate || pending}
              onClick={() => {
                run(addExceptionAction({ offeringId, date: excDate, reason: excReason || undefined }), "İstisna günü əlavə edildi");
                setExcDate("");
                setExcReason("");
              }}
            >
              Əlavə et
            </Button>
          </div>
        </div>

        {/* Generate */}
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <Button size="sm" onClick={generate} disabled={pending}>
            <Sparkles className="h-3.5 w-3.5" /> Görüşləri yarat
          </Button>
          {meetingsCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() =>
                start(async () => {
                  if (!confirm("Yalnız 'planlaşdırılıb' statuslu, cədvəldən yaranan görüşlər silinəcək. Davam edilsin?")) return;
                  const r = await clearPlannedMeetingsAction(offeringId);
                  if (r.ok) {
                    toast.success(`${r.data.removed} görüş silindi`);
                    router.refresh();
                  } else toast.error(r.error);
                })
              }
            >
              <RotateCcw className="h-3.5 w-3.5" /> Planlaşdırılmışları təmizlə
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {meetingsCount > 0 ? `${meetingsCount} görüş mövcuddur` : "Hələ görüş yoxdur"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function SlotForm({
  offeringId,
  groupId,
  onDone,
}: {
  offeringId: string;
  groupId: string;
  onDone: () => void;
}) {
  const [weekday, setWeekday] = React.useState(1);
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("10:30");
  const [kind, setKind] = React.useState("");
  const [room, setRoom] = React.useState("");
  const [pending, start] = React.useTransition();

  return (
    <div className="mt-2 flex flex-wrap items-end gap-2 rounded-md border bg-muted/30 p-2">
      <label className="text-[11px] font-medium text-muted-foreground">
        Gün
        <select className="mt-1 h-9 rounded-md border border-input bg-background px-2 text-sm" value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
          {[1, 2, 3, 4, 5, 6, 7].map((d) => <option key={d} value={d}>{WEEKDAYS[d]}</option>)}
        </select>
      </label>
      <label className="text-[11px] font-medium text-muted-foreground">
        Başlama
        <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 w-28" />
      </label>
      <label className="text-[11px] font-medium text-muted-foreground">
        Bitmə
        <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1 w-28" />
      </label>
      <label className="text-[11px] font-medium text-muted-foreground">
        Növ
        <select className="mt-1 h-9 rounded-md border border-input bg-background px-2 text-sm" value={kind} onChange={(e) => setKind(e.target.value)}>
          {KINDS.map((k) => <option key={k} value={k}>{k || "—"}</option>)}
        </select>
      </label>
      <label className="text-[11px] font-medium text-muted-foreground">
        Auditoriya
        <Input value={room} onChange={(e) => setRoom(e.target.value)} className="mt-1 w-28" placeholder="304 / online" />
      </label>
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await upsertSlotAction({ offeringId, groupId, weekday, startTime, endTime, kind, room });
            if (res.ok) {
              toast.success("Slot əlavə edildi");
              onDone();
            } else toast.error(res.error);
          })
        }
      >
        Əlavə et
      </Button>
    </div>
  );
}

export { WEEKDAY_FULL };
