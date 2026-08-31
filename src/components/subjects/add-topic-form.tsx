"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertTopicAction } from "@/server/actions/subjects";

export function AddTopicForm({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [pending, start] = React.useTransition();

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        start(async () => {
          const res = await upsertTopicAction({ subjectId, name });
          if (res.ok) {
            toast.success("Mövzu əlavə edildi");
            setName("");
            router.refresh();
          } else toast.error(res.error);
        });
      }}
    >
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Yeni mövzu (dərs) adı…" />
      <Button type="submit" disabled={pending || !name.trim()}>
        <Plus className="h-4 w-4" /> Mövzu
      </Button>
    </form>
  );
}
