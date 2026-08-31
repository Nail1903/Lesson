"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { upsertSourceAction, deleteSourceAction } from "@/server/actions/misc";

const KINDS = ["BOOK", "ARTICLE", "PAPER", "WEBSITE", "VIDEO", "COURSE", "OTHER"];

interface Source {
  id: string;
  kind: string;
  title: string;
  authors: string | null;
  year: number | null;
  url: string | null;
  pages: string | null;
  doi: string | null;
  personalNote: string | null;
  termId: string | null;
  termName: string | null;
}

export function SourceManager({
  sources,
  terms,
}: {
  sources: Source[];
  terms: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    kind: "WEBSITE",
    title: "",
    authors: "",
    year: "",
    url: "",
    pages: "",
    doi: "",
    personalNote: "",
    termId: "",
  });
  const [pending, start] = React.useTransition();

  function save() {
    start(async () => {
      const res = await upsertSourceAction({
        ...form,
        year: form.year ? Number(form.year) : null,
        termId: form.termId || null,
      });
      if (res.ok) {
        toast.success("Mənbə saxlanıldı");
        setForm({ kind: "WEBSITE", title: "", authors: "", year: "", url: "", pages: "", doi: "", personalNote: "", termId: "" });
        setOpen(false);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-3">
      {!open ? (
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Mənbə əlavə et</Button>
      ) : (
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}>
              {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={form.termId} onChange={(e) => setForm((f) => ({ ...f, termId: e.target.value }))}>
              <option value="">— terminlə əlaqələndirmə —</option>
              {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <Input placeholder="Başlıq *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <div className="grid gap-2 sm:grid-cols-3">
            <Input placeholder="Müəllif(lər)" value={form.authors} onChange={(e) => setForm((f) => ({ ...f, authors: e.target.value }))} />
            <Input placeholder="İl" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} />
            <Input placeholder="Səhifə(lər)" value={form.pages} onChange={(e) => setForm((f) => ({ ...f, pages: e.target.value }))} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="URL" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
            <Input placeholder="DOI" value={form.doi} onChange={(e) => setForm((f) => ({ ...f, doi: e.target.value }))} />
          </div>
          <Textarea placeholder="Şəxsi qeyd" value={form.personalNote} onChange={(e) => setForm((f) => ({ ...f, personalNote: e.target.value }))} rows={2} />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={pending || !form.title.trim()}>Saxla</Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Ləğv et</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sources.length === 0 && <p className="text-sm text-muted-foreground">Hələ mənbə yoxdur.</p>}
        {sources.map((s) => (
          <div key={s.id} className="flex items-start justify-between rounded-md border px-3 py-2 text-sm">
            <div>
              <p className="font-medium">{s.title}</p>
              <p className="text-xs text-muted-foreground">
                {[s.kind, s.authors, s.year, s.pages && `s. ${s.pages}`].filter(Boolean).join(" · ")}
              </p>
              {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">{s.url}</a>}
              {s.termName && <p className="text-xs text-muted-foreground">Termin: {s.termName}</p>}
              {s.personalNote && <p className="mt-1 text-xs italic">{s.personalNote}</p>}
            </div>
            <button
              className="text-muted-foreground hover:text-destructive"
              onClick={() =>
                start(async () => {
                  const res = await deleteSourceAction(s.id);
                  if (res.ok) {
                    toast.success("Silindi");
                    router.refresh();
                  } else toast.error(res.error);
                })
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
