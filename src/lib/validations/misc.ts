import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Ad ən azı 2 hərf").max(80),
    email: z.string().email("Düzgün email daxil edin"),
    password: z.string().min(8, "Şifrə ən azı 8 simvol").max(200),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Şifrələr uyğun gəlmir",
    path: ["confirm"],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const askSchema = z.object({
  chatId: z.string().cuid().optional(),
  question: z.string().trim().min(3, "Sual çox qısadır").max(4000),
  mode: z
    .enum([
      "SIMPLE",
      "TEACHER",
      "SCIENTIFIC",
      "STEP_BY_STEP",
      "COMPARE",
      "WITH_EXAMPLE",
      "SUMMARY",
      "EXAM_ANSWER",
      "QUIZ_ME",
    ])
    .default("TEACHER"),
  scope: z.enum(["NOTES_ONLY", "NOTES_PLUS_AI"]).default("NOTES_ONLY"),
  termIds: z.array(z.string().cuid()).max(20).optional(),
  categoryIds: z.array(z.string().cuid()).max(20).optional(),
});

export const quizConfigSchema = z.object({
  source: z.enum(["CATEGORY", "TERMS", "THIS_WEEK", "WEAK", "RANDOM", "DUE"]).default("RANDOM"),
  categoryIds: z.array(z.string().cuid()).optional(),
  termIds: z.array(z.string().cuid()).optional(),
  size: z.coerce.number().int().min(1).max(30).default(8),
  types: z
    .array(
      z.enum([
        "OPEN",
        "MCQ",
        "TRUE_FALSE",
        "FILL_BLANK",
        "IDENTIFY_TERM",
        "COMPARE",
        "SCENARIO",
        "CODE_OUTPUT",
        "EXPLAIN_FORMULA",
        "FLASHCARD",
      ]),
    )
    .min(1)
    .default(["OPEN", "MCQ", "TRUE_FALSE"]),
});

export const gradeAnswerSchema = z.object({
  questionId: z.string().cuid(),
  quizId: z.string().cuid().optional(),
  response: z.string().trim().max(8000),
});

export const reviewGradeSchema = z.object({
  termId: z.string().cuid(),
  grade: z.enum(["FORGOT", "HARD", "GOOD", "EASY"]),
  source: z.enum(["flashcard", "quiz", "manual"]).default("flashcard"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type AskInput = z.infer<typeof askSchema>;
export type QuizConfigInput = z.infer<typeof quizConfigSchema>;
