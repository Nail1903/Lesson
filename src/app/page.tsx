import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BrainCircuit,
  Network,
  MessageSquareText,
  Repeat2,
  Search,
  GraduationCap,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { env } from "@/env";

const features = [
  { icon: BrainCircuit, title: "Strukturlu terminlər", desc: "Qısa/geniş izah, öz sözlərinlə, nümunələr, düsturlar, kod, mənbələr — hamısı bir yerdə." },
  { icon: Network, title: "Bilik qrafı", desc: "Terminləri 8 əlaqə növü ilə bağla və interaktiv qrafda gör." },
  { icon: Search, title: "Semantik axtarış", desc: "Dəqiq sözü unutsan belə, mənaca uyğun termini tap (pgvector RAG)." },
  { icon: MessageSquareText, title: "Bilik köməkçisi", desc: "AI yalnız SƏNİN qeydlərinə əsaslanır, mənbələri göstərir, uydurmaqdan çəkinir." },
  { icon: GraduationCap, title: "Test mərkəzi", desc: "Qeydlərindən 10 növ sual; cavabın mənası qiymətləndirilir." },
  { icon: Repeat2, title: "Aralıqlı təkrar", desc: "SM-2 alqoritmi ilə hər terminin növbəti təkrar tarixini hesablayır." },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 font-semibold">
          <BrainCircuit className="h-5 w-5 text-primary" /> MyLesson
        </span>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Giriş</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Qeydiyyat</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6">
        <section className="py-16 md:py-24">
          <p className="mb-3 text-sm font-medium text-primary">Şəxsi bilik və yaddaş sistemi</p>
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Topladığın məlumatı passiv qeyd deyil, aktiv biliyə çevir.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Termin əlavə et → nümunə ilə zənginləşdir → digər anlayışlarla əlaqələndir → AI-yə sual ver →
            testdən keç → zəif tərəfləri müəyyən et → vaxtı çatanda təkrar et.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register">Pulsuz başla</Link>
            </Button>
            {env.DEMO_MODE && (
              <Button asChild size="lg" variant="outline">
                <Link href={`/login?demo=1`}>Demo ilə bax</Link>
              </Button>
            )}
          </div>
          {env.DEMO_MODE && (
            <p className="mt-3 text-xs text-muted-foreground">
              Demo: <code className="rounded bg-muted px-1">{env.DEMO_EMAIL}</code> /{" "}
              <code className="rounded bg-muted px-1">{env.DEMO_PASSWORD}</code>
            </p>
          )}
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        MyLesson · Next.js · PostgreSQL + pgvector · dəyişdirilə bilən AI provayder
      </footer>
    </div>
  );
}
