"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Send,
  Plus,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  AlertTriangle,
  Trash2,
  MessageSquareText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/markdown";
import { CHAT_MODE_LABEL } from "@/lib/labels";
import { cn, relativeTime } from "@/lib/utils";
import {
  askAction,
  voteMessageAction,
  deleteChatAction,
  promoteAnswerAction,
} from "@/server/actions/assistant";
import type { Citation } from "@/lib/rag/answer";

interface Msg {
  id: string;
  role: string;
  content: string;
  citations: Citation[];
  confidence: number | null;
  hasGap: boolean;
  usedGeneralKnowledge: boolean;
  helpfulVote: number | null;
}

interface ChatSummary {
  id: string;
  title: string;
  mode: string;
  scope: string;
  updatedAt: string;
}

const MODES = Object.keys(CHAT_MODE_LABEL);

export function AssistantChat({
  initialChats,
  terms,
  activeChat,
  initialQuestion,
}: {
  initialChats: ChatSummary[];
  terms: { id: string; name: string; slug: string }[];
  activeChat: {
    id: string;
    title: string;
    mode: string;
    scope: string;
    messages: Msg[];
  } | null;
  initialQuestion: string;
}) {
  const router = useRouter();
  const [chatId, setChatId] = React.useState<string | null>(activeChat?.id ?? null);
  const [messages, setMessages] = React.useState<Msg[]>(activeChat?.messages ?? []);
  const [input, setInput] = React.useState(initialQuestion);
  const [mode, setMode] = React.useState(activeChat?.mode ?? "TEACHER");
  const [scope, setScope] = React.useState<"NOTES_ONLY" | "NOTES_PLUS_AI">(
    (activeChat?.scope as "NOTES_ONLY" | "NOTES_PLUS_AI") ?? "NOTES_ONLY",
  );
  const [pending, start] = React.useTransition();
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    const q = input.trim();
    if (!q || pending) return;
    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      role: "USER",
      content: q,
      citations: [],
      confidence: null,
      hasGap: false,
      usedGeneralKnowledge: false,
      helpfulVote: null,
    };
    setMessages((m) => [...m, optimistic]);
    setInput("");

    start(async () => {
      const res = await askAction({ chatId: chatId ?? undefined, question: q, mode: mode as never, scope });
      if (!res.ok) {
        toast.error(res.error);
        setMessages((m) => m.filter((x) => x.id !== optimistic.id));
        return;
      }
      setChatId(res.data.chatId);
      setMessages((m) => [
        ...m.filter((x) => x.id !== optimistic.id),
        { ...optimistic, id: res.data.userMessageId },
        {
          id: res.data.assistantMessageId,
          role: "ASSISTANT",
          content: res.data.answer,
          citations: res.data.citations,
          confidence: res.data.confidence,
          hasGap: res.data.hasGap,
          usedGeneralKnowledge: res.data.usedGeneralKnowledge,
          helpfulVote: null,
        },
      ]);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      {/* Chat list */}
      <aside className="hidden lg:block">
        <Button
          size="sm"
          className="mb-3 w-full"
          onClick={() => {
            setChatId(null);
            setMessages([]);
            router.push("/assistant");
          }}
        >
          <Plus className="h-4 w-4" /> Yeni söhbət
        </Button>
        <div className="space-y-1">
          {initialChats.map((c) => (
            <div
              key={c.id}
              className={cn(
                "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                c.id === chatId && "bg-muted font-medium",
              )}
            >
              <Link href={`/assistant?chat=${c.id}`} className="flex-1 truncate">
                {c.title}
                <span className="block text-[10px] text-muted-foreground">{relativeTime(c.updatedAt)}</span>
              </Link>
              <button
                className="opacity-0 group-hover:opacity-100"
                onClick={async () => {
                  const res = await deleteChatAction(c.id);
                  if (res.ok) {
                    toast.success("Söhbət silindi");
                    if (c.id === chatId) {
                      setChatId(null);
                      setMessages([]);
                    }
                    router.push("/assistant");
                    router.refresh();
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Conversation */}
      <div className="flex min-h-[calc(100vh-8rem)] flex-col rounded-xl border">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            {MODES.map((m) => (
              <option key={m} value={m}>{CHAT_MODE_LABEL[m]}</option>
            ))}
          </select>
          <div className="flex overflow-hidden rounded-md border text-xs">
            <button
              className={cn("px-2.5 py-1.5", scope === "NOTES_ONLY" && "bg-primary text-primary-foreground")}
              onClick={() => setScope("NOTES_ONLY")}
            >
              Yalnız mənim qeydlərim
            </button>
            <button
              className={cn("px-2.5 py-1.5", scope === "NOTES_PLUS_AI" && "bg-primary text-primary-foreground")}
              onClick={() => setScope("NOTES_PLUS_AI")}
            >
              Qeydlərim + AI biliyi
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <MessageSquareText className="h-10 w-10 opacity-40" />
              <p className="mt-3 max-w-sm text-sm">
                Qeydlərinə əsaslanan sual ver. Məsələn: “GraphSAGE ilə GCN arasındakı fərqləri mənim qeydlərimə əsasən izah et.”
              </p>
            </div>
          )}

          {messages.map((m) =>
            m.role === "USER" ? (
              <div key={m.id} className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                {m.content}
              </div>
            ) : (
              <AssistantMessage key={m.id} msg={m} terms={terms} onVote={(v) => voteMessageAction(m.id, v)} />
            ),
          )}
          {pending && <p className="text-sm text-muted-foreground">Köməkçi düşünür…</p>}
          <div ref={bottomRef} />
        </div>

        <div className="border-t p-3">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Sualını yaz… (Enter — göndər, Shift+Enter — yeni sətir)"
              className="min-h-[44px] resize-none"
              rows={1}
            />
            <Button onClick={send} disabled={pending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssistantMessage({
  msg,
  terms,
  onVote,
}: {
  msg: Msg;
  terms: { id: string; name: string; slug: string }[];
  onVote: (v: 1 | -1 | 0) => void;
}) {
  const router = useRouter();
  const [vote, setVote] = React.useState<number | null>(msg.helpfulVote);
  const [promoteOpen, setPromoteOpen] = React.useState(false);

  return (
    <div className="max-w-[85%] space-y-2">
      <div className="rounded-2xl rounded-bl-sm border bg-card px-3.5 py-2.5">
        <Markdown>{msg.content}</Markdown>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {typeof msg.confidence === "number" && (
          <Badge variant={msg.confidence > 0.4 ? "success" : msg.confidence > 0.15 ? "warning" : "danger"}>
            uyğunluq {Math.round(msg.confidence * 100)}%
          </Badge>
        )}
        {msg.hasGap && (
          <Badge variant="warning">
            <AlertTriangle className="mr-1 h-3 w-3" /> məlumat çatışmazlığı
          </Badge>
        )}
        {msg.usedGeneralKnowledge && <Badge variant="secondary">ümumi AI biliyi istifadə olundu</Badge>}

        <button
          className={cn("rounded p-1 hover:bg-muted", vote === 1 && "text-emerald-600")}
          onClick={() => {
            const v = vote === 1 ? 0 : 1;
            setVote(v || null);
            onVote(v as 1 | 0);
          }}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
        <button
          className={cn("rounded p-1 hover:bg-muted", vote === -1 && "text-destructive")}
          onClick={() => {
            const v = vote === -1 ? 0 : -1;
            setVote(v || null);
            onVote(v as -1 | 0);
          }}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>

        {!msg.id.startsWith("tmp-") && (
          <button className="flex items-center gap-1 rounded p-1 hover:bg-muted" onClick={() => setPromoteOpen((o) => !o)}>
            <BookOpen className="h-3.5 w-3.5" /> Qeydə əlavə et
          </button>
        )}
      </div>

      {promoteOpen && (
        <PromotePanel
          messageId={msg.id}
          terms={terms}
          onDone={() => {
            setPromoteOpen(false);
            router.refresh();
          }}
        />
      )}

      {msg.citations.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-2 text-xs">
          <p className="mb-1 font-medium text-muted-foreground">İstifadə olunan qeydlər</p>
          <ul className="space-y-1">
            {msg.citations.map((c) => (
              <li key={c.index}>
                <span className="mr-1 font-mono text-muted-foreground">[{c.index}]</span>
                {c.termSlug ? (
                  <Link href={`/terms/${c.termSlug}`} className="text-primary hover:underline">
                    {c.termName}
                  </Link>
                ) : (
                  <span>{c.termName ?? "?"}</span>
                )}
                <span className="text-muted-foreground"> · {c.source} · {Math.round(c.score * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PromotePanel({
  messageId,
  terms,
  onDone,
}: {
  messageId: string;
  terms: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [termId, setTermId] = React.useState("");
  const [as, setAs] = React.useState<"note" | "example">("note");
  const [pending, start] = React.useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-2 text-xs">
      <select className="h-8 rounded border border-input bg-background px-2" value={termId} onChange={(e) => setTermId(e.target.value)}>
        <option value="">— termin seç —</option>
        {terms.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <select className="h-8 rounded border border-input bg-background px-2" value={as} onChange={(e) => setAs(e.target.value as never)}>
        <option value="note">Qeyd kimi</option>
        <option value="example">Nümunə kimi</option>
      </select>
      <Button
        size="sm"
        disabled={!termId || pending}
        onClick={() =>
          start(async () => {
            const res = await promoteAnswerAction({ messageId, termId, as });
            if (res.ok) {
              toast.success("Termə əlavə edildi (AI mənşəli kimi işarələndi)");
              onDone();
            } else toast.error(res.error);
          })
        }
      >
        Təsdiqlə və əlavə et
      </Button>
    </div>
  );
}
