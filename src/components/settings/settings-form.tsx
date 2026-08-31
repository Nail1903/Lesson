"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/server/actions/misc";

export function SettingsForm({
  initial,
  serverDefaultProvider,
}: {
  initial: { name: string; locale: string; aiProvider: string };
  serverDefaultProvider: string;
}) {
  const router = useRouter();
  const [form, setForm] = React.useState(initial);
  const [pending, start] = React.useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await updateProfileAction(form);
          if (res.ok) {
            toast.success("Yadda saxlanıldı");
            router.refresh();
          } else toast.error(res.error);
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Ad</Label>
        <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="locale">Dil</Label>
        <select
          id="locale"
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={form.locale}
          onChange={(e) => setForm((f) => ({ ...f, locale: e.target.value }))}
        >
          <option value="az">Azərbaycan</option>
          <option value="en">English</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="prov">AI provayder (şəxsi seçim)</Label>
        <select
          id="prov"
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={form.aiProvider}
          onChange={(e) => setForm((f) => ({ ...f, aiProvider: e.target.value }))}
        >
          <option value="">Server default ({serverDefaultProvider})</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="echo">Echo (oflayn)</option>
        </select>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Saxlanılır…" : "Saxla"}</Button>
    </form>
  );
}
