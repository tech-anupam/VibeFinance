import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { getEnv } from "@/lib/env";

let instance: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (instance) return instance;

  const env = getEnv();
  const url = env.TURSO_DATABASE_URL || "file:data/local.db";
  const client = createClient({
    url,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  instance = drizzle(client, { schema });
  return instance;
}
