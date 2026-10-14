import type { Profile } from "@/schemas/profile";
import type { Trade } from "@/schemas/trade";
import type { Verdict } from "@/schemas/verdict";
import type { Source } from "@/schemas/source";
import type { Claim } from "@/schemas/claim";
import type { AgentResult } from "@/schemas/agent";
import { extractClaims } from "@/agents/claim-extractor";
import { runForensicAuditor } from "@/agents/forensic-auditor";
import { runProsecutor, type AnalyticsEvidence } from "@/agents/prosecutor";
import { runDefence } from "@/agents/defence";
import { runBehavioralMirror } from "@/agents/behavioral-mirror";
import { runRiskAgent, type RiskInput } from "@/agents/risk";
import { runAgents } from "./runner";
import { verifyAll } from "./verifier";
import { arbitrate } from "./arbiter";
import { SourceStore } from "@/retrieval/cite";
import { getSourceRegistry } from "@/sources/registry";
import { fetchPriceHistory } from "@/sources/price/yahoo";
import { computeHhi, hhiAfterTrade, type Holding } from "@/analytics/concentration";
import { analyzeBehavior } from "@/analytics/behavior";
import { rsi, macd } from "@/analytics/indicators";
import { maxDrawdown } from "@/analytics/returns";
import { volumeZScore } from "@/analytics/volume";
import { log } from "@/lib/log";
import { elapsedMs } from "@/lib/time";

export interface PipelineInput {
  tipText: string;
  profile: Profile;
  trades: Trade[];
  holdings: Holding[];
  symbol: string;
  tradeValue: number;
}

export interface PipelineOutput {
  verdict: Verdict;
  claims: Claim[];
  agentResults: AgentResult[];
  sources: Source[];
  metrics: PipelineMetrics;
}

export interface PipelineMetrics {
  totalLatencyMs: number;
  agentLatencies: Record<string, number>;
  verifierRetries: number;
  droppedFindings: number;
  hhiBefore: number;
  hhiAfter: number;
}

export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const pipelineStart = Date.now();
  const sourceStore = new SourceStore();
  const registry = getSourceRegistry();

  const { result: claimResult, claims } = await extractClaims(input.tipText);

  const [priceSources, filingSources, socialSources, historyBars] = await Promise.all([
    registry.fetch("price", input.symbol),
    registry.fetch("filing", input.symbol),
    registry.fetch("web", input.symbol.replace(".NS", "").replace(".BO", "")),
    fetchPriceHistory(input.symbol),
  ]);
  sourceStore.addMany(priceSources);
  sourceStore.addMany(filingSources);
  sourceStore.addMany(socialSources);

  const closes = historyBars.map((b) => b.close);

  const rsiValues = closes.length >= 14 ? rsi(closes) : [];
  const latestRsi = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : undefined;

  const macdResult = closes.length >= 26 ? macd(closes) : undefined;
  const macdHistogram = macdResult && macdResult.histogram.length > 0
    ? macdResult.histogram[macdResult.histogram.length - 1]
    : undefined;

  const mDrawdown = historyBars.length > 0 ? maxDrawdown(historyBars) * 100 : undefined;
  const volAnalysis = historyBars.length >= 10 ? volumeZScore(historyBars, Math.min(20, historyBars.length - 1)) : undefined;
  const volZ = volAnalysis?.zScore;

  const analytics: AnalyticsEvidence = {
    rsiLatest: latestRsi !== undefined ? parseFloat(latestRsi.toFixed(2)) : undefined,
    volumeZScore: volZ !== undefined ? parseFloat(volZ.toFixed(2)) : undefined,
    maxDrawdownPct: mDrawdown !== undefined ? parseFloat(mDrawdown.toFixed(2)) : undefined,
    macdHistogram: macdHistogram !== undefined ? parseFloat(macdHistogram.toFixed(2)) : undefined,
  };

  const hhiBefore = computeHhi(input.holdings);
  const hhiAfter = hhiAfterTrade(input.holdings, input.symbol, input.tradeValue);
  const totalPortfolioValue = input.holdings.reduce((sum, h) => sum + h.value, 0) + input.tradeValue;
  const positionSizePct = totalPortfolioValue > 0 ? (input.tradeValue / totalPortfolioValue) * 100 : 0;

  const behaviorFlags = input.trades.length > 0
    ? analyzeBehavior(input.trades, new Map())
    : undefined;

  const riskInput: RiskInput = {
    hhiBefore,
    hhiAfter,
    positionSizePct,
    profile: input.profile,
    sourceId: priceSources[0]?.id ?? "no-price-source",
  };

  const allEvidence = [...priceSources, ...filingSources, ...socialSources];

  const agentResults = await runAgents([
    { name: "forensic-auditor", fn: () => runForensicAuditor(claims, [...filingSources, ...socialSources]) },
    { name: "prosecutor", fn: () => runProsecutor(analytics, allEvidence) },
    { name: "defence", fn: () => runDefence(analytics, allEvidence) },
    { name: "behavioral-mirror", fn: () => runBehavioralMirror(behaviorFlags) },
    { name: "risk", fn: () => runRiskAgent(riskInput) },
  ]);

  const allResults = [claimResult, ...agentResults];
  const verified = verifyAll(allResults, sourceStore);
  const verifiedResults = verified.map((v) => v.result);
  const totalRetries = verified.reduce((sum, v) => sum + v.retries, 0);
  const totalDropped = verified.reduce((sum, v) => sum + v.droppedFindings, 0);

  const arbiterResult = arbitrate(verifiedResults, input.profile);
  const disclaimer = "This analysis is for educational purposes only. It is not investment advice. Consult a qualified financial advisor before making investment decisions.";

  const verdict: Verdict = { ...arbiterResult, disclaimer };

  const agentLatencies: Record<string, number> = {};
  for (const r of verifiedResults) {
    agentLatencies[r.agent] = r.latencyMs;
  }

  const metrics: PipelineMetrics = {
    totalLatencyMs: elapsedMs(pipelineStart),
    agentLatencies,
    verifierRetries: totalRetries,
    droppedFindings: totalDropped,
    hhiBefore: hhiBefore.hhi,
    hhiAfter: hhiAfter.hhi,
  };

  log.info("Pipeline complete", {
    decision: verdict.decision,
    totalLatencyMs: metrics.totalLatencyMs,
    claimCount: claims.length,
  });

  return {
    verdict,
    claims,
    agentResults: verifiedResults,
    sources: sourceStore.getAll(),
    metrics,
  };
}
