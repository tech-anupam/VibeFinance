import type { Trade } from "@/schemas/trade";
import type { PriceBar } from "./indicators";

export interface BehavioralFlags {
  averagingDownCount: number;
  averagingDownTradeIds: string[];
  panicSellCount: number;
  panicSellTradeIds: string[];
  winnerSoldEarlyRatio: number;
  winnerSoldEarlyTradeIds: string[];
  fomoEntryCount: number;
  fomoEntryTradeIds: string[];
}

function groupTradesBySymbol(trades: Trade[]): Map<string, Trade[]> {
  const groups = new Map<string, Trade[]>();
  for (const trade of trades) {
    const existing = groups.get(trade.symbol) ?? [];
    existing.push(trade);
    groups.set(trade.symbol, existing);
  }
  return groups;
}

export function detectAveragingDown(trades: Trade[]): Pick<BehavioralFlags, "averagingDownCount" | "averagingDownTradeIds"> {
  const ids: string[] = [];
  const groups = groupTradesBySymbol(trades);

  for (const [, symbolTrades] of groups) {
    const sorted = [...symbolTrades].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    let consecutiveBuysAtLowerPrice = 0;
    let lastBuyPrice = Infinity;

    for (const trade of sorted) {
      if (trade.side === "buy") {
        if (trade.price < lastBuyPrice) {
          consecutiveBuysAtLowerPrice++;
          if (consecutiveBuysAtLowerPrice >= 2) {
            ids.push(trade.id);
          }
        } else {
          consecutiveBuysAtLowerPrice = 0;
        }
        lastBuyPrice = trade.price;
      }
    }
  }

  return { averagingDownCount: ids.length, averagingDownTradeIds: ids };
}

export function detectPanicSells(
  trades: Trade[],
  priceHistory: Map<string, PriceBar[]>,
  drawdownThreshold: number = 0.15
): Pick<BehavioralFlags, "panicSellCount" | "panicSellTradeIds"> {
  const ids: string[] = [];

  const sells = trades.filter((t) => t.side === "sell");
  for (const sell of sells) {
    const bars = priceHistory.get(sell.symbol);
    if (!bars || bars.length < 5) continue;

    const sellDate = sell.timestamp.slice(0, 10);
    const recentBars = bars.filter((b) => b.date <= sellDate).slice(-30);
    if (recentBars.length < 2) continue;

    const peak = Math.max(...recentBars.map((b) => b.high));
    const current = recentBars[recentBars.length - 1]!.close;
    const drawdown = (peak - current) / peak;

    if (drawdown >= drawdownThreshold) {
      ids.push(sell.id);
    }
  }

  return { panicSellCount: ids.length, panicSellTradeIds: ids };
}

export function detectFomoEntries(
  trades: Trade[],
  priceHistory: Map<string, PriceBar[]>,
  spikeZScoreThreshold: number = 2
): Pick<BehavioralFlags, "fomoEntryCount" | "fomoEntryTradeIds"> {
  const ids: string[] = [];

  const buys = trades.filter((t) => t.side === "buy");
  for (const buy of buys) {
    const bars = priceHistory.get(buy.symbol);
    if (!bars || bars.length < 22) continue;

    const buyDate = buy.timestamp.slice(0, 10);
    const priorBars = bars.filter((b) => b.date < buyDate).slice(-21);
    if (priorBars.length < 20) continue;

    const volumes = priorBars.slice(0, -1).map((b) => b.volume);
    const lastBar = priorBars[priorBars.length - 1]!;
    const avg = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const std = Math.sqrt(
      volumes.reduce((sum, v) => sum + (v - avg) ** 2, 0) / volumes.length
    );
    const z = std === 0 ? 0 : (lastBar.volume - avg) / std;

    if (z > spikeZScoreThreshold) {
      ids.push(buy.id);
    }
  }

  return { fomoEntryCount: ids.length, fomoEntryTradeIds: ids };
}

export function detectWinnersSoldEarly(
  trades: Trade[],
  priceHistory: Map<string, PriceBar[]>,
  forwardDays: number = 30,
  missedGainThreshold: number = 0.1
): Pick<BehavioralFlags, "winnerSoldEarlyRatio" | "winnerSoldEarlyTradeIds"> {
  const ids: string[] = [];
  let totalSells = 0;

  const sells = trades.filter((t) => t.side === "sell");
  for (const sell of sells) {
    const bars = priceHistory.get(sell.symbol);
    if (!bars) continue;

    const sellDate = sell.timestamp.slice(0, 10);
    const futureBars = bars.filter((b) => b.date > sellDate).slice(0, forwardDays);
    if (futureBars.length === 0) continue;

    totalSells++;
    const maxFuturePrice = Math.max(...futureBars.map((b) => b.high));
    const missedGain = (maxFuturePrice - sell.price) / sell.price;

    if (missedGain >= missedGainThreshold) {
      ids.push(sell.id);
    }
  }

  return {
    winnerSoldEarlyRatio: totalSells === 0 ? 0 : ids.length / totalSells,
    winnerSoldEarlyTradeIds: ids,
  };
}

export function analyzeBehavior(
  trades: Trade[],
  priceHistory: Map<string, PriceBar[]>
): BehavioralFlags {
  const avgDown = detectAveragingDown(trades);
  const panic = detectPanicSells(trades, priceHistory);
  const fomo = detectFomoEntries(trades, priceHistory);
  const winners = detectWinnersSoldEarly(trades, priceHistory);

  return {
    ...avgDown,
    ...panic,
    ...fomo,
    ...winners,
  };
}
