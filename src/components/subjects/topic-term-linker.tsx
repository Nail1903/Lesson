"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { linkTopicTermAction, unlinkTopicTermAction } from "@/server/actions/subjects";

export function TopicTermLinker({
  topicId,
  terms,
}: {
  topicId: string;
  terms: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [existingId, setExistingId] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [note, setNote] = React.useState("");
  const [pending, start] = React.useTransition();

  function link() {
    start(async () => {
      const res = await linkTopicTermAction({
        topicId,
        termId: existingId || undefined,
        newTermName: existingId ? undefined : newName || undefined,
        note,
      });
      if (res.ok) {
        toast.success("Termin mövzuya əlavə edildi");
        setExistingId("");
        setNewName("");
        setNote("");
        setOpen(false);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  if (!open)
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Termin əlavə et
      </Button>
    );

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={existingId}
          onChange={(e) => setExistingId(e.target.value)}
        >
          <option value="">— mövcud termin seç —</option>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <Input
          placeholder="…və ya yeni termin adı"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={!!existingId}
        />
      </div>
      <Input placeholder="Bu mövzu üçün qeyd (opsional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" onClick={link} disabled={pending || (!existingId && !newName.trim())}>
          Əlavə et
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Ləğv et</Button>
      </div>
    </div>
  );
}

export function RemoveButton({ topicId, termId }: { topicId: string; termId: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <button
      className="text-muted-foreground hover:text-destructive"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await unlinkTopicTermAction(topicId, termId);
          if (res.ok) {
            toast.success("Mövzudan çıxarıldı");
            router.refresh();
          } else toast.error(res.error);
        })
      }
    >
      <X className="h-4 w-4" />
    </button>
  );
}
