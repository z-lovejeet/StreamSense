# StreamSense — Tech Stack Decision Document (DOC 03)

> **Document ID:** DOC-03
> **Version:** 1.0
> **Last Updated:** September 29, 2026
> **Depends On:** DOC-01 (PRD), DOC-02 (Feature Matrix)

---

## Table of Contents

1. [Stack Overview](#1-stack-overview)
2. [Frontend](#2-frontend)
3. [Backend](#3-backend)
4. [AI / ML Layer](#4-ai--ml-layer)
5. [Database & Storage](#5-database--storage)
6. [Authentication](#6-authentication)
7. [FHIR](#7-fhir)
8. [External APIs](#8-external-apis)
9. [Deployment](#9-deployment)
10. [Dev Tools & Quality](#10-dev-tools--quality)
11. [Complete Dependency List](#11-complete-dependency-list)
12. [Project Directory Structure](#12-project-directory-structure)

---

## 1. Stack Overview

```
┌───────────────────────────────────────────────────────────────┐
│                       FRONTEND                                 │
│  Next.js 14 (App Router) + TypeScript + Tailwind CSS           │
│  shadcn/ui + Framer Motion + Leaflet + Recharts                │
├───────────────────────────────────────────────────────────────┤
│                   NEXT.JS API ROUTES (BFF)                     │
│  Server-side API routes acting as proxy to Python backend      │
├───────────────────────────────────────────────────────────────┤
│                       BACKEND                                  │
│  Python 3.11+ + FastAPI + Uvicorn                              │
│  Async handlers + Pydantic models + SQLAlchemy                 │
├───────────┬───────────────┬───────────────┬───────────────────┤
│  AI LAYER │   DATABASE    │    STORAGE    │    EXTERNAL       │
│           │               │               │                   │
│ BioCLIP 2 │ Supabase      │ Supabase      │ FHIR Sandbox      │
│ Gemini    │ (PostgreSQL)  │ Storage       │ GBIF API          │
│ Groq      │               │ (S3-compat)   │ OpenWeatherMap    │
│ (local)   │               │               │ DipteraCAST Mock  │
└───────────┴───────────────┴───────────────┴───────────────────┘
```

---

## 2. Frontend

### 2.1 Framework: Next.js 14+ (App Router)

| Attribute | Detail |
|-----------|--------|
| **Package** | `next@14.2.x` |
| **Why** | App Router provides file-based routing, server components, streaming, and API routes. The BFF (Backend-for-Frontend) pattern via API routes proxies calls to the Python backend, keeping API keys server-side. Excellent DX for rapid development. |
| **Rendering** | Server-Side Rendering (SSR) for initial load performance. Client components for interactive elements (forms, maps, charts). |
| **PWA** | Use `next-pwa` for service worker. Cache the submission form for offline access. Queue submissions for upload when connectivity returns. |

### 2.2 Language: TypeScript 5.x

| Attribute | Detail |
|-----------|--------|
| **Package** | `typescript@5.x` |
| **Why** | Type safety across the entire frontend. Shared types between frontend API calls and backend responses. AI coding agents produce better TypeScript because interfaces explicitly declare requirements. |
| **Strictness** | `strict: true` in tsconfig. No `any` types permitted. |

### 2.3 Styling: Tailwind CSS 3.4+

| Attribute | Detail |
|-----------|--------|
| **Package** | `tailwindcss@3.4.x` |
| **Why** | Utility-first CSS enables rapid iteration without context-switching to CSS files. Custom design tokens (colors, fonts, spacing) defined in `tailwind.config.ts`. |
| **Custom theme** | Earthy, warm, nature-inspired palette (defined in DOC-09 UI/UX Spec). NOT the default blue/gray. |

### 2.4 Component Library: shadcn/ui

| Attribute | Detail |
|-----------|--------|
| **Why** | Not an NPM dependency — components are copied into the project, giving full control over styling. Built on Radix UI primitives for accessibility. We customize every component to match our cozy, nature-inspired aesthetic. |
| **Components used** | Button, Card, Dialog, DropdownMenu, Input, Label, Select, Tabs, Badge, Table, Skeleton, Toast, Tooltip, Avatar, Sheet |
| **Customization** | Override default colors, border-radius (softer/rounder), shadows (warm-toned), fonts |

### 2.5 Animations: Framer Motion 11+

| Attribute | Detail |
|-----------|--------|
| **Package** | `framer-motion@11.x` |
| **Why** | Declarative animations for React. Used for: AI processing step animation, page transitions, card hover effects, impact receipt reveal, notification entrance. Subtle and purposeful — not flashy. |

### 2.6 Maps: React-Leaflet 4.x + Leaflet 1.9

| Attribute | Detail |
|-----------|--------|
| **Packages** | `react-leaflet@4.x`, `leaflet@1.9.x` |
| **Why** | Free, open-source, lightweight. Perfect for plotting observation pins, researcher validated data map, and volunteer observation map. No API key required (uses OpenStreetMap tiles). |
| **Tile provider** | OpenStreetMap default. Optional: Stadia Maps for more aesthetic tiles (free tier). |

### 2.7 Charts: Recharts 2.x

| Attribute | Detail |
|-----------|--------|
| **Package** | `recharts@2.x` |
| **Why** | React-native charting library. Composable, customizable. Used for researcher analytics dashboard: submission trends, species distribution, confidence histograms. |

### 2.8 Icons: Lucide React

| Attribute | Detail |
|-----------|--------|
| **Package** | `lucide-react@latest` |
| **Why** | Clean, nature-friendly stroke icons. Tree-shakeable (only imported icons are bundled). Consistent with shadcn/ui. |

### 2.9 Forms: React Hook Form + Zod

| Attribute | Detail |
|-----------|--------|
| **Packages** | `react-hook-form@7.x`, `zod@3.x`, `@hookform/resolvers` |
| **Why** | Performant form handling with Zod schema validation. Type-safe form data that matches backend expectations. Used for: observation submission form, researcher correction form, login/register forms. |

---

## 3. Backend

### 3.1 Language: Python 3.11+

| Attribute | Detail |
|-----------|--------|
| **Why** | BioCLIP 2 (`pybioclip`) requires Python. The AI/ML ecosystem is Python-native. Fast prototyping. Both Gemini and Groq SDKs have excellent Python clients. |
| **Version** | 3.11+ for `asyncio.TaskGroup` support (parallel agent execution). |

### 3.2 Framework: FastAPI

| Attribute | Detail |
|-----------|--------|
| **Package** | `fastapi[standard]` |
| **Why** | Async by default (critical for parallel AI agent execution). Auto-generated OpenAPI docs (Swagger). Pydantic models for request/response validation. Type hints match our TypeScript frontend contracts. |
| **Server** | `uvicorn` (ASGI server) |

### 3.3 Key Python Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | latest | Web framework |
| `uvicorn[standard]` | latest | ASGI server |
| `pydantic` | 2.x | Data validation and serialization |
| `sqlalchemy` | 2.x | Database ORM |
| `asyncpg` | latest | Async PostgreSQL driver |
| `python-multipart` | latest | File upload handling |
| `python-jose[cryptography]` | latest | JWT token handling |
| `passlib[bcrypt]` | latest | Password hashing |
| `httpx` | latest | Async HTTP client for external APIs |
| `pillow` | latest | Image processing |
| `pybioclip` | latest | BioCLIP 2 inference |
| `google-genai` | latest | Gemini API client |
| `groq` | latest | Groq API client |
| `fhir.resources` | latest | FHIR R4 resource validation (Pydantic models) |
| `supabase` | latest | Supabase Python client (storage, auth) |
| `alembic` | latest | Database migrations |

---

## 4. AI / ML Layer

### 4.1 BioCLIP 2 (Local Inference)

| Attribute | Detail |
|-----------|--------|
| **Package** | `pybioclip` via pip, model from HuggingFace |
| **Model** | BioCLIP 2 (trained on TreeOfLife-200M dataset) |
| **Execution** | Local inference on CPU (no GPU required for single-image classification). Runs in-process within the FastAPI server. |
| **Speed** | ~1-2 seconds per image on CPU |
| **Purpose** | Agent 1: Vision Analyzer — species identification from citizen photos |
| **Why BioCLIP** | Purpose-built for biological organisms. Far superior to generic vision models (GPT-4V, Gemini Vision) for species identification because it's trained on 200M biological images. |

### 4.2 Google Gemini API (Flash Chain with Rate Limiter)

| Attribute | Detail |
|-----------|--------|
| **SDK** | `google-genai` |
| **Available Models** | `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-3.7-flash`, `gemini-3.8-flash` |
| **Purpose** | Agents 4 (Quality Scorer), 5 (FHIR Translator), 7 (Expert Brief Generator). Used where quality/reasoning depth matters more than raw speed. |
| **Speed** | ~1-2 seconds per call |
| **Why Gemini** | Best balance of quality and speed in the free tier. Flash models are fast enough for real-time pipeline. Excellent at structured JSON generation (critical for FHIR). |

**⚠️ CRITICAL — Rate Limit Strategy:**

| Model | RPD Limit (safe) | Type |
|-------|------------------|------|
| `gemini-3.5-flash-lite` | **500** | Lite — high quota |
| `gemini-3.5-flash` | **16** | Non-lite — low quota |
| `gemini-3.6-flash` | **16** | Non-lite — low quota |
| `gemini-3.7-flash` | **16** | Non-lite — low quota |
| `gemini-3.8-flash` | **16** | Non-lite — low quota |

> Non-lite models have only ~20 RPD. We use a safe limit of 16 per model. Exceeding 20 RPD on any non-lite model risks account blocking. The lite model has 500 RPD and is the safety net.

**Model Chain (cascading on rate limit hit):**

```
DEVELOPMENT / TESTING (cheapest first, preserve quota):
  gemini-3.5-flash-lite → gemini-3.5-flash → gemini-3.6-flash → gemini-3.7-flash → gemini-3.8-flash

PRODUCTION / LIVE DEMO (best quality first, graceful degradation):
  gemini-3.8-flash → gemini-3.7-flash → gemini-3.6-flash → gemini-3.5-flash → gemini-3.5-flash-lite
```

**How cascading works:** If model X has hit its 16 RPD limit, the next request automatically routes to the next model in the chain. Limits reset daily. The rate limiter tracks per-model counts in an in-memory counter (reset at midnight UTC).

### 4.3 Groq API (Qwen 3.8-27B + GPT-OSS Fallbacks)

| Attribute | Detail |
|-----------|--------|
| **SDK** | `groq` |
| **Primary Model** | `qwen/qwen3.8-27b` (27B params, 131K context, ✅ JSON mode) |
| **Fallback 1** | `openai/gpt-oss-120b` (120B params, 131K context, ❌ no JSON mode — use prompt-based JSON) |
| **Fallback 2** | `openai/gpt-oss-20b` (20B params, 131K context, ❌ no JSON mode — lightweight) |
| **Purpose** | Agents 2 (Description Interpreter), 3 (Metadata Validator), 6 (Impact Generator). Used where speed is critical and tasks are more straightforward extraction/generation. |
| **Speed** | <500ms per call (Groq's LPU inference engine) |
| **Why Groq** | Fastest LLM inference available. Agents 2, 3, 6 need to be fast (they run in the parallel first stage). |

> **JSON mode note:** Only `qwen/qwen3.8-27b` supports `response_format: {"type": "json_object"}`. For GPT-OSS fallbacks, use strong prompt instructions ("Output ONLY valid JSON, no explanation") and parse with `json.loads()` + error handling.

### 4.4 Model Selection Rationale

```
Task Type            → Speed Critical?  → Quality Critical?  → Model
──────────────────────────────────────────────────────────────────────
Vision (species ID)  → Yes              → Very High          → BioCLIP 2 (specialized, local)
Text extraction      → Yes (parallel)   → Medium             → Groq (qwen3.8-27b)
Metadata validation  → Yes (parallel)   → Medium             → Groq (qwen3.8-27b)
Quality scoring      → No (sequential)  → High               → Gemini (chain)
FHIR generation      → No (post-route)  → Very High          → Gemini (chain)
Impact text          → Yes (parallel)   → Medium             → Groq (qwen3.8-27b)
Expert brief         → No (post-route)  → High               → Gemini (chain)
```

**Fallback strategy:**
- **Gemini rate limited** → Auto-cascade to next model in chain (handled by rate limiter)
- **All Gemini exhausted** → Groq (qwen3.8-27b) handles agents 4, 5, 7 (lower quality but works)
- **Groq primary down** → gpt-oss-120b → gpt-oss-20b → Gemini chain as ultimate fallback
- **BioCLIP fails** → Proceed without vision data, flag it, route to expert review

---

## 5. Database & Storage

### 5.1 Database: Supabase (PostgreSQL 15)

| Attribute | Detail |
|-----------|--------|
| **Service** | Supabase (hosted PostgreSQL) |
| **Why Supabase** | Free tier is generous (500MB database, 1GB storage). Built-in auth, storage, and realtime subscriptions. PostgreSQL gives us full SQL power, JSONB for AI agent outputs, and PostGIS for geospatial queries. Instant setup. |
| **Connection** | Async via `asyncpg` + SQLAlchemy 2.0 async engine. Connection pooling via Supabase's built-in pgBouncer. |
| **Migrations** | Alembic for schema versioning. |

### 5.2 File Storage: Supabase Storage

| Attribute | Detail |
|-----------|--------|
| **Service** | Supabase Storage (S3-compatible) |
| **Bucket** | `observations` — stores citizen-uploaded photos |
| **Policy** | Public read (images need to be displayable). Authenticated write only. |
| **File naming** | `{user_id}/{observation_id}/{uuid}.{ext}` |
| **Image processing** | Resize to max 1920px on longest side before storage (saves bandwidth for display). Keep original for AI processing. |

---

## 6. Authentication

### 6.1 Strategy: Supabase Auth + JWT

| Attribute | Detail |
|-----------|--------|
| **Provider** | Supabase Auth |
| **Method** | Email/password (simplest for demo) |
| **Roles** | `volunteer` (default on registration) and `researcher` (set manually in DB or via admin seed) |
| **Frontend** | `@supabase/supabase-js` client handles auth state. JWT stored in cookies (httpOnly for security). |
| **Backend** | FastAPI middleware validates JWT on every request. Extracts user ID and role. |
| **Route protection** | Next.js middleware checks auth cookie. Redirects unauthenticated users to login. Researcher routes check role. |

---

## 7. FHIR

### 7.1 Libraries

| Package | Purpose |
|---------|---------|
| `fhir.resources` | Python Pydantic models for FHIR R4 resources. Validates resource structure, cardinality, and vocabulary bindings BEFORE we POST to the sandbox. |
| `httpx` | Async HTTP client for FHIR REST API calls to the sandbox. |

### 7.2 Sandbox

| Attribute | Detail |
|-----------|--------|
| **URL** | `https://sandbox.hl7europe.eu/oneaquahealth/fhir` |
| **Standard** | FHIR R4 |
| **Authentication** | Check sandbox docs (likely open for hackathon) |
| **Profiles** | `observation-indicators-oah`, `observation-health-measure-oah`, `location-oah` |
| **Operations** | POST (create), GET (read), Search (query) |

---

## 8. External APIs

### 8.1 GBIF (Global Biodiversity Information Facility)

| Attribute | Detail |
|-----------|--------|
| **Base URL** | `https://api.gbif.org/v1/` |
| **Purpose** | Agent 3 (Metadata Validator) queries GBIF species occurrence API to check if a species has been historically observed near the submitted GPS coordinates. |
| **Endpoint** | `GET /occurrence/search?decimalLatitude={lat}&decimalLongitude={lon}&radius=50km&taxonKey={key}` |
| **Auth** | No API key required for read access |
| **Rate limit** | Generous for hackathon use |

### 8.2 OpenWeatherMap

| Attribute | Detail |
|-----------|--------|
| **Base URL** | `https://api.openweathermap.org/data/2.5/` |
| **Purpose** | Agent 3 checks weather conditions at observation time/location. Validates: was it daylight? Was it raining? Temperature consistent with species activity? |
| **Endpoint** | `GET /weather?lat={lat}&lon={lon}&appid={key}` |
| **Auth** | API key required (free tier: 60 calls/min) |

### 8.3 Geocoding (Nominatim / OpenStreetMap)

| Attribute | Detail |
|-----------|--------|
| **Base URL** | `https://nominatim.openstreetmap.org/` |
| **Purpose** | Reverse geocode GPS coordinates to human-readable location name. Check if coordinates are near a water body. |
| **Endpoint** | `GET /reverse?lat={lat}&lon={lon}&format=json` |
| **Auth** | No API key required. Rate limit: 1 request/second. |

### 8.4 DipteraCAST (Mock)

| Attribute | Detail |
|-----------|--------|
| **Implementation** | Internal mock endpoint on our FastAPI server |
| **Purpose** | Simulates disease vector prediction from environmental parameters |
| **Input contract** | `{ temperature, dissolved_oxygen, turbidity, flow_speed, vegetation_cover, land_use, season }` |
| **Output contract** | `{ risk_score, dominant_taxa: [{name, probability}], risk_level: "low|moderate|high" }` |
| **Why mock** | DipteraCAST has NO public API. We create a realistic data contract based on published model inputs. Label clearly as "Simulated" in UI. |

---

## 9. Deployment

### 9.1 Frontend: Vercel

| Attribute | Detail |
|-----------|--------|
| **Service** | Vercel (free tier) |
| **Why** | Native Next.js deployment. Zero-config. Automatic HTTPS. Preview deployments for PRs. Global CDN. |
| **Build** | `next build` → deployed automatically on git push |

### 9.2 Backend: Railway or Render

| Attribute | Detail |
|-----------|--------|
| **Service** | Railway (preferred) or Render (fallback) |
| **Why** | Easy Python deployment. Free tier sufficient for hackathon. Supports environment variables. |
| **Deployment** | Dockerfile or `railway up` CLI |
| **Resources** | 512MB RAM minimum (BioCLIP model needs ~300MB loaded in memory) |

### 9.3 Environment Variables

All secrets stored as environment variables, never in code:

```bash
# .env.example (Backend)

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=postgresql+asyncpg://...

# AI Models — Gemini
GEMINI_API_KEY=
GEMINI_MODEL_CHAIN_DEV=gemini-3.5-flash-lite,gemini-3.5-flash,gemini-3.6-flash,gemini-3.7-flash,gemini-3.8-flash
GEMINI_MODEL_CHAIN_PROD=gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash,gemini-3.5-flash-lite
GEMINI_RPD_LITE=500
GEMINI_RPD_NON_LITE=16
APP_ENV=dev

# AI Models — Groq
GROQ_API_KEY=
GROQ_MODEL_PRIMARY=qwen/qwen3.8-27b
GROQ_MODEL_FALLBACK_1=openai/gpt-oss-120b
GROQ_MODEL_FALLBACK_2=openai/gpt-oss-20b

# External APIs
OPENWEATHERMAP_API_KEY=
GBIF_API_URL=https://api.gbif.org/v1

# FHIR
FHIR_SANDBOX_URL=https://sandbox.hl7europe.eu/oneaquahealth/fhir

# CORS
FRONTEND_URL=http://localhost:3000

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

```bash
# .env.local (Frontend)

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

---

## 10. Dev Tools & Quality

| Tool | Purpose |
|------|---------|
| **ESLint** | JavaScript/TypeScript linting (Next.js default config) |
| **Prettier** | Code formatting (consistent style) |
| **Ruff** | Python linting + formatting (replaces flake8, black, isort) |
| **mypy** | Python type checking |
| **Git** | Version control |
| **pnpm** | Package manager (faster than npm, deterministic) |
| **uv** | Python package manager (fast pip replacement) |

---

## 11. Complete Dependency List

### Frontend (package.json)

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "framer-motion": "^11.0.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "recharts": "^2.12.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.0",
    "lucide-react": "^0.400.0",
    "date-fns": "^3.6.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.4.0",
    "class-variance-authority": "^0.7.0",
    "sonner": "^1.5.0",
    "next-pwa": "^5.6.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@types/react": "^18.3.0",
    "@types/node": "^20.14.0",
    "@types/leaflet": "^1.9.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "prettier": "^3.3.0",
    "prettier-plugin-tailwindcss": "^0.6.0"
  }
}
```

### Backend (requirements.txt)

```
fastapi[standard]
uvicorn[standard]
pydantic>=2.0
sqlalchemy>=2.0
asyncpg
alembic
python-multipart
python-jose[cryptography]
passlib[bcrypt]
httpx
pillow
pybioclip
google-genai
groq
fhir.resources
supabase
python-dotenv
ruff
mypy
```

---

## 12. Project Directory Structure

```
OneAquaHealth/
├── docs/                          # All planning documents (DOC 01-11)
│   ├── 01_PRD.md
│   ├── 02_FEATURE_MATRIX.md
│   ├── 03_TECH_STACK.md
│   └── ...
│
├── frontend/                      # Next.js application
│   ├── public/
│   │   ├── icons/                 # PWA icons
│   │   └── images/                # Static images (species reference photos)
│   ├── src/
│   │   ├── app/                   # Next.js App Router
│   │   │   ├── (auth)/            # Auth pages (login, register)
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── register/
│   │   │   │       └── page.tsx
│   │   │   ├── (volunteer)/       # Volunteer panel pages
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── submit/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── observation/
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── history/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── map/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx     # Volunteer layout (sidebar, nav)
│   │   │   ├── (researcher)/      # Researcher panel pages
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── review/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── review/
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── validated/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── analytics/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── fhir/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx     # Researcher layout
│   │   │   ├── api/               # BFF API routes (proxy to Python)
│   │   │   │   ├── observations/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── review/
│   │   │   │   │   └── route.ts
│   │   │   │   └── auth/
│   │   │   │       └── route.ts
│   │   │   ├── layout.tsx         # Root layout
│   │   │   ├── page.tsx           # Landing page
│   │   │   └── globals.css        # Global styles + Tailwind
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui components (customized)
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   └── ...
│   │   │   ├── shared/            # Shared components
│   │   │   │   ├── header.tsx
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── loading.tsx
│   │   │   │   └── observation-card.tsx
│   │   │   ├── volunteer/         # Volunteer-specific components
│   │   │   │   ├── submission-form.tsx
│   │   │   │   ├── ai-feedback.tsx
│   │   │   │   ├── processing-animation.tsx
│   │   │   │   ├── impact-receipt.tsx
│   │   │   │   └── species-card.tsx
│   │   │   └── researcher/        # Researcher-specific components
│   │   │       ├── review-queue.tsx
│   │   │       ├── review-detail.tsx
│   │   │       ├── validated-table.tsx
│   │   │       ├── fhir-viewer.tsx
│   │   │       ├── analytics-charts.tsx
│   │   │       └── observation-map.tsx
│   │   ├── lib/                   # Utilities
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts      # Browser Supabase client
│   │   │   │   └── server.ts      # Server Supabase client
│   │   │   ├── api.ts             # Backend API client
│   │   │   ├── utils.ts           # General utilities
│   │   │   └── constants.ts       # App constants
│   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── use-auth.ts
│   │   │   ├── use-observations.ts
│   │   │   └── use-realtime.ts
│   │   └── types/                 # TypeScript type definitions
│   │       ├── observation.ts
│   │       ├── user.ts
│   │       ├── ai-result.ts
│   │       └── fhir.ts
│   ├── tailwind.config.ts
│   ├── next.config.mjs
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                       # Python FastAPI application
│   ├── app/
│   │   ├── main.py                # FastAPI app entry point
│   │   ├── config.py              # Environment config (Pydantic Settings)
│   │   ├── database.py            # SQLAlchemy engine + session
│   │   ├── models/                # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── observation.py
│   │   │   ├── ai_result.py
│   │   │   ├── review.py
│   │   │   └── fhir_resource.py
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   ├── observation.py
│   │   │   ├── ai_result.py
│   │   │   ├── review.py
│   │   │   └── fhir.py
│   │   ├── api/                   # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── router.py          # Main router aggregation
│   │   │   ├── observations.py    # POST /observations, GET /observations
│   │   │   ├── review.py          # GET /review, POST /review/{id}/action
│   │   │   ├── validated.py       # GET /validated
│   │   │   ├── analytics.py       # GET /analytics
│   │   │   └── fhir.py            # GET /fhir, POST /fhir/export
│   │   ├── agents/                # AI agent implementations
│   │   │   ├── __init__.py
│   │   │   ├── orchestrator.py    # Orchestrates all 7 agents
│   │   │   ├── vision.py          # Agent 1: BioCLIP Vision
│   │   │   ├── description.py     # Agent 2: Description Interpreter
│   │   │   ├── metadata.py        # Agent 3: Metadata Validator
│   │   │   ├── quality.py         # Agent 4: Quality Scorer
│   │   │   ├── fhir_translator.py # Agent 5: FHIR Translator
│   │   │   ├── impact.py          # Agent 6: Impact Generator
│   │   │   ├── expert_brief.py    # Agent 7: Expert Brief Generator
│   │   │   └── prompts/           # System prompts for each agent
│   │   │       ├── description_prompt.py
│   │   │       ├── metadata_prompt.py
│   │   │       ├── quality_prompt.py
│   │   │       ├── fhir_prompt.py
│   │   │       ├── impact_prompt.py
│   │   │       └── expert_brief_prompt.py
│   │   ├── services/              # Business logic services
│   │   │   ├── __init__.py
│   │   │   ├── observation_service.py
│   │   │   ├── review_service.py
│   │   │   ├── fhir_service.py
│   │   │   ├── storage_service.py
│   │   │   └── dipteracast_mock.py
│   │   ├── middleware/            # Middleware
│   │   │   ├── __init__.py
│   │   │   └── auth.py            # JWT validation middleware
│   │   └── utils/                 # Utilities
│   │       ├── __init__.py
│   │       ├── image_processing.py
│   │       └── geocoding.py
│   ├── migrations/                # Alembic migrations
│   │   ├── env.py
│   │   └── versions/
│   ├── seed/                      # Seed data
│   │   ├── species_reference.json # 15-20 indicator taxa
│   │   ├── bmwp_scores.json       # BMWP scoring table
│   │   ├── pilot_cities.json      # 5 pilot city locations
│   │   └── demo_researcher.json   # Pre-seeded researcher account
│   ├── tests/                     # Test files
│   │   ├── test_agents/
│   │   ├── test_api/
│   │   └── test_services/
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── .github/                       # CI/CD (optional)
├── .gitignore
└── README.md                      # Project overview for Devpost
```

---

*End of DOC-03: Tech Stack Decision Document*
*Next document: DOC-04 System Architecture*
