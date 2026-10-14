import { jsonCall } from "@/llm/json-call";
import { llmAgentOutputSchema, type AgentResult } from "@/schemas/agent";
import type { ConcentrationResult } from "@/analytics/concentration";
import type { Profile } from "@/schemas/profile";
import { loadSkillByName } from "@/skills/loader";
import { elapsedMs } from "@/lib/time";
import path from "path";

export interface RiskInput {
  hhiBefore: ConcentrationResult;
  hhiAfter: ConcentrationResult;
  positionSizePct: number;
  profile: Profile;
  sourceId: string;
}

export async function runRiskAgent(input: RiskInput): Promise<AgentResult> {
  const start = Date.now();
  const skill = loadSkillByName(path.join(process.cwd(), "skills", "internal"), "risk");
  const systemPrompt = skill?.body ?? "Analyze concentration and position size risk.";

  const riskSummary = [
    `HHI before trade: ${input.hhiBefore.hhi.toFixed(0)} (concentrated: ${input.hhiBefore.isConcentrated})`,
    `HHI after trade: ${input.hhiAfter.hhi.toFixed(0)} (concentrated: ${input.hhiAfter.isConcentrated})`,
    `Position size: ${input.positionSizePct.toFixed(1)}% of portfolio`,
    `Profile max position: ${input.profile.maxPositionPct}%`,
    `Profile max drawdown: ${input.profile.maxDrawdownPct}%`,
    `Top holdings before: ${input.hhiBefore.topHoldings.map((h) => `${h.symbol} ${h.weightPct.toFixed(1)}%`).join(", ")}`,
    `Top holdings after: ${input.hhiAfter.topHoldings.map((h) => `${h.symbol} ${h.weightPct.toFixed(1)}%`).join(", ")}`,
  ].join("\n");

  const response = await jsonCall(llmAgentOutputSchema, "risk-result", {
    systemPrompt,
    userPrompt: `RISK ANALYSIS:\n${riskSummary}\n\nSource ID: ${input.sourceId}`,
  });

  return { ...response.data, latencyMs: elapsedMs(start) };
}
