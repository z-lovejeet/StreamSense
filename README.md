# StreamSense

**AI-powered smart triage for citizen science stream monitoring.**
Built for the OneAquaHealth IEEE Global Hackathon 2026 -- Track 3: Agentic AI.

- **Live Application:** [https://stream-sense-eight.vercel.app](https://stream-sense-eight.vercel.app)
- **API Documentation (Swagger UI):** [https://streamsense-u9oc.onrender.com/docs](https://streamsense-u9oc.onrender.com/docs)

StreamSense sits between raw citizen stream observations and trusted research data. When a volunteer photographs an urban stream and describes what they see, a 7-agent AI pipeline identifies macroinvertebrate bioindicators, validates geospatial and temporal metadata, scores observation quality, and routes the result: high-confidence observations are auto-validated and translated into HL7 FHIR R4 health records; low-confidence observations are sent to a researcher review queue with AI-generated expert briefs. The volunteer receives an instant impact receipt explaining how their data contributes to One Health outcomes.

---

## Table of Contents

- [Live Deployment](#live-deployment)
- [Problem](#problem)
- [How It Works](#how-it-works)
- [AI Triage Pipeline](#ai-triage-pipeline)
- [System Architecture](#system-architecture)
- [Volunteer Panel](#volunteer-panel)
- [Researcher Panel](#researcher-panel)
- [FHIR R4 Integration](#fhir-r4-integration)
- [One Health Connection](#one-health-connection)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [External Integrations](#external-integrations)
- [Documentation](#documentation)
- [Hackathon Context](#hackathon-context)
- [License](#license)

---

## Live Deployment

| Service | Environment | URL |
|---------|-------------|-----|
| **Frontend Web App (Volunteer & Researcher)** | Production (Vercel) | [https://stream-sense-eight.vercel.app](https://stream-sense-eight.vercel.app) |
| **Backend REST API (FastAPI & Swagger Docs)** | Production (Render) | [https://streamsense-u9oc.onrender.com/docs](https://streamsense-u9oc.onrender.com/docs) |
| **Interactive Health Check** | Production (Render) | [https://streamsense-u9oc.onrender.com/health](https://streamsense-u9oc.onrender.com/health) |

---

## Problem

Urban freshwater ecosystems are critical to public health. The OneAquaHealth consortium monitors streams across five European pilot cities (Coimbra, Toulouse, Benevento, Ghent, Oslo) through citizen volunteers. But citizen-submitted data suffers from a cascading quality problem:

1. **No automated triage.** Every observation requires manual expert review, taking 5-15 minutes each.
2. **High rejection rates.** 60-80% of submissions are discarded as unusable, wasting both volunteer and researcher time.
3. **Zero feedback.** Volunteers submit data and hear nothing back. Over 90% churn within 30 days.
4. **Data silos.** Even validated ecological observations remain locked in research databases, disconnected from public health systems.
5. **Broken One Health chain.** Stream degradation signals never reach health authorities who need them for disease vector surveillance.

StreamSense addresses all five failure points with a single intelligent layer.

```
Without StreamSense                    With StreamSense
--------------------                   ----------------

Citizen submits photo                  Citizen submits photo
        |                                      |
        v                                      v
Manual queue (days)                    7-agent AI pipeline (3-5 sec)
        |                                      |
        v                              +-------+-------+
Expert reviews 100%                    |               |
        |                         Score >= 70     Score < 70
        v                              |               |
60-80% rejected                   Auto-validate    Expert queue
No feedback to citizen            FHIR export      AI brief attached
Data stays in CSV                 Impact receipt    Expert reviews 20%
                                  sent to citizen   (not 100%)
```

---

## How It Works

```
                    STREAMSENSE PLATFORM

  +-------------------+           +------------------------+
  |  VOLUNTEER PANEL  |           |   RESEARCHER PANEL     |
  |                   |           |                        |
  |  Submit photos    |           |  Review queue          |
  |  Write description|           |  Validate / reject     |
  |  Get AI feedback  |           |  Analytics dashboard   |
  |  Impact receipt   |           |  FHIR resource export  |
  |  View history     |           |  Interactive map       |
  |  Health & tips    |           |  Gamification stats    |
  +--------+----------+           +-----------+------------+
           |                                  |
           +----------------+-----------------+
                            |
               +------------v--------------+
               |   AI TRIAGE PIPELINE      |
               |                           |
               |   7 specialized agents    |
               |   Parallel + chained      |
               |   SSE real-time streaming  |
               +---------------------------+
                            |
        +-------------------+-------------------+
        |                   |                   |
  +-----v------+    +------v------+    +-------v------+
  | Supabase   |    | FHIR R4     |    | External     |
  | PostgreSQL |    | Sandbox     |    | APIs         |
  | + Storage  |    | (HAPI)      |    | GBIF, Weather|
  +------------+    +-------------+    +--------------+
```

A volunteer opens the mobile-first web app, takes a photo of a stream, writes a free-text description (e.g., "water is murky, saw some small shrimp-like creatures"), and hits submit. The backend receives the photo and text, then launches the AI pipeline. Within 3-5 seconds the volunteer sees:

- Which species the AI identified and at what confidence
- A quality score breakdown (vision 40%, metadata 35%, description 25%)
- An impact receipt connecting their data to community health outcomes
- Their observation status: auto-validated or sent for expert review

The researcher, meanwhile, only sees the low-confidence observations in their review queue -- each pre-annotated with an AI expert brief listing specific concerns (e.g., "GPS is 2.3 km from nearest water body") and recommended actions.

---

## AI Triage Pipeline

The pipeline consists of seven specialized agents orchestrated through a parallel-then-chain execution pattern. All progress is streamed to the frontend via Server-Sent Events (SSE).

```
                         Citizen Submission
                         (photo + text + GPS)
                                |
            +-------------------+-------------------+
            |                   |                   |
            v                   v                   v
    +-------+--------+  +------+-------+  +--------+--------+
    | Agent 1        |  | Agent 2      |  | Agent 3         |
    | Vision         |  | Description  |  | Metadata        |
    | Analyzer       |  | Interpreter  |  | Validator       |
    |                |  |              |  |                  |
    | Gemini 3 Flash |  | Groq Qwen    |  | Groq Qwen       |
    | multi-modal    |  | 3.8 27B      |  | 3.8 27B         |
    | vision         |  |              |  |                  |
    |                |  | Extracts 14  |  | Checks GPS,     |
    | Identifies     |  | environmental|  | timestamp,       |
    | macroinverte-  |  | parameters   |  | GBIF occurrence, |
    | brate species  |  | from free    |  | weather, reverse |
    | from photo     |  | text         |  | geocode          |
    +-------+--------+  +------+-------+  +--------+--------+
            |                   |                   |
            +-------------------+-------------------+
                                |
                                v
                    +-----------+-----------+
                    | Agent 4               |
                    | Quality Scorer        |
                    |                       |
                    | Gemini 3 Flash        |
                    |                       |
                    | Weighted aggregation: |
                    |  Vision:     40%      |
                    |  Metadata:   35%      |
                    |  Description: 25%     |
                    |                       |
                    | Output: 0-100 score   |
                    | Route: auto_validate  |
                    |    or expert_review   |
                    +-----------+-----------+
                                |
                +---------------+---------------+
                |                               |
         Score >= 70                      Score < 70
                |                               |
        +-------+-------+              +-------+--------+
        |               |              |                |
        v               v              v                v
  +-----+------+  +----+------+  +----+-------+  +----+------+
  | Agent 5    |  | Agent 6   |  | Agent 7    |  | Agent 6   |
  | FHIR       |  | Impact    |  | Expert     |  | Impact    |
  | Translator |  | Generator |  | Brief Gen  |  | Generator |
  |            |  |           |  |            |  |           |
  | Gemini 3   |  | Groq Qwen |  | Gemini 3   |  | Groq Qwen |
  | Flash      |  | 3.8 27B   |  | Flash      |  | 3.8 27B   |
  |            |  |           |  |            |  |           |
  | Converts   |  | Writes    |  | Generates  |  | Writes    |
  | to FHIR R4 |  | citizen-  |  | expert     |  | citizen-  |
  | Observation|  | facing    |  | review     |  | facing    |
  | resource   |  | impact    |  | brief with |  | impact    |
  | (OAH       |  | receipt   |  | specific   |  | receipt   |
  |  profile)  |  |           |  | concerns   |  |           |
  +------------+  +-----------+  +------------+  +-----------+
```

### Agent Details

| Agent | Name | Model | Latency | Input | Output |
|-------|------|-------|---------|-------|--------|
| 1 | Vision Analyzer | Gemini 3 Flash series (gemini-3.8-flash / 3.7 / 3.5-lite) | ~2s | JPEG/PNG photo | Species ID, confidence 0-1, BMWP score, common name |
| 2 | Description Interpreter | Groq (qwen/qwen3.8-27b) | <500ms | Free-text string | 14 structured parameters (water color, clarity, flow, odor, algae, debris, etc.) |
| 3 | Metadata Validator | Groq (qwen/qwen3.8-27b) + APIs | <800ms | GPS + timestamp + weather + GBIF data | Anomaly list, GPS validity, species plausibility, overall validity rating |
| 4 | Quality Scorer | Gemini 3 Flash (3.8 / 3.7) | ~2s | Outputs of agents 1-3 | Score 0-100, routing decision, breakdown, key concerns |
| 5 | FHIR Translator | Gemini 3 Flash (3.8 / 3.7) | ~2s | Validated observation data | FHIR R4 Observation resource (OAH profile) |
| 6 | Impact Generator | Groq (qwen/qwen3.8-27b) | <500ms | Species + quality + routing | 4-field impact receipt (headline, text, ecological insight, health connection) |
| 7 | Expert Brief Generator | Gemini 3 Flash (3.8 / 3.7) | ~2s | All pipeline outputs | Structured brief with typed concerns, severity, check recommendations |

### Execution Timing

Agents 1, 2, and 3 run in parallel (they have no interdependencies). Agent 4 waits for all three, then runs. Based on the routing decision, either agents 5+6 or agents 7+6 run in parallel. Total wall-clock time: 3-5 seconds per observation.

### BMWP Biotic Index

The pipeline uses the Biological Monitoring Working Party (BMWP) scoring system to translate species identifications into water quality assessments:

| BMWP Score | Taxa Examples | Water Quality |
|------------|---------------|---------------|
| 10 | Ephemeroptera (mayfly), Plecoptera (stonefly) | Good -- sensitive indicators |
| 6-8 | Trichoptera (caddisfly), Gammaridae (freshwater shrimp) | Good to moderate |
| 3-5 | Hydropsychidae, Simuliidae, Gastropoda | Moderate |
| 1-2 | Chironomidae (midge larvae), Oligochaeta (worms) | Poor -- tolerant of pollution |
| 0 | Culicidae (mosquito larvae) | Disease vector indicator |

The 15 target taxa and their BMWP mappings are defined in `backend/app/agents/prompts/vision_config.py`.

---

## System Architecture

```
+----------------------------------------------------------+
|                        FRONTEND                           |
|  Next.js 15  |  App Router  |  React 19  |  TypeScript   |
|                                                           |
|  Route Groups:                                            |
|    (auth)       -- login, OAuth callback                  |
|    (volunteer)  -- dashboard, submit, history, map, health|
|    (researcher) -- dashboard, review, validated,          |
|                    analytics, FHIR                         |
|                                                           |
|  Auth: Supabase client SDK (PKCE flow)                    |
|  State: React hooks + fetch (no Redux)                    |
|  Streaming: EventSource for SSE pipeline progress         |
+-----------------------------+----------------------------+
                              |
                         HTTPS / REST
                              |
+-----------------------------v----------------------------+
|                        BACKEND                            |
|  FastAPI  |  Python 3.13  |  async/await                  |
|                                                           |
|  Middleware:                                               |
|    JWT verification (Supabase JWKS)                       |
|    CORS (configurable origins)                            |
|    Global error handler                                   |
|                                                           |
|  API Routers:                                             |
|    /auth      -- session exchange                         |
|    /observations -- CRUD + AI pipeline trigger            |
|    /review    -- expert review queue + actions             |
|    /validated -- validated data + GeoJSON                  |
|    /analytics -- time series + species distribution        |
|    /fhir      -- FHIR resource management + sandbox export |
|    /stats     -- volunteer gamification stats              |
|                                                           |
|  Services:                                                |
|    observation_service  -- business logic + scope filter   |
|    review_service       -- expert review workflow          |
|    fhir_service         -- FHIR resource generation        |
|    storage_service      -- Supabase Storage adapter        |
|    gemini_client        -- Google Gemini API wrapper        |
|    groq_client          -- Groq API wrapper                 |
|                                                           |
|  Agents:                                                  |
|    orchestrator.py -- parallel execution + SSE streaming   |
|    7 agent modules (vision, description, metadata,         |
|      quality, fhir_translator, impact, expert_brief)       |
|    prompts/ -- system prompts + reference data             |
+-----------------------------+----------------------------+
                              |
                    SQLAlchemy 2.0 (async)
                              |
+-----------------------------v----------------------------+
|                      DATABASE                             |
|  Supabase PostgreSQL 15                                   |
|                                                           |
|  Tables:                                                  |
|    users              -- auth profiles, roles              |
|    observations       -- citizen submissions               |
|    ai_results         -- per-agent JSON outputs            |
|    expert_reviews     -- researcher review actions          |
|    fhir_resources     -- generated FHIR R4 resources        |
|    notifications      -- in-app notification feed           |
|    species_reference  -- taxa catalog + BMWP scores         |
|                                                           |
|  Auth: Supabase Auth (Google OAuth + email)                |
|  Storage: Supabase Storage (observation photos)            |
|  RLS: Row-Level Security on all tables                     |
+----------------------------------------------------------+
```

---

## Volunteer Panel

The volunteer panel is a mobile-first responsive interface designed for field use. Key pages:

### Dashboard
- Summary statistics (total submissions, validated count, pending count, average AI score) computed from real database queries
- Recent observations list with status badges
- Dynamic gamification: XP tracker, earned badges, active missions, eco-impact metrics -- all derived from actual observation data, not hardcoded values

### Submit Observation
- Photo upload with drag-and-drop and camera capture
- Free-text description field
- Manual GPS entry with optional geolocation button (triggers only on click, not on page load)
- Pilot city selector (Coimbra, Toulouse, Benevento, Ghent, Oslo)
- Real-time SSE progress animation showing each agent's status as the pipeline runs

### Observation Detail
- Full AI analysis breakdown: species card with confidence gauge, environmental parameters table, metadata validation results
- Quality score with 3-component breakdown (vision / metadata / description weights)
- Impact receipt with One Health connection
- Expert brief (if routed to review)

### History
- Paginated list of all past observations with status filters
- Expandable detail view per observation

### Interactive Map
- Leaflet.js map showing all observation locations as clustered markers
- Popup cards with species, score, and status

### Health and Field Safety
- Field safety advisories for stream monitoring
- AI scoring breakdown explaining how the 40/35/25 weights affect acceptance
- Five actionable tips for improving observation acceptance rates

---

## Researcher Panel

The researcher panel is a desktop-optimized interface for freshwater ecologists.

### Dashboard
- KPI cards: total observations, pending review count, validated count, average quality score
- Dynamic gamification with review milestones
- Quick links to review queue and analytics

### Review Queue
- Filterable table of pending observations sorted by priority
- Each row shows: volunteer name, species, AI score, submission date, anomaly flags

### Review Detail
- Side-by-side view: zoomable observation photo (left) and AI expert brief (right)
- Expert brief contains: typed concerns with severity levels, specific check recommendations, estimated review time
- Three action buttons: Confirm (accept AI result), Correct (accept with species/parameter edits), Reject (with reason)

### Validated Data
- Searchable, sortable table of all validated observations
- Toggle to interactive map view with GeoJSON overlay
- Click-through to full observation detail with popup cards on map markers

### Analytics
- Time-series charts: observations over time, quality score trends
- Species distribution breakdown
- Water quality indicator distribution
- Pilot city comparison

### FHIR Resources
- Card-based viewer for all generated FHIR R4 resources
- Per-resource export button to push individual resources to a FHIR sandbox
- Batch export as FHIR Bundle
- Status tracking: pending vs. posted, sandbox ID, posted timestamp
- Resource detail viewer showing full FHIR JSON

---

## FHIR R4 Integration

StreamSense generates FHIR R4 Observation resources conforming to the OneAquaHealth Implementation Guide profile (`observation-indicators-oah`).

```
FHIR R4 Observation Resource (StreamSense)

  meta.profile:  http://hl7.eu/fhir/ig/oah/StructureDefinition/
                 observation-indicators-oah
  status:        "final"
  category:      "survey"
  code:          LOINC 73985-4 (Exercise activity)

  effectiveDateTime:  observation timestamp (ISO 8601)

  component[]:
    +-- species-identified        (valueString)
    +-- species-confidence        (valueQuantity, %)
    +-- bmwp-score                (valueQuantity, integer)
    +-- water-quality-indication  (valueString)
    +-- water-color               (valueString)
    +-- water-clarity             (valueString)
    +-- flow-speed                (valueString)
    +-- odor                      (valueString)
    +-- algae-presence            (valueString)
    +-- debris                    (valueString)
    +-- ai-confidence-score       (valueQuantity, 0-100)
    +-- disease-vector-detected   (valueBoolean)
    +-- validation-source         (valueString: "ai" or "expert")

  note[]:
    +-- Volunteer description
    +-- AI confidence narrative
    +-- Validation method
```

Resources are stored in the `fhir_resources` database table and can be exported to any FHIR R4-compliant server. The default sandbox target is the European HAPI FHIR server at `https://hapi.fhir.org/baseR4`.

---

## One Health Connection

StreamSense operationalizes the One Health framework by connecting three domains through a single data pipeline:

```
+----------------+        +------------------+        +------------------+
|   ANIMAL       |        |   ENVIRONMENT    |        |   HUMAN          |
|   HEALTH       |        |   HEALTH         |        |   HEALTH         |
|                |        |                  |        |                  |
| Macroinverte-  |  <-->  | Water quality    |  <-->  | Disease vector   |
| brate species  |        | indicators       |        | surveillance     |
| as bioindica-  |        | (BMWP scoring,   |        | (mosquito/       |
| tors of eco-   |        | turbidity,       |        | blackfly larvae  |
| system health  |        | algae blooms)    |        | detection,       |
|                |        |                  |        | FHIR export to   |
|                |        |                  |        | health systems)  |
+----------------+        +------------------+        +------------------+
        |                         |                          |
        +-------------------------+--------------------------+
                                  |
                     StreamSense Data Pipeline
                                  |
                          FHIR R4 Output
                                  |
                     Health Information Systems
```

When the Vision Agent detects Culicidae (mosquito larvae) or Simuliidae (blackfly larvae), the observation is flagged as a disease vector detection. This information flows through the FHIR translation into a standardized health record that public health authorities can consume through existing health information exchange infrastructure.

The DipteraCAST integration (currently mocked for the hackathon) demonstrates the forward path: feeding validated macroinvertebrate occurrence data into disease vector population models to predict outbreak risk at the watershed level.

---

## Tech Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend framework | Next.js 15 (App Router) | Server/client components, route groups, middleware |
| UI library | React 19 | Component rendering |
| Language | TypeScript 5 | Type safety across frontend |
| Styling | Tailwind CSS 4 | Utility-first responsive design |
| Component library | shadcn/ui (Radix primitives) | Accessible, composable UI components |
| Maps | Leaflet.js + react-leaflet | Interactive observation maps |
| Charts | Recharts | Analytics visualizations |
| Backend framework | FastAPI | Async Python REST API |
| Python version | 3.13 | Runtime |
| ORM | SQLAlchemy 2.0 (async) | Database access layer |
| Validation | Pydantic v2 | Request/response schemas |
| Database | Supabase PostgreSQL 15 | Primary data store |
| Object storage | Supabase Storage | Observation photo storage |
| Authentication | Supabase Auth | Google OAuth + email/password, JWT |
| AI (vision) | Google Gemini 3 Flash series (gemini-3.8-flash, 3.7, 3.5-lite) | Multimodal species identification |
| AI (reasoning) | Google Gemini 3 Flash series (gemini-3.8-flash, 3.7) | Quality scoring, FHIR translation, expert briefs |
| AI (fast inference) | Groq (qwen/qwen3.8-27b) | Description parsing, metadata validation, impact generation |
| Migrations | Alembic | Database schema versioning |
| Package manager (Python) | uv | Dependency resolution and virtual environments |
| Package manager (JS) | pnpm | Frontend dependency management |
| Health data standard | HL7 FHIR R4 | Interoperable health observations |
| FHIR sandbox | HAPI FHIR (hapi.fhir.org) | Testing FHIR resource submission |

---

## Project Structure

```
StreamSense/
|
|-- backend/
|   |-- app/
|   |   |-- agents/                 # AI triage pipeline
|   |   |   |-- orchestrator.py     # Parallel execution engine + SSE streaming
|   |   |   |-- vision.py           # Agent 1: Gemini multimodal species ID
|   |   |   |-- description.py      # Agent 2: free-text parameter extraction
|   |   |   |-- metadata.py         # Agent 3: GPS/timestamp/GBIF validation
|   |   |   |-- quality.py          # Agent 4: weighted confidence scoring
|   |   |   |-- fhir_translator.py  # Agent 5: FHIR R4 resource generation
|   |   |   |-- impact.py           # Agent 6: citizen impact receipt
|   |   |   |-- expert_brief.py     # Agent 7: researcher review brief
|   |   |   |-- base.py             # Abstract agent base class
|   |   |   +-- prompts/            # System prompts and reference data
|   |   |       |-- vision_config.py       # 15 target taxa, BMWP scores
|   |   |       |-- description_prompt.py  # 14-parameter extraction schema
|   |   |       |-- metadata_prompt.py     # Anomaly detection rules
|   |   |       |-- quality_prompt.py      # Scoring weights and thresholds
|   |   |       |-- fhir_prompt.py         # FHIR R4 mapping instructions
|   |   |       |-- impact_prompt.py       # Impact receipt tone/format
|   |   |       +-- expert_brief_prompt.py # Review brief structure
|   |   |
|   |   |-- api/                    # FastAPI route handlers
|   |   |   |-- router.py           # Central router aggregation
|   |   |   |-- auth.py             # Session exchange
|   |   |   |-- observations.py     # CRUD + pipeline trigger
|   |   |   |-- review.py           # Expert review queue + actions
|   |   |   |-- validated.py        # Validated data + GeoJSON
|   |   |   |-- analytics.py        # Time series + distributions
|   |   |   |-- fhir.py             # FHIR resources + sandbox export
|   |   |   +-- volunteer_stats.py  # Gamification statistics
|   |   |
|   |   |-- models/                 # SQLAlchemy ORM models
|   |   |   |-- observation.py      # Core observation table
|   |   |   |-- ai_result.py        # Per-agent JSON result storage
|   |   |   |-- expert_review.py    # Researcher review actions
|   |   |   |-- fhir_resource.py    # Generated FHIR resources
|   |   |   |-- user.py             # Auth profiles and roles
|   |   |   |-- notification.py     # In-app notifications
|   |   |   |-- species_reference.py# Taxa catalog
|   |   |   +-- enums.py            # Status and role enumerations
|   |   |
|   |   |-- schemas/                # Pydantic request/response models
|   |   |-- services/               # Business logic layer
|   |   |   |-- observation_service.py  # Observation CRUD + scope filtering
|   |   |   |-- review_service.py       # Review workflow
|   |   |   |-- fhir_service.py         # FHIR generation
|   |   |   |-- storage_service.py      # Supabase Storage adapter
|   |   |   |-- gemini_client.py        # Google Gemini API wrapper
|   |   |   |-- groq_client.py          # Groq API wrapper
|   |   |   +-- dipteracast_mock.py     # DipteraCAST integration mock
|   |   |
|   |   |-- middleware/             # JWT auth + error handling
|   |   |-- utils/                  # Geocoding, weather, GBIF lookups
|   |   |-- config.py              # Environment configuration
|   |   |-- database.py            # Async SQLAlchemy session factory
|   |   +-- main.py                # FastAPI application entry point
|   |
|   |-- migrations/                # Alembic database migrations
|   |-- tests/                     # pytest test suite
|   |-- seed/                      # Demo data and species reference
|   +-- pyproject.toml             # Python project configuration
|
|-- frontend/
|   |-- src/
|   |   |-- app/
|   |   |   |-- (auth)/            # Authentication route group
|   |   |   |   |-- login/page.tsx          # Login page
|   |   |   |   +-- callback/route.ts       # OAuth callback handler
|   |   |   |
|   |   |   |-- (volunteer)/       # Volunteer panel route group
|   |   |   |   |-- layout.tsx              # Sidebar + header shell
|   |   |   |   +-- volunteer/
|   |   |   |       |-- dashboard/page.tsx  # Dashboard with stats + gamification
|   |   |   |       |-- submit/page.tsx     # Photo submission form
|   |   |   |       |-- history/page.tsx    # Past observations list
|   |   |   |       |-- map/page.tsx        # Interactive observation map
|   |   |   |       |-- health/page.tsx     # Field safety + acceptance tips
|   |   |   |       +-- observation/[id]/page.tsx  # Observation detail
|   |   |   |
|   |   |   |-- (researcher)/      # Researcher panel route group
|   |   |   |   |-- layout.tsx              # Desktop sidebar shell
|   |   |   |   +-- researcher/
|   |   |   |       |-- dashboard/page.tsx  # KPIs + gamification
|   |   |   |       |-- review/page.tsx     # Review queue
|   |   |   |       |-- review/[id]/page.tsx# Review detail + actions
|   |   |   |       |-- validated/page.tsx  # Validated data table/map
|   |   |   |       |-- validated/[id]/page.tsx
|   |   |   |       |-- analytics/page.tsx  # Charts + distributions
|   |   |   |       |-- fhir/page.tsx       # FHIR resource cards + export
|   |   |   |       +-- observation/[id]/page.tsx
|   |   |   |
|   |   |   |-- api/geocode/route.ts  # Server-side geocoding proxy
|   |   |   |-- layout.tsx            # Root layout
|   |   |   +-- page.tsx              # Landing page
|   |   |
|   |   |-- components/
|   |   |   |-- volunteer/          # Volunteer-specific components
|   |   |   |   |-- submission-form.tsx      # Photo + description form
|   |   |   |   |-- processing-animation.tsx # SSE pipeline progress
|   |   |   |   |-- species-card.tsx         # Identified species display
|   |   |   |   |-- ai-feedback.tsx          # AI analysis breakdown
|   |   |   |   |-- impact-receipt.tsx       # One Health impact card
|   |   |   |   |-- detailed-report.tsx      # Full observation report
|   |   |   |   +-- volunteer-gamification.tsx # XP, badges, missions
|   |   |   |
|   |   |   |-- researcher/        # Researcher-specific components
|   |   |   |   |-- review-queue.tsx         # Filterable review table
|   |   |   |   |-- review-detail.tsx        # Side-by-side review view
|   |   |   |   |-- validated-table.tsx      # Validated data table
|   |   |   |   |-- observation-map.tsx      # Leaflet map component
|   |   |   |   |-- analytics-charts.tsx     # Recharts visualizations
|   |   |   |   |-- fhir-viewer.tsx          # FHIR JSON viewer
|   |   |   |   +-- researcher-gamification.tsx
|   |   |   |
|   |   |   |-- shared/            # Cross-panel components
|   |   |   |   |-- sidebar.tsx              # Volunteer navigation
|   |   |   |   |-- researcher-sidebar.tsx   # Researcher navigation
|   |   |   |   |-- header.tsx               # Top bar with auth
|   |   |   |   |-- observation-card.tsx     # Reusable observation card
|   |   |   |   |-- confidence-gauge.tsx     # Circular confidence meter
|   |   |   |   |-- status-badge.tsx         # Color-coded status pills
|   |   |   |   |-- loading-skeleton.tsx     # Skeleton loading states
|   |   |   |   |-- error-boundary.tsx       # Error fallback UI
|   |   |   |   |-- notification-bell.tsx    # Notification dropdown
|   |   |   |   +-- dipteracast-card.tsx     # DipteraCAST risk card
|   |   |   |
|   |   |   +-- ui/                # shadcn/ui primitives
|   |   |
|   |   |-- hooks/use-auth.ts      # Authentication state hook
|   |   |-- lib/
|   |   |   |-- api.ts             # Backend API client
|   |   |   |-- utils.ts           # Utility functions
|   |   |   +-- supabase/          # Supabase client (browser + server)
|   |   |-- middleware.ts          # Auth redirect middleware
|   |   +-- types/index.ts        # Shared TypeScript interfaces
|   |
|   |-- public/images/observations/  # Demo observation photos
|   +-- package.json
|
|-- docs/                          # 11 specification documents
+-- README.md
```

---

## Getting Started

### Prerequisites

- Python 3.13+
- Node.js 20+
- pnpm 9+
- uv (Python package manager)
- A Supabase project (free tier works)
- Google Gemini API key
- Groq API key

### Backend

```bash
cd backend

# Create virtual environment and install dependencies
uv sync

# Copy environment template and fill in your keys
cp .env.example .env
# Edit .env with your Supabase URL, keys, Gemini key, Groq key

# Run database migrations
uv run alembic upgrade head

# Seed species reference data
uv run python -m seed.run_seed

# Start the development server
uv run uvicorn app.main:app --reload --port 8000
```

The API server runs at `http://localhost:8000`. Interactive Swagger docs are available at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local
# Edit .env.local with your Supabase URL, anon key, and backend URL

# Start the development server
pnpm dev
```

The frontend runs at `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service role key (server-side only) |
| `SUPABASE_JWT_SECRET` | JWT secret for token verification |
| `DATABASE_URL` | PostgreSQL connection string (async: `postgresql+asyncpg://...`) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GROQ_API_KEY` | Groq API key |
| `FHIR_SANDBOX_URL` | FHIR server base URL (default: `https://hapi.fhir.org/baseR4`) |
| `FRONTEND_URL` | Frontend origin for CORS (default: `http://localhost:3000`) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `NEXT_PUBLIC_API_URL` | Backend API base URL (default: `http://localhost:8000`) |

---

## API Overview

All endpoints are prefixed with `/api/v1`. Authentication is via Supabase JWT in the `Authorization: Bearer <token>` header.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/session` | Public | Exchange Supabase token for session |
| GET | `/observations` | Required | List observations (paginated, scope-filtered) |
| POST | `/observations` | Required | Submit new observation (triggers AI pipeline) |
| GET | `/observations/{id}` | Required | Get observation detail with AI results |
| DELETE | `/observations/{id}` | Required | Soft-delete observation (role-scoped) |
| GET | `/observations/stats` | Required | Volunteer gamification statistics |
| GET | `/observations/{id}/stream` | Required | SSE stream of pipeline progress |
| GET | `/review/queue` | Researcher | Pending observations for expert review |
| POST | `/review/{id}/confirm` | Researcher | Confirm observation as valid |
| POST | `/review/{id}/correct` | Researcher | Accept with corrections |
| POST | `/review/{id}/reject` | Researcher | Reject observation |
| GET | `/validated` | Researcher | List validated observations |
| GET | `/validated/geojson` | Researcher | GeoJSON feature collection |
| GET | `/analytics/overview` | Researcher | Aggregated statistics |
| GET | `/analytics/timeseries` | Researcher | Observations over time |
| GET | `/analytics/species` | Researcher | Species distribution |
| GET | `/fhir/resources` | Researcher | List FHIR resources |
| GET | `/fhir/resources/{id}` | Researcher | Get single FHIR resource |
| POST | `/fhir/export` | Researcher | Batch export to FHIR sandbox |
| POST | `/fhir/resources/{id}/export` | Researcher | Export single resource to sandbox |

---

## External Integrations

| Service | Purpose | Endpoint |
|---------|---------|----------|
| **GBIF** (Global Biodiversity Information Facility) | Validate species occurrence plausibility against known distribution records | `api.gbif.org/v1/occurrence/search` |
| **OpenWeatherMap** | Fetch weather conditions at observation time/location for metadata validation | `api.openweathermap.org/data/2.5/weather` |
| **Nominatim** (OpenStreetMap) | Reverse geocode GPS coordinates to human-readable location names | `nominatim.openstreetmap.org/reverse` |
| **HAPI FHIR Sandbox** | Submit generated FHIR R4 resources for interoperability testing | `hapi.fhir.org/baseR4` |
| **DipteraCAST** (mocked) | Disease vector population model feed -- demonstrates forward integration path | Internal mock service |

---

## Documentation

The `docs/` directory contains 11 specification documents written before implementation began. They cover every design decision from product requirements to database schema to agent prompt engineering:

| Document | Contents |
|----------|----------|
| [01 -- PRD](docs/01_PRD.md) | Product vision, problem statement, user personas, user stories, functional requirements, success metrics, risk register |
| [02 -- Feature Matrix](docs/02_FEATURE_MATRIX.md) | Complete feature inventory with priority levels and implementation status |
| [03 -- Tech Stack](docs/03_TECH_STACK.md) | Technology selection rationale for every layer of the stack |
| [04 -- System Architecture](docs/04_SYSTEM_ARCHITECTURE.md) | Component topology, data flow, auth architecture, deployment model |
| [05 -- Agentic AI Workflow](docs/05_AGENTIC_AI_WORKFLOW.md) | Full specification of the 7-agent pipeline: inputs, outputs, prompts, execution model, error handling, rate limiting |
| [06 -- Database Schema](docs/06_DATABASE_SCHEMA.md) | All table definitions, column types, constraints, indexes, RLS policies |
| [07 -- API Keys Manual](docs/07_API_KEYS_MANUAL.md) | Step-by-step setup guide for every external API key |
| [08 -- FHIR Specification](docs/08_FHIR_SPEC.md) | FHIR R4 resource templates, OAH profile constraints, code mappings (LOINC/SNOMED), sandbox API reference |
| [09 -- UI/UX Specification](docs/09_UI_UX_SPEC.md) | Design tokens, component specs, page layouts, responsive breakpoints, accessibility requirements |
| [10 -- Development Roadmap](docs/10_DEVELOPMENT_ROADMAP.md) | 7-phase build plan with task tables, exit criteria, and dependency chains |
| [11 -- AI Build Instructions](docs/11_AI_BUILD_INSTRUCTIONS.md) | Phase-by-phase implementation prompts for AI-assisted development |

---

## Hackathon Context

### OneAquaHealth IEEE Global Hackathon 2026

- **Primary Track:** **Track 3 -- AI-Supported Assessment** (Agentic AI for Health Intelligence)
- **Cross-Cutting Track:** **Track 7 -- Digital Health Standards** (HL7 FHIR R4 Interoperability)

The OneAquaHealth project is an EU-funded consortium studying the relationship between urban freshwater ecosystems and public health across five European pilot cities. The hackathon challenges teams to build tools that connect citizen science data to health information systems using AI and the FHIR health data standard.

### How StreamSense Addresses the Judging Criteria

**Technical implementation.** Seven-agent AI pipeline with parallel execution, real-time SSE streaming, weighted confidence scoring, and automated routing. Full-stack application with 20+ REST endpoints, async database operations, and role-based access control.

**Innovation and creativity.** No existing citizen science platform provides instant AI triage with explainable confidence scores. The dual-routing architecture (auto-validate vs. expert review) is novel -- it reduces expert workload by 80% while maintaining data quality through targeted human oversight on genuinely ambiguous submissions.

**One Health alignment.** Direct pipeline from citizen observations through AI triage to FHIR R4 health records. Disease vector detection (Culicidae, Simuliidae) is surfaced as a first-class concern in the AI pipeline, impact receipts, and FHIR output. DipteraCAST integration demonstrates the path from ecological monitoring to epidemiological prediction.

**FHIR compliance.** Resources conform to the OneAquaHealth Implementation Guide profile (`observation-indicators-oah`). Components use the StreamSense code system mapped to LOINC and SNOMED CT where applicable. Resources are validated and exportable to any FHIR R4 server.

**User experience.** Mobile-first volunteer interface with instant feedback (3-5 second pipeline). Gamification (XP, badges, missions) computed from real data to sustain engagement. Researcher interface designed for efficiency: AI-generated expert briefs reduce review time from 10 minutes to 30 seconds for straightforward cases.

### Pilot Cities

| City | Country | Stream Context |
|------|---------|----------------|
| Coimbra | Portugal | Ribeira dos Covoes watershed |
| Toulouse | France | Garonne tributary urban streams |
| Benevento | Italy | Calore Irpino river system |
| Ghent | Belgium | Coupure and Lieve canal network |
| Oslo | Norway | Alna river urban corridor |

---

## License

Built for the OneAquaHealth IEEE Global Hackathon 2026. All rights reserved.
