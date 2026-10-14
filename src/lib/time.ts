export function now(): string {
  return new Date().toISOString();
}

export function elapsedMs(start: number): number {
  return Date.now() - start;
}

export function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}
