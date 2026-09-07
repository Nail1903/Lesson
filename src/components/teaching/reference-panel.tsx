"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  upsertUniversityAction,
  deleteUniversityAction,
  upsertFacultyAction,
  deleteFacultyAction,
  upsertGroupAction,
  deleteGroupAction,
} from "@/server/actions/teaching";

interface Uni {
  id: string;
  name: string;
  shortName: string | null;
  city: string | null;
  academicHourMinutes: number;
  faculties: { id: string; name: string; department: string | null }[];
}
interface Grp {
  id: string;
  name: string;
  universityId: string | null;
  universityName: string | null;
  studentCount: number | null;
  specialty: string | null;
}

export function ReferencePanel({ universities, groups }: { universities: Uni[]; groups: Grp[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const refresh = () => router.refresh();
  const run = (p: Promise<{ ok: boolean; error?: string }>, okMsg: string) =>
    start(async () => {
      const r = await p;
      if (r.ok) {
        toast.success(okMsg);
        refresh();
      } else toast.error(r.error);
    });

  // new-university form
  const [uName, setUName] = React.useState("");
  const [uShort, setUShort] = React.useState("");
  const [uMin, setUMin] = React.useState("45");

  // new-group form
  const [gName, setGName] = React.useState("");
  const [gUni, setGUni] = React.useState("");
  const [gCount, setGCount] = React.useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Universities */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Universitetlər</h3>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!uName.trim()) return;
            run(
              upsertUniversityAction({ name: uName, shortName: uShort, academicHourMinutes: Number(uMin) || 45 }),
              "Universitet əlavə edildi",
            );
            setUName("");
            setUShort("");
          }}
        >
          <Input className="min-w-[160px] flex-1" placeholder="Ad" value={uName} onChange={(e) => setUName(e.target.value)} />
          <Input className="w-28" placeholder="Qısa ad" value={uShort} onChange={(e) => setUShort(e.target.value)} />
          <Input className="w-24" type="number" placeholder="Akad. saat dəq." value={uMin} onChange={(e) => setUMin(e.target.value)} />
          <Button type="submit" size="icon" disabled={pending}><Plus className="h-4 w-4" /></Button>
        </form>

        <div className="space-y-2">
          {universities.length === 0 && <p className="text-sm text-muted-foreground">Yoxdur.</p>}
          {universities.map((u) => (
            <div key={u.id} className="rounded-lg border p-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {u.name} {u.shortName && <span className="text-muted-foreground">({u.shortName})</span>}
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{u.academicHourMinutes} dəq/saat</span>
                  <button
                    onClick={() => run(deleteUniversityAction(u.id), "Silindi")}
                    className="hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <FacultyList uni={u} onRun={run} pending={pending} />
            </div>
          ))}
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Qruplar</h3>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!gName.trim()) return;
            run(
              upsertGroupAction({
                name: gName,
                universityId: gUni || null,
                studentCount: gCount ? Number(gCount) : null,
              }),
              "Qrup əlavə edildi",
            );
            setGName("");
            setGCount("");
          }}
        >
          <Input className="w-32" placeholder="Qrup adı" value={gName} onChange={(e) => setGName(e.target.value)} />
          <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={gUni} onChange={(e) => setGUni(e.target.value)}>
            <option value="">— universitet —</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>{u.shortName || u.name}</option>
            ))}
          </select>
          <Input className="w-20" type="number" placeholder="Sayı" value={gCount} onChange={(e) => setGCount(e.target.value)} />
          <Button type="submit" size="icon" disabled={pending}><Plus className="h-4 w-4" /></Button>
        </form>

        <div className="space-y-1.5">
          {groups.length === 0 && <p className="text-sm text-muted-foreground">Yoxdur.</p>}
          {groups.map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-lg border px-2.5 py-2 text-sm">
              <span>
                <span className="font-medium">{g.name}</span>
                {g.universityName && <span className="text-muted-foreground"> · {g.universityName}</span>}
                {g.studentCount != null && <span className="text-muted-foreground"> · {g.studentCount} tələbə</span>}
              </span>
              <button onClick={() => run(deleteGroupAction(g.id), "Silindi")} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FacultyList({
  uni,
  onRun,
  pending,
}: {
  uni: Uni;
  onRun: (p: Promise<{ ok: boolean; error?: string }>, m: string) => void;
  pending: boolean;
}) {
  const [name, setName] = React.useState("");
  return (
    <div className="mt-2 space-y-1 border-l pl-3">
      {uni.faculties.map((f) => (
        <div key={f.id} className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <ChevronRight className="h-3 w-3" />
            {f.name}
            {f.department && ` / ${f.department}`}
          </span>
          <button onClick={() => onRun(deleteFacultyAction(f.id), "Silindi")} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      <form
        className="flex gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onRun(upsertFacultyAction({ universityId: uni.id, name }), "Fakültə əlavə edildi");
          setName("");
        }}
      >
        <input
          className="h-7 flex-1 rounded border border-input bg-background px-2 text-xs"
          placeholder="Fakültə / kafedra əlavə et"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" size="sm" variant="ghost" className="h-7 px-2" disabled={pending}>
          <Plus className="h-3 w-3" />
        </Button>
      </form>
    </div>
  );
}
