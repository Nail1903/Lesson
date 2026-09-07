import { z } from "zod";

const optStr = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const upsertSubjectSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(1, "Fənnin adı vacibdir").max(160),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Rəng #RRGGBB formatında olmalıdır")
    .optional()
    .or(z.literal("")),
  position: z.coerce.number().int().min(0).default(0),
  // course catalogue metadata (spec §2) — all optional
  code: optStr(40),
  faculty: optStr(200),
  department: optStr(200),
  specialty: optStr(200),
  level: z.enum(["Bakalavr", "Magistr", "Doktorantura", ""]).optional(),
  courseYear: z.coerce.number().int().min(1).max(6).optional().nullable(),
  objective: z.string().trim().max(8000).optional().or(z.literal("")),
  prerequisites: z.string().trim().max(4000).optional().or(z.literal("")),
  relatedCourses: optStr(600),
  contentLanguage: z.enum(["az", "en", "ru"]).optional(),
});

export const upsertTopicSchema = z.object({
  id: z.string().cuid().optional(),
  subjectId: z.string().cuid(),
  parentId: z.string().cuid().optional().nullable(),
  name: z.string().trim().min(1, "Mövzunun adı vacibdir").max(200),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  position: z.coerce.number().int().min(0).default(0),
});

export const linkTopicTermSchema = z.object({
  topicId: z.string().cuid(),
  termId: z.string().cuid().optional(),
  /** create a brand-new term inline and link it in one step */
  newTermName: z.string().trim().min(1).max(200).optional(),
  note: z.string().trim().max(4000).optional().or(z.literal("")),
  position: z.coerce.number().int().min(0).optional(),
});

export const setTermSubjectsSchema = z.object({
  termId: z.string().cuid(),
  subjectIds: z.array(z.string().cuid()).max(50),
});

export type UpsertSubjectInput = z.infer<typeof upsertSubjectSchema>;
export type UpsertTopicInput = z.infer<typeof upsertTopicSchema>;
export type LinkTopicTermInput = z.infer<typeof linkTopicTermSchema>;
