import { z } from "zod";

const strList = z.union([z.array(z.string()), z.string()]).optional();

export const lessonTermSchema = z.object({
  name: z.string().trim().min(1).max(200),
  aliases: strList,
  shortDef: z.string().max(4000).optional(),
  longDef: z.string().max(40000).optional(),
  inMyWords: z.string().max(20000).optional(),
  practicalUse: z.string().max(20000).optional(),
  category: z.string().trim().max(120).optional(),
  tags: strList,
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  status: z.enum(["NEW", "LEARNING", "UNDERSTOOD", "NEEDS_REVIEW"]).optional(),
  confidence: z.coerce.number().min(1).max(5).optional(),
  importance: z.coerce.number().min(1).max(5).optional(),
});

export const lessonQuestionSchema = z.object({
  term: z.string().trim().min(1).max(200),
  type: z
    .enum(["OPEN", "MCQ", "TRUE_FALSE", "FILL_BLANK", "IDENTIFY_TERM"])
    .default("OPEN"),
  prompt: z.string().trim().min(3).max(4000),
  choices: z.array(z.string().min(1)).min(2).max(8).optional(),
  correctAnswer: z.string().trim().min(1).max(4000),
  explanation: z.string().trim().max(4000).optional(),
});

export const lessonFlashcardSchema = z.object({
  term: z.string().trim().min(1).max(200),
  front: z.string().trim().min(1).max(2000),
  back: z.string().trim().min(1).max(8000),
});

export const lessonPackSchema = z.object({
  subject: z.string().trim().max(160).optional(),
  subjectColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/)
    .optional(),
  topic: z.string().trim().max(200).optional(),
  topicDescription: z.string().trim().max(4000).optional(),
  terms: z.array(lessonTermSchema).min(1).max(500),
  questions: z.array(lessonQuestionSchema).max(1000).optional(),
  flashcards: z.array(lessonFlashcardSchema).max(1000).optional(),
});

export type LessonPack = z.infer<typeof lessonPackSchema>;
