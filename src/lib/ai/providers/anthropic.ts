import Anthropic from "@anthropic-ai/sdk";

import type {
  ChatCompletionOptions,
  ChatCompletionResult,
  ChatProvider,
} from "@/lib/ai/types";
import { AIProviderError } from "@/lib/ai/types";
import { env } from "@/env";

function client() {
  if (!env.ANTHROPIC_API_KEY) {
    throw new AIProviderError("ANTHROPIC_API_KEY is not set", "anthropic");
  }
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
}

/**
 * Anthropic exposes no embeddings endpoint — `getEmbeddingProvider()` in
 * `../index.ts` always resolves embeddings through EMBEDDING_PROVIDER instead.
 */
export class AnthropicChatProvider implements ChatProvider {
  readonly id = "anthropic";
  readonly model = env.ANTHROPIC_CHAT_MODEL;

  async complete(opts: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const system = opts.messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");
    const messages = opts.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    try {
      const res = await client().messages.create(
        {
          model: this.model,
          system: opts.json
            ? `${system}\n\nRespond with a single valid JSON object and nothing else.`
            : system || undefined,
          max_tokens: opts.maxTokens ?? 1200,
          temperature: opts.temperature ?? 0.2,
          messages,
        },
        { signal: opts.signal },
      );

      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");

      return {
        text,
        model: res.model,
        usage: {
          promptTokens: res.usage.input_tokens,
          completionTokens: res.usage.output_tokens,
        },
      };
    } catch (err) {
      throw new AIProviderError("Anthropic message failed", "anthropic", err);
    }
  }

  async *stream(opts: ChatCompletionOptions): AsyncIterable<string> {
    const system = opts.messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");
    const messages = opts.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const stream = client().messages.stream({
      model: this.model,
      system: system || undefined,
      max_tokens: opts.maxTokens ?? 1200,
      temperature: opts.temperature ?? 0.2,
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }
}
