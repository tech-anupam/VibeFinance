import type { Source } from "@/schemas/source";
import type { SourceAdapter } from "../types";
import { getEnv } from "@/lib/env";
import { getCached, setCache } from "../price/cache";
import { log } from "@/lib/log";
import { now } from "@/lib/time";

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  published_date?: string;
}

interface TavilyResponse {
  results?: TavilySearchResult[];
}

function extractPublisher(url: string): string {
  try {
    const host = new URL(url).hostname.replace("www.", "").toLowerCase();
    if (host.includes("reddit.com")) return "Reddit";
    if (host.includes("twitter.com") || host.includes("x.com")) return "X (Twitter)";
    if (host.includes("quora.com")) return "Quora";
    if (host.includes("moneycontrol.com")) return "Moneycontrol";
    if (host.includes("livemint.com")) return "LiveMint";
    if (host.includes("economictimes")) return "Economic Times";
    if (host.includes("business-standard.com")) return "Business Standard";
    if (host.includes("traderji.com")) return "TraderJi Forum";
    if (host.includes("valuepickr.com")) return "ValuePickr";
    if (host.includes("tickertape.in")) return "Tickertape";
    if (host.includes("trendlyne.com")) return "Trendlyne";
    return host;
  } catch {
    return "Web Source";
  }
}

export class TavilyAdapter implements SourceAdapter {
  id = "web-tavily";
  kind: Source["kind"] = "web";

  async fetch(query: string): Promise<Source[]> {
    const apiKey = getEnv().TAVILY_API_KEY;
    if (!apiKey) {
      log.info("Tavily API key not configured, skipping Tavily adapter");
      return [];
    }

    const today = new Date().toISOString().slice(0, 10);
    const cleanQuery = query.trim().replace(/\.NS|\.BO/g, "");
    const cacheKey = `tavily-${today}-${cleanQuery.toLowerCase()}`;

    const cached = await getCached<Source[]>(cacheKey);
    if (cached) {
      log.info("Tavily search cache hit", { query });
      return cached.data.map((s) => ({ ...s, trust: "cached" as const }));
    }

    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: `${cleanQuery} stock financial analysis Reddit forum news`,
          search_depth: "basic",
          include_answer: false,
          max_results: 6,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        log.warn("Tavily search failed", { status: res.status });
        return [];
      }

      const data = (await res.json()) as TavilyResponse;
      const results = data.results ?? [];
      const timestamp = now();

      const sources: Source[] = results.map((r, i) => {
        const publisher = extractPublisher(r.url);
        return {
          id: `tavily-${cleanQuery.toLowerCase()}-${i}`,
          kind: "web",
          title: r.title || `${publisher} analysis of ${cleanQuery}`,
          publisher,
          url: r.url,
          retrievedAt: timestamp,
          asOf: r.published_date ? new Date(r.published_date).toISOString() : timestamp,
          excerpt: r.content.slice(0, 250),
          trust: "secondary",
        };
      });

      if (sources.length > 0) {
        await setCache(cacheKey, sources);
      }

      log.info("Tavily search retrieved sources", { count: sources.length, query: cleanQuery });
      return sources;
    } catch (e) {
      log.warn("Tavily search request exception", { error: String(e) });
      return [];
    }
  }

  async healthCheck(): Promise<boolean> {
    return Boolean(getEnv().TAVILY_API_KEY);
  }
}

export const tavilyAdapter = new TavilyAdapter();
