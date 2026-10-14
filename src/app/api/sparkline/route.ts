import { NextResponse } from "next/server";
import { log } from "@/lib/log";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return NextResponse.json({ prices: [], change: 0, changePercent: 0, currentPrice: 0, currency: "INR" });
    }

    const data = await res.json() as {
      chart?: {
        result?: Array<{
          meta?: { regularMarketPrice?: number; previousClose?: number; chartPreviousClose?: number; currency?: string };
          indicators?: { quote?: Array<{ close?: (number | null)[] }> };
        }>;
      };
    };

    const result = data.chart?.result?.[0];
    const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter(
      (v): v is number => typeof v === "number" && !isNaN(v)
    );

    const meta = result?.meta;
    const lastPrice = closes.length > 0 ? closes[closes.length - 1]! : 0;
    const currentPrice = meta?.regularMarketPrice ?? lastPrice;

    const baseClose = meta?.previousClose ?? (closes.length > 1 ? closes[closes.length - 2]! : (closes[0] ?? currentPrice));
    const change = currentPrice - baseClose;
    const changePercent = baseClose > 0 ? (change / baseClose) * 100 : 0;

    let currency = meta?.currency ?? (symbol.endsWith(".NS") || symbol.endsWith(".BO") ? "INR" : "USD");
    if (symbol.endsWith(".NS") || symbol.endsWith(".BO")) {
      currency = "INR";
    }

    return NextResponse.json({
      prices: closes,
      currentPrice,
      change,
      changePercent,
      currency,
    });
  } catch (e) {
    log.warn("Sparkline fetch failed", { symbol, error: String(e) });
    return NextResponse.json({ prices: [], change: 0, changePercent: 0, currentPrice: 0, currency: "INR" });
  }
}
