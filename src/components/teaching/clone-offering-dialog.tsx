"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CopyPlus } from "lucide-react";
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
import { cloneOfferingAction } from "@/server/actions/teaching";
import { cn } from "@/lib/utils";

export function CloneOfferingDialog({
  offeringId,
  currentGroups,
  hasCourseVersion,
}: {
  offeringId: string;
  currentGroups: { id: string; name: string }[];
  hasCourseVersion: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, start] = React.useTransition();
  const [year, setYear] = React.useState(nextYear());
  const [term, setTerm] = React.useState("Yaz");
  const [groupIds, setGroupIds] = React.useState<string[]>(currentGroups.map((g) => g.id));
  const [keepVersion, setKeepVersion] = React.useState(true);

  function run() {
    start(async () => {
      const res = await cloneOfferingAction({
        offeringId,
        academicYear: year,
        term: term as "Payız" | "Yaz" | "Yay",
        groupIds,
        keepCourseVersion: keepVersion,
      });
      if (res.ok) {
        toast.success("Növbəti semestrə köçürüldü (qaralama)");
        setOpen(false);
        router.push(`/teaching/${res.data.id}`);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><CopyPlus className="h-4 w-4" /> Semestrə köçür</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Növbəti semestrə köçürmə</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Yeni tədris planı <b>qaralama</b> kimi yaradılır. Keçmiş semestrin dərs gedişi, görüşləri və qeydləri köçürülmür.
          </p>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tədris ili</Label>
              <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026/2027" />
            </div>
            <div className="space-y-1.5">
              <Label>Semestr</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={term} onChange={(e) => setTerm(e.target.value)}>
                {["Payız", "Yaz", "Yay"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Qruplar</Label>
            {currentGroups.length === 0 ? (
              <p className="text-xs text-muted-foreground">Köçürüləcək qrup yoxdur — sonra əlavə edərsiniz.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {currentGroups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGroupIds((p) => (p.includes(g.id) ? p.filter((x) => x !== g.id) : [...p, g.id]))}
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
            <p className="text-[11px] text-muted-foreground">
              Adətən yeni semestrdə yeni qruplar olur — köçürdükdən sonra “Redaktə”dən dəyişin.
            </p>
          </div>

          {hasCourseVersion && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={keepVersion} onChange={(e) => setKeepVersion(e.target.checked)} className="accent-primary" />
              Eyni proqram/sillabus versiyasını saxla
            </label>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Bağla</Button>
          <Button onClick={run} disabled={pending}>{pending ? "Köçürülür…" : "Köçür"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function nextYear() {
  const n = new Date();
  const y = n.getMonth() >= 7 ? n.getFullYear() : n.getFullYear() - 1;
  return `${y + 1}/${y + 2}`;
}
