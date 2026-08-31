"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/env";
import { limit } from "@/lib/rate-limit";
import { ask } from "@/lib/rag/answer";
import { askSchema } from "@/lib/validations/misc";
import { reindexTerm } from "@/lib/rag/indexer";
import { logActivity } from "@/server/services/activity";
import { ok, fail, fromError, type ActionResult } from "@/server/actions/_result";
import type { AskActionData } from "@/server/actions/types";

export async function askAction(raw: unknown): Promise<ActionResult<AskActionData>> {
  try {
    const user = await requireUser();

    const rl = limit(`ai:${user.id}`, env.RATE_LIMIT_AI_PER_MINUTE);
    if (!rl.ok) return fail("Çox tez-tez sorğu göndərirsiniz. Bir dəqiqə gözləyin.");

    const parsed = askSchema.safeParse(raw);
    if (!parsed.success) return fail("Sual düzgün deyil", parsed.error.flatten().fieldErrors);
    const input = parsed.data;

    let chatId = input.chatId;
    if (chatId) {
      const owns = await db.chat.findFirst({ where: { id: chatId, userId: user.id }, select: { id: true } });
      if (!owns) return fail("Söhbət tapılmadı");
    } else {
      const chat = await db.chat.create({
        data: {
          userId: user.id,
          title: input.question.slice(0, 60),
          mode: input.mode,
          scope: input.scope,
        },
      });
      chatId = chat.id;
    }

    const history = await db.chatMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      take: 12,
      select: { role: true, content: true },
    });

    const userMessage = await db.chatMessage.create({
      data: { chatId, role: "USER", content: input.question },
    });

    const result = await ask({
      userId: user.id,
      question: input.question,
      mode: input.mode,
      scope: input.scope,
      termIds: input.termIds,
      categoryIds: input.categoryIds,
      history: history.map((h) => ({
        role: h.role === "ASSISTANT" ? "assistant" : "user",
        content: h.content,
      })),
      providerOverride: (await db.user.findUnique({ where: { id: user.id }, select: { aiProvider: true } }))?.aiProvider,
    });

    const assistantMessage = await db.chatMessage.create({
      data: {
        chatId,
        role: "ASSISTANT",
        content: result.text,
        citations: result.citations as unknown as object,
        confidence: result.confidence,
        hasGap: result.hasGap,
        usedGeneralKnowledge: result.usedGeneralKnowledge,
        model: result.model,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
      },
    });

    await db.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
    await logActivity({ userId: user.id, type: "chat.message", entity: "Chat", entityId: chatId });

    revalidatePath("/assistant");
    revalidatePath("/history");

    return ok({
      chatId,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      answer: result.text,
      citations: result.citations,
      confidence: result.confidence,
      hasGap: result.hasGap,
      usedGeneralKnowledge: result.usedGeneralKnowledge,
      relatedTermIds: result.relatedTermIds,
      model: result.model,
    });
  } catch (e) {
    return fromError(e);
  }
}

export async function renameChatAction(chatId: string, title: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    const clean = title.trim().slice(0, 120) || "Adsız söhbət";
    await db.chat.updateMany({ where: { id: chatId, userId: user.id }, data: { title: clean } });
    revalidatePath("/history");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteChatAction(chatId: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await db.chat.updateMany({ where: { id: chatId, userId: user.id }, data: { deletedAt: new Date() } });
    revalidatePath("/history");
    revalidatePath("/assistant");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function voteMessageAction(messageId: string, vote: 1 | -1 | 0): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    const msg = await db.chatMessage.findFirst({
      where: { id: messageId, chat: { userId: user.id } },
      select: { id: true },
    });
    if (!msg) return fail("Tapılmadı");
    await db.chatMessage.update({
      where: { id: messageId },
      data: { helpfulVote: vote === 0 ? null : vote },
    });
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

/** Turn an assistant answer into a note or example on a term — requires explicit user action. */
export async function promoteAnswerAction(input: {
  messageId: string;
  termId: string;
  as: "note" | "example";
  exampleKind?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const msg = await db.chatMessage.findFirst({
      where: { id: input.messageId, chat: { userId: user.id }, role: "ASSISTANT" },
      select: { content: true, model: true },
    });
    if (!msg) return fail("Cavab tapılmadı");
    const term = await db.term.findFirst({ where: { id: input.termId, userId: user.id, deletedAt: null }, select: { id: true, slug: true } });
    if (!term) return fail("Termin tapılmadı");

    let createdId: string;
    if (input.as === "note") {
      const n = await db.note.create({
        data: {
          userId: user.id,
          termId: term.id,
          title: "AI köməkçisindən",
          body: `> ℹ️ Bu qeyd AI köməkçisinin cavabından yaradılıb (${msg.model ?? "?"}) və istifadəçi tərəfindən təsdiqlənib.\n\n${msg.content}`,
          isAiGenerated: true,
          aiModel: msg.model,
        },
      });
      createdId = n.id;
    } else {
      const e = await db.example.create({
        data: {
          userId: user.id,
          termId: term.id,
          kind: (input.exampleKind as never) ?? "USER",
          title: "AI köməkçisindən",
          body: msg.content,
          isAiGenerated: true,
          aiModel: msg.model,
        },
      });
      createdId = e.id;
    }

    await reindexTerm(term.id, user.id).catch(() => undefined);
    revalidatePath(`/terms/${term.slug}`);
    return ok({ id: createdId });
  } catch (e) {
    return fromError(e);
  }
}
