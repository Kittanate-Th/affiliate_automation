# Shopee Affiliate Automation System

End-to-end AI-powered pipeline that discovers high-commission Shopee products, generates Thai-language content and product images, publishes to Facebook Groups on a schedule, and tracks commissions in a real-time dashboard.

---

## Architecture

```
Shopee API → Discovery Worker → Queue → AI Content Worker → Queue → Facebook Publisher
                                                                          ↓
                                                              Commission Sync ← Shopee API
                                                                          ↓
                                                                     Dashboard
```

Full architecture documentation: [docs/PRD.md](docs/PRD.md)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Product discovery | Python + httpx + APScheduler |
| AI text generation | Claude API (claude-sonnet-4-20250514) |
| AI image prompts | Gemini API (gemini-2.0-flash) |
| Image generation | Replicate FLUX Schnell |
| Queue | BullMQ + Upstash Redis |
| Database | Supabase PostgreSQL + Prisma |
| File storage | Cloudflare R2 |
| Publisher | Node.js TypeScript + Facebook Graph API |
| Dashboard | Next.js App Router + Tremor |
| Secrets | Doppler |
| CI/CD | GitHub Actions |
| Monitoring | Better Stack (Logtail) |

---

## Repository Structure

```
shopee-affiliate-bot/
├── apps/
│   ├── discovery/          Python — Shopee API poller + queue producer
│   ├── content-gen/        Python — Claude + Gemini + Replicate worker
│   ├── commission-sync/    Python — commission attribution worker
│   ├── publisher/          Node.js TypeScript — Facebook publisher
│   └── dashboard/          Next.js App Router — analytics dashboard
├── packages/
│   ├── shopee-client/      Python — Shopee Affiliate API wrapper
│   ├── ai-agents/          Python — Claude + Gemini + Replicate clients
│   └── db/                 Prisma schema + migrations
├── infrastructure/
│   ├── docker-compose.yml  Local development environment
│   └── .github/workflows/  CI/CD pipeline definitions
└── docs/
    ├── PRD.md              Product Requirements Document
    ├── plan.md             Roadmap and discrete steps
    ├── instructions.md     Project constitution (overrides everything)
    ├── claude.md           Rules for Claude AI assistant
    ├── gemini.md           Rules for Gemini CLI
    └── architecture/       Detailed service diagrams
```

---

## Prerequisites

- Python 3.12+
- Node.js 20+
- pnpm 9+
- Poetry 1.8+
- Docker Desktop (for local Redis)
- Doppler CLI

---

## Local Development Setup

### 1. Install Doppler CLI

```bash
brew install dopplerhq/cli/doppler
doppler login
doppler setup
```

### 2. Install dependencies

```bash
pnpm install
cd apps/discovery && poetry install
cd apps/content-gen && poetry install
cd apps/commission-sync && poetry install
```

### 3. Start local services

```bash
docker-compose up -d
```

Starts: PostgreSQL (port 5432), Redis (port 6379)

### 4. Run database migrations

```bash
cd packages/db
doppler run -- pnpm prisma migrate dev
doppler run -- pnpm prisma db seed
```

### 5. Run a specific service

```bash
doppler run -- python apps/discovery/main.py
doppler run -- pnpm --filter publisher dev
doppler run -- pnpm --filter dashboard dev
```

---

## Environment Variables

All secrets are managed by Doppler. Never create a `.env` file manually.

Required variables (configured in Doppler):

```
SHOPEE_AFFILIATE_APP_ID
SHOPEE_AFFILIATE_SECRET
ANTHROPIC_API_KEY
GEMINI_API_KEY
REPLICATE_API_TOKEN
FACEBOOK_ACCESS_TOKEN
FACEBOOK_GROUP_IDS          comma-separated list
UPSTASH_REDIS_URL
UPSTASH_REDIS_TOKEN
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CLOUDFLARE_R2_BUCKET
CLOUDFLARE_R2_ACCESS_KEY_ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY
CLOUDFLARE_R2_ENDPOINT
LOGTAIL_SOURCE_TOKEN
PIPELINE_ENABLED            true | false (kill switch)
CONTENT_QUALITY_THRESHOLD   0-100, default 65
MIN_COMMISSION_RATE         decimal, e.g. 0.05 for 5%
MIN_MONTHLY_SALES           integer, e.g. 1000
```

---

## Emergency Stop

To halt all job enqueueing immediately without stopping services:

```bash
doppler secrets set PIPELINE_ENABLED=false
```

All workers check this flag at the start of each processing cycle. Jobs already in-flight complete normally. New jobs stop being enqueued immediately.

To resume:

```bash
doppler secrets set PIPELINE_ENABLED=true
```

---

## Running Tests

```bash
# Python services
cd apps/discovery && doppler run -- pytest

# Node.js services
pnpm --filter publisher test
pnpm --filter dashboard test
```

---

## CI/CD

Every push to a feature branch runs:
- Lint (ruff for Python, eslint for Node.js)
- Unit tests
- Security audit (pip-audit, pnpm audit)

Merge to `main` additionally runs:
- Integration tests
- Deploy to Render (Python services)
- Deploy to Vercel (dashboard)

---

## Monitoring

Logs available in Better Stack (Logtail) dashboard.
All logs include `correlation_id`, `service_name`, `job_id`, and `timestamp`.

Alerts configured for:
- Dead-letter queue receives any job
- Queue depth > 100 jobs
- No products discovered in 12 hours
- Any service down > 5 minutes

---

## Documentation

| Document | Purpose |
|----------|---------|
| [PRD.md](docs/PRD.md) | Product requirements and success metrics |
| [plan.md](docs/plan.md) | Roadmap, current step, ADR table |
| [instructions.md](docs/instructions.md) | Project constitution — rules that override everything |
| [claude.md](docs/claude.md) | Instructions for Claude AI assistant |
| [gemini.md](docs/gemini.md) | Instructions for Gemini CLI |

---

## Contributing

1. Check `plan.md` for the current active step
2. Create branch: `feat/<step-number>-<description>`
3. Implement + write tests
4. Run quality gates listed in `plan.md` for that step
5. Open PR with Conventional Commits message
6. Update `plan.md` checkbox after merge
