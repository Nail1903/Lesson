import OpenAI from "openai";

import type {
  ChatCompletionOptions,
  ChatCompletionResult,
  ChatProvider,
  EmbeddingProvider,
} from "@/lib/ai/types";
import { AIProviderError } from "@/lib/ai/types";
import { env } from "@/env";

function client() {
  if (!env.OPENAI_API_KEY) {
    throw new AIProviderError("OPENAI_API_KEY is not set", "openai");
  }
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

export class OpenAIChatProvider implements ChatProvider {
  readonly id = "openai";
  readonly model = env.OPENAI_CHAT_MODEL;

  async complete(opts: ChatCompletionOptions): Promise<ChatCompletionResult> {
    try {
      const res = await client().chat.completions.create({
        model: this.model,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 1200,
        response_format: opts.json ? { type: "json_object" } : undefined,
        messages: opts.messages,
      }, { signal: opts.signal });

      return {
        text: res.choices[0]?.message?.content ?? "",
        model: res.model,
        usage: {
          promptTokens: res.usage?.prompt_tokens ?? 0,
          completionTokens: res.usage?.completion_tokens ?? 0,
        },
      };
    } catch (err) {
      throw new AIProviderError("OpenAI chat completion failed", "openai", err);
    }
  }

  async *stream(opts: ChatCompletionOptions): AsyncIterable<string> {
    const stream = await client().chat.completions.create({
      model: this.model,
      temperature: opts.temperature ?? 0.2,
      max_tokens: opts.maxTokens ?? 1200,
      messages: opts.messages,
      stream: true,
    }, { signal: opts.signal });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly id = "openai";
  readonly model = env.OPENAI_EMBEDDING_MODEL;
  readonly dimensions = env.OPENAI_EMBEDDING_DIMENSIONS;

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    try {
      const res = await client().embeddings.create({
        model: this.model,
        dimensions: this.dimensions,
        input: texts,
      });
      return res.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding as number[]);
    } catch (err) {
      throw new AIProviderError("OpenAI embedding failed", "openai", err);
    }
  }
}
