import Link from "next/link";
import { GraduationCap, Sparkles, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getLearnQueue } from "@/server/services/learn-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LearnSession } from "@/components/learn/learn-session";

export const metadata = { title: "Öyrənmə" };

export default async function LearnPage() {
  const user = await requireUser();
  const { cards, counts } = await getLearnQueue(user.id, 12);

  if (cards.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-2xl font-bold">Öyrənmə</h1>
        <Card>
          <CardContent className="space-y-4 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
              <Sparkles className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">Hər şey gündəmdədir 👌</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Bu gün üçün təkrar yoxdur. Yeni termin əlavə et və ya sabah qayıt.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/terms/new"><Plus className="h-4 w-4" /> Yeni termin</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/quizzes"><GraduationCap className="h-4 w-4" /> Test mərkəzi</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Öyrənmə seansı</h1>
        <p className="text-sm text-muted-foreground">
          {counts.due} təkrar · {counts.new} yeni · {counts.weak} zəif
        </p>
      </div>
      <LearnSession cards={cards} />
    </div>
  );
}
