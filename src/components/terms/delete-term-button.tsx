"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteTermAction } from "@/server/actions/terms";

export function DeleteTermButton({ termId, termName }: { termId: string; termName: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, start] = React.useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Termini səbətə göndər</DialogTitle>
          <DialogDescription>
            <b>{termName}</b> səbətə köçürüləcək. İstənilən vaxt “Səbət” bölməsindən bərpa edə bilərsiniz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Ləğv et</Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await deleteTermAction(termId);
                if (res.ok) {
                  toast.success("Termin səbətə göndərildi");
                  router.push("/terms");
                  router.refresh();
                } else toast.error(res.error);
              })
            }
          >
            {pending ? "Göndərilir…" : "Səbətə göndər"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
