import { jsonCall } from "@/llm/json-call";
import { llmAgentOutputSchema, type AgentResult } from "@/schemas/agent";
import type { Source } from "@/schemas/source";
import { loadSkillByName } from "@/skills/loader";
import { elapsedMs } from "@/lib/time";
import path from "path";

export interface AnalyticsEvidence {
  rsiLatest?: number;
  volumeZScore?: number;
  maxDrawdownPct?: number;
  macdHistogram?: number;
  returnStats?: string;
}

export async function runProsecutor(
  analytics: AnalyticsEvidence,
  sources: Source[]
): Promise<AgentResult> {
  const start = Date.now();
  const skill = loadSkillByName(path.join(process.cwd(), "skills", "internal"), "prosecutor");
  const systemPrompt = skill?.body ?? "Build the bear case.";

  const analyticsText = Object.entries(analytics)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const sourcesText = sources
    .map((s) => `[${s.id}] ${s.title}: ${s.excerpt}`)
    .join("\n\n");

  const userPrompt = `ANALYTICS:\n${analyticsText}\n\nSOURCES:\n${sourcesText || "No sources available"}`;

  const response = await jsonCall(llmAgentOutputSchema, "prosecutor-result", {
    systemPrompt,
    userPrompt,
  });

  return { ...response.data, latencyMs: elapsedMs(start) };
}
