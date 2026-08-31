"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/server/actions/auth";

export function LoginForm({ demo }: { demo: { email: string; password: string } | null }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [email, setEmail] = React.useState(demo?.email ?? "");
  const [password, setPassword] = React.useState(demo?.password ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await loginAction({ email, password });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Xoş gəldin!");
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Şifrə</Label>
        <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Yoxlanılır…" : "Daxil ol"}
      </Button>
    </form>
  );
}
