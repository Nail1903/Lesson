import { z } from "zod";

export const versionSchema = z.object({
  id: z.string().cuid().optional(),
  subjectId: z.string().cuid(),
  label: z.string().trim().min(1).max(80),
  kind: z.enum(["program", "syllabus"]).default("program"),
  description: z.string().max(20000).optional().or(z.literal("")),
  objective: z.string().max(20000).optional().or(z.literal("")),
});

export const sectionSchema = z.object({
  id: z.string().cuid().optional(),
  courseVersionId: z.string().cuid(),
  key: z.string().trim().max(40).optional().or(z.literal("")),
  title: z.string().trim().min(1).max(200),
  body: z.string().max(40000).optional().or(z.literal("")),
  hidden: z.boolean().optional(),
  required: z.boolean().optional(),
});

export const reorderSchema = z.object({
  courseVersionId: z.string().cuid(),
  orderedIds: z.array(z.string().cuid()).max(60),
});

export const assessmentSchema = z.object({
  id: z.string().cuid().optional(),
  courseVersionId: z.string().cuid(),
  name: z.string().trim().min(1).max(120),
  weight: z.coerce.number().min(0).max(100),
  criteria: z.string().trim().max(4000).optional().or(z.literal("")),
  dueInfo: z.string().trim().max(200).optional().or(z.literal("")),
});

export const courseOutcomeSchema = z.object({
  id: z.string().cuid().optional(),
  courseVersionId: z.string().cuid(),
  subjectId: z.string().cuid(),
  code: z.string().trim().max(20).optional().or(z.literal("")),
  text: z.string().trim().min(3).max(2000),
  bloomLevel: z
    .enum(["Yadda saxlama", "Anlama", "Tətbiq", "Analiz", "Sintez", "Qiymətləndirmə", ""])
    .optional(),
});
