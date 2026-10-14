import type { Source } from "@/schemas/source";

export interface SourceAdapter {
  id: string;
  kind: Source["kind"];
  fetch(query: string): Promise<Source[]>;
  healthCheck(): Promise<boolean>;
}

export interface AdapterStatus {
  id: string;
  healthy: boolean;
  lastChecked: string;
  error?: string;
}
