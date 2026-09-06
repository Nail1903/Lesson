import Link from "next/link";
import {
  Plus,
  GraduationCap,
  MessageSquareText,
  Repeat2,
  ArrowRight,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/server/queries/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_LABEL, STATUS_VARIANT } from "@/lib/labels";
import { relativeTime } from "@/lib/utils";

export const metadata = { title: "İdarə paneli" };

export default async function DashboardPage() {
  const user = await requireUser();
  const d = await getDashboardData(user.id);

  const readyToLearn = d.dueCount + d.newCount;

  const stats = [
    { label: "Ümumi termin", value: d.totalTerms, href: "/terms" },
    { label: "Fənn", value: d.totalSubjects, href: "/subjects" },
    { label: "Kateqoriya", value: d.totalCategories, href: "/collections" },
    { label: "Bu gün əlavə olundu", value: d.addedToday, href: "/terms?sort=recent" },
    { label: "Bu həftə öyrənildi", value: d.learnedThisWeek, href: "/terms?status=UNDERSTOOD" },
    { label: "Təkrar vaxtı çatıb", value: d.dueCount, href: "/learn", highlight: d.dueCount > 0 },
  ];

  const maxStreak = Math.max(1, ...d.streak.map((s) => s.count));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">İdarə paneli</h1>
        <p className="text-sm text-muted-foreground">Öyrənmə dövrünə buradan davam et.</p>
      </div>

      {/* Tək, aydın öyrənmə giriş nöqtəsi */}
      <Card className="border-primary/40 bg-gradient-to-br from-accent/50 to-transparent">
        <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Bu gün öyrənməyə hazır</p>
            <p className="mt-0.5 text-3xl font-bold tabular-nums">
              {readyToLearn} <span className="text-base font-normal text-muted-foreground">termin</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {d.dueCount} təkrar · {d.newCount} yeni{d.weakCount ? ` · ${d.weakCount} zəif` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href="/learn"><Repeat2 className="h-4 w-4" /> {readyToLearn > 0 ? "Öyrənməyə başla" : "Təkrar et"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/quizzes"><GraduationCap className="h-4 w-4" /> Test et</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/terms/new"><Plus className="h-4 w-4" /> Yeni termin</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/import-export"><ArrowRight className="h-4 w-4" /> Dərs materialı idxal et</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/assistant"><MessageSquareText className="h-4 w-4" /> Qeydlərimə sual ver</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className={s.highlight ? "border-primary/50" : ""}>
              <CardContent className="p-4">
                <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">14 günlük öyrənmə ardıcıllığı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5">
              {d.streak.map((s) => (
                <div key={s.date} className="flex flex-1 flex-col items-center gap-1" title={`${s.date}: ${s.count} fəaliyyət`}>
                  <div
                    className="w-full rounded-sm bg-primary/80"
                    style={{ height: `${8 + (s.count / maxStreak) * 72}px` }}
                  />
                  <span className="text-[9px] text-muted-foreground">{s.date.slice(8)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Statuslar</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {d.statusGroups.length === 0 && <p className="text-sm text-muted-foreground">Hələ məlumat yoxdur.</p>}
            {d.statusGroups.map((g) => (
              <div key={g.status} className="flex items-center justify-between text-sm">
                <Badge variant={STATUS_VARIANT[g.status]}>{STATUS_LABEL[g.status]}</Badge>
                <span className="tabular-nums text-muted-foreground">{g.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Zəif öyrənilən terminlər</CardTitle>
            <Link href="/terms?weak=1" className="text-xs text-primary">hamısı</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.weakTerms.length === 0 && <p className="text-sm text-muted-foreground">Zəif termin yoxdur 🎉</p>}
            {d.weakTerms.map((t) => (
              <Link key={t.id} href={`/terms/${t.slug}`} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <span className="truncate">{t.name}</span>
                <span className="text-xs text-muted-foreground">əminlik {t.confidence}/5</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Son redaktə edilən</CardTitle>
            <Link href="/terms" className="text-xs text-primary">hamısı</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.recentTerms.map((t) => (
              <Link key={t.id} href={`/terms/${t.slug}`} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <span className="truncate">{t.name}</span>
                <span className="text-xs text-muted-foreground">{relativeTime(t.updatedAt)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Son AI söhbətləri</CardTitle>
            <Link href="/history" className="text-xs text-primary">hamısı</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.recentChats.length === 0 && <p className="text-sm text-muted-foreground">Hələ söhbət yoxdur.</p>}
            {d.recentChats.map((c) => (
              <Link key={c.id} href={`/assistant?chat=${c.id}`} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <span className="truncate">{c.title}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {d.categoryGroups.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Kateqoriyalara görə bilik bölgüsü</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {d.categoryGroups.map((c) => {
              const pct = Math.round((c._count.terms / Math.max(1, d.totalTerms)) * 100);
              return (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{c.name}</span>
                    <span className="text-muted-foreground">{c._count.terms} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: c.color ?? "hsl(var(--primary))" }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
