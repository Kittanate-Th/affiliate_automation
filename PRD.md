# Product Requirements Document — Shopee Affiliate Automation System

## Overview

An end-to-end AI-powered automation pipeline that discovers high-commission Shopee products, generates compelling Thai-language content and product images, publishes to social channels on a schedule, and provides a real-time dashboard for commission tracking and revenue analytics.

## Problem Statement

Manual Shopee affiliate marketing requires constant human effort: finding products, writing copy, creating visuals, posting to groups, and tracking results. This system eliminates all manual steps, enabling passive income at scale with zero daily operational overhead.

## Goals

- Automate 100% of the product-discovery-to-publish pipeline
- Maintain content quality above human baseline via AI quality gates
- Track commission attribution accurately with full audit trail
- Enable horizontal scaling without code changes

## Non-Goals (Phase 1)

- Multi-language content (Thai only in Phase 1)
- Channels beyond Facebook Groups
- Paid ad management
- Influencer network integration

---

## User Stories

### Operator (the system owner)

| ID | As an operator I want to... | So that... | Priority |
|----|---------------------------|------------|----------|
| US-01 | Set minimum commission rate threshold | Only profitable products enter the pipeline | P0 |
| US-02 | Set minimum monthly sales volume | Content is generated only for proven bestsellers | P0 |
| US-03 | Define posting schedule per channel | Posts go out at peak engagement times | P0 |
| US-04 | See a dashboard of earned commissions by product | I know which products drive revenue | P0 |
| US-05 | Receive an alert when a post fails | I can intervene before revenue is lost | P1 |
| US-06 | Review AI-generated content before it publishes | I catch quality issues before they reach audiences | P1 |
| US-07 | Pause the entire pipeline with one toggle | I can stop operations immediately if ToS issues arise | P0 |
| US-08 | See total revenue, pending, and confirmed commissions | I have accurate financial visibility | P0 |

---

## Functional Requirements

### FR-1: Product Discovery Service (Python)

- Poll Shopee Affiliate API every 6 hours
- Filter products: `commission_rate >= configurable_threshold` AND `monthly_sold >= configurable_threshold`
- Deduplicate against already-processed products (idempotency via product_id hash)
- Enqueue qualifying products to `product-discovery` BullMQ queue
- Store raw API response in PostgreSQL for audit

### FR-2: AI Content Generation Service (Python)

- Consume jobs from `product-discovery` queue
- Generate Thai-language post copy via Claude API (claude-sonnet-4-20250514 model)
- Generate image generation prompt via Gemini API
- Generate product image via Replicate FLUX Schnell
- Apply quality score gate: reject content scoring below threshold
- Store generated content + image URL in PostgreSQL
- Enqueue approved content to `publishing` queue

### FR-3: Publishing Service (Node.js / TypeScript)

- Consume jobs from `publishing` queue
- Post to Facebook Groups via Graph API
- Enforce per-platform rate limits (token bucket algorithm)
- Generate affiliate link with UTM parameters before each post
- Store post record with `status: pending | published | failed`
- Retry failed posts up to 3 times with exponential backoff
- Send to dead-letter queue after max retries

### FR-4: Commission Tracking Service (Python)

- Sync commission data from Shopee Affiliate API every 4 hours
- Map commission transactions to post records via UTM tracking
- Store with status: `pending | confirmed | paid`
- Expose REST endpoints consumed by dashboard

### FR-5: Dashboard (Next.js App Router)

- Total revenue: pending + confirmed + paid breakdown
- Commission per product (sortable table)
- Posts published per day (bar chart)
- Conversion rate per product (clicks / commissions)
- Pipeline health: queue depth, worker status, last run timestamp
- Manual override: pause pipeline, re-queue failed jobs

---

## Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Security** | All API keys in environment variables only. Zero secrets in code or git history. |
| **Reliability** | Dead-letter queue captures 100% of failed jobs. No job is silently dropped. |
| **Idempotency** | Re-running any pipeline stage for the same input must produce the same output without side effects. |
| **Observability** | Every pipeline run logged with correlation ID. All queue events emit structured JSON logs. |
| **Rate Limiting** | All outbound API calls rate-limited. No platform ToS violations due to burst traffic. |
| **Data Retention** | All generated content and commission data retained minimum 2 years. |
| **Scalability** | Workers are stateless and horizontally scalable. Queue is the only shared state. |

---

## Constraints

- Budget: Free-tier infrastructure for MVP (Supabase, Upstash Redis, Render, Cloudflare R2)
- Shopee Affiliate API Terms of Service must be respected at all times
- Facebook Graph API Terms: no automation that simulates human interaction patterns deceptively
- Content must be factually accurate — no hallucinated product specifications

---

## Success Metrics (Phase 1 — 90 days)

| Metric | Target |
|--------|--------|
| Products processed per day | ≥ 20 |
| Content quality gate pass rate | ≥ 85% |
| Posts published per day | ≥ 10 |
| Pipeline uptime | ≥ 99% |
| Commission tracking accuracy | 100% (zero unattributed transactions) |
| Time-to-publish (product found → post live) | ≤ 30 minutes |

---

## Phases

### Phase 1 — MVP (Current)
Product discovery → AI content → Facebook Groups → Commission dashboard

### Phase 2 — Scale
LINE OA + TikTok channels, content variation engine, A/B testing per channel

### Phase 3 — Intelligence
Predictive commission scoring, auto-budget allocation, multi-account rotation management
