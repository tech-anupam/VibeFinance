import type { Source } from "@/schemas/source";
import type { SourceAdapter, AdapterStatus } from "./types";
import { log } from "@/lib/log";
import { now } from "@/lib/time";

export class SourceRegistry {
  private adapters: Map<string, SourceAdapter> = new Map();
  private statuses: Map<string, AdapterStatus> = new Map();
  private disabled: Set<string> = new Set();

  register(adapter: SourceAdapter): void {
    this.adapters.set(adapter.id, adapter);
    log.info("Source adapter registered", { id: adapter.id, kind: adapter.kind });
  }

  disable(adapterId: string): void {
    this.disabled.add(adapterId);
    log.info("Source adapter disabled", { id: adapterId });
  }

  enable(adapterId: string): void {
    this.disabled.delete(adapterId);
    log.info("Source adapter enabled", { id: adapterId });
  }

  async fetch(kind: Source["kind"], query: string): Promise<Source[]> {
    const candidates = Array.from(this.adapters.values())
      .filter((a) => a.kind === kind && !this.disabled.has(a.id));

    const results: Source[] = [];

    for (const adapter of candidates) {
      try {
        const sources = await adapter.fetch(query);
        this.statuses.set(adapter.id, { id: adapter.id, healthy: true, lastChecked: now() });
        if (sources.length > 0) {
          results.push(...sources);
          if (kind !== "web") break;
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        log.warn("Source adapter fetch failed, trying next", { id: adapter.id, error: errorMsg });
        this.statuses.set(adapter.id, {
          id: adapter.id,
          healthy: false,
          lastChecked: now(),
          error: errorMsg,
        });
      }
    }

    return results;
  }

  async runHealthChecks(): Promise<AdapterStatus[]> {
    const results: AdapterStatus[] = [];
    for (const adapter of this.adapters.values()) {
      try {
        const healthy = await adapter.healthCheck();
        const status: AdapterStatus = { id: adapter.id, healthy, lastChecked: now() };
        this.statuses.set(adapter.id, status);
        results.push(status);
      } catch (e) {
        const status: AdapterStatus = {
          id: adapter.id,
          healthy: false,
          lastChecked: now(),
          error: String(e),
        };
        this.statuses.set(adapter.id, status);
        results.push(status);
      }
    }
    return results;
  }

  getStatuses(): AdapterStatus[] {
    return Array.from(this.statuses.values());
  }

  getDegradedAdapters(): string[] {
    return Array.from(this.statuses.values())
      .filter((s) => !s.healthy)
      .map((s) => s.id);
  }

  getAdaptersByKind(kind: Source["kind"]): SourceAdapter[] {
    return Array.from(this.adapters.values()).filter((a) => a.kind === kind);
  }
}

let instance: SourceRegistry | undefined;

export function getSourceRegistry(): SourceRegistry {
  if (!instance) {
    instance = new SourceRegistry();
  }
  return instance;
}
