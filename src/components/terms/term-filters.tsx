"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Option { value: string; label: string }

export function TermFilters({
  categories,
  subjects,
}: {
  categories: Option[];
  subjects: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [q, setQ] = React.useState(sp.get("q") ?? "");
  const [showFilters, setShowFilters] = React.useState(false);

  const setParam = React.useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(sp.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname, sp],
  );

  const semantic = sp.get("mode") === "semantic";

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setParam("q", q.trim() || null);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={semantic ? "Mənaca axtar: “qrafda yeni obyektləri öyrənən model”" : "Ad, sinonim, qeyd mətni…"}
            className="pl-8"
          />
        </div>
        <Button
          type="button"
          variant={semantic ? "default" : "outline"}
          onClick={() => setParam("mode", semantic ? null : "semantic")}
          title="Semantik axtarış"
        >
          <Sparkles className="h-4 w-4" /> Semantik
        </Button>
        <Button type="button" variant="outline" onClick={() => setShowFilters((s) => !s)}>
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </form>

      {showFilters && (
        <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <SelectFilter label="Kateqoriya" param="category" options={categories} sp={sp} onChange={setParam} />
          <SelectFilter label="Fənn" param="subject" options={subjects} sp={sp} onChange={setParam} />
          <SelectFilter
            label="Status"
            param="status"
            options={[
              { value: "NEW", label: "Yeni" },
              { value: "LEARNING", label: "Öyrənilir" },
              { value: "UNDERSTOOD", label: "Başa düşülüb" },
              { value: "NEEDS_REVIEW", label: "Təkrar edilməlidir" },
            ]}
            sp={sp}
            onChange={setParam}
          />
          <SelectFilter
            label="Çətinlik"
            param="difficulty"
            options={[
              { value: "BEGINNER", label: "Başlanğıc" },
              { value: "INTERMEDIATE", label: "Orta" },
              { value: "ADVANCED", label: "İrəli" },
            ]}
            sp={sp}
            onChange={setParam}
          />
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
            <Toggle label="Zəif öyrənilmiş" active={sp.get("weak") === "1"} onClick={() => setParam("weak", sp.get("weak") === "1" ? null : "1")} />
            <Toggle label="Təkrar vaxtı çatmış" active={sp.get("due") === "1"} onClick={() => setParam("due", sp.get("due") === "1" ? null : "1")} />
            <Toggle label="Ad üzrə sırala" active={sp.get("sort") === "name"} onClick={() => setParam("sort", sp.get("sort") === "name" ? null : "name")} />
            <Toggle label="Vacibliyə görə" active={sp.get("sort") === "importance"} onClick={() => setParam("sort", sp.get("sort") === "importance" ? null : "importance")} />
          </div>
        </div>
      )}
    </div>
  );
}

function SelectFilter({
  label,
  param,
  options,
  sp,
  onChange,
}: {
  label: string;
  param: string;
  options: Option[];
  sp: URLSearchParams;
  onChange: (k: string, v: string | null) => void;
}) {
  return (
    <label className="text-xs font-medium text-muted-foreground">
      {label}
      <select
        className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
        value={sp.get(param) ?? ""}
        onChange={(e) => onChange(param, e.target.value || null)}
      >
        <option value="">Hamısı</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
