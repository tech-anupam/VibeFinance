export interface BM25Document {
  id: string;
  content: string;
}

interface IndexedDoc {
  id: string;
  terms: Map<string, number>;
  length: number;
}

export class BM25Index {
  private readonly k1: number;
  private readonly b: number;
  private docs: IndexedDoc[] = [];
  private avgDocLength = 0;
  private docFrequency: Map<string, number> = new Map();

  constructor(k1: number = 1.5, b: number = 0.75) {
    this.k1 = k1;
    this.b = b;
  }

  addDocuments(documents: BM25Document[]): void {
    for (const doc of documents) {
      const terms = this.tokenize(doc.content);
      const termFreqs = new Map<string, number>();
      for (const term of terms) {
        termFreqs.set(term, (termFreqs.get(term) ?? 0) + 1);
      }

      this.docs.push({ id: doc.id, terms: termFreqs, length: terms.length });

      const seen = new Set<string>();
      for (const term of terms) {
        if (!seen.has(term)) {
          this.docFrequency.set(term, (this.docFrequency.get(term) ?? 0) + 1);
          seen.add(term);
        }
      }
    }

    const totalLength = this.docs.reduce((sum, d) => sum + d.length, 0);
    this.avgDocLength = this.docs.length > 0 ? totalLength / this.docs.length : 0;
  }

  search(query: string, topK: number = 10): Array<{ id: string; score: number }> {
    const queryTerms = this.tokenize(query);
    const n = this.docs.length;
    const scores: Array<{ id: string; score: number }> = [];

    for (const doc of this.docs) {
      let score = 0;
      for (const term of queryTerms) {
        const tf = doc.terms.get(term) ?? 0;
        if (tf === 0) continue;

        const df = this.docFrequency.get(term) ?? 0;
        const idf = Math.log((n - df + 0.5) / (df + 0.5) + 1);
        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + this.b * (doc.length / this.avgDocLength));
        score += idf * (numerator / denominator);
      }
      if (score > 0) {
        scores.push({ id: doc.id, score });
      }
    }

    return scores.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1);
  }
}
