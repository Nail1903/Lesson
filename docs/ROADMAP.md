# Yol xəritəsi

## Mərhələ 1 — MVP (bu repo)

- [x] Auth: qeydiyyat, giriş, çıxış, sessiya izolyasiyası, demo hesab
- [x] Termin CRUD, bölmələrə ayrılmış forma, avtomatik saxlama, `[[keçid]]`
- [x] Kateqoriya / etiket / kolleksiya
- [x] Fənn / Mövzu (dərs) / `TopicTerm` — termin çoxlu fənndə, izah səhifəsi tək
- [x] Nümunə CRUD + tip + reytinq; AI təklifi (Sadə/Texniki/Başqa) → təsdiqlə
- [x] Əlaqələr (8 növ) + interaktiv bilik qrafı (filtr, zoom, fokus)
- [x] Adi axtarış (ad/sinonim/kateqoriya/etiket/mətn) + semantik axtarış
- [x] RAG AI köməkçisi: 9 rejim, 2 scope, sitatlar, uyğunluq %, GAP, əlaqəli terminlər
- [x] Söhbət tarixçəsi: ad dəyiş / sil / faydalı səs / cavabı termə köçür
- [x] Test mərkəzi: 6 mənbə, 5+ sual növü, semantik qiymətləndirmə, terminə keçid
- [x] Flashcard + SM-2 aralıqlı təkrar; dashboard təkrar növbəsi
- [x] Dashboard + Statistika (status/kateqoriya/aktivlik/test qrafikləri)
- [x] Mənbələr (kitab/məqalə/keçid metadata)
- [x] Import/Export: JSON backup, CSV, Markdown; JSON/CSV idxal; yenidən indeksləmə
- [x] Səbət (soft delete) + bərpa/birdəfəlik silmə
- [x] Parametrlər: profil, dil, per-user AI provayder, bütün məzmunu silmə
- [x] Dark mode, responsive, toast, skeleton, empty/error state
- [x] Vitest: SRS + RAG parçalama/embedding testləri
- [x] `.env.example`, seed skript, `/api/health`, README + docs

## Mərhələ 2

- [ ] **Fayl yükləmə** (`Attachment` + storage adapter hazırdır): PDF (`pdf-parse`), DOCX (`mammoth`), TXT/MD mətn çıxarışı → istifadəçi icazəsi ilə RAG indeksinə (`EmbeddingSource.ATTACHMENT_CHUNK`)
- [ ] **Tiptap** zəngin redaktor (hazırda: toolbar + canlı önizləməli Markdown textarea)
- [ ] Şifrə sıfırlama e-poçtu (`PasswordResetToken` + Resend/SMTP)
- [ ] **Ziddiyyət/təkrar aşkarlanması**: eyni istifadəçinin embedding cütləri arasında yüksək oxşarlıq + fərqli iddia → dashboard xəbərdarlığı
- [ ] `TopicTerm` → polimorf `TopicSupplement` (`kind: TERM | FORMULA | FILE | EXERCISE | SUMMARY`)
- [ ] Streaming AI cavabları (adapterlərdə `stream()` var — UI-də SSE)
- [ ] Reranker (cross-encoder və ya LLM rerank) retrieval-dan sonra
- [ ] Testdə "flashcard" və "kodun nəticəsi" növləri üçün xüsusi UI

## Mərhələ 3

- [ ] Çoxistifadəçili: komanda kolleksiyaları, paylaşılan fənnlər, rol/icazə (`User.role` var)
- [ ] Redis rate-limit + BullMQ embedding növbəsi (böyük idxallar üçün)
- [ ] Mobil PWA + offline oxu
- [ ] Anki `.apkg` idxal/ixrac
- [ ] Bilik boşluğu təhlili: "hansı ilkin biliklər çatmır" (qraf + status)
- [ ] Çoxdilli embedding / termin tərcümələri

## Texniki borc

- Rate-limit yaddaşdadır → Redis
- S3 storage adapteri stub → tam implementasiya
- `retrieve.ts` keyword axtarışı `ILIKE` → `pg_trgm` `similarity()` / `websearch_to_tsquery`
- Bəzi Prisma sorğularında `as never` cast-ları → dəqiq tiplər
