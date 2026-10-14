import type { AgentResult } from "@/schemas/agent";
import { TimeoutError } from "@/lib/errors";
import { log } from "@/lib/log";

const DEFAULT_TIMEOUT_MS = 45_000;

type AgentFn = () => Promise<AgentResult>;

interface AgentTask {
  name: string;
  fn: AgentFn;
  timeoutMs?: number;
}

function withTimeout<T>(promise: Promise<T>, name: string, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new TimeoutError(name, ms)),
      ms
    );
    promise
      .then((v) => { clearTimeout(timer); resolve(v); })
      .catch((e) => { clearTimeout(timer); reject(e); });
  });
}

export async function runAgents(tasks: AgentTask[]): Promise<AgentResult[]> {
  const promises = tasks.map((task) =>
    withTimeout(task.fn(), task.name, task.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  );

  const settled = await Promise.allSettled(promises);

  return settled.map((result, i) => {
    const task = tasks[i]!;
    if (result.status === "fulfilled") {
      return result.value;
    }

    const error = result.reason instanceof Error ? result.reason : new Error(String(result.reason));
    log.error("Agent failed", { agent: task.name, error: error.message });

    return {
      agent: task.name,
      status: "failed" as const,
      label: `Agent failed: ${error.message}`,
      confidence: 0,
      findings: [],
      latencyMs: 0,
      error: error.message,
    };
  });
}
