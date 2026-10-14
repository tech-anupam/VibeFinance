import { describe, it, expect } from "vitest";
import { computeEvalMetrics, computePercentile } from "@/eval/metrics";
import { runBacktest } from "@/eval/backtest";

describe("Eval Metrics", () => {
  it("computes percentiles accurately", () => {
    const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    expect(computePercentile(values, 50)).toBe(50);
    expect(computePercentile(values, 95)).toBe(100);
  });

  it("handles empty values for percentiles", () => {
    expect(computePercentile([], 50)).toBe(0);
  });

  it("computes eval metrics summary", () => {
    const results = [
      { expectedVerdict: "PROCEED", actualVerdict: "PROCEED", expectedClaimsCount: 3, actualClaimsCount: 3, retries: 0, latencyMs: 1200 },
      { expectedVerdict: "AVOID", actualVerdict: "AVOID", expectedClaimsCount: 2, actualClaimsCount: 2, retries: 1, latencyMs: 1500 },
      { expectedVerdict: "PROCEED", actualVerdict: "WAIT_48H", expectedClaimsCount: 1, actualClaimsCount: 2, retries: 0, latencyMs: 900 },
    ];
    const metrics = computeEvalMetrics(results);
    expect(metrics.totalScenarios).toBe(3);
    expect(metrics.verdictAgreementRate).toBeCloseTo(0.67, 1);
    expect(metrics.verifierRetryRate).toBeCloseTo(0.33, 1);
    expect(metrics.latencyP50Ms).toBeGreaterThan(0);
  });
});

describe("Backtest Engine", () => {
  it("evaluates signal win rates and loss avoidance", () => {
    const trades = [
      { symbol: "RELIANCE.NS", entryDate: "2024-01-01", verdict: "PROCEED" as const, entryPrice: 100, exitPrice30d: 110 },
      { symbol: "TCS.NS", entryDate: "2024-01-01", verdict: "PROCEED" as const, entryPrice: 100, exitPrice30d: 95 },
      { symbol: "PUMP.NS", entryDate: "2024-01-01", verdict: "AVOID" as const, entryPrice: 100, exitPrice30d: 70 },
      { symbol: "RISKY.NS", entryDate: "2024-01-01", verdict: "AVOID" as const, entryPrice: 100, exitPrice30d: 105 },
    ];

    const result = runBacktest(trades);
    expect(result.totalSignals).toBe(4);
    expect(result.proceedWinRate).toBe(50);
    expect(result.avoidLossesAvoided).toBe(50);
    expect(result.averageProceedReturnPct).toBeCloseTo(2.5, 1);
    expect(result.averageAvoidReturnPct).toBeCloseTo(-12.5, 1);
  });
});
