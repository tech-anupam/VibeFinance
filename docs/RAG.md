# Retrieval-Augmented Generation (RAG) Architecture

## Overview

In financial intelligence, hallucinations are dangerous. A generic language model might guess a company's debt or misremember promoter holding percentages. **Tip Court** solves this by implementing an end-to-end Retrieval-Augmented Generation (RAG) system grounded in audited regulatory documents and live market research.

No agent is permitted to make claims about corporate debt, promoter shareholding, or earnings without citing an exact retrieved document chunk.

---

## The 4-Stage RAG Pipeline

```
  +-------------------------------------------------------------+
  | 1. Document Ingestion & Chunking                            |
  |    - BSE / NSE Annual Reports & Regulatory Filings          |
  |    - Sentence-aware semantic windowing (chunkText)          |
  |    - Configurable chunk size (500 chars) + overlap (50 chars)|
  +-------------------------------------------------------------+
                               |
                               v
  +-------------------------------------------------------------+
  | 2. Hybrid Retrieval & Source Registration                   |
  |    - Local Corpus: data/filings.json                        |
  |    - Lexical Ranking: Deterministic BM25 (k1=1.5, b=0.75)    |
  |    - Live Web Fallback: Tavily API search (last 24 hours)   |
  +-------------------------------------------------------------+
                               |
                               v
  +-------------------------------------------------------------+
  | 3. Evidence Grounding & Agent Cross-Examination             |
  |    - Forensic Auditor compares extracted claims vs chunks   |
  |    - Matches: Supported, Contradicted, or Unverifiable      |
  |    - Tags each finding with exact chunk source ID           |
  +-------------------------------------------------------------+
                               |
                               v
  +-------------------------------------------------------------+
  | 4. Strict Citation Verifier Loop                            |
  |    - Validates source IDs against session SourceStore       |
  |    - Uncited or fabricated facts are instantly DROPPED      |
  |    - Marked as "insufficient evidence"                      |
  +-------------------------------------------------------------+
```

---

## Detailed Components

### 1. Document Chunking (`src/retrieval/chunker.ts`)
Financial disclosures contain precise sentences describing debt covenants, capital expenditure, and board resolutions. Naive character-count splitting often cuts critical figures in half (e.g. splitting `₹50,460 crore` into `₹50,` and `460 crore`).

The `chunkText()` function uses sentence-boundary regular expressions (`/(?<=[.!?])\s+/`) with a 50-character overlap window. This guarantees every numerical disclosure remains intact within its surrounding grammatical context.

### 2. Deterministic BM25 Ranking (`src/retrieval/bm25.ts`)
While vector embeddings are good for conversational chatbots, they frequently struggle with exact financial terms like `net debt`, `pledged shares`, and `promoter holding` because vector distance can blur numerical distinctions.

Tip Court implements the standard Okapi BM25 ranking algorithm:
$$\text{Score}(D, Q) = \sum_{t \in Q} \text{IDF}(t) \cdot \frac{f(t, D) \cdot (k_1 + 1)}{f(t, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}$$
Parameters:
- `k1 = 1.5` (controls term frequency saturation)
- `b = 0.75` (controls document length normalization)

This guarantees exact term matching on financial disclosures without embedding drift.

### 3. Source Registry & Multi-Tier Fallback (`src/sources/registry.ts`)
The source layer uses an extensible adapter pattern:
- **Tier 1 (Filing Corpus):** `filings-local-corpus` checks pre-indexed audited filings (`data/filings.json`) for instant sub-second verification.
- **Tier 2 (Tavily AI Search):** `web-tavily` executes live web searches across Reddit, X, investor forums, and news with a 24-hour recency filter.
- **Tier 3 (Degraded Graceful Fallback):** If filings are missing or unreachable, the Forensic Auditor marks claims as `unverifiable` with a `degraded` flag. The Arbiter is mathematically prevented from returning `PROCEED` when filings are absent.

### 4. Citation Store & Anti-Hallucination Verifier (`src/retrieval/cite.ts` & `src/core/verifier.ts`)
Every retrieved document is registered in a per-session `SourceStore` with an immutable ID (e.g. `filing-tcs-0`, `tavily-tcs-1`).

When an agent produces its findings:
1. The Verifier checks every `sourceId` in the finding against the `SourceStore`.
2. If an agent invents a citation or cites a non-existent document, the finding is dropped.
3. The finding text is replaced with `"Insufficient evidence: [reason]"`.
4. Retry logic re-prompts the offending agent once. If it fails again, it enters degraded mode.

---

## Why RAG Is Critical for Retail Investors

Without RAG, an AI model will happily hallucinate:
- *"Yes, company XYZ is debt free!"* (based on outdated 2021 training data).

With Tip Court's RAG:
- The system pulls the audited FY24 balance sheet and live news.
- Discovers the company recently took on ₹12,000 Cr in debt.
- The Prosecutor and Forensic Auditor present the exact filing snippet.
- The final verdict drops from `PROCEED` to `AVOID`, saving the retail investor from a costly trap.
