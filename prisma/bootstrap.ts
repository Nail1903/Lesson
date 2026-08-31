/**
 * DB bootstrap helper — runs the bits Prisma's schema push can't express.
 *
 *   tsx prisma/bootstrap.ts            → create required extensions (run BEFORE `prisma db push`)
 *   tsx prisma/bootstrap.ts --indexes  → create vector + trigram indexes (run AFTER `prisma db push`)
 *
 * Uses the Prisma client's raw query API so no extra pg driver is needed.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// DDL (CREATE EXTENSION / CREATE INDEX) must run on a direct, non-pooled
// connection — pgbouncer-style poolers reject some of these statements.
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({ datasources: { db: { url } } });

const EXTENSIONS = ["vector", "pg_trgm"];

// HNSW index for cosine similarity + GIN trigram indexes powering hybrid search.
const INDEXES: string[] = [
  `CREATE INDEX IF NOT EXISTS "Embedding_embedding_hnsw_idx"
     ON "Embedding" USING hnsw ("embedding" vector_cosine_ops)`,
  `CREATE INDEX IF NOT EXISTS "Term_name_trgm_idx"
     ON "Term" USING gin ("name" gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS "Term_shortDef_trgm_idx"
     ON "Term" USING gin ("shortDef" gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS "Note_body_trgm_idx"
     ON "Note" USING gin ("body" gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS "Example_body_trgm_idx"
     ON "Example" USING gin ("body" gin_trgm_ops)`,
];

async function main() {
  const withIndexes = process.argv.includes("--indexes");

  for (const ext of EXTENSIONS) {
    process.stdout.write(`· CREATE EXTENSION IF NOT EXISTS ${ext} … `);
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS "${ext}"`);
    console.log("ok");
  }

  if (withIndexes) {
    for (const sql of INDEXES) {
      const name = sql.match(/"([A-Za-z_]+idx)"/)?.[1] ?? "index";
      process.stdout.write(`· ${name} … `);
      try {
        await prisma.$executeRawUnsafe(sql);
        console.log("ok");
      } catch (err) {
        console.log(`skipped (${(err as Error).message.split("\n")[0]})`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
