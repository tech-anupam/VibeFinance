import { z } from "zod";
import { callLlm, type LlmCallOptions } from "./client";
import { ValidationError } from "@/lib/errors";
import { log } from "@/lib/log";

export interface TypedLlmResult<T> {
  data: T;
  raw: string;
  latencyMs: number;
}

export async function jsonCall<T>(
  schema: z.ZodType<T>,
  schemaName: string,
  options: LlmCallOptions
): Promise<TypedLlmResult<T>> {
  const response = await callLlm(options);

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.content);
  } catch {
    throw new ValidationError(schemaName, ["LLM returned invalid JSON"]);
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`
    );
    log.warn("LLM output validation failed", { schemaName, issues });
    throw new ValidationError(schemaName, issues);
  }

  return {
    data: result.data,
    raw: response.content,
    latencyMs: response.latencyMs,
  };
}
