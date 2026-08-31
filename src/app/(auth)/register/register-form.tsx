"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/server/actions/auth";
import { loginAction } from "@/server/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [form, setForm] = React.useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    start(async () => {
      const res = await registerAction(form);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      await loginAction({ email: form.email, password: form.password });
      toast.success("Hesab yaradıldı!");
      router.push("/dashboard");
      router.refresh();
    });
  }

  const err = (k: string) => errors[k]?.[0];

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Ad" htmlFor="name" error={err("name")}>
        <Input id="name" required value={form.name} onChange={set("name")} />
      </Field>
      <Field label="Email" htmlFor="email" error={err("email")}>
        <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={set("email")} />
      </Field>
      <Field label="Şifrə" htmlFor="password" error={err("password")}>
        <Input id="password" type="password" autoComplete="new-password" required value={form.password} onChange={set("password")} />
      </Field>
      <Field label="Şifrəni təkrarla" htmlFor="confirm" error={err("confirm")}>
        <Input id="confirm" type="password" autoComplete="new-password" required value={form.confirm} onChange={set("confirm")} />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Yaradılır…" : "Qeydiyyatdan keç"}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
