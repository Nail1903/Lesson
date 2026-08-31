import { History } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/app/empty-state";
import { ChatHistoryRow } from "@/components/assistant/chat-history-row";

export const metadata = { title: "Sual-cavab tarixçəsi" };

export default async function HistoryPage() {
  const user = await requireUser();
  const chats = await db.chat.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 1, select: { content: true } },
      _count: { select: { messages: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Sual-cavab tarixçəsi</h1>
        <p className="text-sm text-muted-foreground">Bütün AI dialoqları burada saxlanılır.</p>
      </div>

      {chats.length === 0 ? (
        <EmptyState
          icon={History}
          title="Hələ söhbət yoxdur"
          description="Bilik köməkçisinə ilk sualını ver."
          actionLabel="Bilik köməkçisi"
          actionHref="/assistant"
        />
      ) : (
        <div className="space-y-2">
          {chats.map((c) => (
            <ChatHistoryRow
              key={c.id}
              id={c.id}
              title={c.title}
              preview={c.messages[0]?.content ?? ""}
              count={c._count.messages}
              updatedAt={c.updatedAt.toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
