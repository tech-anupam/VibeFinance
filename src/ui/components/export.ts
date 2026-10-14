import type { Verdict } from "@/schemas/verdict";
import type { Claim } from "@/schemas/claim";
import type { AgentResult } from "@/schemas/agent";
import type { Source } from "@/schemas/source";

interface ExportData {
  symbol: string;
  verdict: Verdict;
  claims: Claim[];
  agentResults: AgentResult[];
  sources: Source[];
  metrics: {
    totalLatencyMs: number;
    hhiBefore: number;
    hhiAfter: number;
  };
  tradePlan?: {
    recommendedAmount: number;
    targetPrice?: number;
    targetGainPct: number;
    stopLossPrice?: number;
    stopLossLossPct: number;
    riskRewardRatio: number;
    holdingAction?: string;
  };
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCsv(data: ExportData): void {
  const rows: string[][] = [
    ["VibeFinance - Tip Court Evaluation Report"],
    ["Stock Symbol", data.symbol],
    ["Generated At", new Date().toISOString()],
    ["Final Verdict", data.verdict.decision],
    ["Confidence", `${(data.verdict.confidence * 100).toFixed(0)}%`],
    ["Regret Risk Score", `${data.verdict.regretRiskScore}/100`],
    [],
    ["TRADE EXECUTION PLAN"],
    ["Recommended Sizing", String(data.tradePlan?.recommendedAmount ?? "N/A")],
    ["Estimated Target", data.tradePlan?.targetPrice ? String(data.tradePlan.targetPrice) : "N/A"],
    ["Stop Loss Floor", data.tradePlan?.stopLossPrice ? String(data.tradePlan.stopLossPrice) : "N/A"],
    ["Risk/Reward", `1 : ${data.tradePlan?.riskRewardRatio ?? "N/A"}`],
    ["Holding Advice", data.tradePlan?.holdingAction ?? "N/A"],
    [],
    ["AGENT FINDINGS & EVIDENCE"],
    ["Agent", "Status", "Finding", "Source IDs"],
  ];

  for (const agent of data.agentResults) {
    for (const f of agent.findings) {
      rows.push([agent.agent, agent.status, `"${f.text.replace(/"/g, '""')}"`, f.sourceIds.join("; ")]);
    }
  }

  rows.push([]);
  rows.push(["SOURCES & CITATIONS"]);
  rows.push(["Publisher", "Title", "Kind", "As Of", "URL"]);
  for (const s of data.sources) {
    rows.push([
      s.publisher,
      `"${s.title.replace(/"/g, '""')}"`,
      s.kind,
      s.asOf,
      s.url ?? "Internal Regulatory Corpus",
    ]);
  }

  const csvContent = rows.map((r) => r.join(",")).join("\n");
  downloadFile(csvContent, `${data.symbol}-court-report.csv`, "text/csv;charset=utf-8;");
}

export function exportToMarkdown(data: ExportData): void {
  const lines: string[] = [
    `# Tip Court Report: ${data.symbol}`,
    `*Generated on ${new Date().toLocaleString()}*`,
    "",
    `## Verdict: **${data.verdict.decision}**`,
    `- **Confidence:** ${(data.verdict.confidence * 100).toFixed(0)}%`,
    `- **Regret Risk:** ${data.verdict.regretRiskScore}/100`,
    `- **Analysis Latency:** ${(data.metrics.totalLatencyMs / 1000).toFixed(1)}s`,
    "",
    "## Trade Execution Plan",
    `- **Recommended Allocation:** ${data.tradePlan?.recommendedAmount.toLocaleString() ?? "N/A"}`,
    `- **Estimated Target:** +${data.tradePlan?.targetGainPct}% (${data.tradePlan?.targetPrice ?? "N/A"})`,
    `- **Stop Loss Floor:** -${data.tradePlan?.stopLossLossPct}% (${data.tradePlan?.stopLossPrice ?? "N/A"})`,
    `- **Risk/Reward Ratio:** 1 : ${data.tradePlan?.riskRewardRatio ?? "N/A"}`,
    ...(data.tradePlan?.holdingAction ? [`- **Holding Action:** ${data.tradePlan.holdingAction}`] : []),
    "",
    "## Key Rationale",
    ...data.verdict.rationale.map((r) => `- ${r.text}`),
    "",
    "## Courtroom Arguments",
  ];

  for (const agent of data.agentResults) {
    lines.push(`### ${agent.agent.toUpperCase()}`);
    for (const f of agent.findings) {
      lines.push(`- ${f.text}`);
    }
    lines.push("");
  }

  lines.push("## Sources & Verifiable Links");
  for (const s of data.sources) {
    if (s.url) {
      lines.push(`- [${s.publisher}: ${s.title}](${s.url}) (as of ${new Date(s.asOf).toLocaleDateString()})`);
    } else {
      lines.push(`- **${s.publisher}**: ${s.title} (${s.excerpt})`);
    }
  }

  lines.push("", "---", `*${data.verdict.disclaimer}*`);
  downloadFile(lines.join("\n"), `${data.symbol}-court-report.md`, "text/markdown;charset=utf-8;");
}

export function printReport(): void {
  window.print();
}
