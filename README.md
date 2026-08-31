# MyLesson — şəxsi bilik və yaddaş sistemi

Öyrəndiyin terminləri sistemli topla → nümunə və əlaqələrlə zənginləşdir → **yalnız öz qeydlərinə** əsaslanan AI köməkçisinə sual ver → testdən keç → zəif tərəfləri müəyyən et → aralıqlı təkrarla.

Bu sadə qeyd proqramı deyil. Əsas dəyər — topladığın məlumatı **aktiv biliyə** çevirən dövrdür.

---

## 1. Texnoloji stack

| Sahə | Seçim | Qeyd |
|---|---|---|
| Framework | **Next.js 15** (App Router) + React 19 | Server Components + Server Actions |
| Dil | **TypeScript strict** (`noUncheckedIndexedAccess` daxil) | `any` minimuma endirilib |
| UI | **Tailwind CSS** + əl ilə yazılmış shadcn/ui üslublu komponentlər | Radix primitivləri, dark mode, responsive |
| DB | **PostgreSQL + pgvector** (Neon uyğun) | Hibrid axtarış: vektor + trigram |
| ORM | **Prisma 6** | `postgresqlExtensions`, `Unsupported("vector(1536)")` |
| Auth | **Auth.js v5 (NextAuth beta)** | Credentials + JWT sessiya, Prisma adapter |
| Validasiya | **Zod** | Bütün action/route girişləri |
| AI | **Provider adapter** (OpenAI / Anthropic / offline `echo`) | Server-only, açar frontendə çıxmır |
| Embeddings | OpenAI `text-embedding-3-small` **və ya** offline hash-embedding | `Embedding.model` + `dimensions` DB-də saxlanılır |
| Markdown/LaTeX | react-markdown + remark-gfm/-math + rehype-katex/-highlight | `[[Termin]]` daxili keçidləri |
| Storage | **Storage adapter** (`local` / `s3`) | S3/R2 üçün stub hazırdır |
| Test | **Vitest** | `tests/` — SRS + RAG vahid testləri |

### Niyə bu seçimlər (əsas texniki qərarlar)

- **AI provider adapter pattern.** `src/lib/ai/` daxilində `ChatProvider` və `EmbeddingProvider` interfeysləri var. Yeni provayder = bir sinif + `getChatProvider()` içində bir `case`. Chat və embedding **ayrıdır** (Anthropic-in embedding API-si yoxdur; premium chat + ucuz lokal embedding mümkün olsun).
- **`echo` offline provayder.** Heç bir API açarı olmadan bütün tətbiq (RAG daxil) işləyir — CI, lokal dev və demo üçün. Hash əsaslı embedding leksik oxşarlığı təxmini əks etdirir.
- **Hibrid RAG.** `pgvector` cosine (HNSW indeks) + `pg_trgm`/ILIKE açar söz axtarışı çəkili cəmlə birləşir və yenidən sıralanır. Bütün sorğular `userId` ilə məhdudlaşır.
- **Inkremental indeksləmə.** Hər termin məzmun parçalara bölünür, hər parçanın `contentHash`-i saxlanılır; yalnız dəyişən parçalar yenidən embed olunur.
- **Soft delete hər yerdə.** `deletedAt` + `Trash` səhifəsi + audit `UserActivity`.
- **Fənn / Mövzu / Kateqoriya.** `Category` — bir terminin tək, rəngli qrupu (qraf üçün). `Subject` (Fənn) — akademik təsnifat, **many-to-many**: bir termin çoxlu fənndə ola bilər, amma izah səhifəsi **birdir** (`/terms/[slug]`). `Topic` (mövzu/dərs) fənnin sıralı ağacıdır; `TopicTerm` termini mövzuya "əlavə" (supplement) kimi bağlayır. Gələcəkdə mövzuya başqa supplement növləri (düstur, fayl, çalışma) əlavə olunacaq.

---

## 2. Sistem arxitekturası

```
Browser (RSC + Client Components)
   │  Server Actions (RPC)          API Routes
   ▼                                 ▼
┌───────────────────────────────────────────────┐
│  Next.js server                               │
│  ├─ src/server/actions/*   (giriş validasiya) │
│  ├─ src/server/services/*  (biznes məntiq)    │
│  ├─ src/lib/rag/*          (chunk→embed→      │
│  │                          retrieve→answer)  │
│  ├─ src/lib/ai/*           (provider adapter) │
│  ├─ src/lib/storage/*      (storage adapter)  │
│  └─ src/lib/auth*          (Auth.js v5)       │
└───────────────┬───────────────────────────────┘
                ▼
   PostgreSQL + pgvector  (Prisma)
                ▲
   OpenAI / Anthropic / echo  (yalnız serverdən)
```

