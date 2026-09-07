"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, Plus, Trash2, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  setMeetingStatusAction,
  upsertMeetingAction,
  deleteMeetingAction,
  setMeetingTopicsAction,
} from "@/server/actions/schedule";

interface Meeting {
  id: string;
  groupId: string;
  groupName: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  status: string;
  note: string | null;
  topics: { id: string; name: string }[];
}

const STATUS = [
  { v: "planned", l: "planlaşdırılıb", cls: "bg-secondary text-secondary-foreground" },
  { v: "held", l: "keçirilib", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  { v: "postponed", l: "təxirə salınıb", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  { v: "cancelled", l: "ləğv edilib", cls: "bg-destructive/15 text-destructive" },
];
const nextStatus = (s: string) => STATUS[(STATUS.findIndex((x) => x.v === s) + 1) % STATUS.length]!.v;
const label = (s: string) => STATUS.find((x) => x.v === s)?.l ?? s;
const cls = (s: string) => STATUS.find((x) => x.v === s)?.cls ?? "";

function fmt(d: string | null) {
  if (!d) return "tarixsiz";
  return new Intl.DateTimeFormat("az-AZ", { day: "2-digit", month: "short", weekday: "short" }).format(new Date(d));
}

export function MeetingsPanel({
  offeringId,
  meetings,
  groups,
  lessons,
}: {
  offeringId: string;
  meetings: Meeting[];
  groups: { id: string; name: string }[];
  lessons: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [addOpen, setAddOpen] = React.useState(false);
  const [tagFor, setTagFor] = React.useState<string | null>(null);

  const byGroup = new Map<string, Meeting[]>();
  for (const m of meetings) {
    const arr = byGroup.get(m.groupId) ?? [];
    arr.push(m);
    byGroup.set(m.groupId, arr);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4" /> Görüşlər ({meetings.length})
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setAddOpen((o) => !o)}>
          <Plus className="h-3.5 w-3.5" /> Əl ilə görüş
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {addOpen && (
          <ManualMeetingForm
            offeringId={offeringId}
            groups={groups}
            onDone={() => {
              setAddOpen(false);
              router.refresh();
            }}
          />
        )}

        {meetings.length === 0 && !addOpen && (
          <p className="text-sm text-muted-foreground">
            Görüş yoxdur. Yuxarıdakı həftəlik cədvəldən “Görüşləri yarat” düyməsini basın və ya əl ilə əlavə edin.
          </p>
        )}

        {groups
          .filter((g) => byGroup.has(g.id))
          .map((g) => (
            <div key={g.id}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.name}</p>
              <div className="space-y-1">
                {(byGroup.get(g.id) ?? []).map((m) => (
                  <div key={m.id} className="rounded-md border px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium tabular-nums">{fmt(m.date)}</span>
                      {(m.startTime || m.endTime) && (
                        <span className="text-xs text-muted-foreground">{m.startTime}–{m.endTime}</span>
                      )}
                      {m.room && <span className="text-xs text-muted-foreground">· {m.room}</span>}
                      <button
                        className={cn("rounded-full px-2 py-0.5 text-[11px]", cls(m.status))}
                        onClick={() =>
                          start(async () => {
                            const res = await setMeetingStatusAction(m.id, offeringId, nextStatus(m.status));
                            if (res.ok) router.refresh();
                            else toast.error(res.error);
                          })
                        }
                        title="Statusu dəyiş"
                      >
                        {label(m.status)}
                      </button>
                      <div className="ml-auto flex gap-1">
                        <button className="text-muted-foreground hover:text-foreground" onClick={() => setTagFor(tagFor === m.id ? null : m.id)} title="Mövzuları işarələ">
                          <Tag className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            start(async () => {
                              const res = await deleteMeetingAction(m.id, offeringId);
                              if (res.ok) { toast.success("Silindi"); router.refresh(); } else toast.error(res.error);
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {m.topics.length > 0 && (
                      <p className="mt-1 flex flex-wrap gap-1">
                        {m.topics.map((t) => <Badge key={t.id} variant="secondary">{t.name}</Badge>)}
                      </p>
                    )}
                    {tagFor === m.id && (
                      <TopicTagger
                        meetingId={m.id}
                        offeringId={offeringId}
                        lessons={lessons}
                        selected={m.topics.map((t) => t.id)}
                        onDone={() => {
                          setTagFor(null);
                          router.refresh();
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}

function ManualMeetingForm({
  offeringId,
  groups,
  onDone,
}: {
  offeringId: string;
  groups: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [groupId, setGroupId] = React.useState(groups[0]?.id ?? "");
  const [date, setDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [room, setRoom] = React.useState("");
  const [pending, start] = React.useTransition();

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/30 p-2">
      <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
        {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
      <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-28" />
      <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-28" />
      <Input placeholder="Auditoriya" value={room} onChange={(e) => setRoom(e.target.value)} className="w-32" />
      <Button
        size="sm"
        disabled={pending || !groupId || !date}
        onClick={() =>
          start(async () => {
            const res = await upsertMeetingAction({ offeringId, groupId, date, startTime, endTime, room });
            if (res.ok) { toast.success("Görüş əlavə edildi"); onDone(); } else toast.error(res.error);
          })
        }
      >
        Əlavə et
      </Button>
    </div>
  );
}

function TopicTagger({
  meetingId,
  offeringId,
  lessons,
  selected,
  onDone,
}: {
  meetingId: string;
  offeringId: string;
  lessons: { id: string; name: string }[];
  selected: string[];
  onDone: () => void;
}) {
  const [ids, setIds] = React.useState<string[]>(selected);
  const [pending, start] = React.useTransition();
  return (
    <div className="mt-2 space-y-2 rounded-md border bg-muted/30 p-2">
      <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
        {lessons.map((l) => (
          <button
            key={l.id}
            onClick={() => setIds((p) => (p.includes(l.id) ? p.filter((x) => x !== l.id) : [...p, l.id]))}
            className={cn(
              "rounded-full border px-2 py-0.5 text-xs",
              ids.includes(l.id) ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {l.name}
          </button>
        ))}
      </div>
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await setMeetingTopicsAction({ meetingId, offeringId, topicIds: ids });
            if (res.ok) { toast.success("Mövzular işarələndi"); onDone(); } else toast.error(res.error);
          })
        }
      >
        Saxla
      </Button>
    </div>
  );
}
