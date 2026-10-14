# VibeFinance: Tip Court

[![Hackathon: Wild Bugs 2026](https://img.shields.io/badge/Hackathon-Wild%20Bugs%202026-7c3aed?style=for-the-badge&logo=target)](https://github.com/tech-anupam/VibeFinance)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.1-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript 5.7](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.0-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Groq LPU](https://img.shields.io/badge/Groq-Fast%20Inference-f55036?style=for-the-badge&logo=lightning)](https://groq.com/)
[![Turso SQLite](https://img.shields.io/badge/Turso-libSQL-00eb8a?style=for-the-badge&logo=sqlite&logoColor=black)](https://turso.tech/)
[![Tavily Search](https://img.shields.io/badge/Tavily-Live%20Web%20AI-4f46e5?style=for-the-badge&logo=googlechrome&logoColor=white)](https://tavily.com/)
[![Vitest](https://img.shields.io/badge/Tests-31%20Passed-22c55e?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)

> Multi-agent autonomous financial intelligence platform turning raw market data, regulatory filings, and social chatter into evidence-backed, personalized verdicts for retail investors.

**Builder:** Anupam Jha | **Repository:** [tech-anupam/VibeFinance](https://github.com/tech-anupam/VibeFinance) | **Hackathon:** Wild Bugs 2026

---

## The Real Problem: Noise, Tips, and Retail Losses

Retail investors are flooded with unsolicited stock tips on Telegram groups, WhatsApp channels, and YouTube videos:
- *"Guaranteed 50% breakout in 2 weeks!"*
- *"Promoter accumulation secretly underway!"*
- *"Zero debt hidden multibagger, buy now!"*

Institutional hedge funds have Bloomberg terminals, data pipelines, and research teams to verify claims. Retail investors do not have the time to read 200-page annual filings or know whether a tip is a real opportunity or an orchestrated pump-and-dump trap.

---

## What Tip Court Delivers

**Tip Court** puts every stock query or social tip through a simulated trial before capital is put on the line.

Instead of relying on a single conversational chatbot, Tip Court executes **5 specialized AI agents in parallel**. They cross-examine the stock across audited filings, live market metrics, and real-time community discussions, delivering one clear verdict:

| Verdict | What It Means to You | Action |
|---|---|---|
| **PROCEED** | Strong fundamentals, verified filings, positive momentum. | Safe to enter with recommended position sizing. |
| **REDUCE_SIZE** | Solid business, but high valuation or portfolio concentration. | Halve your allocation to protect downside. |
| **WAIT_48H** | High volatility or imminent event risk (earnings, policy). | Allow price action to settle for 2 days. |
| **AVOID** | False claims, high debt, red flags, or severe overbought signals. | Stay away and preserve your capital. |

Every finding carries an exact clickable citation link (BSE/NSE filing, Yahoo live feed, or Tavily web search). Unverified claims are tagged as **insufficient evidence**.

---

## User Interface & Live Screenshots

### 1. Stock & Tip Input with Currency Switcher
Enter a direct stock query or paste raw social media tips from WhatsApp or Telegram. Select your currency (INR, USD, EUR, GBP), set planned allocation, or toggle existing shareholdings for hold/sell guidance.

![Stock and Tip Input Interface](docs/screenshots/tip-verification-input.png)

### 2. SVG Live Price Feed & Autocomplete Stock Select Menu
Search any stock across NSE, BSE, NASDAQ, or NYSE. View real-time quotes, percentage movements, and 1-month SVG sparklines directly inside the dropdown.

![Live Autocomplete Stock Select Menu with SVG Sparklines](docs/screenshots/stock-search-autocomplete.png)

### 3. The Courtroom Trial: Prosecutor vs Defence
Parallel specialized agents present opposing evidence. The Prosecutor argues the technical risk and valuation headwind case, while the Defence highlights fundamental balance sheet resilience and market momentum.

![Courtroom Trial: Prosecutor vs Defence](docs/screenshots/prosecutor-defence-trial.png)

### 4. Audited Evidence Stream & Source Citations
Every argument is backed by a verified, clickable citation link to audited BSE/NSE filings, Yahoo Finance market feeds, or real-time Tavily web discussions. Unsubstantiated claims are dropped.

![Audited Evidence Stream and Source Citations](docs/screenshots/citations-evidence-stream.png)

### 5. Evidence Analysis & Conflict Resolution
When agents disagree, Tip Court surfaces a **Split Court** alert card and lists verified arguments categorized by Bear Argument, Bull Argument, and Filing Audit.

![Evidence Analysis and Conflict Resolution](docs/screenshots/courtroom-evidence-clash.png)

### 6. Regret Risk Gauge, Confidence Bars & Radar Chart
Visual verdict summary featuring a 0 to 100 Regret Risk Score gauge, individual agent confidence meters, and a multi-axis risk shape radar chart.

![Regret Risk Gauge and Confidence Analysis](docs/screenshots/verdict-risk-meter.png)

---

## How It Works: Interactive Flowchart

```mermaid
flowchart TD
    A["👤 User Input<br/>(Stock Ticker or Copied Tip)"] --> B["🔍 Claim Extractor Agent<br/>(Extracts verifiable claims)"]

    B --> C["🌐 Live Data & RAG Layer"]
    C --> C1["📈 Yahoo Finance<br/>(Live Quote & Price Bars)"]
    C --> C2["📑 BSE/NSE Filings Corpus<br/>(Audited Balance Sheets)"]
    C --> C3["💬 Tavily Search<br/>(Reddit, X, Forums in 24h)"]
    C --> C4["🧮 TypeScript Math<br/>(RSI, MACD, Volume Z-Score, HHI)"]

    C1 --> D["⚡ Parallel Agent Trial"]
    C2 --> D
    C3 --> D
    C4 --> D

    D --> E1["🕵️ Forensic Auditor<br/>(Verifies claims against filings)"]
    D --> E2["📉 Prosecutor<br/>(Builds technical bear case)"]
    D --> E3["📈 Defence<br/>(Builds fundamental bull case)"]
    D --> E4["🧠 Behavioral Mirror<br/>(Flags emotional trader habits)"]
    D --> E5["🛡️ Risk Analyst<br/>(Evaluates portfolio concentration)"]

    E1 --> F["🔒 Verifier Loop<br/>(Drops uncited or fake facts)"]
    E2 --> F
    E3 --> F
    E4 --> F
    E5 --> F

    F --> G["⚖️ Deterministic Arbiter<br/>(Mathematical score from profile weights)"]

    G --> H["📋 Final User Verdict<br/>(PROCEED | REDUCE_SIZE | WAIT_48H | AVOID)"]
    H --> I["📊 Trade Plan (Entry, Target, Stop Loss)"]
    H --> J["🔄 Hold/Sell Advice for Existing Shares"]
    H --> K["💾 Export Report (PDF, Excel CSV, Markdown)"]
```

---

## Practical Features for Traders

- **Clean Stock Search:** Auto-complete search across all NSE, BSE, NASDAQ, and NYSE equities with real-time quotes and 1-month sparkline charts.
- **Smart Currency Support:** Native support for Indian Rupee (INR) by default, plus USD, EUR, and GBP with clean, compact amount inputs.
- **Trade Execution Plan:**
  - Suggested starting amount based on volatility.
  - Estimated profit target price and percentage.
  - Recommended stop-loss floor level.
  - Realistic Risk-to-Reward ratio (e.g. 1 : 2.4).
- **Hold or Sell Advice for Existing Shareholders:**
  - Toggle to input shares currently owned and average purchase price.
  - Receives tailored advice: `HOLD`, `BOOK PROFITS`, `ACCUMULATE`, or `CUT LOSS`.
- **Direct Report Exporting:**
  - **Print / PDF:** Clean, print-formatted executive summary.
  - **Excel (CSV):** Tabular data file containing verdict, scores, all agent findings, and source links.
  - **Doc (Markdown):** Complete markdown report ready for sharing.

---

## Why Database Is Used (In Plain English)

The PS04 Hackathon problem statement requires personalized investor profiling and persistent historical tracking:

1. **User Risk Profiles (`profiles` table):**
   Stores distinct investor archetypes (Conservative, Aggressive, Panic-Seller) with individual concentration thresholds (HHI limits) and agent weights.
2. **Behavioral History (`trades` table):**
   Persists past trade executions. The Behavioral Mirror agent scans this history to detect emotional flaws (averaging down on losers, panic selling on dips, FOMO buying).
3. **Audit Trail (`sessions` table):**
   Every trial run stores extracted claims, agent findings, citations, verifier retries, and the final score for regulatory compliance.
4. **Pre-Indexed Filings (`filing_chunks` table):**
   Stores pre-chunked annual reports and corporate announcement excerpts for sub-second retrieval augmented generation (RAG).

---

## Detailed Documentation

- [System Architecture & Agent Contracts](docs/ARCHITECTURE.md) : Detailed pipeline flow, arbiter weights, and verifier loop.
- [Retrieval-Augmented Generation (RAG) & BM25](docs/RAG.md) : Document chunking, Okapi BM25 ranking, and anti-hallucination citation verification.
- [Agent Extender & Modular Skills (GitHub Integration)](docs/SKILLS.md) : Dynamic BM25 skill selector, provenance enforcement via `SOURCE.md`, and zero-trust sandboxing.
- [Data Provenance & Source Disclosures](docs/DATA.md) : Data adapters, caching policies, and degraded mode behavior.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | ![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=flat&logo=next.js&logoColor=white) | React 19 App Router and Server Components |
| **Language** | ![TypeScript](https://img.shields.io/badge/TypeScript%205.7-3178c6?style=flat&logo=typescript&logoColor=white) | Strict typing with zero `any` |
| **Styling** | ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS%20v4-06b6d4?style=flat&logo=tailwindcss&logoColor=white) | Responsive mobile-first dark UI |
| **AI Inference** | ![Groq](https://img.shields.io/badge/Groq%20LPU-f55036?style=flat&logo=lightning&logoColor=white) | Ultra-fast JSON inference (`qwen/qwen3.8-27b`) |
| **Database** | ![Turso](https://img.shields.io/badge/Turso%20libSQL-00eb8a?style=flat&logo=sqlite&logoColor=black) | Edge SQLite database managed via Drizzle ORM |
| **Live Research** | ![Tavily](https://img.shields.io/badge/Tavily%20Search-4f46e5?style=flat&logo=googlechrome&logoColor=white) | Real-time social discourse from Reddit, X, and forums |
| **Market Feeds** | ![Yahoo Finance](https://img.shields.io/badge/Yahoo%20Finance-6001d2?style=flat&logo=yahoo&logoColor=white) | Live quotes and historical daily price bars |
| **Unit Testing** | ![Vitest](https://img.shields.io/badge/Vitest%202.1-729b1b?style=flat&logo=vitest&logoColor=white) | 31 automated tests across math, indicators, skills, and RAG |

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

## Verification & Testing

- `pnpm test` : Runs all 31 unit tests (technical indicators, HHI concentration, behavioral bias detector, BM25 retrieval, skills loader, trade planning).
- `pnpm run eval` : Runs 20 real-world benchmark scenarios and outputs verdict agreement rate, claim precision, and latency percentiles.
- `pnpm run build` : Compiles production Next.js build.

---

## License

MIT License. Developed for the Wild Bugs 2026 Hackathon by **Anupam Jha**.  
Repository: [github.com/tech-anupam/VibeFinance](https://github.com/tech-anupam/VibeFinance)
