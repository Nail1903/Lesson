import Link from "next/link";
import { FileText, Lightbulb, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, STATUS_VARIANT, DIFFICULTY_LABEL } from "@/lib/labels";
import { truncate } from "@/lib/utils";

interface TermCardData {
  id: string;
  name: string;
  slug: string;
  shortDef: string | null;
  status: string;
  difficulty: string;
  confidence: number;
  importance: number;
  category?: { name: string; color: string | null } | null;
  tags?: { id: string; name: string }[];
  _count?: { examples: number; notes: number; relationsFrom: number; relationsTo: number };
}

export function TermCard({ term, snippet, score }: { term: TermCardData; snippet?: string; score?: number }) {
  const rel = term._count ? term._count.relationsFrom + term._count.relationsTo : 0;
  return (
    <Link
      href={`/terms/${term.slug}`}
      className="group flex flex-col rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold group-hover:text-primary">{term.name}</h3>
        {typeof score === "number" && (
          <span className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
            {Math.round(score * 100)}%
          </span>
        )}
      </div>

      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {snippet ? truncate(snippet, 160) : term.shortDef ? truncate(term.shortDef, 160) : "İzah hələ yazılmayıb."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {term.category && (
          <span
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]"
            style={{ background: `${term.category.color ?? "#6d28d9"}20`, color: term.category.color ?? "#6d28d9" }}
          >
            {term.category.name}
          </span>
        )}
        <Badge variant={STATUS_VARIANT[term.status]}>{STATUS_LABEL[term.status]}</Badge>
        <Badge variant="outline">{DIFFICULTY_LABEL[term.difficulty]}</Badge>
      </div>

      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><Lightbulb className="h-3 w-3" />{term._count?.examples ?? 0}</span>
        <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{term._count?.notes ?? 0}</span>
        <span className="flex items-center gap-1"><Network className="h-3 w-3" />{rel}</span>
        <span className="ml-auto">əminlik {term.confidence}/5 · vaciblik {term.importance}/5</span>
      </div>
    </Link>
  );
}
