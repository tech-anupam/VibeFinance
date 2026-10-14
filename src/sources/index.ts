import { getSourceRegistry } from "./registry";
import { yahooAdapter } from "./price/yahoo";
import { localCorpusAdapter } from "./filings/local-corpus";
import { tavilyAdapter } from "./web/tavily";
import { socialAdapter } from "./social/search";

export function initializeSources(): void {
  const registry = getSourceRegistry();
  registry.register(yahooAdapter);
  registry.register(localCorpusAdapter);
  registry.register(tavilyAdapter);
  registry.register(socialAdapter);
}

export { getSourceRegistry } from "./registry";
export type { SourceAdapter, AdapterStatus } from "./types";
