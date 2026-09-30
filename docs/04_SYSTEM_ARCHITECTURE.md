# StreamSense — System Architecture (DOC 04)

> **Document ID:** DOC-04
> **Version:** 1.0
> **Last Updated:** September 29, 2026
> **Depends On:** DOC-01 (PRD), DOC-02 (Feature Matrix), DOC-03 (Tech Stack)

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Component Diagram](#2-component-diagram)
3. [Data Flow Diagrams](#3-data-flow-diagrams)
4. [REST API Design](#4-rest-api-design)
5. [Authentication Flow](#5-authentication-flow)
6. [File Upload Pipeline](#6-file-upload-pipeline)
7. [Real-Time Updates](#7-real-time-updates)
8. [Error Handling Strategy](#8-error-handling-strategy)
9. [Security Architecture](#9-security-architecture)

---

## 1. High-Level Architecture

StreamSense follows a clean **three-tier architecture** with a separate AI orchestration layer:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                                  │
│                                                                      │
│  ┌──────────────────────────────┐  ┌───────────────────────────────┐ │
│  │    VOLUNTEER PANEL (PWA)      │  │    RESEARCHER PANEL            │ │
│  │                               │  │                               │ │
│  │  • Submit observation         │  │  • Review queue               │ │
│  │  • AI feedback display        │  │  • Validate/correct/reject    │ │
│  │  • Processing animation       │  │  • Validated data dashboard   │ │
│  │  • Impact receipt             │  │  • FHIR viewer                │ │
│  │  • History & map              │  │  • Analytics                  │ │
│  │                               │  │                               │ │
│  │  Mobile-first responsive      │  │  Desktop-optimized            │ │
│  └──────────────┬────────────────┘  └──────────────┬────────────────┘ │
│                 │                                   │                 │
│                 └─────────────┬─────────────────────┘                 │
│                               │ HTTPS                                │
└───────────────────────────────┼──────────────────────────────────────┘
                                │
┌───────────────────────────────┼──────────────────────────────────────┐
│                      BFF TIER (Next.js API Routes)                   │
│                               │                                      │
│  Handles: auth cookies, CORS, request proxying,                     │
│           API key protection (keys never reach client)               │
│                               │                                      │
└───────────────────────────────┼──────────────────────────────────────┘
                                │ HTTP (internal)
┌───────────────────────────────┼──────────────────────────────────────┐
│                      APPLICATION TIER                                │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │                    FastAPI Backend                                ││
│  │                                                                  ││
│  │  ┌────────────┐  ┌────────────────┐  ┌────────────────────────┐ ││
│  │  │ API Router  │  │ Business Logic │  │ AI Orchestrator        │ ││
│  │  │             │  │                │  │                        │ ││
│  │  │ /obs        │→ │ ObsSvc         │→ │ run_pipeline()         │ ││
│  │  │ /review     │→ │ ReviewSvc      │  │   ├─ Agent 1 (Vision) │ ││
│  │  │ /validated  │→ │ FHIRSvc        │  │   ├─ Agent 2 (Desc)   │ ││
│  │  │ /analytics  │→ │ AnalyticsSvc   │  │   ├─ Agent 3 (Meta)   │ ││
│  │  │ /fhir       │→ │ StorageSvc     │  │   ├─ Agent 4 (Quality)│ ││
│  │  └────────────┘  └────────────────┘  │   ├─ Agent 5 (FHIR)   │ ││
│  │                                       │   ├─ Agent 6 (Impact) │ ││
│  │                                       │   └─ Agent 7 (Brief)  │ ││
│  │                                       └────────────────────────┘ ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐   │
│  │ BioCLIP 2  │  │ Gemini API │  │  Groq API  │  │ External APIs│   │
│  │ (local)    │  │ (remote)   │  │  (remote)  │  │ GBIF, OWM    │   │
│  └────────────┘  └────────────┘  └────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────┼──────────────────────────────────────┐
│                        DATA TIER                                     │
│                                                                      │
│  ┌────────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │  Supabase           │  │ Supabase Storage  │  │ FHIR Sandbox    │  │
│  │  PostgreSQL 15      │  │ (S3-compatible)   │  │ (hl7europe.eu)  │  │
│  │                     │  │                   │  │                 │  │
│  │  • users            │  │  • observation    │  │  • FHIR R4      │  │
│  │  • observations     │  │    photos         │  │  • OAH profiles │  │
│  │  • ai_results       │  │                   │  │                 │  │
│  │  • reviews          │  │                   │  │                 │  │
│  │  • fhir_resources   │  │                   │  │                 │  │
│  │  • species_ref      │  │                   │  │                 │  │
│  └────────────────────┘  └──────────────────┘  └─────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Diagram

### 2.1 Frontend Components

```
Next.js App Router
├── Layouts
│   ├── RootLayout           — Global providers, fonts, theme
│   ├── AuthLayout           — Centered card layout for OAuth sign-in
│   ├── VolunteerLayout      — Sidebar nav + header (mobile-first)
│   └── ResearcherLayout     — Sidebar nav + header (desktop-optimized)
│
├── Pages (Server Components where possible)
│   ├── LandingPage          — Hero + features + CTAs
│   ├── AuthPage             — OAuth sign-in (Google + GitHub buttons)
│   ├── VolunteerDashboard   — Recent observations + stats summary
│   ├── SubmitPage           — Photo upload + description form
│   ├── ObservationPage      — AI feedback + impact receipt (detail view)
│   ├── HistoryPage          — Past observations list
│   ├── VolunteerMapPage     — Map of user's observations
│   ├── ResearcherDashboard  — Queue count + stats + recent activity
│   ├── ReviewQueuePage      — List of pending observations
│   ├── ReviewDetailPage     — Full observation + AI brief + action buttons
│   ├── ValidatedDataPage    — Table + map toggle of validated data
│   ├── AnalyticsPage        — Charts and metrics
│   └── FHIRPage             — FHIR resource viewer + export
│
├── Client Components (interactive)
│   ├── SubmissionForm       — Photo upload + description + GPS
│   ├── ProcessingAnimation  — Step-by-step agent progress
│   ├── AIFeedbackCard       — Species ID + confidence + parameters
│   ├── ImpactReceipt        — Impact statement with animation
│   ├── SpeciesCard          — Educational expandable card
│   ├── ReviewActions        — Confirm/Correct/Reject buttons
│   ├── ObservationMap       — Leaflet map with pins
│   ├── FHIRViewer           — Structured FHIR resource display
│   ├── AnalyticsCharts      — Recharts visualizations
│   └── NotificationBell     — Notification dropdown
│
└── Shared Components
    ├── Header               — App title + user avatar + nav
    ├── Sidebar              — Navigation links per role
    ├── ObservationCard      — Compact observation preview
    ├── ConfidenceGauge      — Circular/bar confidence visualization
    ├── StatusBadge           — Auto-Validated / Pending / Rejected
    └── LoadingSkeleton      — Content placeholder while loading
```

### 2.2 Backend Components

```
FastAPI Application
├── API Layer (Routers)
│   ├── auth_router          — POST /auth/register, POST /auth/login
│   ├── observation_router   — POST /observations, GET /observations, GET /observations/:id
│   ├── review_router        — GET /review/queue, POST /review/:id/action
│   ├── validated_router     — GET /validated, GET /validated/map
│   ├── analytics_router     — GET /analytics/summary, GET /analytics/species
│   └── fhir_router          — GET /fhir/resources, POST /fhir/export, GET /fhir/:id
│
├── Service Layer (Business Logic)
│   ├── ObservationService   — Create observation, trigger pipeline, update status
│   ├── ReviewService        — Get queue, process review action, notify volunteer
│   ├── FHIRService          — Generate FHIR resource, validate, POST to sandbox
│   ├── AnalyticsService     — Compute stats, aggregate data
│   ├── StorageService       — Upload/retrieve images from Supabase Storage
│   └── DipteraCastMock      — Mock disease vector prediction
│
├── AI Layer (Agents + Orchestrator)
│   ├── Orchestrator         — Coordinates agent execution (parallel + sequential)
│   ├── VisionAgent          — BioCLIP 2 species identification
│   ├── DescriptionAgent     — Groq text extraction
│   ├── MetadataAgent        — Groq + GBIF/Weather metadata validation
│   ├── QualityAgent         — Gemini confidence scoring
│   ├── FHIRAgent            — Gemini FHIR resource generation
│   ├── ImpactAgent          — Groq impact receipt generation
│   └── ExpertBriefAgent     — Gemini expert review brief generation
│
├── Data Layer (Models + Database)
│   ├── SQLAlchemy Models    — User, Observation, AIResult, Review, FHIRResource, SpeciesRef
│   ├── Pydantic Schemas     — Request/response validation
│   └── Database Session     — Async connection pool
│
└── Infrastructure
    ├── Auth Middleware       — JWT validation, role extraction
    ├── CORS Middleware       — Allow frontend origin
    ├── Error Handlers       — Global exception handlers
    └── Config               — Environment variable loading
```

---

## 3. Data Flow Diagrams

### 3.1 Observation Submission Flow (Complete End-to-End)

```
VOLUNTEER                    FRONTEND                      BACKEND                         EXTERNAL
─────────                    ────────                      ───────                         ────────
                                                                                           
Takes photo         ──→  Upload photo to               
Writes description       Supabase Storage         ──→   Receive image URL
Grants GPS access        Get GPS coordinates              
                         Get timestamp                    
                              │                           
                         POST /api/observations    ──→   Create observation record (status: "processing")
                              │                           
                         Show processing           ←──   Start AI Pipeline ─────────────────────┐
                         animation                        │                                      │
                              │                           ├── Agent 1 (BioCLIP): process image   │
                         ← SSE/WebSocket              ├── Agent 2 (Groq): extract text  ──→  Groq API
                           "Vision: ✅ 89%"            ├── Agent 3 (Groq): validate meta ──→  Groq API
                           "Description: ✅"           │   └── Query GBIF occurrence    ──→  GBIF API
                           "Metadata: ✅"              │   └── Query weather            ──→  OWM API
                              │                           │   (ALL THREE IN PARALLEL)            │
                              │                           │                                      │
                              │                        ←──┤ All 3 complete                       │
                              │                           │                                      │
                              │                           ├── Agent 4 (Gemini): score     ──→  Gemini API
                         ← "Quality: 87/100"           │                                      │
                              │                           │                                      │
                              │                      ┌────┴────┐                                 │
                              │                      │ Score≥70 │                                 │
                              │                      │ (HIGH)   │                                 │
                              │                      └────┬────┘                                 │
                              │                           │                                      │
                              │                           ├── Agent 5 (Gemini): FHIR     ──→  Gemini API
                              │                           │   └── Validate via fhir.resources    │
                              │                           │   └── POST to FHIR Sandbox   ──→  FHIR Sandbox
                              │                           │                                      │
                              │                           ├── Agent 6 (Groq): impact     ──→  Groq API
                              │                           │   (PARALLEL with Agent 5)            │
                              │                           │                                      │
                         ← SSE "FHIR: ✅"              │                                      │
                         ← SSE "Complete"              │                                      │
                              │                           │                                      │
                         Display AI feedback              Update observation:                    │
                         Display impact receipt              status → "auto_validated"           │
                         Show species card                   store all agent outputs             │
                         Show FHIR status                                                       │
```

### 3.2 Expert Review Flow

```
RESEARCHER                   FRONTEND                     BACKEND
──────────                   ────────                     ───────

Login                 ──→  Authenticate              ──→  Verify JWT, check role="researcher"
                              │
Navigate to           ──→  GET /api/review/queue      ──→  Query observations WHERE status="pending_review"
Review Queue                  │                              ORDER BY created_at DESC
                         Display queue list           ←──  Return observations with AI results
                              │
Click observation     ──→  GET /api/observations/:id  ──→  Return full observation + all agent outputs
                              │
                         Display:                         
                         • Original photo                 
                         • Citizen description             
                         • AI species prediction          
                         • Confidence score               
                         • Metadata anomaly flags         
                         • GPS on map                     
                         • Expert brief (Agent 7)         
                              │
Click "Confirm"       ──→  POST /api/review/:id/action ──→  action="confirm"
   or "Correct"                                             │
   or "Reject"                                              ├── Update observation status
                                                            │
                                                            ├── If confirm/correct:
                                                            │   ├── Run Agent 5 (FHIR) → POST to Sandbox
                                                            │   ├── Run Agent 6 (Impact) → generate receipt
                                                            │   └── Notify volunteer
                                                            │
                                                            └── If reject:
                                                                ├── Store rejection reason
                                                                └── Notify volunteer
                              │
                         Show success toast           ←──  Return updated observation
                         Queue auto-advances
```

### 3.3 FHIR Resource Flow

```
Validated Observation Data
│
├── Species: Ephemeroptera (mayfly)
├── Confidence: 89%
├── GPS: 40.2033, -8.4103
├── Water color: clear
├── Flow speed: moderate
├── Timestamp: 2026-09-29T14:30:00+01:00
│
▼
Agent 5 (FHIR Translator — Gemini)
│
├── Maps "mayfly" → LOINC code (if applicable) or custom OAH code
├── Maps "clear water" → water quality indicator
├── Maps GPS → FHIR Location resource
├── Maps timestamp → FHIR effectiveDateTime
│
▼
Generate FHIR R4 Observation Resource
│
├── meta.profile: "http://hl7.eu/fhir/ig/oah/StructureDefinition/observation-indicators-oah"
├── status: "final"
├── code: { coding: [{ system: "...", code: "...", display: "..." }] }
├── subject: reference to Location
├── effectiveDateTime: "2026-09-29T14:30:00+01:00"
├── valueQuantity or valueString
└── component: [additional parameters]
│
▼
Validate via fhir.resources (Pydantic)
│
├── Schema valid? ✅ → proceed
└── Invalid? ❌ → retry generation with error feedback, max 2 retries
│
▼
POST to FHIR Sandbox
│
├── URL: https://sandbox.hl7europe.eu/oneaquahealth/fhir/Observation
├── Headers: Content-Type: application/fhir+json
├── Body: validated FHIR JSON
│
▼
Response
│
├── 201 Created → store resource ID, update observation record
└── 4xx/5xx → log error, store FHIR resource locally, retry later
```

---

## 4. REST API Design

### 4.1 Base URL

- **Development:** `http://localhost:8000/api/v1`
- **Production:** `https://streamsense-api.railway.app/api/v1`

### 4.2 Authentication Endpoints

Auth is handled client-side by Supabase OAuth (Google/GitHub). The backend only syncs user records.

| Method | Endpoint | Request Body | Response | Description |
|--------|----------|-------------|----------|-------------|
| POST | `/auth/sync` | — (JWT in header) | `{ user, role }` | Sync OAuth user to our DB. Creates user record if new (role=volunteer). |
| GET | `/auth/me` | — (JWT in header) | `{ user }` | Get current user profile with role |

### 4.3 Observation Endpoints

| Method | Endpoint | Auth | Query Params | Request Body | Response | Description |
|--------|----------|------|-------------|-------------|----------|-------------|
| POST | `/observations` | Volunteer | — | `{ image_url, description, latitude, longitude, timestamp }` | `{ observation, pipeline_task_id }` | Submit new observation (triggers AI pipeline) |
| GET | `/observations` | Both | `?status=&page=&limit=&user_id=` | — | `{ observations[], total, page }` | List observations (filtered by role: volunteers see own, researchers see all) |
| GET | `/observations/:id` | Both | — | — | `{ observation, ai_results, review?, fhir_resource? }` | Full observation detail with all AI results |
| GET | `/observations/:id/status` | Both | — | — | `{ status, agent_statuses[] }` | Real-time pipeline processing status |

### 4.4 Review Endpoints

| Method | Endpoint | Auth | Query Params | Request Body | Response | Description |
|--------|----------|------|-------------|-------------|----------|-------------|
| GET | `/review/queue` | Researcher | `?page=&limit=&sort=&species=&min_score=&max_score=` | — | `{ observations[], total }` | Get review queue (status=pending_review) |
| GET | `/review/queue/count` | Researcher | — | — | `{ count }` | Count of pending reviews |
| POST | `/review/:id/action` | Researcher | — | `{ action: "confirm"|"correct"|"reject", corrections?, rejection_reason? }` | `{ observation, fhir_resource? }` | Process review action |

### 4.5 Validated Data Endpoints

| Method | Endpoint | Auth | Query Params | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| GET | `/validated` | Researcher | `?page=&limit=&species=&city=&date_from=&date_to=&source=` | `{ observations[], total }` | List validated observations |
| GET | `/validated/map` | Researcher | `?species=&city=&date_from=&date_to=` | `{ features[] }` (GeoJSON) | Map data for validated observations |

### 4.6 Analytics Endpoints

| Method | Endpoint | Auth | Response | Description |
|--------|----------|------|----------|-------------|
| GET | `/analytics/summary` | Researcher | `{ total_observations, auto_validated_count, expert_validated_count, rejected_count, avg_confidence }` | Summary statistics |
| GET | `/analytics/timeline` | Researcher | `{ data: [{ date, submissions, validated }] }` | Submissions over time |
| GET | `/analytics/species` | Researcher | `{ data: [{ species, count }] }` | Species distribution |
| GET | `/analytics/confidence` | Researcher | `{ data: [{ range, count }] }` | Confidence score distribution |

### 4.7 FHIR Endpoints

| Method | Endpoint | Auth | Request Body | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| GET | `/fhir/resources` | Researcher | — | `{ resources[] }` | List generated FHIR resources |
| GET | `/fhir/resources/:id` | Researcher | — | `{ resource_json, sandbox_status }` | Get specific FHIR resource |
| POST | `/fhir/export` | Researcher | `{ observation_ids[] }` | `{ bundle_json, sandbox_response }` | Export as FHIR Bundle and POST to sandbox |

### 4.8 Realtime Endpoint (SSE)

| Method | Endpoint | Auth | Response | Description |
|--------|----------|------|----------|-------------|
| GET | `/observations/:id/stream` | Both | Server-Sent Events | Stream agent processing status updates |

**SSE Event Format:**
```
event: agent_update
data: {"agent": "vision", "status": "complete", "result": {"species": "Ephemeroptera", "confidence": 0.89}}

event: agent_update
data: {"agent": "description", "status": "complete", "result": {"water_color": "clear", "flow_speed": "moderate"}}

event: agent_update
data: {"agent": "metadata", "status": "complete", "result": {"gps_valid": true, "anomalies": []}}

event: agent_update  
data: {"agent": "quality", "status": "complete", "result": {"score": 87, "routing": "auto_validate"}}

event: pipeline_complete
data: {"observation_id": "...", "status": "auto_validated", "confidence": 87}
```

---

## 5. Authentication Flow

StreamSense uses **Supabase Auth with OAuth providers** (Google + GitHub) instead of email/password. This is faster for demo UX — one click sign-in, no forms.

```
OAUTH LOGIN FLOW (Google / GitHub):
────────────────────────────────────
Client                          Supabase Auth                    Backend
  │                                   │                            │
  │ Click "Sign in with Google"       │                            │
  │ supabase.auth.signInWithOAuth()   │                            │
  │ ──────────────────────────────→   │                            │
  │                                   │ Redirect to Google/GitHub  │
  │   ←── Redirect to OAuth provider  │                            │
  │                                   │                            │
  │ ... User authorizes ...           │                            │
  │                                   │                            │
  │ ← Callback with session token     │                            │
  │   supabase sets session cookie    │                            │
  │                                   │                            │
  │ GET /api/auth/sync                │                            │
  │ (session token in cookie)   ──→   │                            │
  │                                   │                            │
  │                                   │ POST /api/v1/auth/sync     │
  │                                   │ Authorization: Bearer JWT  │
  │                                   │ ──────────────────────→    │
  │                                   │                            │ Verify JWT via Supabase
  │                                   │                            │ Upsert user record in DB
  │                                   │                            │ (set role=volunteer if new)
  │                                   │    ←───────────────────    │
  │                                   │ { user, role }             │
  │   ←───────────────────────────    │                            │
  │ { user, role }                    │                            │
  │                                   │                            │
  │ Redirect to:                      │                            │
  │   /volunteer/dashboard  (if volunteer)                         │
  │   /researcher/dashboard (if researcher)                        │

AUTHENTICATED REQUEST:
──────────────────────
Client                          Next.js API Route                Backend
  │                                   │                            │
  │ GET /api/observations             │                            │
  │ Cookie: sb-session          ──→   │                            │
  │                                   │ Extract JWT from Supabase  │
  │                                   │ GET /api/v1/observations   │
  │                                   │ Authorization: Bearer <JWT>│
  │                                   │ ──────────────────────→    │
  │                                   │                            │ Verify JWT signature
  │                                   │                            │ Extract user_id, role
  │                                   │                            │ Filter by role permissions
  │                                   │    ←───────────────────    │
  │   ←───────────────────────────    │ { observations[] }         │
  │ { observations[] }                │                            │

ROLE ASSIGNMENT:
────────────────
• First-time OAuth users → role = "volunteer" (default)
• To make someone a researcher → manually update role in Supabase DB
  or use a secret invite link: /auth/researcher-invite?code=<SECRET>
• Role is stored in our users table, NOT in Supabase Auth metadata
```

---

## 6. File Upload Pipeline

```
CITIZEN'S PHONE                  FRONTEND                    SUPABASE STORAGE           BACKEND
────────────────                 ────────                    ─────────────────           ───────

Select photo            ──→  Validate:
from gallery                 • File type (jpg/png/webp)
or camera                    • File size (<10MB)
                              │
                         Compress if >5MB
                         (canvas resize to max 1920px)
                              │
                         Generate unique filename:
                         `{userId}/{uuid}.{ext}`
                              │
                         Upload to Supabase         ──→  Store in `observations` bucket
                         Storage                         Return public URL
                              │
                         ←── Image URL returned
                              │
                         Include image_url in        ──→  Store image_url in observation record
                         observation POST                  Download image for AI processing
                                                          │
                                                          Process through BioCLIP (Agent 1)
                                                          Process through Gemini Vision (if needed)
```

**Image Processing Details:**
- Client-side compression: resize longest side to 1920px using canvas API
- Store compressed version for display (bandwidth optimization)
- Backend downloads original from Supabase Storage URL for AI processing
- BioCLIP processes from PIL Image loaded from URL
- No image stored in backend filesystem — always fetched from Supabase URL

---

## 7. Real-Time Updates

### 7.1 AI Pipeline Processing Status (Server-Sent Events)

When a volunteer submits an observation, the frontend opens an SSE connection to receive real-time updates as each agent completes:

```
Frontend:
  const eventSource = new EventSource(`/api/observations/${id}/stream`);
  eventSource.addEventListener('agent_update', (event) => {
    const data = JSON.parse(event.data);
    // Update processing animation step
  });
  eventSource.addEventListener('pipeline_complete', (event) => {
    // Show AI feedback + impact receipt
    eventSource.close();
  });

Backend (FastAPI):
  @router.get("/observations/{id}/stream")
  async def stream_status(id: str):
      async def event_generator():
          # Subscribe to pipeline events for this observation
          # Yield SSE events as agents complete
          pass
      return StreamingResponse(event_generator(), media_type="text/event-stream")
```

### 7.2 Review Queue Updates (Polling)

Researcher dashboard polls for new items in the review queue every 30 seconds. Simple and reliable for hackathon scope.

```typescript
// Frontend polling
const { data } = useSWR('/api/review/queue/count', fetcher, {
  refreshInterval: 30000 // 30 seconds
});
```

---

## 8. Error Handling Strategy

### 8.1 AI Agent Failures

Every agent has a defined fallback. The pipeline NEVER crashes — it always returns a result.

| Agent | Failure Mode | Fallback Response | Impact on Pipeline |
|-------|-------------|-------------------|-------------------|
| Agent 1 (Vision) | BioCLIP crashes, OOM, timeout (>10s) | `{ species: null, confidence: 0, error: "vision_unavailable" }` | Pipeline continues. Quality score penalized. Observation routed to expert review. |
| Agent 2 (Description) | Groq API down, rate limited, timeout (>5s) | `{ extracted_params: {}, error: "description_unavailable" }` | Pipeline continues with less data for Quality Scorer. |
| Agent 3 (Metadata) | Groq down, GBIF down, Weather API down | `{ validation: "partial", anomalies: [], error: "metadata_partial" }` | Pipeline continues. Quality score notes incomplete validation. |
| Agent 4 (Quality) | Gemini API down, timeout (>10s) | Use simple rule-based scoring: vision_conf * 0.5 + metadata_valid * 0.3 + description_exists * 0.2 | Pipeline continues with deterministic fallback score. |
| Agent 5 (FHIR) | Gemini down, FHIR generation fails, sandbox rejects | Store observation as "fhir_pending". Retry later. Show "FHIR export queued" in UI. | Observation is still validated. FHIR will catch up. |
| Agent 6 (Impact) | Groq down | Use template: "Thank you for your observation! Your data has been processed and contributes to stream health monitoring." | Generic but acceptable. |
| Agent 7 (Expert Brief) | Gemini down | Show raw agent outputs to researcher without synthesized brief. | Researcher can still review, just without AI summary. |

### 8.2 HTTP Error Responses

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Image file is required",
    "details": [
      { "field": "image", "issue": "Missing required field" }
    ]
  }
}
```

| HTTP Status | Code | When |
|------------|------|------|
| 400 | `VALIDATION_ERROR` | Invalid request body, missing fields, wrong file type |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 403 | `FORBIDDEN` | Volunteer accessing researcher routes (or vice versa) |
| 404 | `NOT_FOUND` | Observation or resource not found |
| 409 | `CONFLICT` | Observation already reviewed |
| 429 | `RATE_LIMITED` | Too many submissions (>10/min) |
| 500 | `INTERNAL_ERROR` | Unhandled server error |
| 503 | `SERVICE_UNAVAILABLE` | AI services temporarily unavailable |

---

## 9. Security Architecture

| Layer | Measure | Implementation |
|-------|---------|---------------|
| **Transport** | HTTPS everywhere | Vercel (frontend) and Railway (backend) provide automatic TLS |
| **Authentication** | JWT with expiration | Tokens expire after 24 hours. Stored in httpOnly cookies (not localStorage). |
| **Authorization** | Role-based access control | Middleware checks `role` claim in JWT. Volunteer ≠ Researcher endpoints. |
| **API keys** | Server-side only | Gemini, Groq, Supabase service keys live in backend env vars. Never exposed to client. Next.js API routes proxy requests. |
| **Input validation** | Pydantic models | Every request body validated against Pydantic schema. Invalid requests rejected before processing. |
| **File upload** | Type + size validation | Only jpg/png/webp. Max 10MB. MIME type checked server-side. |
| **Rate limiting** | Per-user throttling | Max 10 observations per minute per user. Prevents abuse. |
| **SQL injection** | ORM parameterized queries | SQLAlchemy uses parameterized queries. No raw SQL with user input. |
| **XSS** | React's built-in escaping | React auto-escapes rendered content. No `dangerouslySetInnerHTML` with user data. |
| **CORS** | Whitelist frontend origin | FastAPI CORS middleware allows only the frontend domain. |

---

*End of DOC-04: System Architecture*
*Next document: DOC-05 Agentic AI Workflow*
