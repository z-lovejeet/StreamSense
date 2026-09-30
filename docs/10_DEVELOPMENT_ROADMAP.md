# StreamSense — Development Roadmap (DOC 10)

> **Document ID:** DOC-10
> **Version:** 1.0
> **Last Updated:** September 29, 2026
> **Depends On:** ALL previous documents (DOC 01-09)
> **Deadline:** September 30, 2026

---

## Table of Contents

1. [Timeline Overview](#1-timeline-overview)
2. [Phase 0: Project Setup](#2-phase-0-project-setup)
3. [Phase 1: Data Layer](#3-phase-1-data-layer)
4. [Phase 2: AI Pipeline](#4-phase-2-ai-pipeline)
5. [Phase 3: Backend API](#5-phase-3-backend-api)
6. [Phase 4: Volunteer Panel](#6-phase-4-volunteer-panel)
7. [Phase 5: Researcher Panel](#7-phase-5-researcher-panel)
8. [Phase 6: Integration & Polish](#8-phase-6-integration--polish)
9. [Phase 7: Demo Production](#9-phase-7-demo-production)
10. [Parallel Workstream Map](#10-parallel-workstream-map)
11. [Risk Buffers & Cut Protocol](#11-risk-buffers--cut-protocol)
12. [Phase Exit Criteria](#12-phase-exit-criteria)

---

## 1. Timeline Overview

```
PHASE 0: Setup           ██░░░░░░░░░░░░░░░░░░  (~2 hours)
PHASE 1: Data Layer      ████░░░░░░░░░░░░░░░░  (~3 hours)
PHASE 2: AI Pipeline     ████████░░░░░░░░░░░░  (~6 hours)
PHASE 3: Backend API     ██████████░░░░░░░░░░  (~5 hours)
PHASE 4: Volunteer UI    ████████████░░░░░░░░  (~6 hours)
PHASE 5: Researcher UI   ██████████████░░░░░░  (~6 hours)
PHASE 6: Integration     ████████████████░░░░  (~4 hours)
PHASE 7: Demo            ██████████████████░░  (~3 hours)
                                              
TOTAL: ~35 hours of dev work
```

### Build Strategy

We use AI coding agents (Antigravity + Claude + Gemini) to build each phase. The strategy:

1. **Each phase has explicit deliverables** — no ambiguity about what "done" means
2. **Phases are sequential** — each phase builds on the previous
3. **Within phases, tasks can be parallel** — AI agents can work on independent files simultaneously
4. **Quality gates** — each phase must pass verification before moving to next
5. **Cut list ready** — if behind schedule, we know exactly what to skip

---

## 2. Phase 0: Project Setup

**Duration:** ~2 hours
**Goal:** Both projects scaffolded, dependencies installed, environment configured, database accessible.

### Tasks

| # | Task | Command/Action | Deliverable |
|---|------|---------------|-------------|
| 0.1 | Create project root | `mkdir -p OneAquaHealth/{frontend,backend,docs}` | Directory structure exists |
| 0.2 | Initialize Next.js frontend | `cd frontend && pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir` | `frontend/` with Next.js App Router |
| 0.3 | Install frontend dependencies | `pnpm add @supabase/supabase-js @supabase/ssr framer-motion leaflet react-leaflet recharts react-hook-form @hookform/resolvers zod lucide-react date-fns clsx tailwind-merge class-variance-authority sonner` | All packages in package.json |
| 0.4 | Install frontend dev dependencies | `pnpm add -D @types/leaflet prettier prettier-plugin-tailwindcss tailwindcss-animate` | Dev deps installed |
| 0.5 | Initialize shadcn/ui | `pnpm dlx shadcn-ui@latest init` → select style, base color etc. Then add components: `pnpm dlx shadcn-ui@latest add button card input label select tabs badge table skeleton dialog dropdown-menu toast tooltip sheet avatar` | shadcn components in `src/components/ui/` |
| 0.6 | Apply Tailwind config | Copy design tokens from DOC-09 into `tailwind.config.ts` | Custom colors, fonts, shadows active |
| 0.7 | Set up Google Fonts | Add Inter + DM Serif Display + JetBrains Mono in `layout.tsx` | Fonts loading |
| 0.8 | Initialize Python backend | `cd backend && uv init && uv add fastapi uvicorn pydantic sqlalchemy asyncpg alembic python-multipart python-jose passlib httpx pillow pybioclip google-genai groq fhir-resources supabase python-dotenv` | `backend/` with deps |
| 0.9 | Create `.env` files | Create `frontend/.env.local` and `backend/.env` from DOC-07 templates | Environment vars configured |
| 0.10 | Verify Supabase connection | Run verification script from DOC-07 | All APIs responding |
| 0.11 | Create directory structure | Create all directories from DOC-03 file tree | Organized project structure |
| 0.12 | Initialize Git | `git init && git add . && git commit -m "Phase 0: Project setup"` | Initial commit |

### Phase 0 Exit Criteria
- [ ] `cd frontend && pnpm dev` → Next.js running on localhost:3000
- [ ] `cd backend && uvicorn app.main:app --reload` → FastAPI running on localhost:8000
- [ ] FastAPI `/docs` shows Swagger UI
- [ ] Supabase dashboard shows project active
- [ ] All API keys verified (run DOC-07 verification script)
- [ ] Git repository initialized with first commit

---

## 3. Phase 1: Data Layer

**Duration:** ~3 hours
**Goal:** Database tables created, ORM models working, seed data loaded, storage bucket functional.

### Tasks

| # | Task | Details | Deliverable |
|---|------|---------|-------------|
| 1.1 | Create SQLAlchemy models | Copy ORM models from DOC-06 Section 8 | `backend/app/models/*.py` |
| 1.2 | Create database.py | Async engine + session factory using asyncpg | `backend/app/database.py` |
| 1.3 | Create config.py | Pydantic Settings class loading all env vars | `backend/app/config.py` |
| 1.4 | Initialize Alembic | `alembic init migrations` → configure for async | `backend/migrations/` |
| 1.5 | Generate initial migration | `alembic revision --autogenerate -m "initial"` | Migration file created |
| 1.6 | Run migration | `alembic upgrade head` | Tables created in Supabase |
| 1.7 | Create Pydantic schemas | Request/response schemas for all endpoints | `backend/app/schemas/*.py` |
| 1.8 | Create seed data files | Species reference JSON from DOC-06 Section 6 | `backend/seed/species_reference.json` |
| 1.9 | Create seed script | Script to load species_reference + demo researcher | `backend/seed/run_seed.py` |
| 1.10 | Run seed | Execute seed script | 15 species + 1 researcher in DB |
| 1.11 | Create storage service | Upload/download from Supabase Storage | `backend/app/services/storage_service.py` |
| 1.12 | Test storage | Upload a test image, verify URL is public | Image accessible via URL |

### Phase 1 Exit Criteria
- [ ] All 7 tables exist in Supabase (check via SQL editor)
- [ ] 15 species reference records loaded
- [ ] Demo researcher account exists
- [ ] Test image uploads to `observations` bucket and is publicly accessible
- [ ] `git commit -m "Phase 1: Data layer complete"`

---

## 4. Phase 2: AI Pipeline

**Duration:** ~6 hours (largest phase)
**Goal:** All 7 AI agents implemented and individually tested.

### Tasks

| # | Task | Details | Deliverable |
|---|------|---------|-------------|
| 2.1 | Create Agent 1: Vision | BioCLIP implementation from DOC-05 Section 3 | `backend/app/agents/vision.py` |
| 2.2 | Test Agent 1 | Run with a test mayfly image → verify species predictions | Test passes |
| 2.3 | Create prompt files | All system prompts from DOC-05 | `backend/app/agents/prompts/*.py` |
| 2.4 | Create Agent 2: Description | Groq implementation from DOC-05 Section 4 | `backend/app/agents/description.py` |
| 2.5 | Test Agent 2 | Run with sample description text → verify structured JSON output | Test passes |
| 2.6 | Create Agent 3: Metadata | Groq + GBIF + Weather from DOC-05 Section 5 | `backend/app/agents/metadata.py` |
| 2.7 | Create geocoding utils | Reverse geocoding + water body detection | `backend/app/utils/geocoding.py` |
| 2.8 | Test Agent 3 | Run with Coimbra GPS → verify validation output | Test passes |
| 2.9 | Create Agent 4: Quality | Gemini scorer from DOC-05 Section 6 | `backend/app/agents/quality.py` |
| 2.10 | Create deterministic fallback | Rule-based scorer from DOC-05 Section 6.4 | Fallback function in quality.py |
| 2.11 | Test Agent 4 | Run with mock agent outputs → verify score + routing | Test passes |
| 2.12 | Create Agent 5: FHIR | Gemini translator from DOC-05 Section 7 + DOC-08 | `backend/app/agents/fhir_translator.py` |
| 2.13 | Create FHIR service | Validation + sandbox POST from DOC-08 Section 7 | `backend/app/services/fhir_service.py` |
| 2.14 | Test Agent 5 | Generate FHIR resource → validate with fhir.resources | Validation passes |
| 2.15 | Create Agent 6: Impact | Groq impact generator from DOC-05 Section 8 | `backend/app/agents/impact.py` |
| 2.16 | Test Agent 6 | Generate impact receipt → verify plain-language output | Test passes |
| 2.17 | Create Agent 7: Expert Brief | Gemini brief generator from DOC-05 Section 9 | `backend/app/agents/expert_brief.py` |
| 2.18 | Test Agent 7 | Generate expert brief → verify concerns list | Test passes |
| 2.19 | Create Orchestrator | Full pipeline coordinator from DOC-05 Section 10 | `backend/app/agents/orchestrator.py` |
| 2.20 | Create DipteraCAST mock | Mock endpoint from DOC-04 | `backend/app/services/dipteracast_mock.py` |
| 2.21 | Integration test | Run full pipeline with test image → verify all agents complete | End-to-end test passes |

### Phase 2 Exit Criteria
- [ ] Each agent runs independently without errors
- [ ] Full orchestrator pipeline completes in <10 seconds
- [ ] High-confidence path: Agents 1-4 → 5+6 (FHIR + Impact)
- [ ] Low-confidence path: Agents 1-4 → 7+6 (Brief + Impact)
- [ ] Fallback scoring works when Gemini is simulated as down
- [ ] FHIR resource validates via fhir.resources
- [ ] `git commit -m "Phase 2: AI pipeline complete"`

---

## 5. Phase 3: Backend API

**Duration:** ~5 hours
**Goal:** All REST endpoints working, auth middleware active, SSE streaming functional.

### Tasks

| # | Task | Details | Deliverable |
|---|------|---------|-------------|
| 3.1 | Create FastAPI app entry | App factory with CORS, middleware | `backend/app/main.py` |
| 3.2 | Create auth middleware | JWT validation, role extraction | `backend/app/middleware/auth.py` |
| 3.3 | Create auth endpoints | POST /register, POST /login, GET /me | `backend/app/api/auth.py` |
| 3.4 | Test auth | Register → login → verify JWT → access protected route | Auth flow works |
| 3.5 | Create observation service | Business logic for observations | `backend/app/services/observation_service.py` |
| 3.6 | Create observation endpoints | POST /observations, GET /observations, GET /observations/:id | `backend/app/api/observations.py` |
| 3.7 | Create SSE endpoint | GET /observations/:id/stream for real-time pipeline updates | SSE streaming works |
| 3.8 | Create review service | Business logic for expert reviews | `backend/app/services/review_service.py` |
| 3.9 | Create review endpoints | GET /review/queue, POST /review/:id/action | `backend/app/api/review.py` |
| 3.10 | Create validated endpoints | GET /validated, GET /validated/map | `backend/app/api/validated.py` |
| 3.11 | Create analytics endpoints | GET /analytics/summary, /timeline, /species | `backend/app/api/analytics.py` |
| 3.12 | Create FHIR endpoints | GET /fhir/resources, POST /fhir/export | `backend/app/api/fhir.py` |
| 3.13 | Create main router | Aggregate all routers with /api/v1 prefix | `backend/app/api/router.py` |
| 3.14 | Test all endpoints | Use Swagger UI to test each endpoint | All endpoints return expected responses |

### Phase 3 Exit Criteria
- [ ] `POST /observations` accepts image_url + description + GPS → triggers pipeline → returns observation
- [ ] `GET /observations/:id/stream` returns SSE events as pipeline runs
- [ ] `GET /review/queue` returns only pending_review observations
- [ ] `POST /review/:id/action` with "confirm" → triggers FHIR flow
- [ ] Auth protects all endpoints (401 without token, 403 wrong role)
- [ ] Swagger UI at `/docs` shows all endpoints
- [ ] `git commit -m "Phase 3: Backend API complete"`

---

## 6. Phase 4: Volunteer Panel

**Duration:** ~6 hours
**Goal:** Complete volunteer-facing UI — register, submit, see AI feedback, view history.

### Tasks

| # | Task | Details | Deliverable |
|---|------|---------|-------------|
| 4.1 | Create root layout | Global providers, fonts, Toaster | `src/app/layout.tsx` |
| 4.2 | Create Supabase client utils | Browser + server clients | `src/lib/supabase/client.ts`, `server.ts` |
| 4.3 | Create API client | Backend API wrapper with auth | `src/lib/api.ts` |
| 4.4 | Create TypeScript types | Observation, User, AIResult, etc. | `src/types/*.ts` |
| 4.5 | Create auth pages | Login + Register with React Hook Form + Zod | `src/app/(auth)/login/page.tsx`, `register/page.tsx` |
| 4.6 | Create auth hook | useAuth hook for user state | `src/hooks/use-auth.ts` |
| 4.7 | Create volunteer layout | Sidebar/nav + header + role protection | `src/app/(volunteer)/layout.tsx` |
| 4.8 | Create volunteer dashboard | Stats + recent observations + CTA | `src/app/(volunteer)/dashboard/page.tsx` |
| 4.9 | Create submission form component | Photo upload + description + GPS | `src/components/volunteer/submission-form.tsx` |
| 4.10 | Create submit page | Page wrapping submission form | `src/app/(volunteer)/submit/page.tsx` |
| 4.11 | Create processing animation | Step-by-step agent progress with SSE | `src/components/volunteer/processing-animation.tsx` |
| 4.12 | Create AI feedback card | Species ID + confidence + parameters | `src/components/volunteer/ai-feedback.tsx` |
| 4.13 | Create impact receipt | Impact text with reveal animation | `src/components/volunteer/impact-receipt.tsx` |
| 4.14 | Create species card | Educational expandable card | `src/components/volunteer/species-card.tsx` |
| 4.15 | Create observation detail page | Full result view (feedback + impact + species) | `src/app/(volunteer)/observation/[id]/page.tsx` |
| 4.16 | Create history page | Past observations list with status | `src/app/(volunteer)/history/page.tsx` |
| 4.17 | Create shared components | Header, sidebar, observation-card, status-badge, confidence-gauge, loading-skeleton | `src/components/shared/*.tsx` |
| 4.18 | Style everything with design tokens | Apply DOC-09 colors, fonts, spacing | All components match design spec |
| 4.19 | Test full volunteer flow | Register → submit → see AI → view history | Happy path works end-to-end |

### Phase 4 Exit Criteria
- [ ] Can register as volunteer
- [ ] Can submit observation with photo + description
- [ ] Processing animation shows agent progress in real-time
- [ ] AI feedback displays species, confidence, parameters
- [ ] Impact receipt is shown
- [ ] History page shows past observations with status badges
- [ ] UI matches cozy design spec (warm colors, rounded corners, serif headers)
- [ ] Mobile responsive (test at 375px width)
- [ ] `git commit -m "Phase 4: Volunteer panel complete"`

---

## 7. Phase 5: Researcher Panel

**Duration:** ~6 hours
**Goal:** Complete researcher-facing UI — review queue, validation workflow, dashboard, FHIR viewer.

### Tasks

| # | Task | Details | Deliverable |
|---|------|---------|-------------|
| 5.1 | Create researcher layout | Desktop-optimized with permanent sidebar | `src/app/(researcher)/layout.tsx` |
| 5.2 | Create researcher dashboard | Stats + queue preview + recent activity | `src/app/(researcher)/dashboard/page.tsx` |
| 5.3 | Create review queue page | Filterable list of pending observations | `src/app/(researcher)/review/page.tsx` |
| 5.4 | Create review queue component | Card list with thumbnails, scores, flags | `src/components/researcher/review-queue.tsx` |
| 5.5 | Create review detail page | Full observation + AI brief + action buttons | `src/app/(researcher)/review/[id]/page.tsx` |
| 5.6 | Create review detail component | Side-by-side layout: photo + AI analysis | `src/components/researcher/review-detail.tsx` |
| 5.7 | Create review actions | Confirm/Correct/Reject with appropriate forms | Action buttons with modal for corrections |
| 5.8 | Create validated data page | Table + map toggle of validated observations | `src/app/(researcher)/validated/page.tsx` |
| 5.9 | Create validated table component | Sortable, filterable data table | `src/components/researcher/validated-table.tsx` |
| 5.10 | Create observation map component | Leaflet map with species-colored pins | `src/components/researcher/observation-map.tsx` |
| 5.11 | Create analytics page | Charts dashboard | `src/app/(researcher)/analytics/page.tsx` |
| 5.12 | Create analytics charts | Recharts: timeline, species bar, confidence histogram, donut | `src/components/researcher/analytics-charts.tsx` |
| 5.13 | Create FHIR page | FHIR resource viewer + export button | `src/app/(researcher)/fhir/page.tsx` |
| 5.14 | Create FHIR viewer component | Structured display of FHIR resource (not raw JSON) + JSON toggle | `src/components/researcher/fhir-viewer.tsx` |
| 5.15 | Create notification bell | In-app notifications for review completions | `src/components/shared/notification-bell.tsx` |
| 5.16 | Test full researcher flow | Login → review → confirm → see in validated → view FHIR | Happy path works |

### Phase 5 Exit Criteria
- [ ] Researcher can log in and see dashboard
- [ ] Review queue shows only pending observations
- [ ] Can click observation → see full AI analysis + expert brief
- [ ] Can Confirm → observation moves to validated + FHIR generated
- [ ] Can Reject → observation marked rejected
- [ ] Validated data page shows table with filters
- [ ] Map view shows observation pins
- [ ] Analytics page shows charts
- [ ] FHIR viewer shows structured resource + raw JSON toggle
- [ ] `git commit -m "Phase 5: Researcher panel complete"`

---

## 8. Phase 6: Integration & Polish

**Duration:** ~4 hours
**Goal:** End-to-end flow works perfectly. FHIR sandbox POST works. DipteraCAST mock integrated. Polish UI details.

### Tasks

| # | Task | Details | Deliverable |
|---|------|---------|-------------|
| 6.1 | End-to-end test | Submit observation → AI pipeline → auto-validate → FHIR POST → impact receipt | Complete flow verified |
| 6.2 | Low-confidence flow test | Submit poor observation → flags for review → expert confirms → FHIR POST | Complete flow verified |
| 6.3 | FHIR sandbox POST | Verify real POST to sandbox.hl7europe.eu → 201 Created | FHIR resource exists on sandbox |
| 6.4 | DipteraCAST integration | Show mock predictions in both panels | DipteraCAST card visible |
| 6.5 | Error state testing | Test each error scenario (API down, image too large, etc.) | Graceful handling verified |
| 6.6 | UI polish | Fix spacing, alignment, color inconsistencies | Visual consistency |
| 6.7 | Responsive testing | Test at 375px, 768px, 1280px widths | All breakpoints look good |
| 6.8 | Animation polish | Ensure all Framer Motion animations are smooth | No janky transitions |
| 6.9 | Prepare demo data | Stage 3-5 pre-made observations with photos | Demo can be re-run reliably |
| 6.10 | Landing page | Create a simple landing page explaining StreamSense | `src/app/page.tsx` |
| 6.11 | Deploy frontend | Push to Vercel | Frontend live at URL |
| 6.12 | Deploy backend | Push to Railway | Backend live at URL |
| 6.13 | Test production | Verify deployed version works end-to-end | Live demo ready |

### Phase 6 Exit Criteria
- [ ] Full happy path works on deployed (production) URLs
- [ ] FHIR POST to sandbox succeeded at least once
- [ ] DipteraCAST mock shows predictions
- [ ] No broken pages at any screen size
- [ ] No console errors in browser
- [ ] Demo data pre-staged
- [ ] `git commit -m "Phase 6: Integration complete"`

---

## 9. Phase 7: Demo Production

**Duration:** ~3 hours
**Goal:** Demo video recorded, Devpost submission completed.

### Tasks

| # | Task | Details | Deliverable |
|---|------|---------|-------------|
| 7.1 | Write demo script | Second-by-second narration script (4:30 target) | Written script |
| 7.2 | Prepare demo environment | Clear test data, stage fresh demo observations | Clean state |
| 7.3 | Rehearse | Run through demo 2-3 times, fix any issues | Smooth execution |
| 7.4 | Record demo | Screen recording (OBS Studio) + narration | Raw video file |
| 7.5 | Edit video | Trim, add title card, clean up | Final video <5 minutes |
| 7.6 | Write README | Project overview, architecture, setup instructions | `README.md` |
| 7.7 | Take screenshots | 4-6 screenshots of key screens | Screenshot files |
| 7.8 | Submit to Devpost | Fill in all Devpost fields, upload video + screenshots | Submission live |

### Phase 7 Exit Criteria
- [ ] Demo video is under 5 minutes
- [ ] Video shows: problem → solution → live demo → architecture → impact
- [ ] Devpost submission has all required fields filled
- [ ] README is professional and well-organized
- [ ] Source code is clean and documented
- [ ] `git commit -m "Phase 7: Submission ready"`

---

## 10. Parallel Workstream Map

Tasks within each phase that can be built simultaneously by multiple AI agents:

```
PHASE 0:  Frontend setup ──┐
          Backend setup  ──┤── Can run in parallel
          Env config     ──┘

PHASE 1:  ORM models + migration ──┐
          Pydantic schemas        ──┤── Can run in parallel
          Seed data files          ──┘

PHASE 2:  Agent 1 (Vision)      ──┐
          Agent 2 (Description) ──┤── Stage 1 agents can be parallel
          Agent 3 (Metadata)    ──┘
          Agent 4 (Quality)     ──── Then sequential
          Agent 5 (FHIR)        ──┐
          Agent 6 (Impact)      ──┤── Stage 3 agents can be parallel
          Agent 7 (Brief)       ──┘

PHASE 3:  Auth endpoints    ──┐
          Obs endpoints     ──┤── Independent endpoint groups
          Review endpoints  ──┤
          FHIR endpoints    ──┘

PHASE 4:  Auth pages        ──┐
          Submit form       ──┤── Components can be parallel
          AI feedback       ──┤
          History page      ──┘

PHASE 5:  Review queue      ──┐
          Validated data    ──┤── Independent pages
          Analytics         ──┤
          FHIR viewer       ──┘
```

---

## 11. Risk Buffers & Cut Protocol

### If Behind Schedule

| Hours Behind | Action |
|-------------|--------|
| 1-2 hours | Skip P2 features (dark mode, photo annotation, CSV export) |
| 3-4 hours | Simplify analytics (show static numbers, skip charts) |
| 5-6 hours | Skip map views (just tables). Skip notification system. |
| 7-8 hours | Hardcode demo data in frontend (skip real backend calls for non-critical pages) |
| 9+ hours | Focus ONLY on: submit → AI pipeline → FHIR POST → impact receipt. Cut researcher panel to read-only dashboard. |

### The Non-Negotiable Demo Path

Even if everything else is cut, this MUST work:

```
1. Volunteer registers ✓
2. Volunteer submits photo + description ✓
3. AI pipeline processes (with visible animation) ✓
4. Species identified + confidence shown ✓
5. Impact receipt displayed ✓
6. FHIR resource generated and shown ✓
7. Researcher sees validated data ✓
```

If this flow works perfectly with beautiful UI, we can win. Everything else is bonus.

---

## 12. Phase Exit Criteria

| Phase | Must Pass Before Moving On |
|-------|---------------------------|
| 0 | Both servers running. All APIs verified. Git initialized. |
| 1 | Tables exist. Seed data loaded. Image upload works. |
| 2 | All 7 agents run individually. Orchestrator completes full pipeline. |
| 3 | All endpoints return correct data. Auth works. SSE streams events. |
| 4 | Volunteer can submit → see AI feedback → view history. UI is cozy. |
| 5 | Researcher can review → validate → see dashboard. FHIR viewer works. |
| 6 | End-to-end on production. FHIR sandbox POST succeeded. Demo data staged. |
| 7 | Video recorded. Devpost submitted. |

---

*End of DOC-10: Development Roadmap*
*Next document: DOC-11 AI Agent Build Instructions*
