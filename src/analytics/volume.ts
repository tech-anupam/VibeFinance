import type { PriceBar } from "./indicators";

export interface VolumeAnalysis {
  currentVolume: number;
  avgVolume: number;
  stdDev: number;
  zScore: number;
  isSpike: boolean;
}

export function volumeZScore(bars: PriceBar[], lookback: number = 20): VolumeAnalysis | undefined {
  if (bars.length < lookback + 1) return undefined;

  const current = bars[bars.length - 1]!;
  const window = bars.slice(bars.length - lookback - 1, bars.length - 1);
  const volumes = window.map((b) => b.volume);

  const sum = volumes.reduce((a, b) => a + b, 0);
  const avg = sum / volumes.length;

  const sqDiffs = volumes.map((v) => (v - avg) ** 2);
  const variance = sqDiffs.reduce((a, b) => a + b, 0) / volumes.length;
  const std = Math.sqrt(variance);

  const z = std === 0 ? 0 : (current.volume - avg) / std;

  return {
    currentVolume: current.volume,
    avgVolume: avg,
    stdDev: std,
    zScore: z,
    isSpike: z > 2,
  };
}

export function volumeProfile(bars: PriceBar[], buckets: number = 10): Map<number, number> {
  if (bars.length === 0) return new Map();

  const prices = bars.map((b) => b.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;
  const bucketSize = range / buckets;

  const profile = new Map<number, number>();
  for (const bar of bars) {
    const bucket = bucketSize === 0
      ? minPrice
      : minPrice + Math.floor((bar.close - minPrice) / bucketSize) * bucketSize;
    profile.set(bucket, (profile.get(bucket) ?? 0) + bar.volume);
  }
  return profile;
}
