import Groq from "groq-sdk";
import { getEnv } from "@/lib/env";
import { log } from "@/lib/log";
import { TimeoutError } from "@/lib/errors";

let groqClient: Groq | undefined;

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: getEnv().GROQ_API_KEY });
  }
  return groqClient;
}

export interface LlmCallOptions {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface LlmResponse {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number };
  latencyMs: number;
}

export async function callLlm(options: LlmCallOptions): Promise<LlmResponse> {
  const client = getGroqClient();
  const model = options.model ?? "qwen/qwen3.8-27b";
  const start = Date.now();

  const controller = new AbortController();
  const timeout = options.timeoutMs ?? 30_000;
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const completion = await client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: options.systemPrompt },
          { role: "user", content: options.userPrompt },
        ],
        temperature: options.temperature ?? 0.1,
        max_tokens: options.maxTokens ?? 4096,
        response_format: { type: "json_object" },
      },
      { signal: controller.signal }
    );

    const content = completion.choices[0]?.message?.content ?? "";
    const latencyMs = Date.now() - start;

    log.info("LLM call complete", { model, latencyMs });

    return {
      content,
      model,
      usage: {
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
      },
      latencyMs,
    };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new TimeoutError("llm-call", timeout);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
