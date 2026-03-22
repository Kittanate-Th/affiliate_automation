# plan.md — Project Roadmap & Execution Tracker

## Project: Shopee Affiliate Automation System
## Status: 🟡 In Progress
## Phase: 1 — MVP

---

## Architecture Decision Record (ADR)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend language | Python (discovery, AI, commission) + Node.js/TypeScript (publisher) | Python = AI ecosystem (LangChain, httpx, Pydantic). Node.js = Facebook Graph SDK maturity |
| Queue | BullMQ + Upstash Redis | Free tier sufficient for MVP, BullMQ has excellent retry + dead-letter support |
| Database | Supabase PostgreSQL | Free 500MB, built-in REST API, Row Level Security, easy migration path |
| File storage | Cloudflare R2 | 10GB/month free, S3-compatible API, zero egress cost |
| AI text | Claude API (claude-sonnet-4-20250514) | Best Thai-language quality, structured JSON output |
| AI image prompt | Gemini API | Long-context, multimodal, free tier generous |
| Image generation | Replicate FLUX Schnell | $0.003/image, fastest open model, no waitlist |
| Dashboard | Next.js App Router + Tremor | Full control, real-time capable, TypeScript |
| Deploy | Render (Python services) + Vercel (Next.js) | Free tier covers MVP load |
| CI/CD | GitHub Actions | 2000 min/month free, matrix builds |
| Secrets | Doppler | Free tier, syncs to Render/Vercel/local |
| Monitoring | Better Stack (Logtail) | 1GB log free, structured log search |

---

## Discrete Steps (Vibe Coding Flow)

Each step = one PR + one commit. Validate before moving to next step.

### ✅ Step 0 — Foundation
- [x] Write PRD.md
- [x] Write plan.md
- [x] Write claude.md
- [x] Write gemini.md
- [x] Write README.md
- [x] Initialize monorepo (pnpm workspaces + Python poetry)
- [x] Set up GitHub repository with branch protection rules
- [x] Configure Doppler project for secrets
- [x] Set up GitHub Actions basic CI skeleton

**Commit:** `chore: initialize monorepo and documentation`

---

### ✅ Step 1 — Database Schema
- [x] Design and write Prisma schema (products, posts, commissions, pipeline_runs)
- [x] Run initial migration against Supabase dev
- [x] Write seed data for local development
- [x] Validate schema with DB diagram

**Quality Gate:** `prisma validate` passes. ERD reviewed.
**Commit:** `feat(db): initial schema — products, posts, commissions`

---

### 🔲 Step 2 — Shopee API Client (Python)
- [ ] Implement Shopee Affiliate API OAuth2 flow
- [ ] Implement `get_products()` with commission + sales filters
- [ ] Implement response model with Pydantic
- [ ] Write unit tests (pytest) with mocked API responses
- [ ] Test against sandbox API

**Quality Gate:** Unit tests pass. No API key in code. Rate limit respected.
**Commit:** `feat(shopee-client): product discovery with commission filter`

---

### 🔲 Step 3 — Queue Infrastructure
- [ ] Set up Upstash Redis instance
- [ ] Configure BullMQ in Node.js publisher service
- [ ] Configure bullmq-python in discovery service
- [ ] Define queue names as constants (no magic strings)
- [ ] Implement dead-letter queue handler
- [ ] Test job enqueue → consume → acknowledge cycle

**Quality Gate:** Dead-letter queue captures intentionally failed jobs.
**Commit:** `feat(queue): bullmq setup with dead-letter handler`

---

### 🔲 Step 4 — Product Discovery Worker (Python)
- [ ] Implement cron scheduler (APScheduler) every 6 hours
- [ ] Implement idempotency check (skip already-queued product_ids)
- [ ] Enqueue qualifying products to `product-discovery` queue
- [ ] Emit structured JSON logs with correlation ID
- [ ] Write integration test against real Shopee sandbox

**Quality Gate:** Running twice with same data enqueues zero duplicates.
**Commit:** `feat(discovery): scheduled product discovery worker`

