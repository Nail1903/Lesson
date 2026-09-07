import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/env";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/settings-form";
import { DangerZone } from "@/components/settings/danger-zone";
import { SECONDARY_LINKS } from "@/components/app/nav-items";

export const metadata = { title: "Profil və parametrlər" };

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { name: true, email: true, locale: true, aiProvider: true, isDemo: true, createdAt: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Profil və parametrlər</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil</CardTitle>
          <CardDescription>{profile.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm
            initial={{
              name: profile.name ?? "",
              locale: profile.locale,
              aiProvider: profile.aiProvider ?? "",
            }}
            serverDefaultProvider={env.AI_PROVIDER}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI provayder</CardTitle>
          <CardDescription>
            Server default: <code className="rounded bg-muted px-1">{env.AI_PROVIDER}</code> · embedding:{" "}
            <code className="rounded bg-muted px-1">{env.EMBEDDING_PROVIDER}</code>. Provayderi{" "}
            <code className="rounded bg-muted px-1">.env</code> faylında dəyişə bilərsiniz (openai / anthropic / echo).
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Bütün AI sorğuları yalnız serverdə icra olunur; API açarları brauzerə göndərilmir.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ətraflı bölmələr</CardTitle>
          <CardDescription>Naviqasiyadan çıxarılıb — burada əlçatandır.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1.5 sm:grid-cols-2">
          {SECONDARY_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
              {l.label}
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Təhlükəli zona</CardTitle>
          <CardDescription>Bu əməliyyatlar geri qaytarıla bilməz.</CardDescription>
        </CardHeader>
        <CardContent>
          <DangerZone isDemo={profile.isDemo} />
        </CardContent>
      </Card>
    </div>
  );
}
