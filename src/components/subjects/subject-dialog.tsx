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

export function SubjectDialog({
  mode,
  subject,
}: {
  mode: "create" | "edit";
  subject?: { id: string; name: string; description: string; color: string };
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(subject?.name ?? "");
  const [description, setDescription] = React.useState(subject?.description ?? "");
  const [color, setColor] = React.useState(subject?.color || "#6d28d9");
  const [pending, start] = React.useTransition();

  function save() {
    start(async () => {
      const res = await upsertSubjectAction({
        ...(subject ? { id: subject.id } : {}),
        name,
        description,
        color,
      });
      if (res.ok) {
        toast.success(mode === "create" ? "Fənn yaradıldı" : "Yeniləndi");
        setOpen(false);
        if (mode === "create") setName("");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Yeni fənn" : "Fənni redaktə et"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="s-name">Ad</Label>
            <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-desc">Təsvir</Label>
            <Textarea id="s-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-color">Rəng</Label>
            <input id="s-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-16 rounded border" />
          </div>
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
          <Button onClick={save} disabled={pending || !name.trim()}>
            {pending ? "Saxlanılır…" : "Saxla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