**Təhlükəsizlik (bölmə 17):** API açarları yalnız serverdə; bütün AI sorğuları server-side; hər istifadəçinin embedding-ləri `userId` ilə filtrlənir; yüklənmiş məzmun etibarsız data kimi RAG konteksti daxilində `<context>` teqləri ilə izolyasiya olunur; per-user rate limiting (`src/lib/rate-limit.ts`); fayl ölçü/format limiti (`.env`); AI heç nəyi istifadəçi təsdiqi olmadan qeydə yazmır (`AIContentSuggestion` PENDING axını).

---

## 3. İstifadəçi axınları

1. **Qeydiyyat → avtomatik başlanğıc məzmun.** `registerAction` yeni istifadəçiyə 11 seed termini + fənnlər + əlaqələr + suallar kopyalayır, embedding-ləri qurur.
2. **Termin əlavə et.** `/terms/new` — yalnız ad məcburi. Bölmələrə ayrılmış forma. Create rejimində `localStorage` qaralaması, edit rejimində **avtomatik saxlama** (debounce 1.2s).
3. **Zənginləşdir.** Termin səhifəsində nümunə/qeyd/əlaqə/düstur; "Sadə / Texniki / Başqa nümunə" düymələri AI təklifi yaradır → istifadəçi **təsdiqləyənə qədər** qeydə düşmür.
4. **Fənnə bağla.** Termin redaktəsində fənnləri seç; fənn səhifəsində mövzu yarat, mövzuya mövcud və ya yeni termin əlavə et.
5. **Soruş.** `/assistant` — RAG. Rejimlər (sadə/müəllim/elmi/…), scope (`Yalnız qeydlərim` / `Qeydlərim + AI biliyi`). Cavabda: istifadə olunan qeydlər (kliklənən), uyğunluq %, məlumat çatışmazlığı, əlaqəli terminlər. Cavabı qeyd/nümunə kimi termə əlavə et (təsdiqlə).
6. **Test.** `/quizzes` — mənbə seç (zəif / bu həftə / kateqoriya / …), sual növləri, say. Açıq suallar **mənaca** qiymətləndirilir (AI, yoxdursa leksik). Nəticə terminin əminlik səviyyəsini və növbəti təkrar tarixini yeniləyir.
7. **Təkrar.** `/review` — flashcard, SM-2. "Xatırlamadım / Çətin / Normal / Asan" → növbəti tarix.
8. **İzlə.** `/dashboard`, `/stats` — ardıcıllıq, status/kateqoriya bölgüsü, test nəticələri.
9. **Köçür.** `/import-export` — JSON/CSV/Markdown ixrac, JSON/CSV idxal, tam backup, vektor yenidən indeksləmə. `/settings` → bütün məzmunu sil.

---

## 4. Verilənlər bazası modeli

Tam sxem: [`prisma/schema.prisma`](prisma/schema.prisma). Diaqram və izah: [`docs/DATABASE.md`](docs/DATABASE.md).

Əsas qruplar:

- **Auth:** `User`, `Account`, `Session`, `VerificationToken`, `PasswordResetToken`
- **Bilik nüvəsi:** `Term`, `TermAlias`, `TermRelation`, `Note`, `Example`, `CodeExample`, `Formula`, `Source`, `Attachment`
- **Təşkilat:** `Category`, `Collection`, `Tag`, `Subject`, `Topic`, `TopicTerm`
- **Vektor:** `Embedding` (`vector(1536)`, `model`, `dimensions`, `contentHash` — yenidən indeksləmə üçün)
- **AI:** `Chat`, `ChatMessage` (citations JSON, confidence, hasGap), `AIContentSuggestion` (PENDING/ACCEPTED/REJECTED)
- **Öyrənmə:** `Quiz`, `Question`, `Answer`, `Review`, `LearningProgress` (SM-2 vəziyyəti)
- **Audit:** `UserActivity`

Hamısında `createdAt`/`updatedAt`; istifadəçi məzmununda `deletedAt` (soft delete).

---

## 5. Qovluq strukturu

```
prisma/
  schema.prisma          Bütün modellər
  bootstrap.ts           EXTENSION + HNSW/trigram indekslər
  seed.ts                Demo istifadəçi + başlanğıc məzmun
src/
  env.ts                 Zod ilə validasiya olunan ENV
  middleware.ts          Auth qapısı
  app/
    (marketing)          → landing (src/app/page.tsx)
    (auth)/login|register
    (app)/dashboard|terms|subjects|collections|graph|
          assistant|quizzes|review|sources|stats|history|
          import-export|trash|settings
    api/auth/[...nextauth] | api/export | api/health
  components/
    ui/                  Button, Card, Dialog, Select, Tabs, …
    app/                 Sidebar, Topbar, EmptyState
    editor/              MarkdownEditor (toolbar + preview)
    terms/ subjects/ assistant/ quiz/ review/ graph/ …
  lib/
    ai/                  types + index (adapter) + providers/{openai,anthropic,echo}
    rag/                 chunk · vector · indexer · retrieve · answer
    storage/             local + s3 adapter
    srs.ts               SM-2
    rate-limit.ts logger.ts labels.ts utils.ts
    validations/         Zod sxemləri
  server/
    actions/             "use server" — girişin validasiyası, revalidatePath
    services/            biznes məntiq (repository/service layer)
    queries/             oxu üçün aqreqasiyalar (dashboard)
tests/                   Vitest
docs/                    ARCHITECTURE.md · DATABASE.md · ROADMAP.md
```

