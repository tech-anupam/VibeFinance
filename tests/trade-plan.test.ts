import { describe, it, expect } from "vitest";
import { computeTradePlan } from "@/analytics/trade-plan";

describe("Trade Plan Calculator", () => {
  it("calculates allocation sizing and target/stop prices for PROCEED", () => {
    const plan = computeTradePlan({
      currentPrice: 1000,
      volatilityPct: 3,
      decision: "PROCEED",
      confidence: 0.85,
      tradeValue: 100000,
    });

    expect(plan.recommendedAmount).toBe(100000);
    expect(plan.targetPrice).toBeGreaterThan(1000);
    expect(plan.stopLossPrice).toBeLessThan(1000);
    expect(plan.riskRewardRatio).toBeGreaterThan(1.5);
  });

  it("reduces recommended size on REDUCE_SIZE and sets 0 on AVOID", () => {
    const reducePlan = computeTradePlan({
      currentPrice: 500,
      decision: "REDUCE_SIZE",
      confidence: 0.6,
      tradeValue: 100000,
    });
    expect(reducePlan.recommendedAmount).toBe(50000);

    const avoidPlan = computeTradePlan({
      currentPrice: 500,
      decision: "AVOID",
      confidence: 0.9,
      tradeValue: 100000,
    });
    expect(avoidPlan.recommendedAmount).toBe(0);
  });

  it("provides holding action for existing shareholders", () => {
    const holdPlan = computeTradePlan({
      currentPrice: 1200,
      decision: "REDUCE_SIZE",
      confidence: 0.7,
      tradeValue: 50000,
      existingHolding: { shares: 100, avgBuyPrice: 1000 },
    });

    expect(holdPlan.holdingAction).toBe("BOOK_PROFIT");
    expect(holdPlan.holdingRationale).toContain("profits");
  });
});
