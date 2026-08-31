import type { Citation } from "@/lib/rag/answer";

export interface AskActionData {
  chatId: string;
  userMessageId: string;
  assistantMessageId: string;
  answer: string;
  citations: Citation[];
  confidence: number;
  hasGap: boolean;
  usedGeneralKnowledge: boolean;
  relatedTermIds: string[];
  model: string;
}
