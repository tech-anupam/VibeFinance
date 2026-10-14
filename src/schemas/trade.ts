import { z } from "zod";

export const tradeSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1),
  symbol: z.string().min(1),
  side: z.enum(["buy", "sell"]),
  quantity: z.number().positive(),
  price: z.number().positive(),
  timestamp: z.string().datetime(),
  exchange: z.enum(["NSE", "BSE"]),
});

export type Trade = z.infer<typeof tradeSchema>;
