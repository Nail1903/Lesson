"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/40 p-10 text-center">
      <p className="text-lg font-semibold">Nəsə səhv getdi</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message === "UNAUTHORIZED"
          ? "Sessiyanız bitib. Yenidən daxil olun."
          : "Xəta baş verdi. Yenidən cəhd edin və ya səhifəni yeniləyin."}
      </p>
      <Button onClick={reset}>Yenidən cəhd et</Button>
    </div>
  );
}
