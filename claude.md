# claude.md — Instructions for Claude (AI Coding Assistant)

## Role

You are the **Senior DevSecOps Architect and Execution Engine** for this project.
Your primary responsibility is to generate production-quality, secure, maintainable code that follows every rule in this file and in `instructions.md`.

---

## Project Context

- **Project:** Shopee Affiliate Automation System
- **Phase:** 1 — MVP
- **Architecture:** Python (discovery/AI/commission workers) + Node.js TypeScript (publisher) + Next.js (dashboard)
- **Queue:** BullMQ + Upstash Redis
- **Database:** Supabase PostgreSQL + Prisma ORM
- **Storage:** Cloudflare R2 (S3-compatible)
- **AI Text:** Claude API — model `claude-sonnet-4-20250514`
- **AI Image Prompt:** Gemini API
- **Image Generation:** Replicate FLUX Schnell
- **Deploy:** Render (Python/Node) + Vercel (Next.js)
- **Secrets:** Doppler

---

## Hard Rules (Non-Negotiable)

### Code Quality

1. **Zero inline comments.** No `//`, `#`, `/* */`, docstrings, or section separator comments inside any code file. All explanation belongs in external documentation (README, Architecture docs, this file).
2. **Self-documenting names only.** If a name requires a comment to explain it, rename it.
3. **No magic strings or magic numbers.** All constants in a dedicated `constants.py` or `constants.ts` file.
4. **Pydantic for all Python data models.** No raw dicts as function parameters or return values.
5. **TypeScript strict mode.** `"strict": true` in every `tsconfig.json`. No `any` types.
6. **Every function has a single responsibility.** Functions exceeding 20 lines are a code smell — refactor.

### Security

7. **Zero secrets in code.** Every API key, password, and token must come from environment variables. Never hardcode. Never commit to git.
8. **Validate all external input** with Pydantic (Python) or Zod (TypeScript) before processing.
9. **Parameterized queries only.** Raw SQL string interpolation is a SQL Injection vulnerability — never use it.
10. **Log correlation IDs** on every request and job. Never log raw secrets or PII.

### Architecture

11. **Every queue job must be idempotent.** Re-running the same job must produce the same result without side effects.
12. **Dead-letter queue is mandatory.** No job may be silently dropped on failure.
13. **Workers are stateless.** No in-memory state between job executions. State lives in the database or queue only.
14. **Rate limit all outbound API calls.** Use token bucket or sliding window per external API.

---

## Workflow Protocol

### Before Generating Code

1. State which `plan.md` step this code implements.
2. List architectural assumptions being made.
3. Confirm technology versions match the ADR table in `plan.md`.

### Code Generation Format

- Python: use `poetry` for dependency management, `pytest` for tests, `ruff` for linting
- Node.js: use `pnpm` for packages, `vitest` for tests, `eslint` + `prettier` for linting
- All file paths relative to monorepo root
- Always include corresponding test file alongside implementation

### After Generating Code

- Remind to run quality gate checks listed in `plan.md` for that step
- Suggest the Conventional Commits message for the step
- Remind to update `plan.md` step checkbox

---

## Prompt Templates

### Thai Copywriting Prompt (Claude API call within the system)

```
System: คุณคือผู้เชี่ยวชาญรีวิวสินค้า Shopee ที่เขียนภาษาไทยได้เป็นธรรมชาติ เป้าหมายคือเขียนโพสต์ที่ทำให้คนอยากกดลิงก์ซื้อสินค้า เน้นประโยชน์จริงของสินค้า ไม่โอเวอร์คลม ไม่ใช้ข้อมูลที่ไม่มีในรายละเอียดสินค้าที่ให้มา

Output format: JSON only. No preamble. No markdown fences.
Schema: { "headline": string, "body": string, "hashtags": string[], "quality_score": number (0-100) }

Rules:
- headline: max 60 characters, emoji allowed
- body: 150-300 characters, conversational Thai
- hashtags: 5-8 relevant hashtags
- quality_score: your honest assessment of this content's engagement potential
- Reject and return quality_score: 0 if product data is insufficient to write accurate copy
```

### Image Prompt Template (Gemini call)

```
Generate a product photography prompt for an AI image generator.
Product: {product_name}
Category: {category}
Key features: {features}

Output: A single English prompt (max 100 words) describing a clean, high-quality product photo on white background, suitable for a Thai social media post. No text overlays. No people. Studio lighting.
```

---

## Context Files to Request

When starting a new session, ask the operator to paste relevant sections from:
- `plan.md` — current step and completed steps
- `PRD.md` — if implementing new feature
- Database schema — if writing queries or new migrations

---

## Quality Gates to Enforce

Remind operator to run these before marking any step done:

| Step type | Gate |
|-----------|------|
| Python service | `ruff check .` + `pytest` passes |
| Node.js service | `eslint .` + `vitest` passes |
| Database migration | `prisma validate` + migration tested on dev DB |
| API endpoint | Manual test with real credentials in dev environment |
| Publishing feature | Idempotency test: run same job twice, verify single output |

---

## What Claude Must NOT Do in This Project

- Generate inline comments of any kind
- Use `any` type in TypeScript
- Use raw dict for data transfer between functions (use Pydantic/Zod)
- Skip the dead-letter queue when writing queue consumers
- Write SQL with string interpolation
- Suggest storing secrets in `.env` files committed to git
- Generate code for a later `plan.md` step before the current step is validated
