import type { Source } from "@/schemas/source";
import type { SourceAdapter } from "../types";
import { getCached, setCache } from "./cache";
import { log } from "@/lib/log";
import { SourceError, TimeoutError } from "@/lib/errors";
import { now } from "@/lib/time";
import type { PriceBar } from "@/analytics/indicators";

const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance";
const TIMEOUT_MS = 10_000;

interface YahooQuoteResponse {
  chart?: {
    result?: Array<{
      meta?: { regularMarketPrice?: number; currency?: string; exchangeName?: string };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }>;
      };
    }>;
  };
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchPriceHistory(symbol: string): Promise<PriceBar[]> {
  try {
    const url = `${YAHOO_BASE}/chart/${encodeURIComponent(symbol)}?range=3mo&interval=1d`;
    const response = await fetchWithTimeout(url, TIMEOUT_MS);
    if (!response.ok) return [];

    const data = (await response.json()) as YahooQuoteResponse;
    const result = data.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const quote = result?.indicators?.quote?.[0];
    if (!quote || !quote.close) return [];

    const bars: PriceBar[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = quote.close[i];
      if (close !== null && close !== undefined && !isNaN(close)) {
        bars.push({
          date: new Date((timestamps[i] ?? 0) * 1000).toISOString().slice(0, 10),
          open: quote.open?.[i] ?? close,
          high: quote.high?.[i] ?? close,
          low: quote.low?.[i] ?? close,
          close,
          volume: quote.volume?.[i] ?? 0,
        });
      }
    }
    return bars;
  } catch (e) {
    log.warn("Failed to fetch historical price bars", { symbol, error: String(e) });
    return [];
  }
}

export const yahooAdapter: SourceAdapter = {
  id: "yahoo-finance",
  kind: "price",

  async fetch(symbol: string): Promise<Source[]> {
    const cacheKey = `quote-${symbol}`;
    const cached = await getCached<Source[]>(cacheKey);
    if (cached) {
      log.info("Yahoo price cache hit", { symbol });
      return cached.data.map((s) => ({ ...s, trust: "cached" as const }));
    }

    const url = `${YAHOO_BASE}/chart/${encodeURIComponent(symbol)}?range=6mo&interval=1d`;
    let response: Response;

    try {
      response = await fetchWithTimeout(url, TIMEOUT_MS);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        throw new TimeoutError("yahoo-finance-fetch", TIMEOUT_MS);
      }
      throw new SourceError("yahoo-finance", e);
    }

    if (!response.ok) {
      throw new SourceError("yahoo-finance", new Error(`HTTP ${response.status}`));
    }

    const data = (await response.json()) as YahooQuoteResponse;
    const result = data.chart?.result?.[0];
    if (!result?.meta) {
      throw new SourceError("yahoo-finance", new Error("No data returned"));
    }

    const sources: Source[] = [
      {
        id: `yahoo-${symbol}-${Date.now()}`,
        kind: "price",
        title: `${symbol} Live Market Quote`,
        publisher: "Yahoo Finance",
        url: `https://finance.yahoo.com/quote/${symbol}`,
        retrievedAt: now(),
        asOf: now(),
        excerpt: `Current price: ${result.meta.regularMarketPrice ?? "N/A"} ${result.meta.currency ?? "INR"} on ${result.meta.exchangeName ?? "NSE"}`,
        trust: "primary",
      },
    ];

    await setCache(cacheKey, sources);
    return sources;
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(
        `${YAHOO_BASE}/chart/RELIANCE.NS?range=1d&interval=1d`,
        5000
      );
      return response.ok;
    } catch {
      return false;
    }
  },
};
