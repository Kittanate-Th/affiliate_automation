# instructions.md — Project Constitution

**These rules override all other instructions, all AI suggestions, and all shortcuts.**
When in doubt, refer to this document first.

---

## 1. Security is Non-Negotiable

### Secrets Management
- Every API key, token, password, and webhook secret lives in **Doppler only**
- Local development uses `doppler run --` prefix for all commands
- `.env` files are gitignored at the monorepo root. A committed `.env` file triggers an immediate secret rotation
- GitHub Actions uses Doppler GitHub Actions integration — no secrets stored in GitHub Secrets UI

### Zero-Trust Principle
- Every service authenticates every request. No service trusts another service by default based on network location alone
- Supabase Row Level Security (RLS) enabled on all tables
- API endpoints return 401/403, never 500, for auth failures

### Dependency Security
- `pip-audit` runs in CI on every Python dependency change
- `pnpm audit` runs in CI on every Node.js dependency change
- No dependencies with known critical CVEs may be merged

---

## 2. Data Integrity is Sacred

### Idempotency Everywhere
- Every queue job carries a unique `job_id` derived from its input hash
- Database upserts use `ON CONFLICT DO NOTHING` or `ON CONFLICT DO UPDATE` — never blind inserts
- Publishing jobs check for existing post record before posting to Facebook

### Audit Trail
- The `pipeline_runs` table is append-only. No UPDATE or DELETE on this table
- Every commission transaction retains its raw API response in a `raw_payload` JSONB column
- All state transitions (draft → published, pending → confirmed) are logged with timestamps and actor

### Commission Attribution Accuracy
- A commission that cannot be attributed to a specific post is stored as an `orphan` record — never discarded
- UTM parameters are the source of truth for attribution. Format: `utm_source=shopee&utm_medium=affiliate&utm_campaign={post_id}`

---

## 3. Code Quality Standards

### No Inline Comments
All explanation lives in external documentation. Code expresses intent through naming.

### Test Coverage
- Unit tests written alongside implementation — never after
- Integration tests required for every external API integration
- No step in `plan.md` is marked done without tests passing

### Conventional Commits
All commit messages follow this format:
```
<type>(<scope>): <description>

type: feat | fix | chore | docs | refactor | test | ci
scope: db | shopee-client | content-gen | publisher | commission | dashboard | queue | ci
```

Examples:
```
feat(shopee-client): add commission rate filter with configurable threshold
fix(publisher): retry exponential backoff not applying to 429 responses
chore(ci): add pip-audit to python dependency check workflow
```

### Branch Naming
```
feat/<step-number>-<short-description>
fix/<issue-description>
chore/<task-description>
```

Examples: `feat/02-shopee-api-client`, `fix/publisher-retry-backoff`

---

## 4. Operational Rules

### Pipeline Kill Switch
- The environment variable `PIPELINE_ENABLED=false` must halt all job enqueueing immediately
- This check happens at the beginning of every worker's main loop
- Documented in README under "Emergency Stop"

### Rate Limit Contracts
Never exceed these limits. Violation risks platform account ban:

| Platform | Limit | Implementation |
|----------|-------|----------------|
| Shopee Affiliate API | 100 req/min | Token bucket in Python client |
| Facebook Graph API | 200 calls/hour/user | Token bucket in Node publisher |
| Claude API | 50 req/min (Tier 1) | Semaphore + queue backpressure |
| Replicate API | 10 concurrent | Concurrency limiter |

### Content Rules
- Never publish product specifications not present in Shopee API response
- Never claim discounts or prices not verified from API at time of content generation
- Content generation timestamp stored — if content is older than 24 hours before publishing, re-validate product data

---

## 5. Infrastructure Rules

### Free Tier Limits (Phase 1 Constraints)
Monitor these weekly. Exceeding them = immediate cost:

| Service | Free Limit | Alert Threshold |
|---------|-----------|-----------------|
| Supabase | 500MB DB, 2GB bandwidth | 400MB / 1.5GB |
| Upstash Redis | 10,000 commands/day | 8,000/day |
| Render | 750 hours/month | 600 hours |
| Cloudflare R2 | 10GB storage, 1M ops/month | 8GB / 800K ops |
| Replicate | Pay-per-use | Budget alert $10 |

### Deployment Constraints
- Production deployments only via GitHub Actions on merge to `main`
- No manual `git push` to production
- Every deployment must pass CI (lint + test) before deploy step runs

---

## 6. AI Agent Boundaries

### Claude's Scope
- Application code generation
- Architecture decisions
- Debugging and code review
- Documentation

### Gemini's Scope
- Image prompt generation
- Long-context document analysis
- Large codebase summarization

### Overlap Rule
If both Claude and Gemini could perform a task, Claude is the default choice.
Gemini is invoked explicitly only for its two designated tasks above.

### Human Override
Any AI-generated content scoring below quality threshold enters a human review queue.
No content publishes automatically without either passing the quality gate or receiving explicit human approval.

---

## 7. What is Never Acceptable

- Storing secrets in code, config files, or git history
- Posting duplicate content to any platform
- Publishing content with unverified product claims
- Disabling the dead-letter queue "temporarily"
- Merging code without tests
- Bypassing rate limits "just this once"
- Ignoring a failed pipeline_run without creating a fix task in plan.md
