# StreamSense — Product Requirements Document (PRD)

> **Document ID:** DOC-01
> **Version:** 1.0
> **Last Updated:** September 29, 2026
> **Status:** APPROVED — Ready for implementation
> **Hackathon:** OneAquaHealth IEEE Global Hackathon 2026
> **Deadline:** September 30, 2026

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [Target Users & Personas](#4-target-users--personas)
5. [User Stories](#5-user-stories)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Success Metrics](#8-success-metrics)
9. [Scope Boundaries](#9-scope-boundaries)
10. [Hackathon Constraints](#10-hackathon-constraints)
11. [OneAquaHealth Alignment](#11-oneaquahealth-alignment)
12. [One Health Narrative](#12-one-health-narrative)
13. [Competitive Positioning](#13-competitive-positioning)
14. [Risk Register](#14-risk-register)
15. [Glossary](#15-glossary)

---

## 1. Product Vision

**StreamSense** is an AI-powered smart triage platform that sits between citizen stream observations and researcher analysis. When a volunteer photographs a stream and describes what they see, StreamSense's multi-agent AI pipeline instantly analyzes the photo for species identification, validates the observation's metadata for plausibility, generates an explainable confidence score, and routes the result: high-confidence observations are auto-validated and translated into FHIR health data standards; low-confidence observations are sent to a researcher review queue with AI-highlighted concerns. The citizen receives an impact receipt showing exactly how their data contributes to One Health outcomes.

**One-sentence pitch:**
> "StreamSense turns messy citizen stream photos into trusted, standardized health intelligence — instantly, transparently, and with human expert oversight."

**Why it matters for OneAquaHealth:**
The OneAquaHealth project has built a citizen science app, satellite monitoring (GEOSSIP), disease vector models (DipteraCAST), resilience maps, and FHIR health data standards. But there is no AI layer connecting citizen submissions to validated research data. StreamSense is that missing intelligence layer.

---

## 2. Problem Statement

### 2.1 The Data Quality Cascade

Urban freshwater ecosystems are critical to public health. The OneAquaHealth consortium monitors streams across 5 European pilot cities (Coimbra, Toulouse, Benevento, Ghent, Oslo) using citizen volunteers. But citizen-submitted data suffers from a cascading quality problem:

```
Stage 1: SUBMISSION
  Volunteer takes a blurry photo of a stream, writes "water looks dirty, saw some bugs"
  → No species identification
  → No structured data extraction
  → No quality assessment

Stage 2: ACCUMULATION
  Hundreds of unvalidated observations pile up in a database
  → Researchers cannot use them without manual review
  → Each review takes 5-15 minutes per observation
  → Expert time is the bottleneck (not citizen enthusiasm)

Stage 3: ABANDONMENT
  Researcher reviews 20 observations → discards 15 as unusable
  → 60-80% rejection rate wastes both volunteer and expert time
  → No feedback to volunteers on what they did wrong
  → Volunteers never see their data's impact

Stage 4: CHURN
  Volunteer submits 3 observations, hears nothing back
  → >90% of citizen science volunteers churn within 30 days
  → The monitoring network shrinks
  → Data gaps grow

Stage 5: HEALTH IMPACT DISCONNECT
  Even validated data stays siloed in ecological databases
  → Health authorities cannot access environmental intelligence
  → No connection between stream degradation and disease risk
  → The "One Health" chain is broken at its foundation
```

### 2.2 The Core Insight

The problem is NOT that citizens submit bad data. The problem is that there is no intelligent triage system between submission and use. Researchers waste time on observations that an AI could instantly flag as implausible (GPS says parking lot, photo shows stream) or auto-validate as consistent (species confirmed, location plausible, timestamp matches lighting).

### 2.3 Quantified Impact

| Metric | Current State | With StreamSense |
|--------|--------------|-----------------|
| Observations requiring expert review | 100% | ~20% (only low-confidence) |
| Average time from submission to validation | 3-14 days | <30 seconds (high-conf) / <24h (low-conf) |
| Volunteer feedback on submission | None | Instant (AI analysis + impact receipt) |
| Volunteer 30-day retention | ~10% | Target: 40%+ (via impact receipts) |
| Data format for health systems | CSV/raw | FHIR R4 (global standard) |
| Connection to disease vector models | None | Automatic (DipteraCAST feed) |

---

## 3. Solution Overview

### 3.1 Platform Structure

StreamSense is a two-panel web platform with an AI triage layer:

```
┌─────────────────────────────────────────────────────────┐
│                    STREAMSENSE PLATFORM                   │
│                                                          │
│  ┌──────────────────┐           ┌──────────────────────┐ │
│  │  VOLUNTEER PANEL  │           │  RESEARCHER PANEL     │ │
│  │                   │           │                       │ │
│  │  • Submit photos  │           │  • Review queue       │ │
│  │  • Write desc.    │           │  • Validate/reject    │ │
│  │  • Get AI feedback│           │  • Analytics          │ │
│  │  • Impact receipt │           │  • FHIR export        │ │
│  │  • View history   │           │  • Species dashboard  │ │
│  └────────┬─────────┘           └──────────┬────────────┘ │
│           │                                │              │
│           └────────────┬───────────────────┘              │
│                        │                                  │
│           ┌────────────▼────────────────┐                 │
│           │    AI TRIAGE PIPELINE        │                 │
│           │                             │                 │
│           │  7 specialized AI agents    │                 │
│           │  running in parallel+chain  │                 │
│           │                             │                 │
│           │  Gemini API + Groq API      │                 │
│           │  + BioCLIP 2 (local)        │                 │
│           └─────────────────────────────┘                 │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              EXTERNAL INTEGRATIONS                    │ │
│  │  FHIR Sandbox | GBIF | GEOSSIP | DipteraCAST mock   │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 3.2 The AI Triage Pipeline (7 Agents)

When a citizen submits an observation, 7 AI agents process it:

| Agent | Name | Model | Speed | Purpose |
|-------|------|-------|-------|---------|
| 1 | Vision Analyzer | BioCLIP 2 (local) | ~1-2s | Identifies macroinvertebrates from photos |
| 2 | Description Interpreter | Groq (Llama-3.3-70b) | <500ms | Extracts structured environmental parameters from free-text |
| 3 | Metadata Validator | Groq (Llama-3.3-70b) | <800ms | Checks GPS plausibility, timestamp consistency, occurrence patterns |
| 4 | Quality Scorer | Gemini 2.0 Flash | ~2s | Aggregates all inputs → confidence score + routing decision |
| 5 | FHIR Translator | Gemini 2.0 Flash | ~2s | Converts validated data to FHIR R4 resources |
| 6 | Impact Generator | Groq (Llama-3.3-70b) | <500ms | Writes citizen-facing impact receipt |
| 7 | Expert Brief Generator | Gemini 2.0 Flash | ~2s | For low-confidence: generates expert review brief |

**Execution Pattern:**
- Agents 1, 2, 3 run **in parallel** (all independent of each other)
- Agent 4 waits for all three, then scores
- Based on score: Agent 5+6 (high confidence) OR Agent 7+6 (low confidence) run **in parallel**
- Total pipeline time: **3-5 seconds** per observation

### 3.3 The Two Routing Outcomes

**HIGH CONFIDENCE (score ≥ 70):**
```
Observation → AI Pipeline → Auto-validated
  → FHIR resource created and POSTed to sandbox
  → DipteraCAST data feed updated
  → Citizen receives impact receipt instantly
  → Observation appears in researcher's validated dashboard
```

**LOW CONFIDENCE (score < 70):**
```
Observation → AI Pipeline → Flagged for review
  → Expert brief generated with specific concerns highlighted
  → Observation appears in researcher's review queue
  → Researcher validates/corrects/rejects
  → Citizen receives notification when reviewed
  → If validated: FHIR + DipteraCAST flow triggers
```

---

## 4. Target Users & Personas

### Persona 1: Maria — The Curious Volunteer

| Attribute | Detail |
|-----------|--------|
| **Age** | 34 |
| **Location** | Coimbra, Portugal |
| **Technical skill** | Uses smartphone daily, comfortable with photo apps, no scientific background |
| **Motivation** | Cares about her local stream (Madrigueira). Joined after seeing dead fish. Wants to help but doesn't know what the insects mean. |
| **Frustration** | Submitted 3 observations to the OAH app. Never heard back. Doesn't know if her data was useful. Stopped volunteering after 2 weeks. |
| **StreamSense value** | Instant AI feedback tells her what she photographed. Impact receipt shows her data mattered. She keeps volunteering. |
| **Key user flow** | Open app → Take photo → Write description → Submit → See AI analysis → Receive impact receipt → View history |

### Persona 2: Dr. João — The Overwhelmed Researcher

| Attribute | Detail |
|-----------|--------|
| **Age** | 45 |
| **Location** | University of Coimbra |
| **Technical skill** | Expert ecologist, comfortable with databases and R/Python, not a web developer |
| **Motivation** | Needs validated macroinvertebrate data for biotic index calculations. Wants BMWP/ASPT scores from citizen data. |
| **Frustration** | Receives 200+ observations per week. Must manually review each one. 70% are unusable (blurry photos, wrong GPS, no species info). Spends 15 hours/week on data triage instead of research. |
| **StreamSense value** | AI pre-triages observations. He only reviews the 20% that need expert judgment. Each review includes AI-highlighted concerns so he knows exactly what to check. Saves 12+ hours/week. |
| **Key user flow** | Login → See review queue (only low-confidence) → Click observation → See AI brief with concerns → Validate/Correct/Reject → See validated data dashboard → Export to FHIR |

### Persona 3: Ana — The Public Health Officer

| Attribute | Detail |
|-----------|--------|
| **Age** | 38 |
| **Location** | Coimbra Regional Health Authority |
| **Technical skill** | Uses health information systems daily (FHIR-based). Not an ecologist. |
| **Motivation** | Needs early warning when environmental conditions create disease risk. Currently relies on reactive surveillance (waits for cases to appear). |
| **StreamSense value** | Validated environmental data arrives in FHIR format she can consume. DipteraCAST predictions flag disease vector risk BEFORE outbreaks. She can take preventive action. |
| **Key user flow** | (Indirect user) Receives FHIR-formatted environmental health observations through standard health information system integration. |

---

## 5. User Stories

### 5.1 Volunteer Panel Stories

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|-------------------|
| V-01 | As a volunteer, I want to **create an account** so I can track my contributions | P0 | Email/password registration; profile with name and location |
| V-02 | As a volunteer, I want to **submit a stream observation** with a photo and description so researchers can use my data | P0 | Upload photo (max 10MB, jpg/png/webp); write free-text description (max 1000 chars); auto-capture GPS + timestamp |
| V-03 | As a volunteer, I want to **see instant AI analysis** of my submission so I know what I photographed | P0 | Within 5 seconds: species identification with confidence %, environmental parameters extracted, plausibility assessment |
| V-04 | As a volunteer, I want to **receive an impact receipt** so I know my data matters | P0 | After AI processing: plain-language statement of what the data contributed to (water quality assessment, disease vector monitoring, etc.) |
| V-05 | As a volunteer, I want to **view my observation history** so I can track my contributions | P1 | List of all past submissions with status (auto-validated / pending review / expert-validated / rejected) and AI analysis summary |
| V-06 | As a volunteer, I want to **see my observation on a map** so I can understand the geographic context | P1 | Pin on map showing observation location within the stream network |
| V-07 | As a volunteer, I want to **receive a notification** when an expert reviews my flagged observation | P1 | Push notification or in-app notification with the expert's verdict |
| V-08 | As a volunteer, I want to **understand why my observation was flagged** so I can improve next time | P2 | Plain-language explanation: "Your photo was blurry" / "GPS didn't match a known stream" / "Species couldn't be identified" |
| V-09 | As a volunteer, I want the app to work **offline** so I can use it in remote stream locations | P2 | PWA caches the submission form; queues submissions for upload when connectivity returns |

### 5.2 Researcher Panel Stories

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|-------------------|
| R-01 | As a researcher, I want to **log in to a researcher dashboard** so I can manage observations | P0 | Separate login with researcher role; dashboard landing page |
| R-02 | As a researcher, I want to **see a queue of low-confidence observations** so I only review what needs human judgment | P0 | Filterable list sorted by submission date; shows AI confidence score, species suggestion, flagged concerns |
| R-03 | As a researcher, I want to **see the AI's analysis brief** for each flagged observation so I know exactly what to check | P0 | For each observation: photo, citizen description, AI species prediction with confidence, metadata anomalies, GPS map, recommended action |
| R-04 | As a researcher, I want to **validate, correct, or reject** an observation so the data pipeline can proceed | P0 | Three buttons: "Confirm AI" (accept as-is), "Correct" (modify species/parameters), "Reject" (with reason) |
| R-05 | As a researcher, I want to **see a dashboard of all validated observations** so I can monitor data quality | P0 | Table/map view of validated observations with species, location, date, confidence, validation source (AI/expert) |
| R-06 | As a researcher, I want to **export validated data as FHIR resources** so it can integrate with health systems | P1 | Export button generates FHIR R4 JSON bundles; option to POST directly to OAH FHIR Sandbox |
| R-07 | As a researcher, I want to **see analytics** on submission quality so I can identify volunteer training needs | P1 | Charts: submissions per day, auto-validation rate, common rejection reasons, species distribution |
| R-08 | As a researcher, I want to **filter observations** by date, location, species, confidence score, and status | P1 | Multi-filter interface on both review queue and validated data views |
| R-09 | As a researcher, I want to **see species distribution maps** so I can identify biodiversity patterns | P2 | Heatmap overlay showing validated species occurrences across pilot city streams |
| R-10 | As a researcher, I want to **see BMWP/ASPT biotic index scores** per monitoring site | P2 | Calculated from validated macroinvertebrate data; shows trend over time |

### 5.3 System Stories

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|-------------------|
| S-01 | As the system, I must **process an observation through 7 AI agents** within 5 seconds | P0 | Parallel execution of agents 1-3; sequential agent 4; parallel agents 5+6 or 7+6 |
| S-02 | As the system, I must **store all observations** with their AI analysis results | P0 | Every observation persisted with photo URL, description, GPS, timestamp, all 7 agent outputs, final confidence score |
| S-03 | As the system, I must **generate valid FHIR R4 resources** from validated observations | P0 | FHIR JSON passes fhir.resources Pydantic validation; uses hl7-eu/oah profiles |
| S-04 | As the system, I must **handle AI agent failures gracefully** | P0 | If any agent times out or errors: use fallback response; never crash the pipeline; always return a result to the citizen |
| S-05 | As the system, I must **track observation status** through its lifecycle | P0 | States: submitted → processing → auto_validated / pending_review → expert_validated / rejected |
| S-06 | As the system, I must **protect user data** with authentication and authorization | P0 | Volunteers see only their own data; researchers see all observations; role-based access control |

---

## 6. Functional Requirements

### 6.1 Authentication & Authorization

| Requirement | Detail |
|-------------|--------|
| FR-AUTH-01 | Two user roles: `volunteer` and `researcher` |
| FR-AUTH-02 | Email/password registration and login |
| FR-AUTH-03 | JWT-based session management |
| FR-AUTH-04 | Role-based route protection (volunteer pages vs. researcher pages) |
| FR-AUTH-05 | Researchers are created by admin invite (not self-registration) for demo purposes |

### 6.2 Observation Submission

| Requirement | Detail |
|-------------|--------|
| FR-OBS-01 | Accept image upload (JPEG, PNG, WebP; max 10MB) |
| FR-OBS-02 | Accept free-text description (max 1000 characters) |
| FR-OBS-03 | Auto-capture GPS coordinates from device (with permission prompt) |
| FR-OBS-04 | Auto-capture timestamp (device local time + timezone) |
| FR-OBS-05 | Extract EXIF data from uploaded photo (if available) |
| FR-OBS-06 | Compress and store image in cloud storage; save URL in database |
| FR-OBS-07 | Trigger AI triage pipeline immediately upon successful submission |
| FR-OBS-08 | Show real-time processing status to citizen ("Analyzing your photo...", "Checking location...", etc.) |

### 6.3 AI Triage Pipeline

| Requirement | Detail |
|-------------|--------|
| FR-AI-01 | Execute Agents 1, 2, 3 in parallel upon submission |
| FR-AI-02 | Execute Agent 4 after Agents 1-3 complete |
| FR-AI-03 | Route to Agent 5+6 (high confidence) OR Agent 7+6 (low confidence) based on Agent 4's score |
| FR-AI-04 | Store all agent outputs in database linked to the observation |
| FR-AI-05 | Total pipeline must complete within 10 seconds (target: 5 seconds) |
| FR-AI-06 | If any agent fails: use fallback response, continue pipeline, flag the failure |
| FR-AI-07 | Return AI analysis summary to volunteer's frontend in real-time |

### 6.4 Expert Review

| Requirement | Detail |
|-------------|--------|
| FR-REV-01 | Low-confidence observations appear in researcher review queue |
| FR-REV-02 | Each review item shows: original photo, citizen description, AI species prediction, confidence score, metadata anomalies, GPS on map, AI-generated expert brief |
| FR-REV-03 | Researcher can: Confirm AI analysis, Correct species/parameters, Reject with reason |
| FR-REV-04 | Upon confirmation: trigger FHIR translation + impact receipt (same as auto-validated flow) |
| FR-REV-05 | Upon rejection: update observation status; notify volunteer with reason |
| FR-REV-06 | Review queue supports filtering by date, location, species, confidence score |

### 6.5 FHIR Integration

| Requirement | Detail |
|-------------|--------|
| FR-FHIR-01 | Generate FHIR R4 Observation resources using hl7-eu/oah profiles |
| FR-FHIR-02 | Validate all FHIR resources via fhir.resources Python library before storage |
| FR-FHIR-03 | POST validated FHIR resources to OAH FHIR Sandbox (sandbox.hl7europe.eu) |
| FR-FHIR-04 | Store FHIR resource JSON in database for reference |
| FR-FHIR-05 | Support bulk export of FHIR resources as FHIR Bundle |

### 6.6 Impact Receipts

| Requirement | Detail |
|-------------|--------|
| FR-IMP-01 | Generate plain-language impact statement for every processed observation |
| FR-IMP-02 | Impact receipt must reference: what was identified, confidence level, how the data contributes to One Health |
| FR-IMP-03 | Display impact receipt prominently after submission processing completes |
| FR-IMP-04 | Store impact receipt text in database linked to observation |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Requirement | Target |
|-------------|--------|
| NFR-PERF-01 | AI pipeline completion: <10 seconds (target 5s) |
| NFR-PERF-02 | Page load time: <2 seconds (First Contentful Paint) |
| NFR-PERF-03 | Image upload: <5 seconds for 5MB image |
| NFR-PERF-04 | Database queries: <200ms for standard operations |

### 7.2 Reliability

| Requirement | Target |
|-------------|--------|
| NFR-REL-01 | AI pipeline must never crash — graceful fallbacks for every agent |
| NFR-REL-02 | If FHIR sandbox is unreachable: queue resource, retry later, show cached result |
| NFR-REL-03 | If image upload fails: client-side retry with exponential backoff |

### 7.3 Security

| Requirement | Target |
|-------------|--------|
| NFR-SEC-01 | All API endpoints require authentication (except login/register) |
| NFR-SEC-02 | Role-based access control (volunteers cannot access researcher endpoints) |
| NFR-SEC-03 | Image uploads validated for type and size before processing |
| NFR-SEC-04 | API keys stored in environment variables, never in code |
| NFR-SEC-05 | Rate limiting on submission endpoint (max 10 per minute per user) |

### 7.4 Usability

| Requirement | Target |
|-------------|--------|
| NFR-UX-01 | Mobile-first responsive design (primary use: field observation on smartphone) |
| NFR-UX-02 | Maximum 3 taps from app open to observation submitted |
| NFR-UX-03 | AI processing feedback: animated progress indicators showing each agent's status |
| NFR-UX-04 | Color palette: warm, earthy, nature-inspired (NOT clinical blue/white) |
| NFR-UX-05 | Typography: clean, readable, friendly (NOT corporate/sterile) |
| NFR-UX-06 | All UI text in plain English (no jargon for volunteer panel) |
| NFR-UX-07 | Researcher panel: information-dense but organized (dashboard-style) |

---

## 8. Success Metrics

### 8.1 Hackathon Success (Judging Criteria)

| Criterion | Weight | How StreamSense Scores |
|-----------|--------|----------------------|
| Impact & Alignment | 30% | Solves foundational data quality cascade; genuine One Health chain; integrates 5 OAH tools |
| Innovation & Creativity | 20% | Multi-agent triage pipeline for citizen science validation — no existing implementation |
| Technical Implementation | 20% | 7 AI agents with parallel execution; FHIR R4; live sandbox integration |
| Usability & UX | 15% | Cozy, warm design; instant feedback; impact receipts; expert time savings |
| Feasibility & Scalability | 15% | Built on standard tech; FHIR scales globally; pipeline architecture is city-agnostic |

### 8.2 Demo Success Metrics

| Metric | Target |
|--------|--------|
| Demo understands the problem in <30 seconds | Yes — open with Maria's story |
| "Magic moment" is memorable | Yes — instant AI analysis + impact receipt |
| Shows technical depth without being boring | Yes — brief architecture walkthrough mid-demo |
| Demo is under 5 minutes | Yes — scripted to 4:30 |
| Something actually works live | Yes — real photo → real AI → real FHIR POST |

---

## 9. Scope Boundaries

### 9.1 IN SCOPE (We Build This)

| Feature | Detail |
|---------|--------|
| Volunteer panel | Registration, observation submission, AI feedback, impact receipts, history |
| Researcher panel | Login, review queue, validate/correct/reject, validated data dashboard, analytics, FHIR export |
| AI triage pipeline | 7 agents (Vision, Description, Metadata, Quality, FHIR, Impact, Expert Brief) |
| FHIR integration | Generate + validate + POST FHIR R4 resources to live OAH sandbox |
| DipteraCAST connection | Mock integration with realistic data contract (no public API exists) |
| GBIF integration | Species occurrence lookup for plausibility validation |
| Image storage | Cloud-based image upload and storage |
| Authentication | Email/password with role-based access |

### 9.2 OUT OF SCOPE (We Do NOT Build This)

| Feature | Reason |
|---------|--------|
| Mobile native app (iOS/Android) | PWA is sufficient for hackathon; responsive web works on all devices |
| Real-time chat between volunteer and researcher | Adds complexity without demo value |
| Payment/subscription system | Not relevant |
| Admin panel for user management | Researchers created via database seed for demo |
| Offline photo processing (edge AI) | Requires significant ML engineering; out of hackathon scope |
| Real DipteraCAST integration | No public API exists — mock with realistic data contract |
| Multi-language support | English only for demo; architecture supports i18n |
| User profile editing | Not needed for demo flow |
| Social features (follow, like, comment) | Not relevant to the scientific mission |
| Complex BMWP/ASPT calculation | Can show projected scores but full calculation requires extensive validated data |

---

## 10. Hackathon Constraints

| Constraint | Detail |
|-----------|--------|
| **Timeline** | 6 days (September 24-30, 2026) |
| **Team size** | Solo developer + AI coding agents |
| **Demo format** | 3-5 minute video (screen recording + narration) |
| **Submission platform** | Devpost |
| **Required deliverables** | Working prototype, demo video, README, source code |
| **Judging** | 10 judges, 5 are OAH consortium insiders |
| **Competition** | ~200-400 competing submissions from 1,010 registrants |
| **Prize pool** | $3,500+ |
| **Judging weights** | Impact 30% / Innovation 20% / Technical 20% / UX 15% / Feasibility 15% |

### Design Philosophy for Hackathon

1. **Depth over breadth** — Do 3 features perfectly rather than 10 features poorly
2. **One happy path** — The demo shows one observation flowing through the entire pipeline flawlessly
3. **Real integrations** — Use the actual FHIR sandbox, actual GBIF API, actual BioCLIP model
4. **Honest architecture** — Don't claim "agentic AI" for sequential function calls; call it a "smart triage pipeline"
5. **Cozy design** — Warm, nature-inspired UI that feels handcrafted, not templated

---

## 11. OneAquaHealth Alignment

### 11.1 OAH Tools We Integrate

| OAH Tool | How StreamSense Uses It | Integration Depth |
|----------|------------------------|-------------------|
| **Citizen Science App** | StreamSense extends the citizen observation concept with AI validation | Conceptual (we build our own submission flow) |
| **FHIR Sandbox** | We POST validated observations as FHIR R4 resources | Deep (live REST API integration) |
| **FHIR IG (hl7-eu/oah)** | We use the actual OAH profiles (observation-indicators-oah, observation-health-measure-oah, location-oah) | Deep (profile-compliant resource generation) |
| **DipteraCAST** | We mock the disease vector prediction model with a realistic data contract | Moderate (mock, but demonstrates architectural readiness) |
| **GEOSSIP** | We use GEOSSIP satellite data concepts for macro-level land-use verification | Light (used in metadata validation) |

### 11.2 OAH Vocabulary Used

StreamSense uses OneAquaHealth terminology throughout:
- "Urban stream" (not "river" or "creek")
- "Citizen scientist" or "volunteer" (not "user")
- "Observation" (not "submission" or "report")
- "Monitoring site" (not "location")
- Biotic indices: BMWP, ASPT, EPT
- Pilot cities: Coimbra, Toulouse, Benevento, Ghent, Oslo

### 11.3 FAIR Data Principles Compliance

| Principle | How StreamSense Complies |
|-----------|------------------------|
| **Findable** | Every observation has a unique ID; metadata is searchable |
| **Accessible** | FHIR R4 REST API provides standardized access |
| **Interoperable** | FHIR format is the global health data interoperability standard; LOINC/SNOMED codes used |
| **Reusable** | Validated observations include provenance (who submitted, AI analysis, expert validation) |

---

## 12. One Health Narrative

The complete One Health chain that StreamSense enables:

```
1. ENVIRONMENTAL MONITORING
   Citizen photographs stream → observes conditions → describes what they see

2. AI-POWERED VALIDATION
   StreamSense's 7 agents analyze → identify species → validate metadata →
   generate confidence score

3. DATA QUALITY ASSURANCE
   High confidence → auto-validated
   Low confidence → expert review → corrected/confirmed

4. HEALTH DATA STANDARDS
   Validated observation → FHIR R4 resource → POSTed to OAH FHIR Sandbox →
   Available to health information systems worldwide

5. DISEASE VECTOR PREDICTION
   Validated macroinvertebrate data → DipteraCAST model →
   Predicts disease vector activity (Culex, Aedes mosquito populations)

6. PUBLIC HEALTH ACTION
   Disease vector prediction → health authority alert →
   Preventive intervention (larviciding, community warning) →
   Disease outbreak PREVENTED

7. CITIZEN FEEDBACK LOOP
   Volunteer receives impact receipt:
   "Your observation helped predict disease risk in your neighborhood.
    Community protective action has been initiated."
   → Volunteer stays engaged → more data → better monitoring
```

**This is One Health in action:** citizen science → environmental monitoring → disease prediction → public health → back to citizen engagement.

---

## 13. Competitive Positioning

| Platform | Image Submit | Description | AI Validation | Instant Feedback | FHIR Output | Disease Vector Link | Impact Receipt |
|----------|-------------|-------------|---------------|-----------------|-------------|--------------------|-|
| **iNaturalist** | ✅ | ✅ | ✅ (community + CV) | ✅ (species ID) | ❌ | ❌ | ❌ |
| **CrowdWater** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **FreshWater Watch** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Water Rangers** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **miniSASS** | ✅ | ✅ | ⚠️ (early) | ❌ | ❌ | ❌ | ❌ |
| **OAH Citizen App** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **StreamSense** | ✅ | ✅ | ✅ **(7-agent pipeline)** | ✅ **(instant + explainable)** | ✅ **(FHIR R4)** | ✅ **(DipteraCAST)** | ✅ |

**StreamSense's unique combination that no other platform offers:**
1. Multi-agent AI validation (not just species ID — metadata checks, quality scoring, explainability)
2. FHIR-compliant health data output (zero competitors)
3. Disease vector prediction connection (zero competitors)
4. Instant impact receipts closing the citizen engagement loop
5. Expert triage queue that saves researcher time (not just crowdsourced validation)

---

## 14. Risk Register

| ID | Risk | Probability | Impact | Mitigation |
|----|------|------------|--------|-----------|
| R-01 | BioCLIP 2 accuracy for aquatic macroinvertebrates is low under field conditions | HIGH | HIGH | Curate 15-20 indicator taxa; use confidence thresholds aggressively; route uncertain cases to experts; be transparent about prototype status |
| R-02 | Scope creep — trying to build too many features | HIGH | HIGH | Strict P0/P1/P2 priority system; cut P2 features if behind schedule; focus on one perfect happy path |
| R-03 | FHIR sandbox is unreachable during demo | MEDIUM | HIGH | Cache a successful FHIR POST response; show the resource structure regardless; have fallback screenshots |
| R-04 | AI pipeline takes >10 seconds | MEDIUM | MEDIUM | Groq is extremely fast (<500ms); BioCLIP runs locally; Gemini Flash is fast; parallel execution reduces wall-clock time |
| R-05 | Gemini or Groq API rate limits exceeded | LOW | HIGH | Implement retry with backoff; cache responses for identical inputs; use Groq for speed-critical agents, Gemini for quality-critical |
| R-06 | Demo video quality insufficient | MEDIUM | HIGH | Script demo in advance; pre-stage demo data; rehearse 3x before recording; use OBS Studio with good microphone |
| R-07 | DipteraCAST mock doesn't impress Koutalieris (he built the real one) | MEDIUM | MEDIUM | Study published DipteraCAST inputs/outputs exhaustively; show the data contract explicitly; frame as "architectural readiness" |
| R-08 | Judges perceive "7 agents" as buzzword padding | MEDIUM | MEDIUM | Show the parallel execution diagram; demonstrate real speed difference; be honest about what's an agent vs. a function |
| R-09 | Frontend looks generic/templated | MEDIUM | MEDIUM | Use custom color palette, earthy typography, nature-inspired design tokens; avoid default shadcn colors |
| R-10 | Database migration issues during development | LOW | MEDIUM | Use Supabase migrations; test schema changes on dev branch first |

---

## 15. Glossary

| Term | Definition |
|------|-----------|
| **ASPT** | Average Score Per Taxon — BMWP score divided by number of scoring families |
| **BioCLIP 2** | Open-source vision model trained on TreeOfLife-200M dataset; available via `pybioclip` |
| **Biotic index** | Numerical score representing biological health of a water body based on indicator species |
| **BMWP** | Biological Monitoring Working Party — scoring system for water quality based on macroinvertebrate families |
| **DipteraCAST** | Disease vector prediction model built by ENORA Innovation (Judge Koutalieris's organization) |
| **EPT** | Ephemeroptera (mayflies), Plecoptera (stoneflies), Trichoptera (caddisflies) — pollution-sensitive indicator groups |
| **FAIR** | Findable, Accessible, Interoperable, Reusable — data principles |
| **FHIR** | Fast Healthcare Interoperability Resources — HL7 standard for health data exchange |
| **FHIR IG** | FHIR Implementation Guide — profile specifications (hl7-eu/oah for OneAquaHealth) |
| **GBIF** | Global Biodiversity Information Facility — species occurrence database |
| **GEOSSIP** | OAH satellite/Earth Observation tool for spectral indices |
| **Groq** | Ultra-fast LLM inference platform; we use Llama-3.3-70b-versatile |
| **HITL** | Human-in-the-Loop — expert review for uncertain AI decisions |
| **LOINC** | Logical Observation Identifiers Names and Codes — standard coding system for clinical observations |
| **Macroinvertebrate** | Organisms without a backbone visible to the naked eye; key bioindicators for stream health |
| **OAH** | OneAquaHealth |
| **One Health** | Framework recognizing interconnection between human, animal, and environmental health |
| **PWA** | Progressive Web App — web app installable on mobile devices |
| **SNOMED** | Systematized Nomenclature of Medicine — clinical terminology system |
| **Triage** | Process of sorting/prioritizing items for attention — StreamSense triages citizen observations |

---

*End of DOC-01: Product Requirements Document*
*Next document: DOC-02 Feature Matrix*
