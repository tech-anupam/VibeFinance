export interface Holding {
  symbol: string;
  value: number;
}

export interface ConcentrationResult {
  hhi: number;
  normalizedHhi: number;
  topHoldings: Array<{ symbol: string; weightPct: number }>;
  isConcentrated: boolean;
}

export function computeHhi(holdings: Holding[]): ConcentrationResult {
  if (holdings.length === 0) {
    return { hhi: 0, normalizedHhi: 0, topHoldings: [], isConcentrated: false };
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  if (totalValue === 0) {
    return { hhi: 0, normalizedHhi: 0, topHoldings: [], isConcentrated: false };
  }

  const weights = holdings.map((h) => ({
    symbol: h.symbol,
    weightPct: (h.value / totalValue) * 100,
  }));

  const hhi = weights.reduce((sum, w) => sum + w.weightPct ** 2, 0);
  const n = holdings.length;
  const minHhi = n > 0 ? 10000 / n : 0;
  const normalizedHhi = n > 1 ? (hhi - minHhi) / (10000 - minHhi) : 1;

  const sorted = [...weights].sort((a, b) => b.weightPct - a.weightPct);

  return {
    hhi,
    normalizedHhi: Math.max(0, Math.min(1, normalizedHhi)),
    topHoldings: sorted.slice(0, 5),
    isConcentrated: hhi > 2500,
  };
}

export function hhiAfterTrade(
  holdings: Holding[],
  symbol: string,
  tradeValue: number
): ConcentrationResult {
  const existing = holdings.find((h) => h.symbol === symbol);
  const updated = holdings.map((h) =>
    h.symbol === symbol ? { ...h, value: h.value + tradeValue } : h
  );

  if (!existing) {
    updated.push({ symbol, value: tradeValue });
  }

  return computeHhi(updated.filter((h) => h.value > 0));
}
