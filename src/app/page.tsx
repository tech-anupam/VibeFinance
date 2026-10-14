"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { Verdict } from "@/schemas/verdict";
import type { Claim } from "@/schemas/claim";
import type { AgentResult } from "@/schemas/agent";
import type { Source } from "@/schemas/source";
import { computeTradePlan, type TradePlan } from "@/analytics/trade-plan";
import {
  AgentConfidenceChart,
  RegretGauge,
  RiskRadarChart,
  friendlyAgentName,
  friendlyVerdict,
  friendlyFinding,
} from "@/ui/components/charts";
import {
  SearchIcon,
  TrendUpIcon,
  TrendDownIcon,
  ChevronDownIcon,
  SourceIcon,
  ShieldIcon,
} from "@/ui/components/icons";
import { exportToCsv, exportToMarkdown, printReport } from "@/ui/components/export";

interface PipelineMetrics {
  totalLatencyMs: number;
  agentLatencies: Record<string, number>;
  verifierRetries: number;
  droppedFindings: number;
  hhiBefore: number;
  hhiAfter: number;
}

interface PipelineResponse {
  verdict: Verdict;
  claims: Claim[];
  agentResults: AgentResult[];
  sources: Source[];
  metrics: PipelineMetrics;
}

interface StockResult {
  symbol: string;
  name: string;
  exchange: string;
}

interface SparklineData {
  prices: number[];
  currentPrice: number;
  change: number;
  changePercent: number;
  currency: string;
}

const VERDICT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PROCEED: { bg: "bg-proceed/10", border: "border-proceed/30", text: "text-proceed" },
  REDUCE_SIZE: { bg: "bg-reduce/10", border: "border-reduce/30", text: "text-reduce" },
  WAIT_48H: { bg: "bg-wait/10", border: "border-wait/30", text: "text-wait" },
  AVOID: { bg: "bg-avoid/10", border: "border-avoid/30", text: "text-avoid" },
};

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
];

const QUICK_AMOUNTS: Record<string, number[]> = {
  INR: [25000, 50000, 100000, 250000],
  USD: [500, 1000, 2500, 5000],
  EUR: [500, 1000, 2500, 5000],
  GBP: [500, 1000, 2500, 5000],
};

type Mode = "analyze" | "tip";

