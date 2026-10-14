import type { Source } from "@/schemas/source";

export class SourceStore {
  private sources: Map<string, Source> = new Map();

  add(source: Source): void {
    this.sources.set(source.id, source);
  }

  addMany(sources: Source[]): void {
    for (const source of sources) {
      this.add(source);
    }
  }

  get(id: string): Source | undefined {
    return this.sources.get(id);
  }

  has(id: string): boolean {
    return this.sources.has(id);
  }

  validateSourceIds(ids: string[]): { valid: string[]; missing: string[] } {
    const valid: string[] = [];
    const missing: string[] = [];
    for (const id of ids) {
      if (this.sources.has(id)) {
        valid.push(id);
      } else {
        missing.push(id);
      }
    }
    return { valid, missing };
  }

  getAll(): Source[] {
    return Array.from(this.sources.values());
  }

  toJson(): string {
    return JSON.stringify(this.getAll());
  }
}
