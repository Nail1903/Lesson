"use client";

import { useRouter } from "next/navigation";
import { Printer, GraduationCap, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExamToolbar({ examId, isTeacher }: { examId: string; isTeacher: boolean }) {
  const router = useRouter();
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <div className="flex overflow-hidden rounded-md border text-sm">
        <button
          className={`px-3 py-1.5 ${isTeacher ? "bg-primary text-primary-foreground" : ""}`}
          onClick={() => router.push(`/exams/${examId}?variant=teacher`)}
        >
          <GraduationCap className="mr-1 inline h-3.5 w-3.5" /> Müəllim
        </button>
        <button
          className={`px-3 py-1.5 ${!isTeacher ? "bg-primary text-primary-foreground" : ""}`}
          onClick={() => router.push(`/exams/${examId}?variant=student`)}
        >
          <User className="mr-1 inline h-3.5 w-3.5" /> Tələbə
        </button>
      </div>
      <Button size="sm" variant="outline" onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> Çap / PDF
      </Button>
    </div>
  );
}
