import type { AgentResult } from "@/schemas/agent";
import type { Profile } from "@/schemas/profile";
import type { Decision, Verdict } from "@/schemas/verdict";

interface WeightedSignal {
  agent: string;
  score: number;
  weight: number;
}

function computeWeightedScore(results: AgentResult[], profile: Profile): WeightedSignal[] {
  const weightMap: Record<string, number> = {
    "forensic-auditor": profile.weights.forensic,
    "prosecutor": profile.weights.contradiction,
    "defence": profile.weights.momentum,
    "behavioral-mirror": profile.weights.behavioral,
    "risk": profile.weights.concentration,
  };

  return results
    .filter((r) => r.status !== "failed")
    .map((r) => ({
      agent: r.agent,
      score: r.confidence * (r.status === "degraded" ? 0.4 : 1),
      weight: weightMap[r.agent] ?? 0.5,
    }));
}

function detectConflicts(results: AgentResult[]): string[] {
  const conflicts: string[] = [];
  const prosecutor = results.find((r) => r.agent === "prosecutor");
  const defence = results.find((r) => r.agent === "defence");

  if (prosecutor && defence && prosecutor.confidence > 0.6 && defence.confidence > 0.6) {
    conflicts.push(
      `Prosecutor (confidence ${prosecutor.confidence.toFixed(2)}) and Defence (confidence ${defence.confidence.toFixed(2)}) both present strong cases`
    );
  }

  const auditor = results.find((r) => r.agent === "forensic-auditor");
  if (auditor && defence) {
    const auditorContradictions = auditor.findings.filter((f) =>
      f.text.toLowerCase().includes("contradicted")
    );
    if (auditorContradictions.length > 0 && defence.confidence > 0.5) {
      conflicts.push(
        `Auditor contradicts ${auditorContradictions.length} claim(s) that Defence relies on`
      );
    }
  }

  return conflicts;
}

function decideVerdict(signals: WeightedSignal[], results: AgentResult[], conflicts: string[]): { decision: Decision; regretRiskScore: number } {
  let bearScore = 0;
  let bullScore = 0;
  let riskPenalty = 0;
  let behavioralPenalty = 0;

  for (const signal of signals) {
    if (signal.agent === "prosecutor") bearScore += signal.score * signal.weight;
    if (signal.agent === "defence") bullScore += signal.score * signal.weight;
    if (signal.agent === "risk") riskPenalty += signal.score * signal.weight;
    if (signal.agent === "behavioral-mirror") behavioralPenalty += signal.score * signal.weight;
  }

  const auditor = results.find((r) => r.agent === "forensic-auditor");
  const hasContradiction = auditor?.findings.some((f) =>
    f.text.toLowerCase().includes("contradicted")
  ) ?? false;

  if (auditor?.status === "degraded") {
    return { decision: "WAIT_48H", regretRiskScore: 65 };
  }

  const netScore = bullScore - bearScore - riskPenalty * 0.5 - behavioralPenalty * 0.3;
  const regretRiskScore = Math.min(100, Math.max(0, Math.round((1 - netScore) * 50 + conflicts.length * 10)));

  if (hasContradiction && bearScore > 0.5) return { decision: "AVOID", regretRiskScore: Math.max(regretRiskScore, 75) };
  if (riskPenalty > 0.7) return { decision: "REDUCE_SIZE", regretRiskScore };
  if (bearScore > bullScore && conflicts.length > 0) return { decision: "WAIT_48H", regretRiskScore };
  if (netScore > 0.3) return { decision: "PROCEED", regretRiskScore };
  if (netScore > 0) return { decision: "REDUCE_SIZE", regretRiskScore };

  return { decision: "WAIT_48H", regretRiskScore };
}

export function arbitrate(results: AgentResult[], profile: Profile): Omit<Verdict, "disclaimer"> {
  const signals = computeWeightedScore(results, profile);
  const conflicts = detectConflicts(results);
  const { decision, regretRiskScore } = decideVerdict(signals, results, conflicts);

  const degradedFlags = results
    .filter((r) => r.status === "degraded" || r.status === "failed")
    .map((r) => r.agent);

  const overallConfidence = signals.length > 0
    ? signals.reduce((sum, s) => sum + s.score * s.weight, 0) / signals.reduce((sum, s) => sum + s.weight, 0)
    : 0;

  const rationale = [
    ...conflicts.map((c) => ({ text: `Conflict: ${c}`, sourceIds: [] as string[] })),
    ...results.flatMap((r) =>
      r.findings.slice(0, 2).map((f) => ({ text: `[${r.agent}] ${f.text}`, sourceIds: f.sourceIds }))
    ),
  ];

  const agentSummaries: Record<string, string> = {};
  for (const r of results) {
    agentSummaries[r.agent] = r.label;
  }

  return {
    decision,
    regretRiskScore,
    confidence: Math.min(1, Math.max(0, overallConfidence)),
    rationale,
    agentSummaries,
    degradedFlags,
  };
}