function Sparkline({ prices, positive }: { prices: number[]; positive: boolean }) {
  if (prices.length < 2) return null;
  const data = prices.map((p, i) => ({ i, p }));
  return (
    <div className="h-8 w-20 shrink-0">
      <ResponsiveContainer>
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="p"
            stroke={positive ? "#22c55e" : "#ef4444"}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function formatSourceBadge(sid: string): { label: string; bg: string; text: string } {
  if (sid.startsWith("filing-")) return { label: "BSE/NSE Filing", bg: "bg-blue-500/15", text: "text-blue-400" };
  if (sid.startsWith("tavily-")) return { label: "Tavily Web Search", bg: "bg-indigo-500/15", text: "text-indigo-400" };
  if (sid.startsWith("social-")) return { label: "Investor Forum", bg: "bg-orange-500/15", text: "text-orange-400" };
  if (sid.startsWith("yahoo-")) return { label: "Yahoo Market Feed", bg: "bg-emerald-500/15", text: "text-emerald-400" };
  return { label: sid, bg: "bg-surface-raised", text: "text-text-muted" };
}

function cleanFindingText(text: string): string {
  return friendlyFinding(text)
    .replace(/^Conflict:\s*/i, "")
    .replace(/^\[Bear Case\]\s*/i, "")
    .replace(/^\[Bull Case\]\s*/i, "")
    .replace(/^\[Filing Check\]\s*/i, "")
    .replace(/^\[Your Patterns\]\s*/i, "")
    .replace(/^\[Position Risk\]\s*/i, "")
    .trim();
}

function FindingBubble({ text, sourceIds }: { text: string; sourceIds: string[] }) {
  const isConflict = text.toLowerCase().includes("conflict");
  const isBear = text.toLowerCase().includes("[bear case]") || text.toLowerCase().includes("[prosecutor]");
  const isBull = text.toLowerCase().includes("[bull case]") || text.toLowerCase().includes("[defence]");
  const isFiling = text.toLowerCase().includes("[filing check]") || text.toLowerCase().includes("[forensic-auditor]");

  if (isConflict) {
    return (
      <div className="rounded-2xl border border-wait/30 bg-wait/10 p-4 text-[13px] leading-relaxed break-words">
        <div className="mb-1.5 flex items-center gap-2 font-semibold text-wait">
          <span className="h-2 w-2 rounded-full bg-wait" />
          <span>Split Court: Strong Disagreement Between Arguments</span>
        </div>
        <p className="text-text-secondary text-[13px]">{cleanFindingText(text)}</p>
      </div>
    );
  }

  const cardStyle = isBear
    ? "border-avoid/25 bg-avoid/5"
    : isBull
    ? "border-proceed/25 bg-proceed/5"
    : isFiling
    ? "border-accent/25 bg-accent/5"
    : "border-border bg-bg";

  const badgeStyle = isBear
    ? { dot: "bg-avoid", label: "Bear Argument", text: "text-avoid" }
    : isBull
    ? { dot: "bg-proceed", label: "Bull Argument", text: "text-proceed" }
    : isFiling
    ? { dot: "bg-accent", label: "Filing Audit", text: "text-accent" }
    : null;

  return (
    <div className={`rounded-2xl border p-4 text-[13px] leading-relaxed break-words overflow-hidden ${cardStyle}`}>
      {badgeStyle && (
        <div className="mb-2 flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${badgeStyle.dot}`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${badgeStyle.text}`}>{badgeStyle.label}</span>
        </div>
      )}
      <p className="text-text-primary text-[13px] leading-relaxed">{cleanFindingText(text)}</p>
      {sourceIds.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {sourceIds.map((sid) => {
            const b = formatSourceBadge(sid);
            return (
              <span key={sid} className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${b.bg} ${b.text}`}>
                {b.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AgentSection({ result }: { result: AgentResult }) {
  const dotColor = result.status === "ok" ? "bg-proceed" : result.status === "degraded" ? "bg-degraded" : "bg-avoid";
  return (
    <div className="h-fit rounded-2xl border border-border bg-surface p-4 overflow-hidden break-words">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <span className="text-sm font-semibold text-text-primary">{friendlyAgentName(result.agent)}</span>
        <span className="ml-auto font-mono text-[10px] text-text-muted">{result.latencyMs.toFixed(0)}ms</span>
      </div>
      <p className="mb-3 text-[13px] text-text-secondary">{result.label}</p>
      <div className="space-y-2.5">
        {result.findings.length > 0 ? (
          result.findings.slice(0, 4).map((f, i) => (
            <FindingBubble key={i} text={f.text} sourceIds={f.sourceIds} />
          ))
        ) : (
          <div className="rounded-2xl bg-bg px-3.5 py-3 text-xs text-text-muted">
            {result.status === "degraded" ? "No historical records available for this check." : result.label}
          </div>
        )}
      </div>
    </div>
  );
}

function SourceCard({ source }: { source: Source }) {
  const age = getTimeAgo(source.asOf);
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 rounded-xl bg-bg p-3 transition-colors hover:bg-surface-raised break-words"
    >
      <SourceIcon publisher={source.publisher} className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-text-primary truncate">{source.publisher}</span>
          <span className="shrink-0 rounded-full bg-surface-raised px-1.5 py-0.5 text-[9px] text-text-muted">{source.kind}</span>
          {source.trust === "cached" && (
            <span className="shrink-0 rounded-full bg-wait/10 px-1.5 py-0.5 text-[9px] text-wait">cached</span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-text-muted line-clamp-2">{source.excerpt}</p>
        <span className="mt-0.5 text-[10px] text-text-muted block">{age}</span>
      </div>
    </a>
  );
}

function getTimeAgo(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("analyze");
  const [symbolInput, setSymbolInput] = useState("");
  const [selectedStockName, setSelectedStockName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [tradeValue, setTradeValue] = useState("100000");
  const [tipText, setTipText] = useState("");
  const [tipSymbol, setTipSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<PipelineResponse | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [expandedSources, setExpandedSources] = useState(false);

  const [hasExistingHolding, setHasExistingHolding] = useState(false);
  const [holdingShares, setHoldingShares] = useState("50");
  const [holdingAvgPrice, setHoldingAvgPrice] = useState("");

  const [searchResults, setSearchResults] = useState<StockResult[]>([]);
  const [searchSparklines, setSearchSparklines] = useState<Record<string, SparklineData>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(symbolInput, 300);

  const currentCurrency = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0]!;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim().length < 1 || selectedStockName) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    fetch(`/api/search-stocks?q=${encodeURIComponent(debouncedQuery.trim())}`)
      .then((r) => r.json())
      .then((data) => {
        setSearchResults(data.results ?? []);
        setSearchOpen(true);
        for (const stock of (data.results ?? []).slice(0, 5)) {
          if (!searchSparklines[stock.symbol]) {
            fetch(`/api/sparkline?symbol=${encodeURIComponent(stock.symbol)}`)
              .then((r) => r.json())
              .then((sp) => setSearchSparklines((prev) => ({ ...prev, [stock.symbol]: sp })))
              .catch(() => {});
          }
        }
      })
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }, [debouncedQuery, selectedStockName]);

  const fetchSparkline = useCallback((symbol: string) => {
    if (searchSparklines[symbol]) return;
    fetch(`/api/sparkline?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((sp) => setSearchSparklines((prev) => ({ ...prev, [symbol]: sp })))
      .catch(() => {});
  }, [searchSparklines]);

  function handleSelectStock(stock: StockResult) {
    setSymbolInput(stock.symbol);
    setSelectedStockName(stock.name);
    setSearchOpen(false);
    if (stock.symbol.endsWith(".NS") || stock.symbol.endsWith(".BO")) {
      setCurrency("INR");
    } else if (stock.exchange === "NMS" || stock.exchange === "NYQ") {
      setCurrency("USD");
    }
  }

  function resolveSymbol(input: string): string {
    const trimmed = input.trim().toUpperCase();
    if (!trimmed) return "";
    if (trimmed.includes(".")) return trimmed;
    if (currency === "INR") return `${trimmed}.NS`;
    return trimmed;
  }

  async function handleAnalyze() {
    const finalSymbol = resolveSymbol(symbolInput);
    if (!finalSymbol) return;

    setLoading(true);
    setError(undefined);
    setResponse(undefined);

    try {
      const res = await fetch("/api/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipText: `Should I enter or hold ${finalSymbol} (${selectedStockName || finalSymbol})? Evaluate fundamental strength, technical momentum, concentration risk, and recent social sentiment.`,
          symbol: finalSymbol,
          tradeValue: parseFloat(tradeValue) || 100000,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Analysis could not be completed");
        return;
      }
      setResponse(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleTipSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tipText.trim()) return;

    setLoading(true);
    setError(undefined);
    setResponse(undefined);

    try {
      let symbol = resolveSymbol(tipSymbol);
      if (!symbol) symbol = "UNKNOWN.NS";

      const res = await fetch("/api/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipText,
          symbol,
          tradeValue: parseFloat(tradeValue) || 100000,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Verification failed");
        return;
      }
      setResponse(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  const prosecutor = response?.agentResults.find((r) => r.agent === "prosecutor");
  const defence = response?.agentResults.find((r) => r.agent === "defence");
  const auditor = response?.agentResults.find((r) => r.agent === "forensic-auditor");
  const behavioral = response?.agentResults.find((r) => r.agent === "behavioral-mirror");
  const riskAgent = response?.agentResults.find((r) => r.agent === "risk");
  const friendly = response ? friendlyVerdict(response.verdict.decision) : undefined;

  const currentPrice = searchSparklines[resolveSymbol(symbolInput)]?.currentPrice ?? 0;

  const tradePlan: TradePlan | undefined = response ? computeTradePlan({
    currentPrice,
    decision: response.verdict.decision,
    confidence: response.verdict.confidence,
    tradeValue: parseFloat(tradeValue) || 100000,
    existingHolding: hasExistingHolding ? {
      shares: parseFloat(holdingShares) || 0,
      avgBuyPrice: parseFloat(holdingAvgPrice) || currentPrice,
    } : undefined,
  }) : undefined;

  const confidenceData = response?.agentResults
    .filter((r) => r.agent !== "claim-extractor")
    .map((r) => ({ agent: r.agent, confidence: r.confidence, status: r.status })) ?? [];

  const radarData = response ? [
    { subject: "Filing Match", value: (auditor?.confidence ?? 0) * 100 },
    { subject: "Bull Strength", value: (defence?.confidence ?? 0) * 100 },
    { subject: "Bear Strength", value: (prosecutor?.confidence ?? 0) * 100 },
    ...(behavioral && behavioral.status !== "degraded" && behavioral.confidence > 0 ? [
      { subject: "Behavior", value: Math.max(0, 100 - (behavioral.confidence ?? 0) * 100) },
    ] : []),
    { subject: "Position Safety", value: Math.max(0, 100 - (riskAgent?.confidence ?? 0) * 50) },
  ] : [];

  const webSources = response?.sources.filter((s) => s.kind === "web") ?? [];
  const dataSources = response?.sources.filter((s) => s.kind !== "web") ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 pb-28 pt-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Tip Court</h1>
        <p className="mt-1 text-sm text-text-muted">Evidence-grounded stock evaluation for retail investors.</p>
      </div>

      <div className="flex gap-1 rounded-2xl bg-surface p-1 max-w-md mx-auto">
        <button
          onClick={() => setMode("analyze")}
          className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all ${
            mode === "analyze" ? "bg-accent text-white shadow-md shadow-accent/20" : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Evaluate Stock
        </button>
        <button
          onClick={() => setMode("tip")}
          className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all ${
            mode === "tip" ? "bg-accent text-white shadow-md shadow-accent/20" : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Verify Tip
        </button>
      </div>

      {mode === "analyze" && (
        <div className="space-y-4 rounded-3xl border border-border bg-surface/50 p-5 backdrop-blur-sm">
          <div ref={searchRef} className="relative">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Search Stock Symbol or Company Name</label>
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={selectedStockName ? `${symbolInput} - ${selectedStockName}` : symbolInput}
                onChange={(e) => {
                  setSymbolInput(e.target.value);
                  setSelectedStockName("");
                  if (!searchOpen && e.target.value.length > 0) setSearchOpen(true);
                }}
                onFocus={() => {
                  if (searchResults.length > 0) setSearchOpen(true);
                }}
                placeholder="Type stock (e.g. RELIANCE, TCS, TSLA, INFY)..."
                className="w-full rounded-2xl border border-border bg-bg py-3.5 pl-10 pr-10 text-[14px] text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              {searchLoading && (
                <span className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-text-muted/30 border-t-accent" />
              )}
            </div>

            {searchOpen && searchResults.length > 0 && (
              <div className="absolute z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl shadow-black/60">
                {searchResults.map((stock) => {
                  const sp = searchSparklines[stock.symbol];
                  const isUp = sp ? sp.changePercent >= 0 : true;
                  const currSign = sp?.currency === "INR" || stock.symbol.endsWith(".NS") || stock.symbol.endsWith(".BO") ? "₹" : "$";

                  return (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelectStock(stock)}
                      onMouseEnter={() => fetchSparkline(stock.symbol)}
                      className="flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface-raised active:bg-bg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-text-primary">{stock.symbol}</span>
                          <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] text-text-muted">{stock.exchange}</span>
                        </div>
                        <span className="text-[12px] text-text-muted truncate block">{stock.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {sp && <Sparkline prices={sp.prices} positive={isUp} />}
                        {sp && sp.currentPrice > 0 && (
                          <div className="text-right min-w-[70px]">
                            <div className="font-mono text-[13px] font-semibold text-text-primary">
                              {currSign}{sp.currentPrice.toFixed(2)}
                            </div>
                            <div className={`flex items-center justify-end gap-0.5 text-[11px] font-medium ${isUp ? "text-proceed" : "text-avoid"}`}>
                              {isUp ? <TrendUpIcon className="h-3 w-3" /> : <TrendDownIcon className="h-3 w-3" />}
                              {isUp ? "+" : ""}{sp.changePercent.toFixed(2)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-text-muted">Planned Allocation</label>
              <div className="flex items-center gap-1 rounded-xl bg-bg px-1.5 py-1">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                      currency === c.code ? "bg-accent text-white" : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    {c.symbol} {c.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-bg px-4 py-3.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
              <span className="font-mono text-base font-bold text-accent shrink-0">
                {currentCurrency.symbol}
              </span>
              <input
                type="number"
                value={tradeValue}
                onChange={(e) => setTradeValue(e.target.value)}
                placeholder="100000"
                className="w-full bg-transparent font-mono text-[15px] font-semibold text-text-primary focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {(QUICK_AMOUNTS[currency] ?? QUICK_AMOUNTS.INR!).map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTradeValue(String(amt))}
                  className={`rounded-xl border px-3 py-1 text-[11px] font-mono transition-colors ${
                    tradeValue === String(amt)
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-bg text-text-muted hover:border-text-muted hover:text-text-secondary"
                  }`}
                >
                  {currentCurrency.symbol}{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-surface/40 p-4 transition-colors">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${hasExistingHolding ? "bg-accent" : "bg-surface-raised"}`}>
                <input
                  type="checkbox"
                  checked={hasExistingHolding}
                  onChange={(e) => setHasExistingHolding(e.target.checked)}
                  className="sr-only"
                />
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${hasExistingHolding ? "translate-x-4.5" : "translate-x-1"}`} />
              </div>
              <span className="text-xs font-medium text-text-secondary">Already holding shares? (Get Hold / Sell / Add advice)</span>
            </label>

            {hasExistingHolding && (
              <div className="mt-3.5 grid grid-cols-2 gap-3 pt-3 border-t border-border/40">
                <div>
                  <label className="text-[11px] text-text-muted block mb-1">Shares Currently Held</label>
                  <input
                    type="number"
                    value={holdingShares}
                    onChange={(e) => setHoldingShares(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full rounded-xl border border-border bg-bg px-3.5 py-2 text-xs font-mono text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-text-muted block mb-1">Avg Buy Price ({currentCurrency.symbol})</label>
                  <input
                    type="number"
                    value={holdingAvgPrice}
                    onChange={(e) => setHoldingAvgPrice(e.target.value)}
                    placeholder="e.g. 2400"
                    className="w-full rounded-xl border border-border bg-bg px-3.5 py-2 text-xs font-mono text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !symbolInput.trim()}
            className="w-full rounded-2xl bg-accent py-3.5 text-[14px] font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Cross-examining market data for {resolveSymbol(symbolInput)}...
              </span>
            ) : (
              `Evaluate ${resolveSymbol(symbolInput) || "Stock"}`
            )}
          </button>
        </div>
      )}

      {mode === "tip" && (
        <form onSubmit={handleTipSubmit} className="space-y-4 rounded-3xl border border-border bg-surface/50 p-5 backdrop-blur-sm">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Paste the tip you received</label>
            <textarea
              value={tipText}
              onChange={(e) => setTipText(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-[13px] text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder={`e.g. "IRCTC is debt free, promoter holding 62%, buy for target 1100. Volume breakout happening, easy 30% in 2 months."`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Stock Symbol</label>
              <input
                type="text"
                value={tipSymbol}
                onChange={(e) => setTipSymbol(e.target.value)}
                placeholder="e.g. IRCTC"
                className="h-12 w-full rounded-2xl border border-border bg-bg px-4 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-text-muted">Investment Amount</label>
                <div className="flex items-center gap-1">
                  {CURRENCIES.map((c) => (
                    <button
                      type="button"
                      key={c.code}
                      onClick={() => setCurrency(c.code)}
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                        currency === c.code ? "bg-accent text-white" : "text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      {c.symbol}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex h-12 items-center gap-2 rounded-2xl border border-border bg-bg px-4 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
                <span className="font-mono text-base font-bold text-accent shrink-0">{currentCurrency.symbol}</span>
                <input
                  type="number"
                  value={tradeValue}
                  onChange={(e) => setTradeValue(e.target.value)}
                  placeholder="100000"
                  className="w-full bg-transparent font-mono text-sm font-semibold text-text-primary focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !tipText.trim()}
            className="w-full rounded-2xl bg-accent py-3.5 text-[14px] font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-40"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Auditing claims against corporate filings...
              </span>
            ) : (
              "Is this tip legit?"
            )}
          </button>
        </form>
      )}

      {error && (
        <div className="rounded-2xl border border-avoid/25 bg-avoid/8 p-4 text-[13px] text-avoid">{error}</div>
      )}

      {response && friendly && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Court Analysis Report</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => printReport()}
                className="flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-text-muted hover:text-text-primary transition-colors"
              >
                <span>Print / PDF</span>
              </button>
              <button
                onClick={() => {
                  if (response) {
                    exportToCsv({
                      symbol: resolveSymbol(symbolInput) || tipSymbol || "STOCK",
                      verdict: response.verdict,
                      claims: response.claims,
                      agentResults: response.agentResults,
                      sources: response.sources,
                      metrics: response.metrics,
                      tradePlan,
                    });
                  }
                }}
                className="flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-text-muted hover:text-text-primary transition-colors"
              >
                <span>Excel (CSV)</span>
              </button>
              <button
                onClick={() => {
                  if (response) {
                    exportToMarkdown({
                      symbol: resolveSymbol(symbolInput) || tipSymbol || "STOCK",
                      verdict: response.verdict,
                      claims: response.claims,
                      agentResults: response.agentResults,
                      sources: response.sources,
                      metrics: response.metrics,
                      tradePlan,
                    });
                  }
                }}
                className="flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-text-muted hover:text-text-primary transition-colors"
              >
                <span>Doc (MD)</span>
              </button>
            </div>
          </div>

          <div className={`rounded-3xl border p-6 shadow-lg ${VERDICT_COLORS[response.verdict.decision]?.border ?? "border-border"} ${VERDICT_COLORS[response.verdict.decision]?.bg ?? "bg-surface"}`}>
            <div className="text-center">
              <h2 className={`text-2xl font-bold ${VERDICT_COLORS[response.verdict.decision]?.text ?? "text-text-primary"}`}>
                {friendly.title}
              </h2>
              <p className="mt-1 text-[13px] text-text-secondary">{friendly.subtitle}</p>
            </div>
            <div className="mt-5 flex items-center justify-center">
              <RegretGauge score={response.verdict.regretRiskScore} />
            </div>
            {response.verdict.degradedFlags.length > 0 && (
              <div className="mt-4 rounded-xl bg-degraded/10 px-3 py-2 text-center text-[12px] text-degraded">
                Some checks were degraded: {response.verdict.degradedFlags.map(friendlyAgentName).join(", ")}
              </div>
            )}
          </div>

          {tradePlan && (
            <div className="rounded-3xl border border-border bg-surface p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Trade Execution & Sizing Plan</span>

              {tradePlan.holdingAction && (
                <div className="mt-3 rounded-2xl border border-accent/20 bg-accent/10 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShieldIcon className="h-4 w-4 text-accent" />
                    <span className="text-xs font-bold text-accent uppercase tracking-wider">Holding Decision: {tradePlan.holdingAction.replace("_", " ")}</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{tradePlan.holdingRationale}</p>
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-bg p-3.5">
                  <span className="text-[11px] text-text-muted block">Recommended Entry</span>
                  <span className="font-mono text-[15px] font-bold text-text-primary">
                    {currentCurrency.symbol}{tradePlan.recommendedAmount.toLocaleString()}
                  </span>
                </div>
                <div className="rounded-2xl bg-bg p-3.5">
                  <span className="text-[11px] text-text-muted block">Estimated Target</span>
                  <span className="font-mono text-[15px] font-bold text-proceed">
                    +{tradePlan.targetGainPct}% {tradePlan.targetPrice ? `(${currentCurrency.symbol}${tradePlan.targetPrice})` : ""}
                  </span>
                </div>
                <div className="rounded-2xl bg-bg p-3.5">
                  <span className="text-[11px] text-text-muted block">Key Risk Floor</span>
                  <span className="font-mono text-[15px] font-bold text-avoid">
                    -{tradePlan.stopLossLossPct}% {tradePlan.stopLossPrice ? `(${currentCurrency.symbol}${tradePlan.stopLossPrice})` : ""}
                  </span>
                </div>
                <div className="rounded-2xl bg-bg p-3.5">
                  <span className="text-[11px] text-text-muted block">Risk / Reward</span>
                  <span className="font-mono text-[15px] font-bold text-text-primary">
                    1 : {tradePlan.riskRewardRatio}
                  </span>
                </div>
              </div>
            </div>
          )}

          {response.verdict.rationale.length > 0 && (
            <div className="rounded-3xl border border-border bg-surface p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Evidence & Courtroom Clash</span>
              <div className="mt-3.5 space-y-3">
                {response.verdict.rationale.slice(0, 5).map((r, i) => (
                  <FindingBubble key={i} text={r.text} sourceIds={r.sourceIds} />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-3xl border border-border bg-surface p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Confidence Breakdown</span>
              <div className="mt-2"><AgentConfidenceChart data={confidenceData} /></div>
            </div>
            <div className="rounded-3xl border border-border bg-surface p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Risk Profile Shape</span>
              <RiskRadarChart data={radarData} />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">The Courtroom Trial</span>
              <span className="text-[11px] text-text-muted">Independent parallel agents</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {prosecutor && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="h-2 w-2 rounded-full bg-avoid" />
                    <span className="text-xs font-bold uppercase tracking-wider text-avoid">Prosecutor (Bear Case)</span>
                  </div>
                  <AgentSection result={prosecutor} />
                </div>
              )}
              {defence && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="h-2 w-2 rounded-full bg-proceed" />
                    <span className="text-xs font-bold uppercase tracking-wider text-proceed">Defence (Bull Case)</span>
                  </div>
                  <AgentSection result={defence} />
                </div>
              )}
            </div>
          </div>

          {auditor && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted block mb-2 px-1">Filing Verification</span>
              <AgentSection result={auditor} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {behavioral && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted block mb-2 px-1">Behavioral History</span>
                <AgentSection result={behavioral} />
              </div>
            )}
            {riskAgent && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted block mb-2 px-1">Portfolio Risk</span>
                <AgentSection result={riskAgent} />
              </div>
            )}
          </div>

          {webSources.length > 0 && (
            <div className="rounded-3xl border border-border bg-surface p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Live Community Discussions ({webSources.length})</span>
              <div className="mt-3 space-y-2">
                {webSources.map((s) => <SourceCard key={s.id} source={s} />)}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-border bg-surface p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Execution Metrics</span>
            <div className="mt-3 grid grid-cols-3 md:grid-cols-5 gap-3">
              {[
                ["Total time", `${(response.metrics.totalLatencyMs / 1000).toFixed(1)}s`],
                ["HHI before", response.metrics.hhiBefore.toFixed(0)],
                ["HHI after", response.metrics.hhiAfter.toFixed(0)],
                ["Retries", String(response.metrics.verifierRetries)],
                ["Dropped facts", String(response.metrics.droppedFindings)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-bg p-3">
                  <div className="text-[10px] text-text-muted">{label}</div>
                  <div className="font-mono text-[13px] font-semibold text-text-primary mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {dataSources.length > 0 && (
            <div className="rounded-3xl border border-border bg-surface p-5">
              <button
                onClick={() => setExpandedSources(!expandedSources)}
                className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-text-muted"
              >
                <span>Financial & Filing Sources ({dataSources.length})</span>
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedSources ? "rotate-180" : ""}`} />
              </button>
              {expandedSources && (
                <div className="mt-3.5 space-y-2">
                  {dataSources.map((s) => <SourceCard key={s.id} source={s} />)}
                </div>
              )}
            </div>
          )}

          <p className="text-center text-[11px] leading-relaxed text-text-muted">
            {response.verdict.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
