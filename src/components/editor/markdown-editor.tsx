"use client";

import * as React from "react";
import { Bold, Italic, List, ListChecks, Code2, Link2, Sigma, Heading2, Quote, Table2, Eye, Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";

interface Tool {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  wrap?: [string, string];
  block?: string;
}

const TOOLS: Tool[] = [
  { icon: Heading2, title: "Başlıq", block: "## " },
  { icon: Bold, title: "Qalın", wrap: ["**", "**"] },
  { icon: Italic, title: "Maili", wrap: ["_", "_"] },
  { icon: List, title: "Siyahı", block: "- " },
  { icon: ListChecks, title: "Checklist", block: "- [ ] " },
  { icon: Quote, title: "Sitat", block: "> " },
  { icon: Code2, title: "Kod bloku", wrap: ["\n```\n", "\n```\n"] },
  { icon: Sigma, title: "LaTeX düstur", wrap: ["$$", "$$"] },
  { icon: Link2, title: "Link", wrap: ["[", "](https://)"] },
  { icon: Table2, title: "Cədvəl", block: "\n| A | B |\n| --- | --- |\n| 1 | 2 |\n" },
];

export function MarkdownEditor({
  value,
  onChange,
  minRows = 6,
  placeholder = "Markdown, LaTeX ($$…$$), kod blokları və [[Termin keçidi]] dəstəklənir…",
}: {
  value: string;
  onChange: (v: string) => void;
  minRows?: number;
  placeholder?: string;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = React.useState<"write" | "preview">("write");

  function apply(tool: Tool) {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const sel = value.slice(s, e);
    let next: string;
    let caret: number;
    if (tool.wrap) {
      next = value.slice(0, s) + tool.wrap[0] + sel + tool.wrap[1] + value.slice(e);
      caret = s + tool.wrap[0].length + sel.length;
    } else {
      const lineStart = value.lastIndexOf("\n", s - 1) + 1;
      next = value.slice(0, lineStart) + tool.block + value.slice(lineStart);
      caret = e + (tool.block?.length ?? 0);
    }
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(caret, caret);
    });
  }

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-0.5 border-b bg-muted/40 p-1">
        {TOOLS.map((t) => (
          <button
            key={t.title}
            type="button"
            title={t.title}
            onClick={() => apply(t)}
            className="rounded p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <t.icon className="h-4 w-4" />
          </button>
        ))}
        <div className="ml-auto flex">
          <TabBtn active={tab === "write"} onClick={() => setTab("write")} icon={Pencil} label="Yaz" />
          <TabBtn active={tab === "preview"} onClick={() => setTab("preview")} icon={Eye} label="Önizləmə" />
        </div>
      </div>

      {tab === "write" ? (
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[8rem] rounded-none border-0 font-mono text-[13px] focus-visible:ring-0"
          style={{ minHeight: `${minRows * 1.6}rem` }}
        />
      ) : (
        <div className="min-h-[8rem] p-3">
          {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-muted-foreground">Önizləmə üçün mətn yoxdur.</p>}
        </div>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded px-2 py-1 text-xs",
        active ? "bg-background font-medium text-foreground" : "text-muted-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
