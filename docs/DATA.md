# Data Disclosure and Provenance

## Principles
1. Every piece of evidence shown to the user carries an exact source citation or is tagged "insufficient evidence".
2. No hallucinated or fabricated financial numbers. All quantitative metrics (RSI, drawdown, HHI, volume z-score) are computed deterministically in TypeScript.
3. Cached responses are transparently flagged as `cached` with their original retrieval timestamp.

## Source Adapters

### 1. Market Data (Yahoo Finance Adapter)
- **ID:** `price-yahoo`
- **Coverage:** National Stock Exchange of India (`.NS`), Bombay Stock Exchange (`.BO`), NASDAQ, NYSE.
- **Data Points:** Real-time quote, previous close, 1-month daily historical closes, 30-day volume.
- **Cache Strategy:** Disk cache at `data/cache/price/{sha256(symbol)}.json`. TTL is 5 minutes during market hours, 24 hours off-market.
- **Degraded Fallback:** If live Yahoo endpoint is unreachable, reads last cached chart with trust labeled `cached`. If no cache exists, the risk and technical agents mark status as `degraded` and confidence is capped at 0.4.

### 2. Corporate Filings (Local Corpus + Regulatory Disclosures)
- **ID:** `filings-local-corpus`
- **Coverage:** Audited annual filings (BSE / NSE), Form 20-F, and regulatory disclosures for Indian large-caps.
- **Data Points:** Net debt, cash balance, promoter shareholding, promoter pledging, operating margin, regulatory notices.
- **Provenance:** `data/filings.json` grounded in audited exchange filings.
- **Degraded Fallback:** When no filing exists for the queried symbol, the forensic auditor returns `status: degraded` and marks all claims unverifiable. The arbiter is forbidden from returning `PROCEED` when filings are absent.

### 3. Live Community Sentiment & Discussions (Social Adapter)
- **ID:** `social-search`
- **Coverage:** Reddit (`r/IndianStockMarket`, `r/IndiaInvestments`), X/Twitter, Quora, Moneycontrol, TraderJi, ValuePickr, Tickertape, Trendlyne.
- **Recency Filter:** Searches restricted to the last 24 hours (`tbs=qdr:d`) with fallback to the last 7 days (`tbs=qdr:w`).
- **Cache Strategy:** Daily keyed cache `data/cache/price/social-{YYYY-MM-DD}-{query}.json`. Yesterday's cache is never served.
- **Provenance:** URLs, platform domain name, and relative post timestamp extracted from snippet text.

## Data Schemas

All sources implement the Zod schema:
```ts
{
  id: string;
  kind: "price" | "filing" | "news" | "web";
  title: string;
  publisher: string;
  url?: string;
  retrievedAt: string; // ISO 8601
  asOf: string;        // ISO 8601
  excerpt: string;
  trust: "primary" | "secondary" | "cached" | "unverified";
}
```
