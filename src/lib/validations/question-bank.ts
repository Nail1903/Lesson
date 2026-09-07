import { z } from "zod";

export const QUESTION_TYPES = [
  "OPEN",
  "MCQ",
  "TRUE_FALSE",
  "FILL_BLANK",
  "IDENTIFY_TERM",
  "COMPARE",
  "SCENARIO",
  "CODE_OUTPUT",
  "EXPLAIN_FORMULA",
  "MATCHING",
  "CALCULATION",
  "ESSAY",
  "PROJECT",
  "PRACTICAL",
] as const;

export const upsertQuestionSchema = z.object({
  id: z.string().cuid().optional(),
  type: z.enum(QUESTION_TYPES).default("OPEN"),
  prompt: z.string().trim().min(3).max(8000),
  choices: z.array(z.string().trim().min(1).max(1000)).max(10).optional(),
  correctAnswer: z.string().trim().min(1).max(8000),
  explanation: z.string().trim().max(8000).optional().or(z.literal("")),
  criteria: z.string().trim().max(4000).optional().or(z.literal("")),
  difficulty: z.enum(["easy", "medium", "hard", ""]).optional(),
  points: z.coerce.number().int().min(0).max(100).optional().nullable(),
  estimatedMinutes: z.coerce.number().int().min(0).max(600).optional().nullable(),
  topicId: z.string().cuid().optional().nullable(),
  termId: z.string().cuid().optional().nullable(),
  outcomeId: z.string().cuid().optional().nullable(),
});

export const examConfigSchema = z.object({
  subjectId: z.string().cuid(),
  title: z.string().trim().min(1).max(200),
  topicIds: z.array(z.string().cuid()).max(60).optional(),
  easy: z.coerce.number().int().min(0).max(50).default(2),
  medium: z.coerce.number().int().min(0).max(50).default(2),
  hard: z.coerce.number().int().min(0).max(50).default(1),
  types: z.array(z.enum(QUESTION_TYPES)).optional(),
});

export type UpsertQuestionInput = z.infer<typeof upsertQuestionSchema>;
export type ExamConfigInput = z.infer<typeof examConfigSchema>;
