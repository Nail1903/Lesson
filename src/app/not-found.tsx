import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-5xl font-bold">404</p>
      <p className="text-muted-foreground">Axtardığınız səhifə tapılmadı.</p>
      <Button asChild>
        <Link href="/dashboard">İdarə panelinə qayıt</Link>
      </Button>
    </div>
  );
}
