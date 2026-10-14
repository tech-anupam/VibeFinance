import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";
import { log } from "@/lib/log";

const CACHE_DIR = path.join(process.cwd(), "data", "cache", "price");

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 16);
}

function cachePath(key: string): string {
  return path.join(CACHE_DIR, `${hashKey(key)}.json`);
}

export async function getCached<T>(key: string): Promise<{ data: T; retrievedAt: string } | undefined> {
  const filePath = cachePath(key);
  if (!existsSync(filePath)) return undefined;

  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as { data: T; retrievedAt: string };
  } catch (e) {
    log.warn("Cache read failed", { key, error: String(e) });
    return undefined;
  }
}

export async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    if (!existsSync(CACHE_DIR)) {
      await mkdir(CACHE_DIR, { recursive: true });
    }
    const entry = {
      data,
      retrievedAt: new Date().toISOString(),
    };
    await writeFile(cachePath(key), JSON.stringify(entry, null, 2), "utf-8");
  } catch (e) {
    log.warn("Cache write failed", { key, error: String(e) });
  }
}
