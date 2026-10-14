import { z } from "zod";

export const claimTypes = ["debt", "growth", "promoter", "price_target", "momentum", "other"] as const;

export const claimSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  type: z.enum(claimTypes),
  company: z.string().min(1),
  checkable: z.boolean(),
});

export type Claim = z.infer<typeof claimSchema>;
