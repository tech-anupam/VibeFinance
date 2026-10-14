"use client";

import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const COLORS = {
  accent: "#3b82f6",
  proceed: "#22c55e",
  reduce: "#eab308",
  wait: "#f97316",
  avoid: "#ef4444",
  degraded: "#a855f7",
  muted: "#71717a",
  surface: "#1c1c1f",
  text: "#e4e4e7",
};

const AGENT_COLORS: Record<string, string> = {
  "forensic-auditor": "#3b82f6",
  "prosecutor": "#ef4444",
  "defence": "#22c55e",
  "behavioral-mirror": "#a855f7",
  "risk": "#f97316",
  "claim-extractor": "#06b6d4",
};

interface AgentConfidence {
  agent: string;
  confidence: number;
  status: string;
}

export function AgentConfidenceChart({ data }: { data: AgentConfidence[] }) {
  const formatted = data.map((d) => ({
    name: friendlyAgentName(d.agent),
    confidence: Math.round(d.confidence * 100),
    fill: AGENT_COLORS[d.agent] ?? COLORS.muted,
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <BarChart data={formatted} layout="vertical" margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: COLORS.muted }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: COLORS.text }} axisLine={false} tickLine={false} width={90} />
          <Tooltip
            contentStyle={{ backgroundColor: COLORS.surface, border: "none", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: COLORS.text }}
            formatter={(value: unknown) => [`${Number(value ?? 0).toFixed(0)}%`, "Confidence"]}
          />
          <Bar dataKey="confidence" radius={[0, 6, 6, 0]} barSize={16}>
            {formatted.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface HoldingSlice {
  symbol: string;
  weightPct: number;
}

export function PortfolioPieChart({ holdings, title }: { holdings: HoldingSlice[]; title: string }) {
  const PIE_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ef4444", "#06b6d4", "#eab308", "#ec4899"];

  return (
    <div>
      <span className="text-[11px] text-text-muted">{title}</span>
      <div className="h-36 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={holdings}
              dataKey="weightPct"
              nameKey="symbol"
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={55}
              paddingAngle={2}
              stroke="none"
            >
              {holdings.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: COLORS.surface, border: "none", borderRadius: 8, fontSize: 11 }}
              formatter={(value: unknown) => [`${Number(value ?? 0).toFixed(1)}%`, "Weight"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {holdings.map((h, i) => (
          <span key={h.symbol} className="flex items-center gap-1 text-[10px] text-text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
            {h.symbol} {h.weightPct.toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  );
}

interface RadarDataPoint {
  subject: string;
  value: number;
}

export function RiskRadarChart({ data }: { data: RadarDataPoint[] }) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#2a2a2e" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: COLORS.text }} />
          <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
          <Radar dataKey="value" stroke={COLORS.accent} fill={COLORS.accent} fillOpacity={0.25} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RegretGauge({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct > 70 ? COLORS.avoid : pct > 40 ? COLORS.wait : COLORS.proceed;
  const label = pct > 70 ? "High risk of regret" : pct > 40 ? "Some risk" : "Low risk";
  const rotation = (pct / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 70" className="w-36">
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#2a2a2e" strokeWidth="8" strokeLinecap="round" />
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${pct * 1.57} 157`} />
        <line x1="60" y1="60" x2="60" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round"
          transform={`rotate(${rotation}, 60, 60)`} />
        <circle cx="60" cy="60" r="4" fill={color} />
      </svg>
      <span className="font-mono text-lg font-bold" style={{ color }}>{score}</span>
      <span className="text-[11px] text-text-muted">{label}</span>
    </div>
  );
}

export function friendlyAgentName(agent: string): string {
  const map: Record<string, string> = {
    "claim-extractor": "Claims",
    "forensic-auditor": "Filing Check",
    "prosecutor": "Bear Case",
    "defence": "Bull Case",
    "behavioral-mirror": "Your Patterns",
    "risk": "Position Risk",
  };
  return map[agent] ?? agent;
}

export function friendlyVerdict(decision: string): { title: string; subtitle: string; emoji: string } {
  const map: Record<string, { title: string; subtitle: string; emoji: string }> = {
    PROCEED: {
      title: "Looks good to enter",
      subtitle: "The evidence supports this trade, but always do your own research",
      emoji: "",
    },
    REDUCE_SIZE: {
      title: "Maybe, but go smaller",
      subtitle: "There are some concerns. Consider investing a smaller amount",
      emoji: "",
    },
    WAIT_48H: {
      title: "Hold on, wait a bit",
      subtitle: "Not enough clarity right now. Let the dust settle before deciding",
      emoji: "",
    },
    AVOID: {
      title: "Stay away for now",
      subtitle: "The evidence raises serious red flags. Protecting capital matters more",
      emoji: "",
    },
  };
  return map[decision] ?? { title: decision, subtitle: "", emoji: "" };
}

export function friendlyFinding(text: string): string {
  return text
    .replace(/^Claim "/g, '"')
    .replace(/contradicted/gi, "does not match the filings")
    .replace(/unverifiable/gi, "could not be checked")
    .replace(/supported/gi, "checks out")
    .replace(/Insufficient evidence:/gi, "Not enough data:")
    .replace(/\[forensic-auditor\]/gi, "[Filing Check]")
    .replace(/\[prosecutor\]/gi, "[Bear Case]")
    .replace(/\[defence\]/gi, "[Bull Case]")
    .replace(/\[behavioral-mirror\]/gi, "[Your Patterns]")
    .replace(/\[risk\]/gi, "[Position Risk]")
    .replace(/\[claim-extractor\]/gi, "[Claims]");
}
