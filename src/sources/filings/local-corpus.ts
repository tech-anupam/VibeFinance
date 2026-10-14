import fs from "fs";
import path from "path";
import type { Source } from "@/schemas/source";
import type { SourceAdapter } from "../types";
import { log } from "@/lib/log";
import { now } from "@/lib/time";

interface FilingRecord {
  symbol: string;
  company: string;
  filingDate: string;
  source: string;
  title: string;
  excerpt: string;
}

export class LocalCorpusAdapter implements SourceAdapter {
  id = "filings-local-corpus";
  kind: Source["kind"] = "filing";

  private records: FilingRecord[] = [];

  constructor() {
    this.loadCorpus();
  }

  private loadCorpus(): void {
    try {
      const filePath = path.join(process.cwd(), "data", "filings.json");
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        this.records = JSON.parse(raw);
        log.info("Loaded filings corpus", { count: this.records.length });
      }
    } catch (e) {
      log.warn("Failed to load filings.json", { error: String(e) });
    }
  }

  async fetch(query: string): Promise<Source[]> {
    const cleanQuery = query.toUpperCase().replace(".NS", "").replace(".BO", "");
    const timestamp = now();

    const matches = this.records.filter((r) => {
      const rSymbol = r.symbol.toUpperCase().replace(".NS", "").replace(".BO", "");
      const rCompany = r.company.toUpperCase();
      return rSymbol === cleanQuery || rCompany.includes(cleanQuery) || cleanQuery.includes(rSymbol);
    });

    if (matches.length > 0) {
      return matches.map((m, i) => ({
        id: `filing-${cleanQuery.toLowerCase()}-${i}`,
        kind: "filing",
        title: m.title,
        publisher: m.source,
        retrievedAt: timestamp,
        asOf: new Date(m.filingDate).toISOString(),
        excerpt: m.excerpt,
        trust: "primary",
      }));
    }

    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${query} annual report financial filings BSE NSE`)}&num=4`;
      const res = await fetch(searchUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) return [];

      const html = await res.text();
      const linkPattern = /href="\/url\?q=(https?:\/\/[^&"]+)/g;
      const snippetPattern = /<span class="[^"]*">([^<]{30,250})<\/span>/g;
      const snippets: string[] = [];
      let sm;
      while ((sm = snippetPattern.exec(html)) !== null && snippets.length < 3) {
        const text = sm[1];
        if (text && !text.includes("<")) snippets.push(text.trim());
      }

      const sources: Source[] = [];
      let lm;
      let idx = 0;
      while ((lm = linkPattern.exec(html)) !== null && idx < 3) {
        const url = decodeURIComponent(lm[1] ?? "");
        if (url.includes("google.com")) continue;

        sources.push({
          id: `filing-web-${cleanQuery.toLowerCase()}-${idx}`,
          kind: "filing",
          title: `${cleanQuery} Corporate Filings Disclosure`,
          publisher: "BSE / NSE Corporate Announcements",
          url,
          retrievedAt: timestamp,
          asOf: timestamp,
          excerpt: snippets[idx] ?? `Official financial disclosures and regulatory filings for ${cleanQuery}`,
          trust: "primary",
        });
        idx++;
      }
      return sources;
    } catch {
      return [];
    }
  }

  async healthCheck(): Promise<boolean> {
    return this.records.length > 0;
  }
}

export const localCorpusAdapter = new LocalCorpusAdapter();
