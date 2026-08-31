"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { createTermAction, updateTermAction } from "@/server/actions/terms";
import { cn } from "@/lib/utils";

interface Category { id: string; name: string }

export interface TermFormValues {
  id?: string;
  name: string;
  aliases: string;
  shortDef: string;
  longDef: string;
  inMyWords: string;
  practicalUse: string;
  categoryId: string;
  subcategory: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  status: "NEW" | "LEARNING" | "UNDERSTOOD" | "NEEDS_REVIEW";
  confidence: number;
  importance: number;
  tags: string;
}

const EMPTY: TermFormValues = {
  name: "",
  aliases: "",
  shortDef: "",
  longDef: "",
  inMyWords: "",
  practicalUse: "",
  categoryId: "",
  subcategory: "",
  difficulty: "BEGINNER",
  status: "NEW",
  confidence: 1,
  importance: 3,
  tags: "",
};

const DRAFT_KEY = "mylesson:term-draft";

export function TermForm({
  mode,
  categories,
  initial,
}: {
  mode: "create" | "edit";
  categories: Category[];
  initial?: Partial<TermFormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = React.useState<TermFormValues>({ ...EMPTY, ...initial });
  const [pending, start] = React.useTransition();
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const firstRender = React.useRef(true);

  // Restore local draft (create mode only)
  React.useEffect(() => {
    if (mode !== "create") return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        setValues((v) => ({ ...v, ...JSON.parse(raw) }));
        toast.info("Yadda saxlanmış qaralama bərpa edildi.");
      }
    } catch {
      /* ignore */
    }
  }, [mode]);

  const set = <K extends keyof TermFormValues>(k: K, val: TermFormValues[K]) =>
    setValues((v) => ({ ...v, [k]: val }));

  const toPayload = React.useCallback(
    () => ({
      ...(values.id ? { id: values.id } : {}),
      name: values.name.trim(),
      aliases: splitList(values.aliases),
      tags: splitList(values.tags),
      shortDef: values.shortDef,
      longDef: values.longDef,
      inMyWords: values.inMyWords,
      practicalUse: values.practicalUse,
      categoryId: values.categoryId || null,
      subcategory: values.subcategory,
      difficulty: values.difficulty,
      status: values.status,
      confidence: values.confidence,
      importance: values.importance,
      collectionIds: [],
    }),
    [values],
  );

  // Autosave (edit mode) + local draft (create mode)
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (mode === "create") {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
          setSavedAt("qaralama saxlanıldı");
        } catch {
          /* ignore */
        }
        return;
      }
      if (!values.name.trim() || !values.id) return;
      updateTermAction(toPayload()).then((res) => {
        if (res.ok) setSavedAt(`avtomatik saxlanıldı ${new Date().toLocaleTimeString("az-AZ")}`);
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [values, mode, toPayload]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    if (!values.name.trim()) {
      setErrors({ name: ["Terminin adı vacibdir"] });
      return;
    }
    start(async () => {
      const res =
        mode === "create"
          ? await createTermAction(toPayload())
          : await updateTermAction(toPayload());
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      if (mode === "create") {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
      }
      toast.success(mode === "create" ? "Termin yaradıldı" : "Dəyişikliklər saxlanıldı");
      router.push(`/terms/${res.data.slug}`);
      router.refresh();
    });
  }

  const err = (k: string) => errors[k]?.[0];

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="Əsas" defaultOpen>
        <div className="space-y-1.5">
          <Label htmlFor="name">Terminin adı *</Label>
          <Input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} required autoFocus />
          {err("name") && <p className="text-xs text-destructive">{err("name")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aliases">Alternativ adlar / sinonimlər (vergüllə)</Label>
          <Input id="aliases" value={values.aliases} onChange={(e) => set("aliases", e.target.value)} placeholder="GNN, qraf neyron şəbəkəsi" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="category">Kateqoriya</Label>
            <select
              id="category"
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={values.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
            >
              <option value="">— seçilməyib —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subcategory">Alt kateqoriya</Label>
            <Input id="subcategory" value={values.subcategory} onChange={(e) => set("subcategory", e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tags">Etiketlər (vergüllə)</Label>
          <Input id="tags" value={values.tags} onChange={(e) => set("tags", e.target.value)} placeholder="induktiv, sampling" />
        </div>
      </Section>

      <Section title="İzahlar">
        <div className="space-y-1.5">
          <Label>Qısa izah</Label>
          <Textarea value={values.shortDef} onChange={(e) => set("shortDef", e.target.value)} rows={2} />
        </div>
        <div className="space-y-1.5">
          <Label>Geniş izah (Markdown + LaTeX)</Label>
          <MarkdownEditor value={values.longDef} onChange={(v) => set("longDef", v)} minRows={6} />
        </div>
        <div className="space-y-1.5">
          <Label>Öz sözlərimlə</Label>
          <MarkdownEditor value={values.inMyWords} onChange={(v) => set("inMyWords", v)} minRows={4} />
        </div>
        <div className="space-y-1.5">
          <Label>Praktiki tətbiq</Label>
          <Textarea value={values.practicalUse} onChange={(e) => set("practicalUse", e.target.value)} rows={3} />
        </div>
      </Section>

      <Section title="Öyrənmə meta-məlumatı">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Çətinlik səviyyəsi
            <select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={values.difficulty} onChange={(e) => set("difficulty", e.target.value as never)}>
              <option value="BEGINNER">Başlanğıc</option>
              <option value="INTERMEDIATE">Orta</option>
              <option value="ADVANCED">İrəli</option>
            </select>
          </label>
          <label className="text-sm">
            Öyrənmə statusu
            <select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={values.status} onChange={(e) => set("status", e.target.value as never)}>
              <option value="NEW">Yeni</option>
              <option value="LEARNING">Öyrənilir</option>
              <option value="UNDERSTOOD">Başa düşülüb</option>
              <option value="NEEDS_REVIEW">Təkrar edilməlidir</option>
            </select>
          </label>
          <RangeField label={`Şəxsi əminlik: ${values.confidence}/5`} value={values.confidence} onChange={(n) => set("confidence", n)} />
          <RangeField label={`Vaciblik: ${values.importance}/5`} value={values.importance} onChange={(n) => set("importance", n)} />
        </div>
      </Section>

      <div className="sticky bottom-0 flex items-center gap-3 border-t bg-background/90 py-3 backdrop-blur">
        <Button type="submit" disabled={pending}>
          {pending ? "Saxlanılır…" : mode === "create" ? "Termini yarat" : "Dəyişiklikləri saxla"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Ləğv et</Button>
        {savedAt && <span className="text-xs text-muted-foreground">{savedAt}</span>}
      </div>
    </form>
  );
}

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-medium"
      >
        {title}
        <span className={cn("text-muted-foreground transition-transform", open && "rotate-180")}>⌄</span>
      </button>
      {open && <div className="space-y-4 border-t p-4">{children}</div>}
    </div>
  );
}

function RangeField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="text-sm">
      {label}
      <input type="range" min={1} max={5} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full accent-primary" />
    </label>
  );
}

function splitList(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
