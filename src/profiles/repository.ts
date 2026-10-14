import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { profiles, trades } from "@/db/schema";
import type { Profile, ProfileWeights } from "@/schemas/profile";
import type { Trade } from "@/schemas/trade";

function rowToProfile(row: typeof profiles.$inferSelect): Profile {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    horizon: row.horizon,
    maxPositionPct: row.maxPositionPct,
    maxDrawdownPct: row.maxDrawdownPct,
    weights: JSON.parse(row.weightsJson) as ProfileWeights,
  };
}

export async function getProfileById(id: string): Promise<Profile | undefined> {
  const db = getDb();
  const rows = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  const row = rows[0];
  return row ? rowToProfile(row) : undefined;
}

export async function upsertProfile(profile: Profile): Promise<void> {
  const db = getDb();
  await db
    .insert(profiles)
    .values({
      id: profile.id,
      name: profile.name,
      type: profile.type,
      horizon: profile.horizon,
      maxPositionPct: profile.maxPositionPct,
      maxDrawdownPct: profile.maxDrawdownPct,
      weightsJson: JSON.stringify(profile.weights),
      createdAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        name: profile.name,
        type: profile.type,
        horizon: profile.horizon,
        maxPositionPct: profile.maxPositionPct,
        maxDrawdownPct: profile.maxDrawdownPct,
        weightsJson: JSON.stringify(profile.weights),
      },
    });
}

export async function getTradesByProfileId(profileId: string): Promise<Trade[]> {
  const db = getDb();
  const rows = await db.select().from(trades).where(eq(trades.profileId, profileId));
  return rows.map((r) => ({
    id: r.id,
    profileId: r.profileId,
    symbol: r.symbol,
    side: r.side,
    quantity: r.quantity,
    price: r.price,
    timestamp: r.timestamp,
    exchange: r.exchange,
  }));
}

export async function insertTrades(tradeList: Trade[]): Promise<void> {
  if (tradeList.length === 0) return;
  const db = getDb();
  await db.insert(trades).values(tradeList);
}

export async function getAllProfiles(): Promise<Profile[]> {
  const db = getDb();
  const rows = await db.select().from(profiles);
  return rows.map(rowToProfile);
}
