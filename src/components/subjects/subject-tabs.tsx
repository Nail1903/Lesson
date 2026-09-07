"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Ümumi baxış" },
  { key: "lessons", label: "Dərslər" },
  { key: "program", label: "Proqram & Sillabus" },
  { key: "teaching", label: "Tədris (semestr, təqvim)" },
  { key: "terms", label: "Terminlər" },
] as const;

export function SubjectTabs({ slug, active }: { slug: string; active: string }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap gap-1 border-b">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={`${pathname}?tab=${t.key}`}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
            active === t.key
              ? "border-primary font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
