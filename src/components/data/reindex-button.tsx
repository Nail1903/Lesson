"use client";

import * as React from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reindexAllAction } from "@/server/actions/data";

export function ReindexButton() {
  const [pending, start] = React.useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await reindexAllAction();
          if (res.ok) toast.success(`${res.data.terms} termin yenidən indeksləndi (${res.data.created + res.data.updated} parça)`);
          else toast.error(res.error);
        })
      }
    >
      <RefreshCw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Yenidən indekslə
    </Button>
  );
}
