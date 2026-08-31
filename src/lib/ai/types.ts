export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessageInput {
  role: ChatRole;
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessageInput[];
  temperature?: number;
  maxTokens?: number;
  /** Ask the provider for strict JSON output when supported. */
  json?: boolean;
  signal?: AbortSignal;
}

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface ChatCompletionResult {
  text: string;
  model: string;
  usage: ChatUsage;
}

export interface ChatProvider {
  readonly id: string;
  readonly model: string;
  complete(opts: ChatCompletionOptions): Promise<ChatCompletionResult>;
  /** Optional token stream. Falls back to `complete` when absent. */
  stream?(opts: ChatCompletionOptions): AsyncIterable<string>;
}

export interface EmbeddingProvider {
  readonly id: string;
  readonly model: string;
  readonly dimensions: number;
  embed(texts: string[]): Promise<number[][]>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}
