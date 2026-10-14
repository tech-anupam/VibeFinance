import { describe, it, expect } from "vitest";
import { BM25Index } from "@/retrieval/bm25";

describe("BM25Index", () => {
  it("returns relevant documents for a query", () => {
    const index = new BM25Index();
    index.addDocuments([
      { id: "doc1", content: "The company has significant debt obligations and borrowings" },
      { id: "doc2", content: "Revenue growth has been strong with increasing market share" },
      { id: "doc3", content: "The promoter holding has decreased from 75% to 60%" },
    ]);

    const results = index.search("debt borrowings");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.id).toBe("doc1");
  });

  it("returns empty for no match", () => {
    const index = new BM25Index();
    index.addDocuments([
      { id: "doc1", content: "Revenue growth is strong" },
    ]);

    const results = index.search("xyz123nonexistent");
    expect(results.length).toBe(0);
  });

  it("respects topK limit", () => {
    const index = new BM25Index();
    index.addDocuments(
      Array.from({ length: 20 }, (_, i) => ({
        id: `doc${i}`,
        content: `document about financial analysis topic ${i}`,
      }))
    );

    const results = index.search("financial analysis", 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("handles empty index", () => {
    const index = new BM25Index();
    const results = index.search("anything");
    expect(results.length).toBe(0);
  });
});
