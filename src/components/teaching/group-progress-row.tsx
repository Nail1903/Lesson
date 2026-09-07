"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { GroupProgressEditor } from "@/components/teaching/group-progress-editor";

export function GroupProgressRow({
  offeringId,
  groupId,
  groupName,
  studentCount,
  lastLessonName,
  lessons,
  initial,
}: {
  offeringId: string;
  groupId: string;
  groupName: string;
  studentCount: number | null;
  lastLessonName: string | null;
  lessons: { id: string; name: string }[];
  initial: { lastLessonId: string | null; note: string; nextStep: string };
}) {
  const [open, setOpen] = React.useState(false);
  const hasNote = !!initial.note || !!initial.nextStep || !!initial.lastLessonId;

  return (
    <div className="rounded-lg border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm"
      >
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
        <span className="font-medium">{groupName}</span>
        <span className="text-xs text-muted-foreground">
          {studentCount != null ? `${studentCount} tələbə` : ""}
          {lastLessonName ? ` · son: ${lastLessonName}` : hasNote ? "" : " · irəliləyiş qeyd olunmayıb"}
        </span>
        {initial.note && <span className="ml-auto truncate text-xs italic text-muted-foreground">“{initial.note.slice(0, 60)}”</span>}
      </button>
      {open && (
        <div className="border-t p-3">
          <GroupProgressEditor offeringId={offeringId} groupId={groupId} lessons={lessons} initial={initial} />
        </div>
      )}
    </div>
  );
}
