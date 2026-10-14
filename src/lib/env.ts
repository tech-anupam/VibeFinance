import { z } from "zod";

const envSchema = z.object({
  GROQ_API_KEY: z.string().min(1),
  TURSO_DATABASE_URL: z.string().default("file:data/local.db"),
  TURSO_AUTH_TOKEN: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${formatted}`);
  }
  return result.data;
}

let cached: Env | undefined;

export function getEnv(): Env {
  if (!cached) {
    cached = validateEnv();
  }
  return cached;
}