---

### 🔲 Step 5 — AI Content Generation Worker (Python)
- [ ] Implement Claude API client wrapper
- [ ] Write Thai copywriting prompt template (stored in prompts.md)
- [ ] Implement Gemini API client for image prompt generation
- [ ] Implement Replicate client for FLUX image generation
- [ ] Upload generated image to Cloudflare R2
- [ ] Implement quality score gate (min score threshold configurable)
- [ ] Store content + image URL in `posts` table with status `draft`

**Quality Gate:** 5 manual test products generate quality-passing content.
**Commit:** `feat(content-gen): ai copywriting and image generation worker`

---

### 🔲 Step 6 — Facebook Publishing Service (Node.js)
- [ ] Implement Facebook Graph API client (TypeScript)
- [ ] Implement token bucket rate limiter (max 50 posts/day)
- [ ] Implement affiliate link builder with UTM parameters
- [ ] Implement idempotency: check if post already published before re-posting
- [ ] Implement exponential backoff retry (max 3 attempts)
- [ ] Update post status to `published` or `failed` after attempt

**Quality Gate:** Posting same job twice results in exactly one Facebook post.
**Commit:** `feat(publisher): facebook groups publisher with rate limiting`

---

### 🔲 Step 7 — Commission Sync Service (Python)
- [ ] Implement Shopee commission API polling (every 4 hours)
- [ ] Map transactions to posts via UTM source tracking
- [ ] Store with status: `pending | confirmed | paid`
- [ ] Handle edge case: commission with no matching post (orphan record)

**Quality Gate:** Orphan commissions logged as warnings, not silently dropped.
**Commit:** `feat(commission): shopee commission sync and attribution`

---

### 🔲 Step 8 — Dashboard (Next.js)
- [ ] Scaffold Next.js App Router project
- [ ] Implement Supabase client (server components)
- [ ] Revenue summary cards (pending/confirmed/paid)
- [ ] Commission per product table (sortable, filterable)
- [ ] Posts per day bar chart (Recharts)
- [ ] Pipeline health status panel
- [ ] Pipeline pause/resume toggle (calls API)

**Quality Gate:** Dashboard loads with seed data. All charts render correctly.
**Commit:** `feat(dashboard): commission tracking dashboard v1`

---

### 🔲 Step 9 — CI/CD & Deployment
- [ ] GitHub Actions: lint + test on every PR
- [ ] GitHub Actions: build + deploy to Render on merge to main
- [ ] GitHub Actions: deploy Next.js to Vercel on merge to main
- [ ] Set up Render cron jobs for discovery + commission sync
- [ ] Configure environment variables via Doppler → Render sync
- [ ] Write deployment runbook in docs/

**Quality Gate:** Full pipeline runs end-to-end in staging environment.
**Commit:** `chore(ci): github actions ci/cd pipeline`

---

### 🔲 Step 10 — Observability & Alerts
- [ ] Connect Better Stack (Logtail) to all services
- [ ] Set up alert: queue depth > 100 jobs
- [ ] Set up alert: dead-letter queue receives any job
- [ ] Set up alert: no products discovered in 12 hours
- [ ] Set up alert: publishing service down > 5 minutes

**Quality Gate:** Intentionally trigger each alert condition. Confirm notification received.
**Commit:** `chore(observability): structured logging and alerting`

---

## Current Focus

**Step 2 — Shopee API Client (Python)** (Step 0 and Step 1 completed, starting Python API client next)

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Shopee API ToS violation | Medium | Critical | Read ToS carefully, use official API only, respect rate limits |
| Facebook account ban | Medium | High | Post delay randomization, content variation, stay under limits |
| AI content quality failure | Low | Medium | Quality gate threshold, human review queue for edge cases |
| Upstash Redis free tier exceeded | Low | Low | Monitor daily commands, optimize cache TTL |
| Supabase free tier exceeded | Low | Medium | Monitor storage, archive old pipeline_runs monthly |
