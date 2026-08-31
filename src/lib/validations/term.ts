import { z } from "zod";

export const difficultyEnum = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
export const statusEnum = z.enum(["NEW", "LEARNING", "UNDERSTOOD", "NEEDS_REVIEW"]);
export const relationTypeEnum = z.enum([
  "SIMILAR",
  "DIFFERENT",
  "PART_OF",
  "PREREQUISITE_FOR",
  "CONTINUATION_OF",
  "ALTERNATIVE_TO",
  "USED_TOGETHER",
  "CUSTOM",
]);
export const exampleKindEnum = z.enum([
  "EVERYDAY",
  "TECHNICAL",
  "REAL_LIFE",
  "SCIENTIFIC",
  "CODE",
  "MATH",
  "WRONG_VS_RIGHT",
  "USER",
]);

/** Only the name is required — everything else can be filled in later. */
export const createTermSchema = z.object({
  name: z.string().trim().min(1, "Terminin adı vacibdir").max(200),
  shortDef: z.string().trim().max(2000).optional().or(z.literal("")),
  longDef: z.string().trim().max(20000).optional().or(z.literal("")),
  inMyWords: z.string().trim().max(20000).optional().or(z.literal("")),
  practicalUse: z.string().trim().max(20000).optional().or(z.literal("")),
  categoryId: z.string().cuid().optional().nullable(),
  subcategory: z.string().trim().max(120).optional().or(z.literal("")),
  difficulty: difficultyEnum.default("BEGINNER"),
  status: statusEnum.default("NEW"),
  confidence: z.coerce.number().int().min(1).max(5).default(1),
  importance: z.coerce.number().int().min(1).max(5).default(3),
  aliases: z.array(z.string().trim().min(1).max(200)).max(30).default([]),
  tags: z.array(z.string().trim().min(1).max(60)).max(40).default([]),
  collectionIds: z.array(z.string().cuid()).max(50).default([]),
});

export const updateTermSchema = createTermSchema.partial().extend({
  id: z.string().cuid(),
});

export const upsertExampleSchema = z.object({
  id: z.string().cuid().optional(),
  termId: z.string().cuid(),
  kind: exampleKindEnum.default("EVERYDAY"),
  title: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().trim().min(1, "Nümunə mətni boş ola bilməz").max(20000),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
});

export const upsertRelationSchema = z.object({
  id: z.string().cuid().optional(),
  fromId: z.string().cuid(),
  toId: z.string().cuid(),
  type: relationTypeEnum.default("SIMILAR"),
  customLabel: z.string().trim().max(120).optional().or(z.literal("")),
  note: z.string().trim().max(4000).optional().or(z.literal("")),
});

export const upsertNoteSchema = z.object({
  id: z.string().cuid().optional(),
  termId: z.string().cuid(),
  title: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().trim().min(1).max(50000),
});

export type CreateTermInput = z.infer<typeof createTermSchema>;
export type UpdateTermInput = z.infer<typeof updateTermSchema>;
export type UpsertExampleInput = z.infer<typeof upsertExampleSchema>;
export type UpsertRelationInput = z.infer<typeof upsertRelationSchema>;
export type UpsertNoteInput = z.infer<typeof upsertNoteSchema>;
