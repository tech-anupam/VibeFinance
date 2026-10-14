export interface BacktestTrade {
  symbol: string;
  entryDate: string;
  verdict: "PROCEED" | "REDUCE_SIZE" | "WAIT_48H" | "AVOID";
  entryPrice: number;
  exitPrice30d: number;
}

export interface BacktestResult {
  totalSignals: number;
  proceedWinRate: number;
  avoidLossesAvoided: number;
  averageProceedReturnPct: number;
  averageAvoidReturnPct: number;
}

export function runBacktest(trades: BacktestTrade[]): BacktestResult {
  const proceedTrades = trades.filter((t) => t.verdict === "PROCEED");
  const avoidTrades = trades.filter((t) => t.verdict === "AVOID");

  const proceedReturns = proceedTrades.map((t) =>
    t.entryPrice > 0 ? (t.exitPrice30d - t.entryPrice) / t.entryPrice : 0
  );
  const avoidReturns = avoidTrades.map((t) =>
    t.entryPrice > 0 ? (t.exitPrice30d - t.entryPrice) / t.entryPrice : 0
  );

  const proceedWins = proceedReturns.filter((r) => r > 0).length;
  const proceedWinRate = proceedTrades.length > 0 ? (proceedWins / proceedTrades.length) * 100 : 0;

  const avoidLosses = avoidReturns.filter((r) => r < 0).length;
  const avoidLossesAvoided = avoidTrades.length > 0 ? (avoidLosses / avoidTrades.length) * 100 : 0;

  const avgProceed = proceedReturns.length > 0
    ? (proceedReturns.reduce((sum, r) => sum + r, 0) / proceedReturns.length) * 100
    : 0;

  const avgAvoid = avoidReturns.length > 0
    ? (avoidReturns.reduce((sum, r) => sum + r, 0) / avoidReturns.length) * 100
    : 0;

  return {
    totalSignals: trades.length,
    proceedWinRate,
    avoidLossesAvoided,
    averageProceedReturnPct: avgProceed,
    averageAvoidReturnPct: avgAvoid,
  };
}
