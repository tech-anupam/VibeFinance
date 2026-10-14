export interface EvalMetrics {
  totalScenarios: number;
  verdictAgreementRate: number;
  claimPrecision: number;
  verifierRetryRate: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
}

export function computePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))] ?? 0;
}

export function computeEvalMetrics(results: Array<{
  expectedVerdict: string;
  actualVerdict: string;
  expectedClaimsCount: number;
  actualClaimsCount: number;
  retries: number;
  latencyMs: number;
}>): EvalMetrics {
  if (results.length === 0) {
    return {
      totalScenarios: 0,
      verdictAgreementRate: 0,
      claimPrecision: 0,
      verifierRetryRate: 0,
      latencyP50Ms: 0,
      latencyP95Ms: 0,
    };
  }

  const correctVerdicts = results.filter((r) => r.expectedVerdict === r.actualVerdict).length;
  const verdictAgreementRate = correctVerdicts / results.length;

  let totalExpected = 0;
  let totalExtracted = 0;
  for (const r of results) {
    totalExpected += r.expectedClaimsCount;
    totalExtracted += r.actualClaimsCount;
  }
  const claimPrecision = totalExtracted > 0 ? Math.min(1, totalExpected / totalExtracted) : 0;

  const totalRetries = results.reduce((sum, r) => sum + r.retries, 0);
  const verifierRetryRate = totalRetries / results.length;

  const latencies = results.map((r) => r.latencyMs);
  const latencyP50Ms = computePercentile(latencies, 50);
  const latencyP95Ms = computePercentile(latencies, 95);

  return {
    totalScenarios: results.length,
    verdictAgreementRate,
    claimPrecision,
    verifierRetryRate,
    latencyP50Ms,
    latencyP95Ms,
  };
}
