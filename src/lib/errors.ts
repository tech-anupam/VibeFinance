export class PipelineError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "PipelineError";
    this.code = code;
  }
}

export class AgentError extends PipelineError {
  readonly agentName: string;
  readonly original: unknown;

  constructor(agentName: string, original: unknown) {
    const message = original instanceof Error ? original.message : String(original);
    super("AGENT_ERROR", `Agent "${agentName}" failed: ${message}`);
    this.name = "AgentError";
    this.agentName = agentName;
    this.original = original;
  }
}

export class SourceError extends PipelineError {
  readonly adapterId: string;
  readonly original: unknown;

  constructor(adapterId: string, original: unknown) {
    const message = original instanceof Error ? original.message : String(original);
    super("SOURCE_ERROR", `Source adapter "${adapterId}" failed: ${message}`);
    this.name = "SourceError";
    this.adapterId = adapterId;
    this.original = original;
  }
}

export class ValidationError extends PipelineError {
  readonly schemaName: string;
  readonly issues: ReadonlyArray<string>;

  constructor(schemaName: string, issues: ReadonlyArray<string>) {
    super("VALIDATION_ERROR", `Schema "${schemaName}" validation failed: ${issues.join("; ")}`);
    this.name = "ValidationError";
    this.schemaName = schemaName;
    this.issues = issues;
  }
}

export class TimeoutError extends PipelineError {
  readonly operation: string;
  readonly timeoutMs: number;

  constructor(operation: string, timeoutMs: number) {
    super("TIMEOUT_ERROR", `Operation "${operation}" timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }
}
