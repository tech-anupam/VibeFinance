import { z } from "zod";

export const profileWeightsSchema = z.object({
  contradiction: z.number().min(0).max(1),
  concentration: z.number().min(0).max(1),
  momentum: z.number().min(0).max(1),
  behavioral: z.number().min(0).max(1),
  forensic: z.number().min(0).max(1),
});

export const profileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["custom", "conservative", "aggressive"]),
  horizon: z.enum(["short", "medium", "long"]),
  maxPositionPct: z.number().min(0).max(100),
  maxDrawdownPct: z.number().min(0).max(100),
  weights: profileWeightsSchema,
});

export type ProfileWeights = z.infer<typeof profileWeightsSchema>;
export type Profile = z.infer<typeof profileSchema>;
