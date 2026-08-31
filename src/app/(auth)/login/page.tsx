import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";
import { env } from "@/env";

export const metadata = { title: "Giriş" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string; registered?: string }>;
}) {
  const sp = await searchParams;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hesabına daxil ol</CardTitle>
        <CardDescription>
          {sp.registered
            ? "Qeydiyyat tamamlandı. İndi daxil ola bilərsən."
            : "Email və şifrənlə davam et."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm
          demo={
            env.DEMO_MODE && sp.demo
              ? { email: env.DEMO_EMAIL, password: env.DEMO_PASSWORD }
              : null
          }
        />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Hesabın yoxdur?{" "}
          <Link href="/register" className="text-primary underline underline-offset-2">
            Qeydiyyatdan keç
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
