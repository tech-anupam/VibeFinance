import { z } from "zod";
import { jsonCall } from "@/llm/json-call";
import { loadSkillByName } from "@/skills/loader";
import { claimSchema, type Claim } from "@/schemas/claim";
import type { AgentResult } from "@/schemas/agent";
import { elapsedMs } from "@/lib/time";
import path from "path";

const claimsResponseSchema = z.object({
  claims: z.array(claimSchema),
});

export async function extractClaims(tipText: string): Promise<{ result: AgentResult; claims: Claim[] }> {
  const start = Date.now();
  const skill = loadSkillByName(path.join(process.cwd(), "skills", "internal"), "claim-extractor");
  const systemPrompt = skill?.body ?? "Extract factual claims from the stock tip as JSON.";

  const response = await jsonCall(claimsResponseSchema, "claims-response", {
    systemPrompt,
    userPrompt: tipText,
  });

  const claims = response.data.claims;

  return {
    claims,
    result: {
      agent: "claim-extractor",
      status: "ok",
      label: `Extracted ${claims.length} claims`,
      confidence: 1,
      findings: claims.map((c) => ({
        text: `[${c.type}] ${c.text} (checkable: ${c.checkable})`,
        sourceIds: [],
      })),
      latencyMs: elapsedMs(start),
    },
  };
}
