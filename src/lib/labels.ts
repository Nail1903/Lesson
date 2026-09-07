import type { BadgeProps } from "@/components/ui/badge";

export const STATUS_LABEL: Record<string, string> = {
  NEW: "Yeni",
  LEARNING: "Öyrənilir",
  UNDERSTOOD: "Başa düşülüb",
  NEEDS_REVIEW: "Təkrar edilməlidir",
};

export const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  NEW: "secondary",
  LEARNING: "warning",
  UNDERSTOOD: "success",
  NEEDS_REVIEW: "danger",
};

export const DIFFICULTY_LABEL: Record<string, string> = {
  BEGINNER: "Başlanğıc",
  INTERMEDIATE: "Orta",
  ADVANCED: "İrəli",
};

export const RELATION_LABEL: Record<string, string> = {
  SIMILAR: "oxşardır",
  DIFFERENT: "fərqlidir",
  PART_OF: "bunun bir hissəsidir",
  PREREQUISITE_FOR: "bunun üçün ilkin bilikdir",
  CONTINUATION_OF: "bunun davamıdır",
  ALTERNATIVE_TO: "bunun alternatividir",
  USED_TOGETHER: "praktikada birlikdə işlədilir",
  CUSTOM: "əlaqə",
};

export const EXAMPLE_KIND_LABEL: Record<string, string> = {
  EVERYDAY: "Gündəlik nümunə",
  TECHNICAL: "Texniki nümunə",
  REAL_LIFE: "Real həyat nümunəsi",
  SCIENTIFIC: "Elmi nümunə",
  CODE: "Kod nümunəsi",
  MATH: "Riyazi nümunə",
  WRONG_VS_RIGHT: "Səhv vs düzgün",
  USER: "Öz nümunəm",
};

export const CHAT_MODE_LABEL: Record<string, string> = {
  SIMPLE: "Çox sadə izah",
  TEACHER: "Müəllim kimi izah et",
  SCIENTIFIC: "Elmi izah",
  STEP_BY_STEP: "Addım-addım izah",
  COMPARE: "Müqayisə et",
  WITH_EXAMPLE: "Nümunə ilə izah et",
  SUMMARY: "Xülasə et",
  EXAM_ANSWER: "İmtahan cavabı hazırla",
  QUIZ_ME: "Mənim biliyimi yoxla",
};

export const QUESTION_TYPE_LABEL: Record<string, string> = {
  OPEN: "Açıq sual",
  MCQ: "Çoxseçimli",
  TRUE_FALSE: "Doğru / Yanlış",
  FILL_BLANK: "Boşluğu doldur",
  IDENTIFY_TERM: "Termini tap",
  COMPARE: "Müqayisə et",
  SCENARIO: "Praktiki situasiya",
  CODE_OUTPUT: "Kodun nəticəsi",
  EXPLAIN_FORMULA: "Formulu izah et",
  FLASHCARD: "Flashcard",
  MATCHING: "Uyğunlaşdırma",
  CALCULATION: "Hesablama",
  ESSAY: "Esse",
  PROJECT: "Layihə",
  PRACTICAL: "Praktiki tapşırıq",
};

export const DIFFICULTY3_LABEL: Record<string, string> = {
  easy: "Asan",
  medium: "Orta",
  hard: "Çətin",
};
