import { z } from "zod";

export const upsertSubjectSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(1, "Fənnin adı vacibdir").max(160),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Rəng #RRGGBB formatında olmalıdır")
    .optional()
    .or(z.literal("")),
  position: z.coerce.number().int().min(0).default(0),
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
