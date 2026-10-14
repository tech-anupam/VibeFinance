import { NextResponse } from "next/server";
import { log } from "@/lib/log";

interface YahooQuote {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  quoteType?: string;
  sector?: string;
}

interface YahooAutoResponse {
  quotes?: YahooQuote[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=12&newsCount=0&listsCount=0&quotesQueryId=tss_match_phrase_query`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = (await res.json()) as YahooAutoResponse;
    const quotes = (data.quotes ?? [])
      .filter((q) => q.quoteType === "EQUITY" || q.quoteType === "ETF")
      .map((q) => ({
        symbol: q.symbol,
        name: q.shortname ?? q.longname ?? q.symbol,
        exchange: q.exchange ?? "",
      }));

    quotes.sort((a, b) => {
      const aIsIndian = a.symbol.endsWith(".NS") || a.symbol.endsWith(".BO") || a.exchange === "NSI" || a.exchange === "BSE";
      const bIsIndian = b.symbol.endsWith(".NS") || b.symbol.endsWith(".BO") || b.exchange === "NSI" || b.exchange === "BSE";
      if (aIsIndian && !bIsIndian) return -1;
      if (!aIsIndian && bIsIndian) return 1;
      return 0;
    });

    return NextResponse.json({ results: quotes });
  } catch (e) {
    log.warn("Stock search failed", { error: String(e) });
    return NextResponse.json({ results: [] });
  }
}
