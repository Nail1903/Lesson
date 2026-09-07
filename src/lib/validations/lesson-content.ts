import { z } from "zod";

const text = z.string().max(40000).optional();

export const lessonFieldsSchema = z.object({
  id: z.string().cuid(),
  name: z.string().trim().min(1).max(200).optional(),
  description: text,
  lessonType: z.enum(["mühazirə", "seminar", "laboratoriya", "praktika", ""]).optional(),
  durationMinutes: z.coerce.number().int().min(0).max(1000).nullable().optional(),
  module: z.string().trim().max(120).optional(),
  week: z.coerce.number().int().min(0).max(60).nullable().optional(),
  orderNo: z.coerce.number().int().min(0).max(999).nullable().optional(),
  prepStatus: z.enum(["draft", "in_progress", "ready", "needs_update"]).optional(),
  objective: text,
  teachingNotes: text,
  preClassPrep: text,
  prerequisites: text,
  misconceptions: text,
  expectedQuestions: text,
  reflection: text,
  nextLessonNote: text,
  homework: text,
  stages: z
    .array(z.object({ name: z.string().trim().max(200), minutes: z.coerce.number().int().min(0).max(600) }))
    .max(30)
    .optional(),
});

export const lessonMaterialSchema = z.object({
  id: z.string().cuid().optional(),
  topicId: z.string().cuid(),
  kind: z.enum(["text", "example", "code", "image", "video", "slide", "file", "link"]).default("text"),
  title: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().trim().max(40000).optional().or(z.literal("")),
  url: z.string().url().optional().or(z.literal("")),
});

export const lessonOutcomeSchema = z.object({
  id: z.string().cuid().optional(),
  topicId: z.string().cuid(),
  code: z.string().trim().max(20).optional().or(z.literal("")),
  text: z.string().trim().min(3).max(2000),
  bloomLevel: z
    .enum(["Yadda saxlama", "Anlama", "Tətbiq", "Analiz", "Sintez", "Qiymətləndirmə", ""])
    .optional(),
  criteria: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const sourceLinkSchema = z.object({
  id: z.string().cuid().optional(),
  sourceId: z.string().cuid(),
  topicId: z.string().cuid().optional().nullable(),
  termId: z.string().cuid().optional().nullable(),
  chapter: z.string().trim().max(80).optional().or(z.literal("")),
  pages: z.string().trim().max(80).optional().or(z.literal("")),
  videoTimestamp: z.string().trim().max(40).optional().or(z.literal("")),
  role: z.enum(["əsas", "əlavə", "tələbəyə tövsiyə", "müəllim hazırlığı", ""]).optional(),
  isRead: z.boolean().optional(),
});

export type LessonFieldsInput = z.infer<typeof lessonFieldsSchema>;
