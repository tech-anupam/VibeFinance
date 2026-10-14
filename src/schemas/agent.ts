import { z } from "zod";

export const findingSchema = z.object({
  text: z.string().min(1),
  sourceIds: z.array(z.string()),
});

export const llmAgentOutputSchema = z.object({
  agent: z.string().min(1),
  status: z.enum(["ok", "degraded", "failed"]),
  label: z.string().min(1),
  confidence: z.number().min(0).max(1),
  findings: z.array(findingSchema),
});

export const agentResultSchema = z.object({
  agent: z.string().min(1),
  status: z.enum(["ok", "degraded", "failed"]),
  label: z.string().min(1),
  confidence: z.number().min(0).max(1),
  findings: z.array(findingSchema),
  latencyMs: z.number().nonnegative(),
  error: z.string().optional(),
});

export type Finding = z.infer<typeof findingSchema>;
export type LlmAgentOutput = z.infer<typeof llmAgentOutputSchema>;
export type AgentResult = z.infer<typeof agentResultSchema>;
