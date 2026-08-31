import type { ChatMode, ChatScope } from "@prisma/client";
import { getChatProvider } from "@/lib/ai";
import { retrieve, type RetrievedChunk } from "@/lib/rag/retrieve";
import { logger } from "@/lib/logger";

export interface Citation {
  index: number;
  embeddingId: string;
  termId: string | null;
  termName: string | null;
  termSlug: string | null;
  source: string;
  snippet: string;
  score: number;
}

export interface AnswerResult {
  text: string;
  citations: Citation[];
  confidence: number; // 0..1 — mean score of cited context
  hasGap: boolean;
  usedGeneralKnowledge: boolean;
  model: string;
  usage: { promptTokens: number; completionTokens: number };
  relatedTermIds: string[];
}

const MODE_INSTRUCTIONS: Record<ChatMode, string> = {
  SIMPLE: "Çox sadə dildə, gündəlik danışıq üslubunda, qısa izah et. Jarqondan qaç.",
  TEACHER: "Səbirli bir müəllim kimi izah et: əvvəl intuisiya, sonra dəqiq tərif, sonra bir nümunə.",
  SCIENTIFIC: "Elmi, dəqiq və formal dildə izah et. Lazım olduqda düsturları LaTeX ilə göstər.",
  STEP_BY_STEP: "Addım-addım, nömrələnmiş siyahı ilə izah et.",
  COMPARE: "İki və ya daha çox anlayışı cədvəl və ya bənd-bənd müqayisə et: oxşarlıqlar, fərqlər, nə vaxt hansını seçmək.",
  WITH_EXAMPLE: "İzahı ən azı iki konkret nümunə ilə dəstəklə.",
  SUMMARY: "Qısa, maddələr şəklində xülasə ver. Ən vacib 3-6 fikir.",
  EXAM_ANSWER: "İmtahan cavabı formatında yaz: tərif, əsas xüsusiyyətlər, nümunə, nəticə.",
  QUIZ_ME: "İstifadəçini yoxla: qeydlərə əsaslanan 3-5 sual ver, cavab gözlə, sonra qiymətləndir.",
};

const BASE_SYSTEM = `Sən "Bilik köməkçisi"sən — istifadəçinin şəxsi qeyd sistemi üçün köməkçi.
QAYDALAR:
1. Yalnız <context> içindəki mətnə əsaslan. Kontekstdə olmayan faktı uydurma.
2. Hər iddianı [n] şəklində mənbə nömrəsi ilə işarələ (n = kontekst blokunun nömrəsi).
3. Kontekst sualı cavablandırmaq üçün kifayət deyilsə, bunu açıq de və nəyin çatışmadığını göstər.
4. İstifadəçinin öz sözləri ("Öz sözlərimlə") ilə rəsmi tərifləri qarışdırma.
5. Cavabın sonunda "GAP:" sətri ver — çatışmayan məlumat varsa qısa qeyd et, yoxdursa "GAP: yoxdur".
6. Azərbaycan dilində cavab ver (istifadəçi başqa dil istəməyibsə).`;

const GENERAL_KNOWLEDGE_ADDON = `
ƏLAVƏ REJIM (Qeydlərim + ümumi AI biliyi): kontekstdən kənar ümumi biliyindən də istifadə edə bilərsən,
AMMA onu ayrıca "ⓘ Ümumi bilik:" başlığı altında ver və qeydlərdən gələn hissədən vizual olaraq ayır.
Qeydlərdən gələn hissədə yenə də [n] istinadları olmalıdır.`;

export interface AskOptions {
  userId: string;
  question: string;
  mode?: ChatMode;
  scope?: ChatScope;
  history?: { role: "user" | "assistant"; content: string }[];
  termIds?: string[];
  categoryIds?: string[];
  providerOverride?: string | null;
}

export async function ask(opts: AskOptions): Promise<AnswerResult> {
  const mode = opts.mode ?? "TEACHER";
  const scope = opts.scope ?? "NOTES_ONLY";

  const chunks = await retrieve({
    userId: opts.userId,
    query: opts.question,
    limit: 8,
    termIds: opts.termIds,
    categoryIds: opts.categoryIds,
  });

  const citations: Citation[] = chunks.map((c, i) => ({
    index: i + 1,
    embeddingId: c.embeddingId,
    termId: c.termId,
    termName: c.termName,
    termSlug: c.termSlug,
    source: c.source,
    snippet: c.content.slice(0, 240),
    score: Number(c.score.toFixed(3)),
  }));

  const contextText = chunks.length
    ? chunks
        .map(
          (c, i) =>
            `[${i + 1}] (${c.termName ?? "?"} · ${c.source})\n${c.content}`,
        )
        .join("\n\n---\n\n")
    : "(uyğun qeyd tapılmadı)";

  const system =
    BASE_SYSTEM +
    (scope === "NOTES_PLUS_AI" ? GENERAL_KNOWLEDGE_ADDON : "") +
    `\n\nCAVAB ÜSLUBU: ${MODE_INSTRUCTIONS[mode]}`;

  const userContent = `<context>\n${contextText}\n</context>\n\nSUAL: ${opts.question}`;

  const provider = getChatProvider(opts.providerOverride);
  const completion = await provider.complete({
    temperature: 0.2,
    maxTokens: 1400,
    messages: [
      { role: "system", content: system },
      ...(opts.history ?? []).slice(-6),
      { role: "user", content: userContent },
    ],
  });

  const { body, gap } = splitGap(completion.text);
  const hasGap = chunks.length === 0 || (gap.length > 0 && !/yox(dur)?/i.test(gap));
  const usedGeneralKnowledge =
    scope === "NOTES_PLUS_AI" && /ümumi bilik/i.test(completion.text);

  const confidence = chunks.length
    ? Number((chunks.reduce((s, c) => s + c.score, 0) / chunks.length).toFixed(3))
    : 0;

  const relatedTermIds = Array.from(
    new Set(chunks.map((c) => c.termId).filter((x): x is string => !!x)),
  );

  logger.info("rag.answer", {
    userId: opts.userId,
    mode,
    scope,
    chunks: chunks.length,
    confidence,
    hasGap,
  });

  return {
    text: body,
    citations,
    confidence,
    hasGap,
    usedGeneralKnowledge,
    model: completion.model,
    usage: completion.usage,
    relatedTermIds,
  };
}

function splitGap(text: string): { body: string; gap: string } {
  const m = text.match(/\n?GAP:\s*(.*)\s*$/is);
  if (!m) return { body: text.trim(), gap: "" };
  return {
    body: text.slice(0, m.index).trim(),
    gap: (m[1] ?? "").trim(),
  };
}

export type { RetrievedChunk };
