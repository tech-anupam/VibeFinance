import { jsonCall } from "@/llm/json-call";
import { llmAgentOutputSchema, type AgentResult } from "@/schemas/agent";
import type { BehavioralFlags } from "@/analytics/behavior";
import { loadSkillByName } from "@/skills/loader";
import { elapsedMs } from "@/lib/time";
import path from "path";

export async function runBehavioralMirror(
  flags: BehavioralFlags | undefined
): Promise<AgentResult> {
  const start = Date.now();

  if (!flags) {
    return {
      agent: "behavioral-mirror",
      status: "degraded",
      label: "No trade history available",
      confidence: 0,
      findings: [{
        text: "Insufficient evidence: no trade history was provided for behavioral analysis",
        sourceIds: [],
      }],
      latencyMs: elapsedMs(start),
    };
  }

  const skill = loadSkillByName(path.join(process.cwd(), "skills", "internal"), "behavioral-mirror");
  const systemPrompt = skill?.body ?? "Describe behavioral patterns.";

  const flagsSummary = [
    `Averaging down count: ${flags.averagingDownCount} (trade IDs: ${flags.averagingDownTradeIds.join(", ") || "none"})`,
    `Panic sell count: ${flags.panicSellCount} (trade IDs: ${flags.panicSellTradeIds.join(", ") || "none"})`,
    `Winner sold early ratio: ${(flags.winnerSoldEarlyRatio * 100).toFixed(1)}% (trade IDs: ${flags.winnerSoldEarlyTradeIds.join(", ") || "none"})`,
    `FOMO entry count: ${flags.fomoEntryCount} (trade IDs: ${flags.fomoEntryTradeIds.join(", ") || "none"})`,
  ].join("\n");

  const response = await jsonCall(llmAgentOutputSchema, "behavioral-mirror-result", {
    systemPrompt,
    userPrompt: `BEHAVIORAL ANALYSIS:\n${flagsSummary}`,
  });

  return { ...response.data, latencyMs: elapsedMs(start) };
}
