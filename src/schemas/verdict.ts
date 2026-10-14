import { z } from "zod";

export const decisions = ["PROCEED", "REDUCE_SIZE", "WAIT_48H", "AVOID"] as const;

export const verdictSchema = z.object({
  decision: z.enum(decisions),
  regretRiskScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  rationale: z.array(
    z.object({
      text: z.string().min(1),
      sourceIds: z.array(z.string()),
    })
  ),
  agentSummaries: z.record(z.string(), z.string()),
  degradedFlags: z.array(z.string()),
  disclaimer: z.string().min(1),
});

export type Decision = z.infer<typeof verdictSchema>["decision"];
export type Verdict = z.infer<typeof verdictSchema>;
