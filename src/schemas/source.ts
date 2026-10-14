import { z } from "zod";

export const sourceKinds = ["filing", "price", "history", "web", "fundamental", "news"] as const;
export const trustLevels = ["primary", "secondary", "cached"] as const;

export const sourceSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(sourceKinds),
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.string().url().optional(),
  retrievedAt: z.string().datetime(),
  asOf: z.string().datetime(),
  excerpt: z.string(),
  trust: z.enum(trustLevels),
});

export type Source = z.infer<typeof sourceSchema>;
