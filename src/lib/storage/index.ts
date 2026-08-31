import { promises as fs } from "node:fs";
import path from "node:path";

import { env } from "@/env";

export interface PutObjectInput {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}

export interface StorageAdapter {
  readonly driver: string;
  put(input: PutObjectInput): Promise<{ key: string; url: string | null }>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  /** Public URL if the driver serves objects directly; otherwise null. */
  publicUrl(key: string): string | null;
}

class LocalStorageAdapter implements StorageAdapter {
  readonly driver = "local";
  private root = path.resolve(env.STORAGE_LOCAL_DIR);

  private full(key: string) {
    const p = path.resolve(this.root, key);
    if (!p.startsWith(this.root)) throw new Error("Path traversal blocked");
    return p;
  }

  async put(input: PutObjectInput) {
    const p = this.full(input.key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, input.body);
    return { key: input.key, url: null };
  }

  async get(key: string) {
    return fs.readFile(this.full(key));
  }

  async delete(key: string) {
    await fs.rm(this.full(key), { force: true });
  }

  publicUrl() {
    // Served through the authenticated route /api/attachments/[id]/raw
    return null;
  }
}

/**
 * S3-compatible adapter (AWS S3, Cloudflare R2, MinIO). Kept as a lazy stub:
 * install `@aws-sdk/client-s3` and fill these in when you switch STORAGE_DRIVER.
 */
class S3StorageAdapter implements StorageAdapter {
  readonly driver = "s3";
  async put(): Promise<{ key: string; url: string | null }> {
    throw new Error(
      "S3 adapter not wired yet — `npm i @aws-sdk/client-s3` and implement src/lib/storage/index.ts::S3StorageAdapter",
    );
  }
  async get(): Promise<Buffer> {
    throw new Error("S3 adapter not implemented");
  }
  async delete(): Promise<void> {
    throw new Error("S3 adapter not implemented");
  }
  publicUrl(key: string) {
    return env.STORAGE_S3_PUBLIC_URL ? `${env.STORAGE_S3_PUBLIC_URL}/${key}` : null;
  }
}

let cached: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (cached) return cached;
  cached = env.STORAGE_DRIVER === "s3" ? new S3StorageAdapter() : new LocalStorageAdapter();
  return cached;
}
