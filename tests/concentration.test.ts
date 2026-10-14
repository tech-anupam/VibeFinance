import { describe, it, expect } from "vitest";
import { computeHhi, hhiAfterTrade } from "@/analytics/concentration";

describe("computeHhi", () => {
  it("returns 10000 for single holding", () => {
    const result = computeHhi([{ symbol: "RELIANCE", value: 100000 }]);
    expect(result.hhi).toBe(10000);
    expect(result.isConcentrated).toBe(true);
  });

  it("returns low HHI for equally distributed holdings", () => {
    const holdings = Array.from({ length: 10 }, (_, i) => ({
      symbol: `STOCK${i}`,
      value: 10000,
    }));
    const result = computeHhi(holdings);
    expect(result.hhi).toBe(1000);
    expect(result.isConcentrated).toBe(false);
  });

  it("handles empty holdings", () => {
    const result = computeHhi([]);
    expect(result.hhi).toBe(0);
  });

  it("returns top holdings sorted by weight", () => {
    const holdings = [
      { symbol: "A", value: 50000 },
      { symbol: "B", value: 30000 },
      { symbol: "C", value: 20000 },
    ];
    const result = computeHhi(holdings);
    expect(result.topHoldings[0]!.symbol).toBe("A");
    expect(result.topHoldings[0]!.weightPct).toBe(50);
  });
});

describe("hhiAfterTrade", () => {
  it("increases HHI when adding to largest position", () => {
    const holdings = [
      { symbol: "A", value: 50000 },
      { symbol: "B", value: 50000 },
    ];
    const before = computeHhi(holdings);
    const after = hhiAfterTrade(holdings, "A", 50000);
    expect(after.hhi).toBeGreaterThan(before.hhi);
  });

  it("adds new symbol if not present", () => {
    const holdings = [{ symbol: "A", value: 100000 }];
    const after = hhiAfterTrade(holdings, "B", 100000);
    expect(after.topHoldings.length).toBe(2);
    expect(after.hhi).toBe(5000);
  });
});
