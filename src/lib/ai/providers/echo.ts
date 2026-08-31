import type {
  ChatCompletionOptions,
  ChatCompletionResult,
  ChatProvider,
  EmbeddingProvider,
} from "@/lib/ai/types";
import { estimateTokens } from "@/lib/utils";

/**
 * Offline stub provider. No network, no API key. Used for local dev, CI and the
 * automated tests. It produces a deterministic, obviously-synthetic answer that
 * echoes the supplied context so RAG plumbing can be exercised end to end.
 */
export class EchoChatProvider implements ChatProvider {
  readonly id = "echo";
  readonly model = "echo-1";

  async complete(opts: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const system = opts.messages.find((m) => m.role === "system")?.content ?? "";
    const lastUser = [...opts.messages].reverse().find((m) => m.role === "user");
    const question = lastUser?.content ?? "";

    const contextBlock = question.match(/<context>([\s\S]*?)<\/context>/)?.[1]?.trim();

    let text: string;
    if (opts.json) {
      text = JSON.stringify({
        note: "echo provider — offline stub output",
        question: question.slice(0, 200),
      });
    } else if (contextBlock) {
      text =
        `**[ECHO — oflayn cavab]** Aşağıdakı cavab yalnız verilmiş qeydlərə əsaslanır:\n\n` +
        contextBlock.slice(0, 900) +
        `\n\n_Gerçək AI provayderi qoşmaq üçün \`.env\` faylında \`AI_PROVIDER\` dəyərini dəyişin._`;
    } else {
      text =
        `**[ECHO — oflayn stub]** Sualınız: "${question.slice(0, 300)}".\n\n` +
        (system ? `Sistem təlimatı qeydə alındı (${system.length} simvol).` : "");
    }

    return {
      text,
      model: this.model,
      usage: {
        promptTokens: opts.messages.reduce((n, m) => n + estimateTokens(m.content), 0),
        completionTokens: estimateTokens(text),
      },
    };
  }

  async *stream(opts: ChatCompletionOptions): AsyncIterable<string> {
    const { text } = await this.complete(opts);
    for (const word of text.split(/(\s+)/)) {
      yield word;
      await new Promise((r) => setTimeout(r, 4));
    }
  }
}

/**
 * Deterministic feature-hashing embedding. Cosine similarity roughly tracks
 * lexical overlap — good enough to demo semantic search offline. Swap for a real
 * provider before relying on true semantic recall.
 */
export class EchoEmbeddingProvider implements EmbeddingProvider {
  readonly id = "echo";
  readonly model = "echo-hash-embed";
  constructor(readonly dimensions = 1536) {}

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.embedOne(t));
  }

  private embedOne(text: string): number[] {
    const vec = new Float64Array(this.dimensions);
    const tokens = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter(Boolean);

    const bump = (i: number, delta: number) => {
      vec[i] = (vec[i] ?? 0) + delta;
    };

    for (const tok of tokens) {
      const h = fnv1a(tok);
      bump(h % this.dimensions, (h >>> 31) & 1 ? -1 : 1);
      // a second bucket per token reduces collisions
      const h2 = fnv1a(`#${tok}`);
      bump(h2 % this.dimensions, ((h2 >>> 30) & 1 ? -1 : 1) * 0.5);
    }

    let norm = 0;
    for (const v of vec) norm += v * v;
    norm = Math.sqrt(norm) || 1;
    return Array.from(vec, (v) => v / norm);
  }
}

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
