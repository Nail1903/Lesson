"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteAllDataAction } from "@/server/actions/data";

export function DangerZone({ isDemo }: { isDemo: boolean }) {
  const router = useRouter();
  const [confirm, setConfirm] = React.useState("");
  const [pending, start] = React.useTransition();

  return (
    <div className="space-y-3">
      <Button asChild variant="outline">
        <a href="/api/export?format=json" download>Əvvəlcə tam backup yüklə</a>
      </Button>
      <p className="text-sm text-muted-foreground">
        Bütün terminlər, fənnlər, söhbətlər və testlər silinəcək. Hesab qalacaq. Təsdiq üçün <b>SİL</b> yazın.
      </p>
      <div className="flex gap-2">
        <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="SİL" className="max-w-[140px]" />
        <Button
          variant="destructive"
          disabled={pending || confirm !== "SİL" || isDemo}
          onClick={() =>
            start(async () => {
              const res = await deleteAllDataAction(confirm);
              if (res.ok) {
                toast.success("Bütün məzmun silindi");
                router.push("/dashboard");
                router.refresh();
              } else toast.error(res.error);
            })
          }
        >
          Bütün məzmunu sil
        </Button>
      </div>
      {isDemo && <p className="text-xs text-muted-foreground">Demo hesabda bu əməliyyat söndürülüb.</p>}
    </div>
  );
}
