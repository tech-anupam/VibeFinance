import { NextResponse } from "next/server";
import { z } from "zod";
import { runPipeline, type PipelineInput } from "@/core/pipeline";
import { initializeSources } from "@/sources/index";
import { conservativeProfile, aggressiveProfile } from "@/profiles/reference";
import { log } from "@/lib/log";

const requestSchema = z.object({
  tipText: z.string().min(1),
  symbol: z.string().min(1),
  tradeValue: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    initializeSources();

    const baseInput: Omit<PipelineInput, "profile"> = {
      tipText: parsed.data.tipText,
      trades: [],
      holdings: [],
      symbol: parsed.data.symbol,
      tradeValue: parsed.data.tradeValue,
    };

    const [conservativeResult, aggressiveResult] = await Promise.all([
      runPipeline({ ...baseInput, profile: conservativeProfile }),
      runPipeline({ ...baseInput, profile: aggressiveProfile }),
    ]);

    return NextResponse.json({
      profiles: {
        conservative: {
          profile: conservativeProfile,
          verdict: conservativeResult.verdict,
          metrics: conservativeResult.metrics,
        },
        aggressive: {
          profile: aggressiveProfile,
          verdict: aggressiveResult.verdict,
          metrics: aggressiveResult.metrics,
        },
      },
      claims: conservativeResult.claims,
      sources: conservativeResult.sources,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    log.error("Compare API error", { error: message });
    return NextResponse.json(
      { error: "Comparison failed", message },
      { status: 500 }
    );
  }
}
