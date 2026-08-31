"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { importTermsAction } from "@/server/actions/data";

export function ImportPanel() {
  const router = useRouter();
  const [raw, setRaw] = React.useState("");
  const [kind, setKind] = React.useState<"json" | "csv">("json");
  const [pending, start] = React.useTransition();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((t) => {
      setRaw(t);
      setKind(file.name.endsWith(".csv") ? "csv" : "json");
    });
  }

  function run() {
    if (!raw.trim()) return;
    start(async () => {
      const res = await importTermsAction({ raw, kind });
      if (res.ok) {
        toast.success(`${res.data.imported} termin idxal edildi, ${res.data.skipped} ötürüldü`);
        setRaw("");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input type="file" accept=".json,.csv,.md,.txt" onChange={onFile} className="text-sm" />
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={kind}
          onChange={(e) => setKind(e.target.value as "json" | "csv")}
        >
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
        </select>
      </div>
      <Textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={8}
        placeholder='[{"name":"Backpropagation","shortDef":"…","category":"ML"}]'
        className="font-mono text-xs"
      />
      <Button onClick={run} disabled={pending || !raw.trim()}>
        {pending ? "İdxal edilir…" : "İdxal et"}
      </Button>
    </div>
  );
}
