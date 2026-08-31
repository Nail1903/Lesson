import { describe, it, expect } from "vitest";
import { splitText } from "@/lib/rag/chunk";
import { cosineSimilarity, toVectorLiteral } from "@/lib/rag/vector";
import { EchoEmbeddingProvider } from "@/lib/ai/providers/echo";

describe("chunk splitter", () => {
  it("keeps short text as a single chunk", () => {
    expect(splitText("qısa mətn")).toEqual(["qısa mətn"]);
  });

  it("splits long text into multiple bounded chunks", () => {
    const para = "Bu bir cümlədir. ".repeat(120);
    const chunks = splitText(para, 80);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeGreaterThan(0);
  });
});

describe("vector helpers", () => {
  it("formats a pgvector literal", () => {
    expect(toVectorLiteral([0.1, 0.2, 0])).toBe("[0.1,0.2,0]");
  });

  it("cosine similarity of identical vectors is 1", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 5);
  });
});

describe("echo embedding provider", () => {
  it("produces normalized vectors of the requested dimension", async () => {
    const p = new EchoEmbeddingProvider(64);
    const [v] = await p.embed(["graph neural network sampling"]);
    expect(v).toHaveLength(64);
    const norm = Math.sqrt(v!.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it("scores lexically similar text higher than unrelated text", async () => {
    const p = new EchoEmbeddingProvider(256);
    const [q, close, far] = await p.embed([
      "induktiv qraf öyrənməsi sampling",
      "induktiv qraf öyrənməsi qonşu sampling",
      "kalman filtri vəziyyət qiymətləndirməsi",
    ]);
    expect(cosineSimilarity(q!, close!)).toBeGreaterThan(cosineSimilarity(q!, far!));
  });
});
