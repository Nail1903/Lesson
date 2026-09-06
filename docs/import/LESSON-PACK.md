# Dərs materialı (Lesson Pack) — JSON formatı

Bir JSON faylı ilə **fənn + mövzu + terminlər + suallar + flashcard-lar** birlikdə idxal olunur.
Tətbiq: **Import / Export → "Dərs materialı idxal et"**.

## Struktur

```jsonc
{
  "subject": "Machine Learning Fundamentals",   // opsional — yoxdursa yaradılır
  "subjectColor": "#7c3aed",                     // opsional (#RRGGBB)
  "topic": "Nəzarətli öyrənmə (səh. 2-6)",       // opsional — "subject" tələb edir
  "topicDescription": "Nəzarətli öyrənmə, təsnifat və reqressiya.", // opsional

  "terms": [                                     // MƏCBURİ (ən azı 1)
    {
      "name": "Supervised Learning",             // ingiliscə kanonik ad (unikal açar)
      "aliases": ["Nəzarətli öyrənmə"],          // AZ adı + sinonimlər
      "shortDef": "Modelə həm sual, həm düzgün cavab göstərilir.",
      "longDef": "Akademik izah…\n\n**Nümunə:** …\n\n_Mənbə: Kitab, səh. 2-6._",
      "inMyWords": "",                           // opsional
      "practicalUse": "",                        // opsional
      "category": "Machine Learning",
      "tags": ["kitab-fəsil-1", "nəzarətli öyrənmə"],
      "difficulty": "BEGINNER",                  // BEGINNER | INTERMEDIATE | ADVANCED
      "status": "NEW",                           // həmişə "NEW"
      "confidence": 1,                           // həmişə 1
      "importance": 5                            // 1-5 (əsas anlayış = 5)
    }
  ],

  "questions": [                                 // opsional — sual bankına düşür
    {
      "term": "Classification",                  // "terms" içindəki və ya mövcud termin adı
      "type": "MCQ",                            // OPEN | MCQ | TRUE_FALSE | FILL_BLANK | IDENTIFY_TERM
      "prompt": "Aşağıdakılardan hansı təsnifat nümunəsidir?",
      "choices": ["A", "B", "C", "D"],          // MCQ üçün 2-8 seçim; TRUE_FALSE üçün ["Doğru","Yanlış"]
      "correctAnswer": "B",                      // MCQ-də seçimin mətni; OPEN-də istinad cavab
      "explanation": "Çünki…"                    // opsional
    },
    {
      "term": "Regression analysis",
      "type": "OPEN",
      "prompt": "Reqressiya nədir, təsnifatdan fərqi nə?",
      "correctAnswer": "Davamlı ədədi hədəfi proqnozlaşdırır; təsnifat isə diskret sinif verir."
    }
  ],

  "flashcards": [                                // opsional — sürətli təkrar üçün
    { "term": "Decision boundary", "front": "Qərar sərhədi nədir?", "back": "Xüsusiyyət fəzasını fərqli sinif regionlarına ayıran xətt/səth." }
  ]
}
```

## Qaydalar

- **Mövcud terminlər** (eyni adlı, hərf böyüklüyünə baxmadan) təkrar yaradılmır — sadəcə mövzuya bağlanır.
- `topic` verilibsə, `subject` da olmalıdır. Terminlər həmin mövzuya verilmə sırası ilə bağlanır.
- Suallar və flashcard-lar `term` sahəsi ilə termə bağlanır; uyğun termin tapılmasa həmin sətir ötürülür.
- `longDef` markdown + LaTeX qəbul edir. **LaTeX-də hər `\` işarəsini JSON-da `\\` yaz:** `$X \\in \\mathbb{R}^{n \\times m}$`.
- Mətn daxilindəki sətir keçidi `\n`, dırnaq `\"`.
- Bir faylda ən çox 500 termin.

## ChatGPT promptu

```
Sən "MyLesson" bilik sistemi üçün "Lesson Pack" JSON hazırlayacaqsan.

Aşağıdakı mətndən/kitab səhifələrindən terminləri çıxar və BU sxemə uyğun TƏK JSON obyekti qaytar:

{
  "subject": "<fənnin adı>",
  "topic": "<mövzunun adı (səhifə aralığı ilə)>",
  "topicDescription": "<qısa təsvir>",
  "terms": [
    {
      "name": "<ingiliscə kanonik ad>",
      "aliases": ["<Azərbaycanca ad>", "<varsa sinonimlər>"],
      "shortDef": "<Sadə izah: 1-2 cümlə, gündəlik dil>",
      "longDef": "<Akademik izah>\n\n**Nümunə:** <konkret nümunə>\n\n_Mənbə: <mənbə>, səh. <səhifələr>._",
      "inMyWords": "",
      "practicalUse": "",
      "category": "<kateqoriya, məs. Machine Learning>",
      "tags": ["kitab-fəsil-1"],
      "difficulty": "BEGINNER",
      "status": "NEW",
      "confidence": 1,
      "importance": <1-5, əsas anlayış = 5>
    }
  ],
  "questions": [
    { "term": "<termin adı>", "type": "MCQ", "prompt": "<sual>", "choices": ["A","B","C","D"], "correctAnswer": "<düzgün seçimin mətni>", "explanation": "<izah>" },
    { "term": "<termin adı>", "type": "OPEN", "prompt": "<sual>", "correctAnswer": "<istinad cavab>", "explanation": "<izah>" }
  ],
  "flashcards": [
    { "term": "<termin adı>", "front": "<qısa sual>", "back": "<qısa cavab>" }
  ]
}

QAYDALAR:
1. YALNIZ təmiz JSON qaytar. ```json bloku, izah, başlıq YOX.
2. Hər termin üçün 1 MCQ + 1 OPEN sual və 1 flashcard yarat (mümkünsə).
3. LaTeX-də hər \ işarəsini \\ kimi yaz (\\times, \\mathbb, \\frac, \\begin{bmatrix}).
4. Sətir keçidi \n, dırnaq \". Azərbaycan hərfləri (ə, ı, ş, ç, ö, ü, ğ) olduğu kimi.
5. Terminlərin sırasını qoru.

MƏTN:
<<< bura kitab mətnini / səhifələri yapışdır >>>
```
