# StreamSense — AI Agent Build Instructions (DOC 11)

> **Document ID:** DOC-11
> **Version:** 1.0
> **Last Updated:** September 29, 2026
> **Purpose:** Master instruction set for AI coding agents (Antigravity, Claude, Gemini) to build StreamSense phase by phase.

---

## Table of Contents

1. [Project Context for AI Agents](#1-project-context-for-ai-agents)
2. [Code Standards](#2-code-standards)
3. [File Structure Reference](#3-file-structure-reference)
4. [Phase-by-Phase Build Prompts](#4-phase-by-phase-build-prompts)
5. [Integration Checkpoints](#5-integration-checkpoints)
6. [Quality Gates](#6-quality-gates)
7. [Common Patterns](#7-common-patterns)
8. [Troubleshooting Guide](#8-troubleshooting-guide)

---

## 1. Project Context for AI Agents

### What You're Building

**StreamSense** is a two-panel web platform for the OneAquaHealth IEEE Global Hackathon 2026. Citizens submit stream photos → 7 AI agents process them → validated data becomes FHIR health resources.

### Architecture Summary

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Python 3.11+ + FastAPI + SQLAlchemy 2.0 (async)
- **Database:** Supabase (PostgreSQL 15)
- **AI:** BioCLIP 2 (local) + Gemini 2.0 Flash + Groq Llama-3.3-70b
- **Auth:** Supabase Auth + JWT
- **Storage:** Supabase Storage (S3-compatible)

### Documents to Reference

When building any phase, ALWAYS read the relevant docs:

| Phase | Primary Doc | Supporting Docs |
|-------|------------|----------------|
| Phase 0: Setup | DOC-03 (Tech Stack) | DOC-07 (API Keys) |
| Phase 1: Data Layer | DOC-06 (Database Schema) | DOC-03 (Tech Stack) |
| Phase 2: AI Pipeline | DOC-05 (Agentic AI Workflow) | DOC-08 (FHIR Spec) |
| Phase 3: Backend API | DOC-04 (System Architecture) | DOC-06 (Schema) |
| Phase 4: Volunteer UI | DOC-09 (UI/UX Spec) | DOC-02 (Feature Matrix) |
| Phase 5: Researcher UI | DOC-09 (UI/UX Spec) | DOC-02 (Feature Matrix) |
| Phase 6: Integration | DOC-08 (FHIR Spec) | DOC-10 (Roadmap) |
| Phase 7: Demo | DOC-02 (Feature Matrix) | DOC-01 (PRD) |

---

## 2. Code Standards

### 2.1 TypeScript (Frontend)

```typescript
// ── NAMING ──
// Files: kebab-case (submission-form.tsx, use-auth.ts)
// Components: PascalCase (SubmissionForm, AIFeedback)
// Hooks: camelCase with "use" prefix (useAuth, useObservations)
// Types/Interfaces: PascalCase (Observation, AIResult)
// Constants: UPPER_SNAKE_CASE (API_BASE_URL, MAX_FILE_SIZE)
// Functions: camelCase (submitObservation, formatDate)

// ── COMPONENT STRUCTURE ──
// 1. Imports (React, then third-party, then local)
// 2. Type definitions
// 3. Component function
// 4. Return JSX

// ── EXAMPLE ──
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Observation } from '@/types/observation'

interface ObservationCardProps {
  observation: Observation
  onViewDetail: (id: string) => void
}

export function ObservationCard({ observation, onViewDetail }: ObservationCardProps) {
  return (
    <Card className="bg-surface rounded-cozy-lg shadow-cozy border border-stone-100 p-6">
      {/* ... */}
    </Card>
  )
}
```

### 2.2 Python (Backend)

```python
# ── NAMING ──
# Files: snake_case (observation_service.py, vision.py)
# Classes: PascalCase (ObservationService, VisionAgent)
# Functions: snake_case (run_vision_agent, create_observation)
# Constants: UPPER_SNAKE_CASE (TARGET_TAXA, BMWP_SCORES)
# Variables: snake_case (confidence_score, observation_id)

# ── MODULE STRUCTURE ──
# 1. Standard library imports
# 2. Third-party imports
# 3. Local imports
# 4. Constants
# 5. Functions/Classes

# ── EXAMPLE ──
"""Agent 1: Vision Analyzer — BioCLIP species identification."""

import asyncio
from typing import Any

from PIL import Image
from pybioclip import TreeOfLifeClassifier

from app.config import settings

# Constants
TARGET_TAXA = ["Ephemeroptera", "Plecoptera", ...]

# Module-level model loading
classifier = TreeOfLifeClassifier()


async def run_vision_agent(image_url: str) -> dict[str, Any]:
    """Identify macroinvertebrate species from citizen photo.
    
    Args:
        image_url: Public URL to the uploaded image.
    
    Returns:
        Agent result dict with predictions, confidence, and status.
    """
    try:
        # ... implementation
        pass
    except Exception as e:
        return _fallback_response(str(e))
```

### 2.3 Error Handling Pattern

**Backend:** Every function that can fail returns a standardized result dict with `status` field:

```python
# Success
{"status": "success", "data": {...}, "error": None}

# Error with graceful fallback
{"status": "error", "data": {}, "error": "Description of what failed"}

# Never raise unhandled exceptions in agent code
# Always catch, log, and return fallback
```

**Frontend:** Use try/catch with user-friendly error messages via sonner toast:

```typescript
try {
  const result = await api.submitObservation(data)
  toast.success('Observation submitted!')
} catch (error) {
  toast.error('Something went wrong. Please try again.')
  console.error('Submission error:', error)
}
```

### 2.4 Comments & Documentation

- Every file starts with a module docstring explaining its purpose
- Every function has a docstring with Args and Returns
- Complex logic gets inline comments explaining WHY, not WHAT
- Do NOT add comments that just restate the code (no `# increment counter` next to `count += 1`)
- Keep existing comments when modifying files

### 2.5 Git Commit Messages

Format: `Phase N: Brief description`

Examples:
- `Phase 0: Project setup with Next.js and FastAPI`
- `Phase 1: Database models and seed data`
- `Phase 2: Agent 1 (Vision) - BioCLIP integration`
- `Phase 2: Orchestrator with parallel execution`
- `Phase 4: Submission form with photo upload`

---

## 3. File Structure Reference

Exact directory tree from DOC-03 Section 12. When creating files, follow this structure precisely.

### Key Locations

| What | Where |
|------|-------|
| Next.js pages | `frontend/src/app/(volunteer)/...` and `(researcher)/...` |
| React components | `frontend/src/components/{shared,volunteer,researcher}/` |
| shadcn/ui components | `frontend/src/components/ui/` |
| TypeScript types | `frontend/src/types/` |
| Custom hooks | `frontend/src/hooks/` |
| Supabase clients | `frontend/src/lib/supabase/` |
| API client | `frontend/src/lib/api.ts` |
| FastAPI routers | `backend/app/api/` |
| AI agents | `backend/app/agents/` |
| Agent prompts | `backend/app/agents/prompts/` |
| Services | `backend/app/services/` |
| ORM models | `backend/app/models/` |
| Pydantic schemas | `backend/app/schemas/` |
| Seed data | `backend/seed/` |

---

## 4. Phase-by-Phase Build Prompts

These are the exact prompts to give an AI coding agent for each phase.

### Phase 0 Prompt

```
BUILD PHASE 0: PROJECT SETUP

Read docs/03_TECH_STACK.md and docs/07_API_KEYS_MANUAL.md.

Tasks:
1. Initialize Next.js in frontend/ with App Router, TypeScript, Tailwind, ESLint, src directory
2. Install all frontend dependencies listed in DOC-03 Section 11
3. Initialize shadcn/ui and add all listed components
4. Apply the Tailwind config from DOC-09 Section 2 (design tokens, colors, fonts)
5. Set up Google Fonts (Inter, DM Serif Display, JetBrains Mono) in root layout
6. Initialize Python backend with FastAPI in backend/
7. Install all Python dependencies listed in DOC-03 Section 11
8. Create .env.example files for both frontend and backend from DOC-07 Section 11
9. Create the full directory structure from DOC-03 Section 12
10. Create a minimal FastAPI app (main.py) with health check endpoint
11. Create a minimal Next.js root layout and home page
12. Verify both servers start without errors

Exit criteria: `pnpm dev` runs frontend, `uvicorn app.main:app --reload` runs backend, both without errors.
```

### Phase 1 Prompt

```
BUILD PHASE 1: DATA LAYER

Read docs/06_DATABASE_SCHEMA.md completely.

Tasks:
1. Create backend/app/config.py — Pydantic Settings loading env vars
2. Create backend/app/database.py — async SQLAlchemy engine and session
3. Create ALL SQLAlchemy ORM models from DOC-06 Section 8:
   - User, Observation, AIResult, ExpertReview, FHIRResource, Notification, SpeciesReference
   - Include ALL columns, relationships, indexes, and enums exactly as specified
4. Create ALL Pydantic schemas (request/response) in backend/app/schemas/:
   - ObservationCreate, ObservationResponse, ReviewAction, etc.
5. Initialize Alembic and generate initial migration
6. Run migration to create tables
7. Create seed data files from DOC-06 Section 6:
   - backend/seed/species_reference.json (15 taxa with educational text)
   - backend/seed/demo_researcher.json
   - backend/seed/pilot_cities.json
8. Create backend/seed/run_seed.py script to load seed data
9. Create backend/app/services/storage_service.py for Supabase Storage uploads
10. Run seed script and verify data exists

Exit criteria: All tables exist in Supabase. 15 species loaded. Demo researcher exists. Storage upload works.
```

### Phase 2 Prompt

```
BUILD PHASE 2: AI PIPELINE

Read docs/05_AGENTIC_AI_WORKFLOW.md completely. This is the most critical phase.

Tasks:
1. Create all system prompt files in backend/app/agents/prompts/:
   - description_prompt.py, metadata_prompt.py, quality_prompt.py
   - fhir_prompt.py, impact_prompt.py, expert_brief_prompt.py
   Copy the EXACT prompts from DOC-05.

2. Create Agent 1 (Vision): backend/app/agents/vision.py
   - Use BioCLIP 2 via pybioclip
   - Load model at module import time
   - Implement run_vision_agent() exactly as in DOC-05 Section 3
   - Include all reference data (TAXA_COMMON_NAMES, BMWP_SCORES)

3. Create Agent 2 (Description): backend/app/agents/description.py
   - Use Groq llama-3.3-70b-versatile
   - JSON response format
   - Handle empty/missing description

4. Create Agent 3 (Metadata): backend/app/agents/metadata.py
   - Use Groq + external API calls (GBIF, OpenWeatherMap, Nominatim)
   - Run external calls in parallel with asyncio.gather
   - Include PILOT_CITIES dict
   - Create backend/app/utils/geocoding.py for reverse geocoding

5. Create Agent 4 (Quality): backend/app/agents/quality.py
   - Use Gemini 2.0 Flash
   - Include deterministic fallback_quality_score() function
   - Score breakdown with 40/35/25 weighting

6. Create Agent 5 (FHIR): backend/app/agents/fhir_translator.py
   - Use Gemini 2.0 Flash
   - Reference prompt from DOC-08 Section 6
   - Include validation loop with fhir.resources

7. Create Agent 6 (Impact): backend/app/agents/impact.py
   - Use Groq for speed
   - Generate warm, encouraging text

8. Create Agent 7 (Expert Brief): backend/app/agents/expert_brief.py
   - Use Gemini 2.0 Flash
   - Generate structured concerns with severity and recommendations

9. Create Orchestrator: backend/app/agents/orchestrator.py
   - Implement run_pipeline() as async generator (yields SSE events)
   - Stage 1: parallel Agents 1,2,3
   - Stage 2: sequential Agent 4
   - Stage 3: conditional parallel (5+6 or 7+6)
   - Include _summarize_agent() for SSE event text

10. Create DipteraCAST mock: backend/app/services/dipteracast_mock.py
    - Accept environmental parameters
    - Return simulated disease vector prediction

11. Create FHIR service: backend/app/services/fhir_service.py
    - validate_observation() using fhir.resources
    - post_to_fhir_sandbox() using httpx
    - Retry logic from DOC-08 Section 7

12. Test each agent individually, then test full pipeline.

Exit criteria: Full pipeline runs in <10 seconds. Both routing paths work. FHIR validates. Fallbacks activate when APIs are mocked as down.
```

### Phase 3 Prompt

```
BUILD PHASE 3: BACKEND API

Read docs/04_SYSTEM_ARCHITECTURE.md Section 4 (REST API Design).

Tasks:
1. Create backend/app/main.py — FastAPI app with CORS, error handlers
2. Create backend/app/middleware/auth.py — JWT validation middleware (verifies Supabase JWT)
3. Create backend/app/api/auth.py — POST /auth/sync (upsert OAuth user to DB), GET /auth/me
4. Create backend/app/services/observation_service.py — business logic
5. Create backend/app/api/observations.py — CRUD + SSE stream endpoint
6. Create backend/app/services/review_service.py — review logic
7. Create backend/app/api/review.py — queue + action endpoints
8. Create backend/app/api/validated.py — validated data + map GeoJSON
9. Create backend/app/api/analytics.py — summary stats + charts data
10. Create backend/app/api/fhir.py — resource viewer + export
11. Create backend/app/api/router.py — aggregate all routers under /api/v1
12. Test all endpoints via Swagger UI (/docs)

Every endpoint must:
- Validate input with Pydantic schemas
- Check auth via middleware
- Return consistent error format
- Handle edge cases gracefully

Exit criteria: All endpoints from DOC-04 Section 4 work. Auth protects routes. SSE streams pipeline events.
```

### Phase 4 Prompt

```
BUILD PHASE 4: VOLUNTEER PANEL

Read docs/09_UI_UX_SPEC.md COMPLETELY before writing any code.

CRITICAL DESIGN RULES:
- Background: bg-background (#faf9f7), NOT pure white
- Primary color: stream-500 (#2d9079), NOT blue
- Card radius: rounded-cozy-lg (16px), NOT rounded-lg (8px)
- Shadows: shadow-cozy (warm-tinted), NOT shadow-md (cold gray)
- Headers: font-display (DM Serif Display), NOT font-sans
- Body: text-stone-800, NOT text-gray-900
- Do NOT use default shadcn colors — override with our design tokens

Tasks:
1. Root layout with fonts, providers, Toaster
2. Supabase client utilities (browser + server)
3. Backend API client wrapper (src/lib/api.ts)
4. TypeScript type definitions for all data models
5. Auth page with OAuth buttons (Google + GitHub) via Supabase signInWithOAuth
6. useAuth hook with Supabase onAuthStateChange listener + role sync
7. Volunteer layout with sidebar nav + header
8. Volunteer dashboard (stats + recent + CTA)
9. Submission form (photo upload + description + GPS)
10. Processing animation (SSE-driven step-by-step)
11. AI feedback card (species + confidence + parameters)
12. Impact receipt (with Framer Motion reveal)
13. Species educational card (expandable)
14. Observation detail page
15. History page (past observations list)
16. All shared components (header, sidebar, badges, gauges, skeletons)

EVERY component must use the design tokens from DOC-09.
Test at 375px mobile width.

Exit criteria: Full volunteer flow works. UI is warm and cozy, NOT clinical or templated.
```

### Phase 5 Prompt

```
BUILD PHASE 5: RESEARCHER PANEL

Read docs/09_UI_UX_SPEC.md Section 8 for researcher screens.

DESIGN NOTE: Researcher panel is desktop-optimized, information-dense, but still cozy.
- Same design tokens as volunteer panel
- Permanent sidebar on desktop
- Tables are dense but readable
- Charts use our color palette

Tasks:
1. Researcher layout (permanent sidebar + header)
2. Researcher dashboard (stats + queue preview + activity)
3. Review queue page (filterable card list)
4. Review detail page (side-by-side: photo + AI analysis)
5. Review action buttons (Confirm/Correct/Reject + modals)
6. Validated data page (table + map toggle)
7. Data table component (sortable, filterable)
8. Observation map (Leaflet with species-colored pins)
9. Analytics page with Recharts (timeline, species, confidence, donut)
10. FHIR resource viewer (structured view + raw JSON toggle)
11. FHIR export button (POST to sandbox)
12. Notification bell component

Exit criteria: Full researcher flow works. Review → validate → FHIR. Charts display data. Map shows pins.
```

---

## 5. Integration Checkpoints

After each phase, verify these integration points:

### After Phase 2 + Phase 3
```bash
# Submit observation via API and verify pipeline runs
curl -X POST http://localhost:8000/api/v1/observations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://your-supabase-url.supabase.co/storage/v1/object/public/observations/test/mayfly.jpg",
    "description": "Clear water with moderate flow. Saw small insects under rocks.",
    "latitude": 40.2033,
    "longitude": -8.4103,
    "timestamp": "2026-09-29T14:30:00+01:00"
  }'

# Expected: observation created, pipeline runs, AI results stored
```

### After Phase 4 + Phase 3
```
1. Open browser to localhost:3000
2. Register as volunteer
3. Submit observation with a real stream photo
4. Watch processing animation
5. See AI feedback + impact receipt
6. View observation in history
```

### After Phase 5 + Phase 3
```
1. Login as researcher (researcher@streamsense.eu)
2. See low-confidence observations in review queue
3. Click one → see full AI analysis
4. Click "Confirm" → verify it moves to validated
5. Check FHIR viewer → verify resource generated
6. Click export → verify FHIR POST attempt
```

### After Phase 6 (Full Integration)
```
1. Deploy frontend to Vercel
2. Deploy backend to Railway
3. Update environment variables with production URLs
4. Run complete flow on production:
   - Register → Submit → AI → Validate → FHIR → Impact
5. Verify FHIR POST to live sandbox
6. Take screenshots for Devpost
```

---

## 6. Quality Gates

Before moving to the next phase, check these:

### Code Quality
- [ ] No TypeScript `any` types (run `tsc --noEmit`)
- [ ] No Python type errors (run `mypy app/`)
- [ ] No lint errors (run `pnpm lint` and `ruff check app/`)
- [ ] No console.log statements left in production code (except error logging)

### UI Quality
- [ ] All text uses design tokens (no hardcoded colors)
- [ ] All cards have rounded-cozy border radius
- [ ] Background is bg-background, not bg-white
- [ ] Primary buttons are bg-stream-500, not bg-blue-500
- [ ] Headers use font-display (DM Serif Display)
- [ ] No default shadcn gray/blue colors visible

### Functional Quality
- [ ] Happy path works end-to-end without manual intervention
- [ ] Error states show user-friendly messages (no raw error objects)
- [ ] Loading states show skeletons (no blank screens)
- [ ] Auth redirects work (unauthenticated → login, wrong role → correct panel)

---

## 7. Common Patterns

### 7.1 API Client Pattern (Frontend)

```typescript
// src/lib/api.ts
const API_BASE = process.env.BACKEND_URL || 'http://localhost:8000'

class ApiClient {
  private token: string | null = null

  setToken(token: string) { this.token = token }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}/api/v1${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
        ...options?.headers,
      },
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error?.error?.message || 'Request failed')
    }
    return response.json()
  }

  // Observations
  submitObservation(data: ObservationCreate) {
    return this.request<ObservationResponse>('/observations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  getObservation(id: string) {
    return this.request<ObservationDetail>(`/observations/${id}`)
  }

  getMyObservations(page = 1, limit = 20) {
    return this.request<PaginatedResponse<Observation>>(`/observations?page=${page}&limit=${limit}`)
  }

  // Review
  getReviewQueue(params?: ReviewQueryParams) {
    const query = new URLSearchParams(params as any).toString()
    return this.request<PaginatedResponse<Observation>>(`/review/queue?${query}`)
  }

  submitReview(id: string, action: ReviewActionPayload) {
    return this.request<ObservationResponse>(`/review/${id}/action`, {
      method: 'POST',
      body: JSON.stringify(action),
    })
  }

  // SSE
  streamPipelineStatus(id: string): EventSource {
    return new EventSource(`${API_BASE}/api/v1/observations/${id}/stream`)
  }
}

export const api = new ApiClient()
```

### 7.2 SSE Consumption Pattern (Frontend)

```typescript
// In processing animation component
useEffect(() => {
  if (!observationId) return

  const eventSource = api.streamPipelineStatus(observationId)

  eventSource.addEventListener('agent_update', (event) => {
    const data = JSON.parse(event.data)
    setAgentStatuses(prev => ({
      ...prev,
      [data.agent]: { status: data.status, summary: data.summary }
    }))
  })

  eventSource.addEventListener('pipeline_complete', (event) => {
    const data = JSON.parse(event.data)
    setResult(data)
    eventSource.close()
  })

  eventSource.onerror = () => {
    eventSource.close()
    // Fall back to polling
  }

  return () => eventSource.close()
}, [observationId])
```

### 7.3 Async Agent Pattern (Backend)

```python
# Every agent follows this pattern:
async def run_agent_name(input_data: SomeType) -> dict:
    """Agent N: Name — brief description."""
    try:
        # 1. Call model/API
        result = await some_api_call(input_data)
        
        # 2. Parse response
        parsed = parse_response(result)
        
        # 3. Return success
        return {
            "agent": "agent_name",
            "status": "success",
            "data": parsed,
            "error": None,
        }
    except Exception as e:
        # 4. Return fallback (NEVER raise)
        return {
            "agent": "agent_name",
            "status": "error",
            "data": DEFAULT_FALLBACK_DATA,
            "error": str(e),
        }
```

### 7.4 Page Layout Pattern (Frontend)

```tsx
// Volunteer page pattern
export default async function VolunteerDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page header with serif font */}
      <div>
        <h1 className="font-display text-3xl text-stone-900">
          Welcome back
        </h1>
        <p className="mt-1 text-stone-500">
          Your stream monitoring dashboard
        </p>
      </div>

      {/* Content cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard />
        {/* ... */}
      </div>

      {/* Main content */}
      <Card className="bg-surface rounded-cozy-lg shadow-cozy border border-stone-100 p-6">
        {/* ... */}
      </Card>
    </div>
  )
}
```

---

## 8. Troubleshooting Guide

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `BioCLIP OOM` | Model too large for available RAM | Use smaller batch size or run on machine with ≥1GB RAM |
| `Groq rate limited` | Too many requests in testing | Add 1-second delay between test calls. Free tier: 30 RPM. |
| `Gemini 429` | Rate limit exceeded | Switch to Groq fallback. Free tier: 15 RPM. |
| `FHIR validation fails` | Generated JSON doesn't match FHIR R4 schema | Check field names, types, required fields. Use fhir.resources error messages. |
| `Supabase Storage 403` | Bucket policy not set | Check DOC-07 Section 2 Step 6 for policy setup |
| `CORS error` | Backend not allowing frontend origin | Add frontend URL to CORS origins in main.py |
| `JWT expired` | Token older than 24 hours | Re-login. Check token expiry in auth middleware. |
| `SSE not streaming` | Async generator not yielding properly | Ensure `StreamingResponse` with `media_type="text/event-stream"`. Check `\n\n` after each event. |
| `Tailwind classes not applying` | Content paths not configured | Check `content` array in tailwind.config.ts includes all `.tsx` files |
| `shadcn components wrong colors` | Design tokens not overriding defaults | Ensure `globals.css` uses our custom CSS variables, not shadcn defaults |
| `Leaflet map not showing` | CSS not imported | Add `import 'leaflet/dist/leaflet.css'` in the map component |
| `Next.js hydration mismatch` | Server/client render different content | Make sure client-only code uses `'use client'` directive and `useEffect` |

### Backend Testing Commands

```bash
# Start backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Test health check
curl http://localhost:8000/health

# Test agent individually
python -c "
import asyncio
from app.agents.vision import run_vision_agent
result = asyncio.run(run_vision_agent('https://example.com/mayfly.jpg'))
print(result)
"

# Run all tests
pytest tests/ -v

# Check types
mypy app/ --ignore-missing-imports

# Lint
ruff check app/
```

### Frontend Testing Commands

```bash
# Start frontend
cd frontend
pnpm dev

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# Build (catch build errors)
pnpm build
```

---

*End of DOC-11: AI Agent Build Instructions*

---

## ✅ ALL 11 DOCUMENTS COMPLETE

| # | Document | File | Status |
|---|----------|------|--------|
| 01 | PRD | `docs/01_PRD.md` | ✅ Complete |
| 02 | Feature Matrix | `docs/02_FEATURE_MATRIX.md` | ✅ Complete |
| 03 | Tech Stack | `docs/03_TECH_STACK.md` | ✅ Complete |
| 04 | System Architecture | `docs/04_SYSTEM_ARCHITECTURE.md` | ✅ Complete |
| 05 | Agentic AI Workflow | `docs/05_AGENTIC_AI_WORKFLOW.md` | ✅ Complete |
| 06 | Database Schema | `docs/06_DATABASE_SCHEMA.md` | ✅ Complete |
| 07 | API Keys Manual | `docs/07_API_KEYS_MANUAL.md` | ✅ Complete |
| 08 | FHIR Spec | `docs/08_FHIR_SPEC.md` | ✅ Complete |
| 09 | UI/UX Spec | `docs/09_UI_UX_SPEC.md` | ✅ Complete |
| 10 | Development Roadmap | `docs/10_DEVELOPMENT_ROADMAP.md` | ✅ Complete |
| 11 | AI Build Instructions | `docs/11_AI_BUILD_INSTRUCTIONS.md` | ✅ Complete |
