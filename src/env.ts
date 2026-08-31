import { z } from "zod";

/**
 * Central, validated environment access. Import `env` everywhere instead of
 * reading `process.env` directly so a missing/invalid var fails fast at boot.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 chars"),
  AUTH_URL: z.string().url().optional(),

  DEMO_MODE: z.coerce.boolean().default(false),
  DEMO_EMAIL: z.string().email().default("demo@mylesson.app"),
  DEMO_PASSWORD: z.string().min(6).default("demo1234"),

  AI_PROVIDER: z.enum(["openai", "anthropic", "echo"]).default("echo"),
  EMBEDDING_PROVIDER: z.enum(["openai", "echo"]).default("openai"),

  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_CHAT_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  OPENAI_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1536),

  ANTHROPIC_API_KEY: z.string().optional().default(""),
  ANTHROPIC_CHAT_MODEL: z.string().default("claude-sonnet-5"),

  RATE_LIMIT_AI_PER_MINUTE: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_UPLOAD_PER_MINUTE: z.coerce.number().int().positive().default(30),

  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("./uploads"),
  STORAGE_S3_BUCKET: z.string().optional().default(""),
  STORAGE_S3_REGION: z.string().optional().default("auto"),
  STORAGE_S3_ENDPOINT: z.string().optional().default(""),
  STORAGE_S3_ACCESS_KEY_ID: z.string().optional().default(""),
  STORAGE_S3_SECRET_ACCESS_KEY: z.string().optional().default(""),
  STORAGE_S3_PUBLIC_URL: z.string().optional().default(""),

  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(20),
  ALLOWED_UPLOAD_TYPES: z
    .string()
    .default(
      "application/pdf,text/plain,text/markdown,text/csv,image/png,image/jpeg,image/webp",
    ),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:\n",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

export const allowedUploadTypes = env.ALLOWED_UPLOAD_TYPES.split(",").map((s) =>
  s.trim(),
);
