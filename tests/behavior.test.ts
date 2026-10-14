import { describe, it, expect } from "vitest";
import { detectAveragingDown } from "@/analytics/behavior";
import type { Trade } from "@/schemas/trade";

function makeTrade(overrides: Partial<Trade> & { id: string; price: number; side: "buy" | "sell" }): Trade {
  return {
    profileId: "test",
    symbol: "RELIANCE",
    quantity: 10,
    timestamp: "2024-01-01T00:00:00Z",
    exchange: "NSE" as const,
    ...overrides,
  };
}

describe("detectAveragingDown", () => {
  it("detects consecutive buys at lower prices", () => {
    const trades: Trade[] = [
      makeTrade({ id: "t1", price: 100, side: "buy", timestamp: "2024-01-01T00:00:00Z" }),
      makeTrade({ id: "t2", price: 90, side: "buy", timestamp: "2024-01-02T00:00:00Z" }),
      makeTrade({ id: "t3", price: 80, side: "buy", timestamp: "2024-01-03T00:00:00Z" }),
    ];
    const result = detectAveragingDown(trades);
    expect(result.averagingDownCount).toBe(2);
    expect(result.averagingDownTradeIds).toContain("t2");
    expect(result.averagingDownTradeIds).toContain("t3");
  });

  it("does not flag buys at higher prices", () => {
    const trades: Trade[] = [
      makeTrade({ id: "t1", price: 100, side: "buy", timestamp: "2024-01-01T00:00:00Z" }),
      makeTrade({ id: "t2", price: 110, side: "buy", timestamp: "2024-01-02T00:00:00Z" }),
    ];
    const result = detectAveragingDown(trades);
    expect(result.averagingDownCount).toBe(0);
  });

  it("handles empty trade list", () => {
    const result = detectAveragingDown([]);
    expect(result.averagingDownCount).toBe(0);
  });
});
