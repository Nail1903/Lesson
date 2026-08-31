/** Helpers for talking to the pgvector `embedding` column via raw SQL. */

export function toVectorLiteral(vec: number[]): string {
  // pgvector accepts the text form `[0.1,0.2,...]`
  return `[${vec.map((n) => (Number.isFinite(n) ? n : 0)).join(",")}]`;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}
