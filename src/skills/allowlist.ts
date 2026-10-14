export const agentToolAllowlist: Record<string, string[]> = {
  "claim-extractor": [],
  "forensic-auditor": ["search_corpus", "get_filings"],
  "prosecutor": ["get_quote", "get_history", "search_corpus"],
  "defence": ["get_quote", "get_history", "search_corpus"],
  "behavioral-mirror": [],
  "risk": ["get_quote"],
  "judge": [],
};

export const domainAllowlist: string[] = [
  "bseindia.com",
  "nseindia.com",
  "sebi.gov.in",
  "rbi.org.in",
  "economictimes.indiatimes.com",
  "moneycontrol.com",
  "business-standard.com",
  "livemint.com",
  "finance.yahoo.com",
];

export function isToolAllowed(agentName: string, toolName: string): boolean {
  const allowed = agentToolAllowlist[agentName];
  if (!allowed) return false;
  return allowed.includes(toolName);
}

export function isDomainAllowed(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return domainAllowlist.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}
