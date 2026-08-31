import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AssistantChat } from "@/components/assistant/assistant-chat";
import type { Citation } from "@/lib/rag/answer";

export const metadata = { title: "Bilik köməkçisi" };

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ chat?: string; q?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const [chats, terms, activeChat] = await Promise.all([
    db.chat.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 40,
      select: { id: true, title: true, mode: true, scope: true, updatedAt: true },
    }),
    db.term.findMany({
      where: { userId: user.id, deletedAt: null },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    sp.chat
      ? db.chat.findFirst({
          where: { id: sp.chat, userId: user.id, deletedAt: null },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        })
      : null,
  ]);

  return (
    <AssistantChat
      initialChats={chats.map((c) => ({ ...c, updatedAt: c.updatedAt.toISOString() }))}
      terms={terms}
      activeChat={
        activeChat
          ? {
              id: activeChat.id,
              title: activeChat.title,
              mode: activeChat.mode,
              scope: activeChat.scope,
              messages: activeChat.messages.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                citations: (m.citations as unknown as Citation[]) ?? [],
                confidence: m.confidence,
                hasGap: m.hasGap,
                usedGeneralKnowledge: m.usedGeneralKnowledge,
                helpfulVote: m.helpfulVote,
              })),
            }
          : null
      }
      initialQuestion={sp.q ?? ""}
    />
  );
}
