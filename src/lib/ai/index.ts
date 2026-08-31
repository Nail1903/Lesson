import type { ChatProvider, EmbeddingProvider } from "@/lib/ai/types";
import { env } from "@/env";
import {
  EchoChatProvider,
  EchoEmbeddingProvider,
} from "@/lib/ai/providers/echo";
import {
  OpenAIChatProvider,
  OpenAIEmbeddingProvider,
} from "@/lib/ai/providers/openai";
import { AnthropicChatProvider } from "@/lib/ai/providers/anthropic";

export * from "@/lib/ai/types";

export type ProviderId = "openai" | "anthropic" | "echo";

/**
 * Resolve the chat provider. `override` lets a per-user preference win over the
 * global `AI_PROVIDER`. Adding a new provider = one new class + one case here.
 */
export function getChatProvider(override?: string | null): ChatProvider {
  const id = (override ?? env.AI_PROVIDER) as ProviderId;
  switch (id) {
    case "openai":
      return new OpenAIChatProvider();
    case "anthropic":
      return new AnthropicChatProvider();
    case "echo":
      return new EchoChatProvider();
    default:
      return new EchoChatProvider();
  }
}

/**
 * Embeddings are decoupled from chat: Anthropic has no embeddings API, and you
 * may want cheap local embeddings with a premium chat model. The chosen
 * embedding model + dimensions are persisted on every Embedding row so the
 * whole index can be rebuilt when this changes.
 */
export function getEmbeddingProvider(): EmbeddingProvider {
  const id = env.EMBEDDING_PROVIDER;
  if (id === "openai" && env.OPENAI_API_KEY) {
    return new OpenAIEmbeddingProvider();
  }
  return new EchoEmbeddingProvider(env.OPENAI_EMBEDDING_DIMENSIONS);
}

export function currentEmbeddingSignature(): { model: string; dimensions: number } {
  const p = getEmbeddingProvider();
  return { model: p.model, dimensions: p.dimensions };
}
