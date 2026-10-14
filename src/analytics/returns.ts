import type { PriceBar } from "./indicators";

export interface ReturnStats {
  totalReturnPct: number;
  annualizedReturnPct: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  volatilityPct: number;
}

export function dailyReturns(bars: PriceBar[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const prev = bars[i - 1]!.close;
    const curr = bars[i]!.close;
    returns.push(prev === 0 ? 0 : (curr - prev) / prev);
  }
  return returns;
}

export function maxDrawdown(bars: PriceBar[]): number {
  if (bars.length < 2) return 0;

  let peak = bars[0]!.close;
  let maxDd = 0;

  for (const bar of bars) {
    if (bar.close > peak) peak = bar.close;
    const dd = (peak - bar.close) / peak;
    if (dd > maxDd) maxDd = dd;
  }

  return maxDd;
}

export function computeReturnStats(bars: PriceBar[]): ReturnStats | undefined {
  if (bars.length < 2) return undefined;

  const first = bars[0]!.close;
  const last = bars[bars.length - 1]!.close;
  const totalReturn = first === 0 ? 0 : (last - first) / first;

  const tradingDays = bars.length - 1;
  const years = tradingDays / 252;
  const annualized = years > 0
    ? (Math.pow(1 + totalReturn, 1 / years) - 1)
    : totalReturn;

  const returns = dailyReturns(bars);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + (r - avgReturn) ** 2, 0) / returns.length;
  const dailyVol = Math.sqrt(variance);
  const annualVol = dailyVol * Math.sqrt(252);

  const riskFreeDaily = 0.06 / 252;
  const excessReturn = avgReturn - riskFreeDaily;
  const sharpe = dailyVol === 0 ? 0 : (excessReturn / dailyVol) * Math.sqrt(252);

  return {
    totalReturnPct: totalReturn * 100,
    annualizedReturnPct: annualized * 100,
    maxDrawdownPct: maxDrawdown(bars) * 100,
    sharpeRatio: sharpe,
    volatilityPct: annualVol * 100,
  };
}

export function forwardReturn(bars: PriceBar[], fromIndex: number, days: number): number | undefined {
  const toIndex = fromIndex + days;
  if (toIndex >= bars.length || fromIndex < 0) return undefined;

  const start = bars[fromIndex]!.close;
  const end = bars[toIndex]!.close;
  return start === 0 ? 0 : (end - start) / start;
}
