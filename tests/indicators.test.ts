import { describe, it, expect } from "vitest";
import { sma, ema, rsi, macd } from "@/analytics/indicators";

describe("sma", () => {
  it("computes simple moving average", () => {
    const result = sma([1, 2, 3, 4, 5], 3);
    expect(result).toEqual([2, 3, 4]);
  });

  it("returns empty for insufficient data", () => {
    expect(sma([1, 2], 3)).toEqual([]);
  });
});

describe("ema", () => {
  it("computes exponential moving average", () => {
    const result = ema([10, 12, 11, 13, 14], 3);
    expect(result.length).toBe(5);
    expect(result[0]).toBe(10);
    expect(result[1]).toBeCloseTo(11, 0);
  });

  it("returns empty for empty input", () => {
    expect(ema([], 3)).toEqual([]);
  });
});

describe("rsi", () => {
  it("computes RSI for sufficient data", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i * 2);
    const result = rsi(closes, 14);
    expect(result.length).toBe(closes.length - 14);
    expect(result[0]).toBeGreaterThan(50);
  });

  it("returns 100-ish RSI for all-up moves", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const result = rsi(closes, 14);
    expect(result[0]).toBeGreaterThan(95);
  });

  it("returns empty for insufficient data", () => {
    expect(rsi([1, 2, 3], 14)).toEqual([]);
  });
});

describe("macd", () => {
  it("returns arrays of equal length to input", () => {
    const closes = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i / 5) * 10);
    const result = macd(closes);
    expect(result.macdLine.length).toBe(50);
    expect(result.signalLine.length).toBe(50);
    expect(result.histogram.length).toBe(50);
  });
});
