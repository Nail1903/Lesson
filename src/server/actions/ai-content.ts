"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/env";
import { limit } from "@/lib/rate-limit";
import { getChatProvider } from "@/lib/ai";
import { reindexTerm } from "@/lib/rag/indexer";
import { ok, fail, fromError, type ActionResult } from "@/server/actions/_result";

const STYLE_PROMPT: Record<string, string> = {
  simpler: "Daha sadə, gündəlik dildə, jarqonsuz bir nümunə ver.",
  technical: "Daha texniki, dəqiq bir nümunə ver (lazım olsa kod və ya düstur ilə).",
  another: "Əvvəlkilərdən fərqli, yeni bir nümunə ver.",
  real_life: "Real həyatdan konkret bir tətbiq nümunəsi ver.",
};

/**
 * Generate an example suggestion for a term. It is stored as a PENDING
 * AIContentSuggestion and NOT added to the term until the user accepts it.
 */
export async function suggestExampleAction(input: {
  termId: string;
  style: keyof typeof STYLE_PROMPT;
}): Promise<ActionResult<{ id: string; text: string; provider: string }>> {
  try {
    const user = await requireUser();
    if (!limit(`ai:${user.id}`, env.RATE_LIMIT_AI_PER_MINUTE).ok) {
      return fail("Çox tez-tez sorğu göndərirsiniz. Bir dəqiqə gözləyin.");
    }

    const term = await db.term.findFirst({
      where: { id: input.termId, userId: user.id, deletedAt: null },
      include: {
        examples: { where: { deletedAt: null }, select: { body: true }, take: 4 },
      },
    });
    if (!term) return fail("Termin tapılmadı");

    const provider = getChatProvider();
    const context = [
      `Termin: ${term.name}`,
      term.shortDef && `Qısa izah: ${term.shortDef}`,
      term.longDef && `Geniş izah: ${term.longDef}`,
      term.inMyWords && `İstifadəçinin öz sözləri: ${term.inMyWords}`,
      term.examples.length ? `Mövcud nümunələr:\n- ${term.examples.map((e) => e.body).join("\n- ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await provider.complete({
      temperature: 0.6,
      maxTokens: 500,
      messages: [
        {
          role: "system",
          content:
            "Sən öyrənmə köməkçisisən. YALNIZ verilən termin məlumatına əsaslan. " +
            "Qısa (2-5 cümlə), konkret bir nümunə yaz. Azərbaycan dilində. Markdown olar.",
        },
        { role: "user", content: `${context}\n\nTapşırıq: ${STYLE_PROMPT[input.style]}` },
      ],
    });

    const suggestion = await db.aIContentSuggestion.create({
      data: {
        userId: user.id,
        termId: term.id,
        type: "EXAMPLE",
        status: "PENDING",
        model: res.model,
        prompt: STYLE_PROMPT[input.style],
        payload: { text: res.text, style: input.style } as object,
      },
    });

    return ok({ id: suggestion.id, text: res.text, provider: provider.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function resolveSuggestionAction(input: {
  id: string;
  accept: boolean;
  exampleKind?: string;
  editedText?: string;
}): Promise<ActionResult<{ exampleId?: string }>> {
  try {
    const user = await requireUser();
    const s = await db.aIContentSuggestion.findFirst({
      where: { id: input.id, userId: user.id, status: "PENDING" },
      include: { term: { select: { id: true, slug: true } } },
    });
    if (!s) return fail("Təklif tapılmadı");

    if (!input.accept) {
      await db.aIContentSuggestion.update({
        where: { id: s.id },
        data: { status: "REJECTED", reviewedAt: new Date() },
      });
      revalidatePath(`/terms/${s.term.slug}`);
      return ok({});
    }

    const payload = s.payload as { text?: string };
    const body = (input.editedText ?? payload.text ?? "").trim();
    if (!body) return fail("Boş məzmun");

    const example = await db.example.create({
      data: {
        userId: user.id,
        termId: s.termId,
        kind: (input.exampleKind as never) ?? "USER",
        title: "AI təklifi (təsdiqlənib)",
        body,
        isAiGenerated: true,
        aiModel: s.model,
      },
    });

    await db.aIContentSuggestion.update({
      where: { id: s.id },
      data: { status: "ACCEPTED", reviewedAt: new Date(), appliedEntityId: example.id },
    });

    await reindexTerm(s.termId, user.id).catch(() => undefined);
    revalidatePath(`/terms/${s.term.slug}`);
    return ok({ exampleId: example.id });
  } catch (e) {
    return fromError(e);
  }
}
