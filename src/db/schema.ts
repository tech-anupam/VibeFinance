import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["custom", "conservative", "aggressive"] }).notNull(),
  horizon: text("horizon", { enum: ["short", "medium", "long"] }).notNull(),
  maxPositionPct: real("max_position_pct").notNull(),
  maxDrawdownPct: real("max_drawdown_pct").notNull(),
  weightsJson: text("weights_json").notNull(),
  createdAt: text("created_at").notNull(),
});

export const trades = sqliteTable("trades", {
  id: text("id").primaryKey(),
  profileId: text("profile_id").notNull().references(() => profiles.id),
  symbol: text("symbol").notNull(),
  side: text("side", { enum: ["buy", "sell"] }).notNull(),
  quantity: real("quantity").notNull(),
  price: real("price").notNull(),
  timestamp: text("timestamp").notNull(),
  exchange: text("exchange", { enum: ["NSE", "BSE"] }).notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  profileId: text("profile_id").notNull().references(() => profiles.id),
  tipText: text("tip_text").notNull(),
  verdictJson: text("verdict_json"),
  sourcesJson: text("sources_json"),
  metricsJson: text("metrics_json"),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
});

export const filingChunks = sqliteTable("filing_chunks", {
  id: text("id").primaryKey(),
  company: text("company").notNull(),
  sourceUrl: text("source_url").notNull(),
  publisher: text("publisher").notNull(),
  asOf: text("as_of").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  retrievedAt: text("retrieved_at").notNull(),
});
