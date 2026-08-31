import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/env";

export async function GET() {
  let dbOk = false;
  try {
    await db.$queryRawUnsafe("SELECT 1");
    dbOk = true;
  } catch {
    dbOk = false;
  }
  return NextResponse.json({
    status: dbOk ? "ok" : "degraded",
    db: dbOk,
    aiProvider: env.AI_PROVIDER,
    embeddingProvider: env.EMBEDDING_PROVIDER,
    time: new Date().toISOString(),
  });
}
