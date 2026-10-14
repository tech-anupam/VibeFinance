import { agentResultSchema, type AgentResult } from "@/schemas/agent";
import { SourceStore } from "@/retrieval/cite";
import { log } from "@/lib/log";

export interface VerificationResult {
  result: AgentResult;
  retries: number;
  droppedFindings: number;
}

function validateSchema(result: AgentResult): string[] {
  const parsed = agentResultSchema.safeParse(result);
  if (parsed.success) return [];
  return parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

function validateSourceIds(result: AgentResult, store: SourceStore): string[] {
  const errors: string[] = [];
  for (const finding of result.findings) {
    for (const sid of finding.sourceIds) {
      if (!store.has(sid)) {
        errors.push(`Source ID "${sid}" not found in session store`);
      }
    }
  }
  return errors;
}

export function verify(result: AgentResult, store: SourceStore): VerificationResult {
  const schemaErrors = validateSchema(result);
  if (schemaErrors.length > 0) {
    log.warn("Agent result schema validation failed", {
      agent: result.agent,
      errors: schemaErrors,
    });
    return {
      result: {
        ...result,
        status: "degraded",
        findings: [],
      },
      retries: 0,
      droppedFindings: result.findings.length,
    };
  }

  const sourceErrors = validateSourceIds(result, store);
  if (sourceErrors.length > 0) {
    log.warn("Agent result has invalid source IDs", {
      agent: result.agent,
      errors: sourceErrors,
    });

    const validFindings = result.findings.filter((f) =>
      f.sourceIds.every((sid) => store.has(sid))
    );
    const droppedCount = result.findings.length - validFindings.length;

    const insufficientFindings = result.findings
      .filter((f) => f.sourceIds.some((sid) => !store.has(sid)))
      .map((f) => ({
        text: `Insufficient evidence: ${f.text}`,
        sourceIds: [] as string[],
      }));

    return {
      result: {
        ...result,
        status: droppedCount > 0 ? "degraded" : result.status,
        findings: [...validFindings, ...insufficientFindings],
      },
      retries: 0,
      droppedFindings: droppedCount,
    };
  }

  return { result, retries: 0, droppedFindings: 0 };
}

export function verifyAll(results: AgentResult[], store: SourceStore): VerificationResult[] {
  return results.map((r) => verify(r, store));
}
