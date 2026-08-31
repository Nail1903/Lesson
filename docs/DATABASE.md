# Verilənlər bazası

Mənbə: [`prisma/schema.prisma`](../prisma/schema.prisma). PostgreSQL 15+, `vector` + `pg_trgm` extension-ları.

## Əlaqə xəritəsi (mətn ERD)

```
User 1─┬─N Term ─┬─N TermAlias
       │         ├─N Note / Example / CodeExample / Formula / Source / Attachment
       │         ├─N Embedding
       │         ├─N Question ─N Answer
       │         ├─1 LearningProgress   ─N Review
       │         ├─N TermRelation (from/to, self many-to-many, 8 tip)
       │         ├─N─N Tag            (TermTags)
       │         ├─N─N Collection     (CollectionTerms)
       │         ├─N─N Subject        (SubjectTerms)
       │         └─N TopicTerm ─1 Topic ─1 Subject
       │         └─1 Category (nullable)
       ├─N Category (parent/children ağac)
       ├─N Collection
       ├─N Subject 1─N Topic (parent/children ağac)
       ├─N Chat 1─N ChatMessage (citations JSON, confidence, hasGap)
       ├─N Quiz 1─N Question / Answer
       ├─N AIContentSuggestion (PENDING→ACCEPTED/REJECTED)
       └─N UserActivity (audit)

Auth: User 1─N Account / Session ; VerificationToken ; PasswordResetToken
```

## Vektor sütunu

`Embedding.embedding` Prisma-da `Unsupported("vector(1536)")?` kimi elan olunub — Prisma Client onu seçmir/yazmır. Ona görə:

1. `prisma/bootstrap.ts` → `CREATE EXTENSION vector, pg_trgm` (schema push-dan **əvvəl**).
2. `prisma db push` → cədvəllər + `vector(1536)` sütunu.
3. `prisma/bootstrap.ts --indexes` → HNSW (`vector_cosine_ops`) + GIN trigram indeksləri (push-dan **sonra**).
4. Yazı: `indexer.ts` əvvəl `prisma.embedding.upsert` (skalyar sahələr), sonra raw `UPDATE "Embedding" SET embedding = $1::vector`.
5. Oxu: `retrieve.ts` raw `SELECT … 1 - (embedding <=> $1::vector) AS score … ORDER BY embedding <=> $1::vector`.

### Yenidən indeksləmə üçün versiyalaşdırma

Hər `Embedding` sətri `model` (məs. `text-embedding-3-small`), `dimensions` və `contentHash` saxlayır. `reindexTerm()` cari provayderin `model`-i ilə saxlanmış `model` uyğun gəlmirsə və ya `contentHash` dəyişibsə parçanı yenidən embed edir. Beləliklə embedding modelini dəyişmək bütün bazanı yenidən qurmadan mümkündür (`reindexAll`).

## Soft delete / audit

- İstifadəçi məzmununda `deletedAt DateTime?`. Bütün `list*`/`get*` sorğuları `deletedAt: null` filtri qoyur.
- `Trash` səhifəsi `deletedAt != null` göstərir; `restore*` / `purge*` action-ları.
- `UserActivity` — `term.created`, `quiz.completed`, `review.done`, `chat.message`, `data.exported`, `login` və s. Dashboard ardıcıllıq qrafiki bundan qurulur.

## Enum-lar (qısa)

`Difficulty` BEGINNER/INTERMEDIATE/ADVANCED · `LearningStatus` NEW/LEARNING/UNDERSTOOD/NEEDS_REVIEW · `RelationType` 8 tip · `ExampleKind` 8 tip · `ChatMode` 9 tip · `ChatScope` NOTES_ONLY/NOTES_PLUS_AI · `QuestionType` 10 tip · `QuizSourceKind` 6 tip · `ReviewGrade` FORGOT/HARD/GOOD/EASY · `SuggestionStatus` PENDING/ACCEPTED/REJECTED · `EmbeddingSource` TERM/NOTE/EXAMPLE/CODE_EXAMPLE/FORMULA/SOURCE/ATTACHMENT_CHUNK.

## İndekslər

- `Term`: `(userId)`, `(userId, categoryId)`, `(userId, status)`, `(userId, nextReviewAt)`, `(userId, deletedAt)` + GIN trigram(`name`, `shortDef`).
- `Embedding`: `(userId)`, `(userId, termId)`, `(userId, source)`, `(contentHash)`, `@@unique(source, sourceId, chunkIndex)` + HNSW(`embedding`).
- `Review`/`LearningProgress`: `(userId, dueAt)`.
- Hər `@@unique([userId, slug])` — slug toqquşması istifadəçi daxilində həll olunur (`-2`, `-3`, …).
