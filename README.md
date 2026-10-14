# Tip Court

[![Hackathon: Wild Bugs 2026](https://img.shields.io/badge/Hackathon-Wild%20Bugs%202026-7c3aed?style=for-the-badge&logo=target)](https://github.com/tech-anupam/VibeFinance)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.1-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript 5.7](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.0-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Groq LPU](https://img.shields.io/badge/Groq-Fast%20Inference-f55036?style=for-the-badge&logo=lightning)](https://groq.com/)
[![Turso SQLite](https://img.shields.io/badge/Turso-libSQL-00eb8a?style=for-the-badge&logo=sqlite&logoColor=black)](https://turso.tech/)
[![Tavily Search](https://img.shields.io/badge/Tavily-Live%20Web%20AI-4f46e5?style=for-the-badge&logo=googlechrome&logoColor=white)](https://tavily.com/)
[![Vitest](https://img.shields.io/badge/Tests-31%20Passed-22c55e?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)

> Autonomous multi-agent financial intelligence platform turning market feeds, regulatory filings, and social chatter into evidence-backed, personalized verdicts for retail investors.

**Builder:** Anupam Jha | **Repository:** [tech-anupam/VibeFinance](https://github.com/tech-anupam/VibeFinance) | **Hackathon:** Wild Bugs 2026

---

## Problem

Retail investors are targeted with unsolicited stock tips across Telegram, WhatsApp, and social media:
- "Guaranteed 50% breakout in 2 weeks!"
- "Promoter accumulation secretly underway!"
- "Zero debt hidden multibagger, buy now!"

Hedge funds use Bloomberg terminals and dedicated research teams to verify claims. Retail investors lack the tools to parse 200-page regulatory filings, distinguish real growth from pump-and-dump operations, or evaluate portfolio risk before risking capital.

---

## Solution

Tip Court runs every stock tip or ticker query through a simulated adversarial trial before capital is committed:
- **5 parallel AI agents** cross-examine the stock across filings, live market metrics, and web sentiment.
- **Deterministic TypeScript analytics** calculate RSI, MACD, Volume Z-Score, and portfolio concentration (HHI). The LLM never computes math.
- **Deterministic arbiter** produces a final verdict with an exact trade execution plan.
- **Anti-hallucination verifier** drops uncited claims and replaces them with an "insufficient evidence" label.

| Verdict | Meaning | Recommended Action |
|---|---|---|
| **PROCEED** | Strong fundamentals, verified filings, positive momentum. | Safe to enter with recommended position sizing. |
| **REDUCE_SIZE** | Solid business, but high valuation or portfolio concentration. | Halve your allocation to protect downside. |
| **WAIT_48H** | High volatility or imminent event risk (earnings, policy). | Allow price action to settle for 2 days. |
| **AVOID** | False claims, high debt, red flags, or severe overbought signals. | Stay away and preserve your capital. |

---

## Interface

### Stock & Tip Input
Supports direct stock evaluation and social media tip verification. Features an intuitive currency switcher (INR, USD, EUR, GBP) and quick allocation presets.

![Stock Evaluation Input with Currency Switcher](docs/screenshots/stock-evaluation-input.png)

![Social Tip Verification Prompt](docs/screenshots/tip-verification-input.png)

### Price Feed Autocomplete
Live autocomplete search across NSE, BSE, NASDAQ, and NYSE equities with real-time price quotes, daily percentage changes, and 1-month SVG sparklines.

![Live Autocomplete Stock Select Menu with SVG Sparklines](docs/screenshots/stock-search-autocomplete.png)

### Existing Holdings Advice
Toggle to enter currently owned shares and average purchase price to receive personalized `HOLD`, `BOOK PROFITS`, `ACCUMULATE`, or `CUT LOSS` recommendations.

![Existing Holdings Guidance Toggle](docs/screenshots/holdings-advice-toggle.png)

### Courtroom Trial
Parallel specialized agents present opposing evidence. The Prosecutor argues the technical risk case, while the Defence highlights fundamental balance sheet resilience.

![Courtroom Trial: Prosecutor vs Defence](docs/screenshots/prosecutor-defence-trial.png)

### Conflict Resolution
Surfaces a Split Court alert whenever agents report high opposing confidence, displaying categorized bear, bull, and audit findings with verified citations.

![Evidence Analysis and Conflict Resolution](docs/screenshots/courtroom-evidence-clash.png)

### Evidence Stream
Every finding carries a verified citation link to audited BSE/NSE filings, Yahoo Finance live data, or Tavily web sentiment.

![Audited Evidence Stream and Source Citations](docs/screenshots/citations-evidence-stream.png)

### Risk Meter
Displays a 0 to 100 Regret Risk Score gauge, individual agent confidence levels, and a multi-axis risk shape radar chart.

![Regret Risk Gauge and Confidence Analysis](docs/screenshots/verdict-risk-meter.png)

### Report Export Toolbar
One-click export toolbar to download official trial reports as formatted Print/PDF documents, Excel CSV spreadsheets, or Markdown documentation.

![Court Analysis Report with Export Toolbar and Trade Execution Plan](docs/screenshots/verdict-trade-plan-export.png)

![CSV Report Download Confirmation](docs/screenshots/export-download-completed.png)

### Community Sentiment & Metrics
Aggregates real-time investor sentiment from Reddit, Stocktwits, and financial forums via Tavily, paired with a sub-5s runtime execution metrics strip.

![Live Community Discussions and Execution Metrics](docs/screenshots/community-discussions-metrics.png)

---

## Pipeline

```mermaid
flowchart TD
    A["User Input (Ticker or Tip)"] --> B["Claim Extractor Agent<br/>(qwen/qwen3.8-27b on Groq)"]

    B --> C["Data & Retrieval Layer"]
    C --> C1["Yahoo Finance<br/>(Live Quotes & Bars)"]
    C --> C2["BSE/NSE Filings<br/>(Audited Balance Sheets)"]
    C --> C3["Tavily Search<br/>(Reddit, X, Forums in 24h)"]
    C --> C4["TypeScript Analytics<br/>(RSI, MACD, Volume, HHI)"]

    C1 --> D["Parallel Courtroom Pool"]
    C2 --> D
    C3 --> D
    C4 --> D

    D --> E1["Forensic Auditor<br/>(Verifies claims against filings)"]
    D --> E2["Prosecutor<br/>(Technical & valuation bear case)"]
    D --> E3["Defence<br/>(Fundamental & momentum bull case)"]
    D --> E4["Behavioral Mirror<br/>(Flags emotional trader habits)"]
    D --> E5["Risk Analyst<br/>(Portfolio concentration & limits)"]

    E1 --> F["Verifier Loop<br/>(Drops uncited claims)"]
    E2 --> F
    E3 --> F
    E4 --> F
    E5 --> F

    F --> G["Deterministic Arbiter<br/>(Mathematical score from profile weights)"]

    G --> H["Final Verdict<br/>(PROCEED | REDUCE_SIZE | WAIT_48H | AVOID)"]
    H --> I["Trade Plan (Allocation, Target, Stop Loss)"]
    H --> J["Hold/Sell Advice for Existing Shares"]
    H --> K["Export Report (PDF, Excel CSV, Markdown)"]
```

---

## Core Features

- **Global Equities Autocomplete:** Live quotes and SVG sparklines across NSE, BSE, NASDAQ, and NYSE.
- **Multi-Currency Support:** Native INR (default), USD, EUR, and GBP support.
- **Actionable Trade Plan:** Suggested allocation, profit target price, stop-loss floor, and risk-to-reward ratio.
- **Existing Shareholder Guidance:** Personalized advice (`HOLD`, `BOOK PROFITS`, `ACCUMULATE`, `CUT LOSS`) based on user cost basis.
- **One-Click Export:** Download reports formatted for Print/PDF, Excel CSV, or Markdown documentation.

---

## Database Design

Tip Court uses Turso (libSQL) with Drizzle ORM to maintain an audit trail and personalize decisions:

1. **`profiles`:** Stores investor archetypes (Conservative, Aggressive, Panic-Seller) with individual risk thresholds and agent weights.
2. **`trades`:** Stores execution history to detect behavioral patterns (averaging down, panic selling, FOMO entries).
3. **`sessions`:** Full audit log of extracted claims, agent findings, citations, and arbiter scores.
4. **`filing_chunks`:** Pre-chunked annual reports and disclosures for sub-second BM25 retrieval.

---

## Documentation

| Guide | Badge | Topic |
|---|---|---|
| [System Architecture](https://github.com/tech-anupam/VibeFinance/blob/main/docs/ARCHITECTURE.md) | [![Architecture](https://img.shields.io/badge/Docs-System%20Architecture-2563eb?style=flat&logo=diagram-next&logoColor=white)](https://github.com/tech-anupam/VibeFinance/blob/main/docs/ARCHITECTURE.md) | Pipeline sequence, arbiter weighting formula, agent contracts, degraded modes. |
| [RAG & BM25](https://github.com/tech-anupam/VibeFinance/blob/main/docs/RAG.md) | [![RAG Pipeline](https://img.shields.io/badge/Docs-RAG%20%26%20BM25-059669?style=flat&logo=databricks&logoColor=white)](https://github.com/tech-anupam/VibeFinance/blob/main/docs/RAG.md) | Annual report chunking, Okapi BM25 ranking, anti-hallucination citation verification. |
| [Agent Extender & Skills](https://github.com/tech-anupam/VibeFinance/blob/main/docs/SKILLS.md) | [![Agent Skills](https://img.shields.io/badge/Docs-Agent%20Extender%20%26%20Skills-7c3aed?style=flat&logo=github&logoColor=white)](https://github.com/tech-anupam/VibeFinance/blob/main/docs/SKILLS.md) | GitHub skills loader, provenance checks via `SOURCE.md`, tool sandbox, BM25 selector. |
| [Data Provenance](https://github.com/tech-anupam/VibeFinance/blob/main/docs/DATA.md) | [![Data Provenance](https://img.shields.io/badge/Docs-Data%20Provenance-d97706?style=flat&logo=sqlite&logoColor=white)](https://github.com/tech-anupam/VibeFinance/blob/main/docs/DATA.md) | BSE/NSE filings, Yahoo Finance, Tavily recency filter, local cache fallback. |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=flat&logo=next.js&logoColor=white) | React 19 App Router and Server Components |
| **Language** | ![TypeScript](https://img.shields.io/badge/TypeScript%205.7-3178c6?style=flat&logo=typescript&logoColor=white) | Strict typing with zero `any` |
| **Styling** | ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS%20v4-06b6d4?style=flat&logo=tailwindcss&logoColor=white) | Mobile-first dark theme UI |
| **Inference** | ![Groq](https://img.shields.io/badge/Groq%20LPU-f55036?style=flat&logo=lightning&logoColor=white) | Fast JSON inference (`qwen/qwen3.8-27b`) |
| **Database** | ![Turso](https://img.shields.io/badge/Turso%20libSQL-00eb8a?style=flat&logo=sqlite&logoColor=black) | Edge SQLite database managed via Drizzle ORM |
| **Web Research** | ![Tavily](https://img.shields.io/badge/Tavily%20Search-4f46e5?style=flat&logo=googlechrome&logoColor=white) | Real-time social discourse from Reddit, X, and forums |
| **Market Feeds** | ![Yahoo Finance](https://img.shields.io/badge/Yahoo%20Finance-6001d2?style=flat&logo=yahoo&logoColor=white) | Live quotes and historical daily price bars |
| **Testing** | ![Vitest](https://img.shields.io/badge/Vitest%202.1-729b1b?style=flat&logo=vitest&logoColor=white) | 31 automated tests across math, indicators, skills, and RAG |

---

## Quickstart

### 1. Clone & Install
```bash
git clone https://github.com/tech-anupam/VibeFinance.git
cd VibeFinance
pnpm install
```

### 2. Configure Environment (`.env`)
```env
GROQ_API_KEY=your_groq_api_key
TURSO_DATABASE_URL=your_turso_db_url
TURSO_AUTH_TOKEN=your_turso_auth_token
TAVILY_API_KEY=your_tavily_api_key
```

### 3. Initialize Database
```bash
pnpm run seed
```

### 4. Start Development Server
```bash
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing

- `pnpm test` : Runs all 31 unit tests (technical indicators, HHI concentration, behavioral bias detector, BM25 retrieval, skills loader, trade planning).
- `pnpm run eval` : Runs 20 real-world benchmark scenarios and outputs verdict agreement rate, claim precision, and latency percentiles.
- `pnpm run build` : Compiles production Next.js build.

---

## License

MIT License. Developed for the Wild Bugs 2026 Hackathon by **Anupam Jha**.  
Repository: [github.com/tech-anupam/VibeFinance](https://github.com/tech-anupam/VibeFinance)