---

## 6. Quraşdırma

### Tələblər
- Node ≥ 20
- PostgreSQL 15+ (`vector` və `pg_trgm` extension-ları ilə) — ən asanı [Neon](https://neon.tech)

### Addımlar

```bash
# 1. Asılılıqlar
npm install

# 2. Mühit
cp .env.example .env
#   DATABASE_URL / DIRECT_URL doldur
#   npx auth secret   → AUTH_SECRET
#   AI_PROVIDER=echo  (açarsız işləmək üçün) və ya openai + OPENAI_API_KEY

# 3. Bazanı qur (extension → schema → indekslər → seed)
npm run db:setup
#   ekiv.: db:bootstrap → db:push → db:index → db:seed

# 4. İşə sal
npm run dev        # http://localhost:3000
```

### Demo hesab
`.env`-də `DEMO_MODE=true` olduqda: **demo@mylesson.app / demo1234** (login səhifəsində `?demo=1` avtomatik doldurur).

### Faydalı skriptlər
| Skript | İş |
|---|---|
| `npm run db:setup` | Sıfırdan tam qurulum |
| `npm run db:reset` | Bazanı sıfırla + yenidən seed |
| `npm run db:studio` | Prisma Studio |
| `npm run db:index` | HNSW/trigram indeksləri (schema push-dan sonra) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `GET /api/health` | DB + provayder statusu |

---

## 7. MVP vs sonrakı mərhələlər

### ✅ MVP (bu repo — işlək)
Autentifikasiya (qeydiyyat/giriş/çıxış, sessiya izolyasiyası) · Termin CRUD + soft delete/restore · Kateqoriya, etiket, kolleksiya · **Fənn / Mövzu / TopicTerm** · Nümunə CRUD + AI təklifi (təsdiqli) · Əlaqələr (8 növ) + bilik qrafı · Adi + **semantik axtarış** · **RAG AI köməkçisi** (rejimlər, scope, sitatlar, gap) · Söhbət tarixçəsi (ad dəyiş/sil/səs ver/qeydə köçür) · **Test mərkəzi** (mənbələr, 5 sual növü, semantik qiymətləndirmə) · **Flashcard + SM-2 təkrar** · Dashboard + Statistika · Mənbələr · Import/Export (JSON/CSV/MD) + yenidən indeksləmə · Dark mode, responsive, toast, skeleton, empty/error state.

### 🔜 Mərhələ 2
- Fayl yükləmə: PDF/DOCX mətn çıxarışı → RAG indeksinə (icazə ilə). Storage adapter və `Attachment` modeli hazırdır.
- Zəngin redaktor: Tiptap (hazırda toolbar + canlı önizləməli Markdown).
- Şifrə sıfırlama e-poçtu (`PasswordResetToken` modeli hazırdır).
- Qeydlərdə ziddiyyət/təkrar aşkarlanması (embedding cütlərinin yaxınlığı).
- Mövzuya digər supplement növləri (düstur, çalışma, xülasə) — `TopicTerm`-i polimorf `TopicSupplement`-ə genişləndir.
- Streaming AI cavabları (adapterlərdə `stream()` artıq var).

### 🔮 Mərhələ 3
- Çoxistifadəçili paylaşım / komanda kolleksiyaları (model artıq `userId` əsaslıdır).
- Redis rate-limit + arxa fon işçiləri (embedding növbəsi).
- Mobil PWA, offline oxu.
- Anki `.apkg` idxal/ixrac.

---

## 8. Bilinən məhdudiyyətlər

- Rate-limit yaddaşdadır (tək instansiya). Horizontal miqyas üçün Redis-ə keçin — `limit()` imzası dəyişmir.
- `echo` embedding **semantik deyil**, leksikdir — gerçək semantik axtarış üçün `EMBEDDING_PROVIDER=openai`.
- S3 storage adapteri stub-dur (`npm i @aws-sdk/client-s3` + implementasiya).
- Fayl (PDF/DOCX) yükləmə UI-si Mərhələ 2-dədir; mənbələr üçün metadata forması işləkdir.
