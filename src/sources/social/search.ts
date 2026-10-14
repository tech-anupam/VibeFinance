import type { Source } from "@/schemas/source";
import type { SourceAdapter } from "../types";
import { getCached, setCache } from "../price/cache";
import { log } from "@/lib/log";
import { now } from "@/lib/time";

const SOCIAL_DOMAINS = [
  "reddit.com",
  "x.com",
  "twitter.com",
  "quora.com",
  "moneycontrol.com",
  "traderji.com",
  "valuepickr.com",
  "economictimes.indiatimes.com",
  "livemint.com",
  "business-standard.com",
  "tickertape.in",
  "trendlyne.com",
];

function buildSearchUrl(query: string, recency: "day" | "week"): string {
  const domainFilter = SOCIAL_DOMAINS.map((d) => `site:${d}`).join(" OR ");
  const timeFilter = recency === "day" ? "qdr:d" : "qdr:w";
  return `https://www.google.com/search?q=${encodeURIComponent(`${query} stock analysis`)}+${encodeURIComponent(domainFilter)}&tbs=${timeFilter}&num=10`;
}

function extractTimestampFromSnippet(snippet: string): string | undefined {
  const patterns = [
    /(\d{1,2})\s+(hours?|hrs?)\s+ago/i,
    /(\d{1,2})\s+(minutes?|mins?)\s+ago/i,
    /(\d{1,2})\s+(days?)\s+ago/i,
    /(today|just now)/i,
    /(\w{3})\s+(\d{1,2}),?\s+(\d{4})/i,
    /(\d{1,2})\s+(\w{3})\s+(\d{4})/i,
  ];

  const today = new Date();

  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (!match) continue;

    if (match[0]?.toLowerCase().includes("just now") || match[0]?.toLowerCase() === "today") {
      return today.toISOString();
    }

    const amount = parseInt(match[1] ?? "0", 10);
    const unit = (match[2] ?? "").toLowerCase();

    if (unit.startsWith("hour") || unit.startsWith("hr")) {
      return new Date(today.getTime() - amount * 3600_000).toISOString();
    }
    if (unit.startsWith("minute") || unit.startsWith("min")) {
      return new Date(today.getTime() - amount * 60_000).toISOString();
    }
    if (unit.startsWith("day")) {
      return new Date(today.getTime() - amount * 86400_000).toISOString();
    }
  }

  return undefined;
}

function domainToPublisher(domain: string): string | undefined {
  const map: Record<string, string> = {
    "reddit.com": "Reddit",
    "x.com": "X (Twitter)",
    "twitter.com": "X (Twitter)",
    "quora.com": "Quora",
    "moneycontrol.com": "Moneycontrol",
    "traderji.com": "TraderJi Forum",
    "valuepickr.com": "ValuePickr",
    "economictimes.indiatimes.com": "Economic Times",
    "livemint.com": "LiveMint",
    "business-standard.com": "Business Standard",
    "tickertape.in": "Tickertape",
    "trendlyne.com": "Trendlyne",
  };
  for (const [key, value] of Object.entries(map)) {
    if (domain.includes(key)) return value;
  }
  return undefined;
}

function extractResultsFromHtml(html: string, query: string): Source[] {
  const sources: Source[] = [];
  const retrievedAt = now();

  const linkPattern = /href="\/url\?q=(https?:\/\/[^&"]+)/g;
  const snippetPattern = /<span class="[^"]*">([^<]{20,300})<\/span>/g;

  const snippets: string[] = [];
  let snippetMatch;
  while ((snippetMatch = snippetPattern.exec(html)) !== null) {
    const text = snippetMatch[1] ?? "";
    if (text.length > 30 && !text.includes("<") && !text.includes("{")) {
      snippets.push(text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
    }
  }

  let linkMatch;
  let index = 0;
  while ((linkMatch = linkPattern.exec(html)) !== null && index < 8) {
    const url = decodeURIComponent(linkMatch[1] ?? "");
    if (!url || url.includes("google.com") || url.includes("googleapis.com") || url.includes("gstatic.com")) continue;

    let domain: string;
    try {
      domain = new URL(url).hostname.replace("www.", "");
    } catch {
      continue;
    }

    const publisher = domainToPublisher(domain);
    if (!publisher) continue;

    const snippet = snippets[index] ?? `${publisher} discussion about ${query}`;
    const postTimestamp = extractTimestampFromSnippet(snippet) ?? retrievedAt;

    sources.push({
      id: `social-${query.replace(/\s+/g, "-").slice(0, 20)}-${Date.now()}-${index}`,
      kind: "web",
      title: `${publisher}: ${query}`,
      publisher,
      url,
      retrievedAt,
      asOf: postTimestamp,
      excerpt: snippet.slice(0, 250),
      trust: "secondary",
    });
    index++;
  }

  return sources;
}

export const socialAdapter: SourceAdapter = {
  id: "social-search",
  kind: "web",

  async fetch(query: string): Promise<Source[]> {
    const todayKey = new Date().toISOString().slice(0, 10);
    const cacheKey = `social-${todayKey}-${query}`;
    const cached = await getCached<Source[]>(cacheKey);
    if (cached) {
      log.info("Social search cache hit (today)", { query });
      return cached.data.map((s) => ({ ...s, trust: "cached" as const }));
    }

    const allSources: Source[] = [];

    for (const recency of ["day", "week"] as const) {
      try {
        const searchUrl = buildSearchUrl(query, recency);
        const res = await fetch(searchUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) continue;

        const html = await res.text();
        const sources = extractResultsFromHtml(html, query);
        allSources.push(...sources);

        if (allSources.length >= 4) break;
      } catch (e) {
        log.warn("Social search attempt failed", { query, recency, error: String(e) });
      }
    }

    const seen = new Set<string>();
    const deduped = allSources.filter((s) => {
      if (seen.has(s.url ?? "")) return false;
      seen.add(s.url ?? "");
      return true;
    });

    if (deduped.length > 0) {
      await setCache(cacheKey, deduped);
    }

    log.info("Social search complete", { query, count: deduped.length });
    return deduped;
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch("https://www.google.com", {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
