import { jsonCall } from "@/llm/json-call";
import { llmAgentOutputSchema, type AgentResult } from "@/schemas/agent";
import type { Claim } from "@/schemas/claim";
import type { Source } from "@/schemas/source";
import { loadSkillByName } from "@/skills/loader";
import { elapsedMs } from "@/lib/time";
import path from "path";

export async function runForensicAuditor(
  claims: Claim[],
  filingsSources: Source[]
): Promise<AgentResult> {
  const start = Date.now();

  if (filingsSources.length === 0) {
    return {
      agent: "forensic-auditor",
      status: "degraded",
      label: "No filings available",
      confidence: 0.2,
      findings: claims.map((c) => ({
        text: `Claim "${c.text}" could not be checked: no filing documents available`,
        sourceIds: [],
      })),
      latencyMs: elapsedMs(start),
    };
  }

  const skill = loadSkillByName(path.join(process.cwd(), "skills", "internal"), "forensic-auditor");
  const systemPrompt = skill?.body ?? "Verify claims against documents. Return JSON with agent, status, label, confidence, findings.";

  const sourceSummary = filingsSources
    .map((s) => `[${s.id}] ${s.title}: ${s.excerpt}`)
    .join("\n\n");

  const claimsSummary = claims
    .map((c) => `- [${c.id}] ${c.text} (type: ${c.type})`)
    .join("\n");

  const userPrompt = `CLAIMS:\n${claimsSummary}\n\nDOCUMENTS:\n${sourceSummary}`;

  const response = await jsonCall(llmAgentOutputSchema, "forensic-auditor-result", {
    systemPrompt,
    userPrompt,
  });

  return { ...response.data, latencyMs: elapsedMs(start) };
}
