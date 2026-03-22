# Vibe Coding & Vibe Engineering — Working Standard

วิธีการทำงานในโปรเจคนี้ทั้งหมด ทุกคนที่เข้ามาร่วม (มนุษย์หรือ AI) ต้องปฏิบัติตาม

---

## Philosophy

> "Move fast, but never break the audit trail."

เราใช้ AI ช่วย generate code เร็วขึ้น แต่ความเร็วนั้นต้องไม่ทำให้ Security หรือ Data Integrity พัง
ทุก step ต้อง validate ได้ ทุก change ต้อง traceable ได้

---

## Vibe Coding Flow

สำหรับการเขียนโค้ดแต่ละ feature:

```
1. PRD Reference
   └── อ่าน acceptance criteria ของ feature นั้นใน PRD.md ก่อนเขียนบรรทัดแรก

2. Step Identification
   └── ระบุว่า code นี้อยู่ใน Step ไหนของ plan.md

3. Prompt → Generate → Validate Loop
   └── ส่ง prompt ให้ Claude หรือ Gemini
   └── Review output ทุกบรรทัด — ห้าม merge blind
   └── Run quality gate ก่อน commit

4. One Thing at a Time
   └── ห้าม implement 2 feature พร้อมกันใน 1 PR
   └── ถ้า scope creep เกิดขึ้น → สร้าง task ใหม่ใน plan.md แทน

5. Commit Checkpoint
   └── Commit ทุกครั้งที่ step ผ่าน quality gate
   └── ใช้ Conventional Commits format เสมอ
```

---

## Vibe Engineering Flow

สำหรับ infrastructure, CI/CD, และ system-level changes:

```
1. Plan
   ├── เขียน intent ก่อนว่าจะทำอะไร (ใน plan.md หรือ PR description)
   ├── ระบุ risk ที่อาจเกิดขึ้น
   └── ระบุ rollback strategy

2. Orchestrate
   ├── ให้ Claude generate infrastructure code (Dockerfile, GitHub Actions, docker-compose)
   ├── Review ทุก config value — ไม่มีค่าอะไรที่ "trust by default"
   └── ทดสอบใน local environment ก่อน deploy staging

3. Verify
   ├── Run ใน staging environment ก่อน production เสมอ
   ├── ตรวจสอบ logs ว่าไม่มี error ที่ซ่อนอยู่
   └── ยืนยันว่า alert และ monitoring ทำงานถูกต้อง
```

---

## Mode Definitions

### Vibe Coding Mode

เราอยู่ใน Vibe Coding Mode เมื่อ:
- ส่ง high-level instruction เช่น "Let's build the Shopee API client"
- ต้องการ scaffold หรือ boilerplate
- ต้องการ generate infrastructure config

Claude ทำหน้าที่เป็น Execution Engine:
- Grasp intent ทันที ไม่ถามมาก
- Generate complete, working code
- State assumptions ก่อน generate ถ้า scope ambiguous ด้าน security

### Debugging Mode

เราอยู่ใน Debugging Mode เมื่อ:
- พิมพ์ "Help me fix this" หรือ paste error
- มี specific bug ที่ต้องแก้

Claude ทำหน้าที่เป็น Senior Reviewer:
- Focus ทีละ issue เดียว
- ขอ latest code ก่อนเสมอ
- ไม่กระโดดไป issue ถัดไปจนกว่า issue แรกจะ resolve

---

## Quality Gate Checklist

ก่อน mark step ว่า done ใน plan.md ต้องผ่านทุกข้อ:

```
□ Tests written and passing (pytest / vitest)
□ Lint clean (ruff / eslint)
□ Security audit clean (pip-audit / pnpm audit)
□ No secrets in code (grep -r "sk-" . returns nothing)
□ Idempotency tested (run same job twice, verify no side effects)
□ Dead-letter queue behavior tested (intentional failure captured)
□ Structured logs emitted with correlation_id
□ plan.md checkbox updated
□ Commit message follows Conventional Commits
```

---

## AI Agent Collaboration Pattern

```
┌─────────────────────────────────────────────────────┐
│                   Human Operator                     │
│         (Architecture decisions, Reviews)            │
└──────────────┬──────────────────┬───────────────────┘
               │                  │
               ▼                  ▼
    ┌──────────────────┐  ┌──────────────────┐
    │      Claude      │  │   Gemini CLI     │
    │  (Code, Arch,    │  │  (Image prompts, │
    │   Debugging)     │  │  Long-context)   │
    └──────────────────┘  └──────────────────┘
               │                  │
               └──────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  Python Workers  │
              │  Node Publisher  │
              └──────────────────┘
```

### Handoff Rules
- Claude → Python worker: structured JSON output stored in DB
- Gemini → Python worker: image prompt JSON validated before use
- Neither AI writes directly to queue or DB — always via application code
- Human reviews AI output that scores below quality threshold

---

## Session Start Protocol

ทุกครั้งที่เริ่ม session ใหม่กับ Claude หรือ Gemini:

1. Paste หัวข้อ Current Focus จาก `plan.md`
2. Paste relevant section จาก `instructions.md` ถ้าทำงานใน critical path
3. บอก mode: "Vibe Coding Mode" หรือ "Debugging Mode"
4. ถ้าแก้ bug: paste latest code version เสมอ

### Session End Protocol

1. Run quality gate checklist ข้างบน
2. Update `plan.md` checkbox
3. Commit ด้วย Conventional Commits message
4. Note anything unfinished ใน `plan.md` under "Current Focus"

---

## Prompt Reuse Templates (เก็บไว้ใช้ซ้ำ)

### Start a new step

```
We are in Vibe Coding Mode.
Current step: [Step X from plan.md]
Goal: [description]
Tech: [relevant tech from ADR]
Constraints: See instructions.md and claude.md.
Let's build it.
```

### Debug a specific error

```
We are in Debugging Mode.
Error: [paste error]
Context: [Step X, service name]
Here is the latest code: [paste code]
```

### Request a code review

```
Please review this code as a strict Senior DevSecOps reviewer.
Check for: OWASP issues, SOLID violations, missing idempotency, missing error handling.
Service: [name]
Code: [paste]
```

---

## Commit Message Reference

```
feat(shopee-client): add product discovery with commission filter
feat(queue): bullmq setup with dead-letter handler
feat(content-gen): claude api wrapper with quality gate
feat(content-gen): gemini image prompt generator
feat(content-gen): replicate flux image generation
feat(publisher): facebook graph api client with rate limiting
feat(publisher): idempotent post publishing with retry backoff
feat(commission): shopee commission sync worker
feat(commission): utm attribution mapping to post records
feat(dashboard): revenue summary cards
feat(dashboard): commission per product sortable table
feat(dashboard): pipeline health status panel
fix(publisher): 429 rate limit not triggering backoff
fix(discovery): duplicate products entering queue on restart
chore(ci): add pip-audit to python workflow
chore(ci): configure doppler github actions integration
docs: update plan.md step 3 complete
refactor(shopee-client): extract rate limiter to shared package
test(publisher): add idempotency integration test
```
