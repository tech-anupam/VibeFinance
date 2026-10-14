import fs from "fs";
import path from "path";
import { runPipeline, type PipelineInput } from "@/core/pipeline";
import { initializeSources } from "@/sources/index";
import { conservativeProfile } from "@/profiles/reference";
import { computeEvalMetrics } from "./metrics";
import { log } from "@/lib/log";

interface Scenario {
  id: string;
  tipText: string;
  symbol: string;
  expectedVerdict: string;
  expectedClaims: Array<{ text: string; type: string }>;
}

async function runEval() {
  initializeSources();

  const scenariosPath = path.join(process.cwd(), "src", "eval", "scenarios.json");
  const rawScenarios = fs.readFileSync(scenariosPath, "utf-8");
  const scenarios: Scenario[] = JSON.parse(rawScenarios);

  const scenarioLimit = process.env.EVAL_LIMIT ? parseInt(process.env.EVAL_LIMIT, 10) : 5;
  const targetScenarios = scenarios.slice(0, scenarioLimit);

  log.info("Starting Tip Court evaluation", { total: scenarios.length, running: targetScenarios.length });

  const results: Array<{
    id: string;
    symbol: string;
    expectedVerdict: string;
    actualVerdict: string;
    expectedClaimsCount: number;
    actualClaimsCount: number;
    retries: number;
    latencyMs: number;
  }> = [];

  for (const s of targetScenarios) {
    const start = Date.now();
    try {
      const input: PipelineInput = {
        tipText: s.tipText,
        profile: conservativeProfile,
        trades: [],
        holdings: [],
        symbol: s.symbol,
        tradeValue: 100000,
      };

      const output = await runPipeline(input);
      const latencyMs = Date.now() - start;

      results.push({
        id: s.id,
        symbol: s.symbol,
        expectedVerdict: s.expectedVerdict,
        actualVerdict: output.verdict.decision,
        expectedClaimsCount: s.expectedClaims.length,
        actualClaimsCount: output.claims.length,
        retries: output.metrics.verifierRetries,
        latencyMs,
      });

      console.log(`[${s.id}] ${s.symbol}: expected=${s.expectedVerdict} actual=${output.verdict.decision} (${(latencyMs / 1000).toFixed(1)}s)`);
    } catch (e) {
      log.error("Scenario evaluation failed", { id: s.id, error: String(e) });
    }
  }

  const metrics = computeEvalMetrics(results);

  console.log("\n=================== EVALUATION REPORT ===================");
  console.log(`Total Scenarios Tested:  ${metrics.totalScenarios}`);
  console.log(`Verdict Agreement Rate:  ${(metrics.verdictAgreementRate * 100).toFixed(1)}%`);
  console.log(`Claim Extraction Ratio:  ${(metrics.claimPrecision * 100).toFixed(1)}%`);
  console.log(`Verifier Retry Rate:     ${metrics.verifierRetryRate.toFixed(2)}`);
  console.log(`Latency p50:             ${metrics.latencyP50Ms}ms`);
  console.log(`Latency p95:             ${metrics.latencyP95Ms}ms`);
  console.log("=========================================================\n");

  const outPath = path.join(process.cwd(), "data", "eval-results.json");
  fs.writeFileSync(outPath, JSON.stringify({ metrics, results }, null, 2));
  log.info("Evaluation results written", { path: outPath });
}

runEval().catch((e) => {
  console.error("Evaluation run failed:", e);
  process.exit(1);
});
