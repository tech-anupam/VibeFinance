export interface TradePlan {
  recommendedAmount: number;
  maxRecommendedAmount: number;
  targetPrice?: number;
  targetGainPct: number;
  stopLossPrice?: number;
  stopLossLossPct: number;
  riskRewardRatio: number;
  holdingAction?: "HOLD" | "BOOK_PROFIT" | "ACCUMULATE" | "CUT_LOSS";
  holdingRationale?: string;
}

export interface TradePlanInput {
  currentPrice: number;
  volatilityPct?: number;
  decision: "PROCEED" | "REDUCE_SIZE" | "WAIT_48H" | "AVOID";
  confidence: number;
  tradeValue: number;
  existingHolding?: {
    shares: number;
    avgBuyPrice: number;
  };
}

export function computeTradePlan(input: TradePlanInput): TradePlan {
  const baseVol = input.volatilityPct && input.volatilityPct > 0 ? input.volatilityPct / 100 : 0.035;

  let sizeMultiplier = 1.0;
  if (input.decision === "REDUCE_SIZE") sizeMultiplier = 0.5;
  if (input.decision === "WAIT_48H") sizeMultiplier = 0.25;
  if (input.decision === "AVOID") sizeMultiplier = 0.0;

  const recommendedAmount = Math.round(input.tradeValue * sizeMultiplier);
  const maxRecommendedAmount = Math.round(input.tradeValue * Math.min(1.0, sizeMultiplier * 1.5));

  const targetGainPct = parseFloat((baseVol * 2.2 * 100).toFixed(1));
  const stopLossLossPct = parseFloat((baseVol * 1.1 * 100).toFixed(1));
  const riskRewardRatio = parseFloat((targetGainPct / Math.max(0.1, stopLossLossPct)).toFixed(1));

  const targetPrice = input.currentPrice > 0
    ? parseFloat((input.currentPrice * (1 + targetGainPct / 100)).toFixed(2))
    : undefined;

  const stopLossPrice = input.currentPrice > 0
    ? parseFloat((input.currentPrice * (1 - stopLossLossPct / 100)).toFixed(2))
    : undefined;

  let holdingAction: TradePlan["holdingAction"];
  let holdingRationale: string | undefined;

  if (input.existingHolding && input.existingHolding.shares > 0) {
    const pnlPct = input.existingHolding.avgBuyPrice > 0 && input.currentPrice > 0
      ? ((input.currentPrice - input.existingHolding.avgBuyPrice) / input.existingHolding.avgBuyPrice) * 100
      : 0;

    if (input.decision === "AVOID") {
      holdingAction = "CUT_LOSS";
      holdingRationale = `Court advises against holding due to high bear signals and filing risks. Consider exiting to protect capital (P&L: ${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(1)}%).`;
    } else if (input.decision === "PROCEED" && pnlPct > 20) {
      holdingAction = "HOLD";
      holdingRationale = `Position is sitting on strong gains (+${pnlPct.toFixed(1)}%) with positive momentum. Let profits ride with a trailing stop at ${stopLossPrice ? `₹${stopLossPrice}` : "recent support"}.`;
    } else if (input.decision === "PROCEED") {
      holdingAction = "ACCUMULATE";
      holdingRationale = `Court signals are positive. Good risk-reward to add more to your current position.`;
    } else if (input.decision === "REDUCE_SIZE" && pnlPct > 10) {
      holdingAction = "BOOK_PROFIT";
      holdingRationale = `Signals show slowing momentum or concentration risk. Good opportunity to lock in partial profits (+${pnlPct.toFixed(1)}%).`;
    } else {
      holdingAction = "HOLD";
      holdingRationale = `Maintain your current shares without adding new capital until court signals give clearer upside confirmation.`;
    }
  }

  return {
    recommendedAmount,
    maxRecommendedAmount,
    targetPrice,
    targetGainPct,
    stopLossPrice,
    stopLossLossPct,
    riskRewardRatio,
    holdingAction,
    holdingRationale,
  };
}
