"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteOfferingAction } from "@/server/actions/teaching";

export function DeleteOfferingButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      className="text-destructive"
      disabled={pending}
      onClick={() =>
        start(async () => {
          if (!confirm("Bu tədris planı silinsin? Qrup irəliləyişləri də silinəcək.")) return;
          const res = await deleteOfferingAction(id);
          if (res.ok) {
            toast.success("Tədris planı silindi");
            router.push("/teaching");
            router.refresh();
          } else toast.error(res.error);
        })
      }
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
