# StreamSense — Feature Matrix (DOC 02)

> **Document ID:** DOC-02
> **Version:** 1.0
> **Last Updated:** September 29, 2026
> **Depends On:** DOC-01 (PRD)

---

## Table of Contents

1. [Priority Tier System](#1-priority-tier-system)
2. [Core Features (P0 — Must Have)](#2-core-features-p0--must-have)
3. [Differentiator Features (P1 — Strong Edge)](#3-differentiator-features-p1--strong-edge)
4. [Polish Features (P2 — Nice to Have)](#4-polish-features-p2--nice-to-have)
5. [Feature-to-Judge Mapping](#5-feature-to-judge-mapping)
6. [Feature-to-Criteria Mapping](#6-feature-to-criteria-mapping)
7. [Feature Dependency Graph](#7-feature-dependency-graph)
8. [Cut List](#8-cut-list)
9. [Winning Edge Strategy](#9-winning-edge-strategy)

---

## 1. Priority Tier System

| Tier | Definition | Rule |
|------|-----------|------|
| **P0** | Demo breaks without this feature. The core pipeline cannot be demonstrated. | Must be complete before ANY other work. No exceptions. |
| **P1** | Strong differentiator that specifically targets judge preferences or maximizes scoring on a criterion. | Build after all P0 features work end-to-end. |
| **P2** | Polish that makes the platform feel professional and complete, but doesn't change the core demo story. | Build only if time permits after P0 + P1 are stable. |

**Rule of thumb:** If we run out of time, every P0 feature must work perfectly. P1 features are the competitive edge. P2 features are the "wow, they even thought of that" layer.

---

## 2. Core Features (P0 — Must Have)

### F-01: User Authentication & Role Management

| Attribute | Detail |
|-----------|--------|
| **Description** | Email/password registration and login with two roles: `volunteer` and `researcher`. Route users to the correct panel based on role. |
| **Volunteer flow** | Register → verify email (optional for demo) → login → volunteer panel |
| **Researcher flow** | Pre-seeded researcher account → login → researcher panel |
| **Technical** | Supabase Auth with JWT; role stored in user metadata; middleware route protection |
| **Acceptance** | Volunteer cannot access researcher routes. Researcher cannot submit observations. Login persists across browser refreshes. |
| **Priority** | P0 |
| **Estimated effort** | 3-4 hours |

### F-02: Observation Submission Form

| Attribute | Detail |
|-----------|--------|
| **Description** | Volunteer uploads a photo of a stream, writes a free-text description, and submits. GPS and timestamp are auto-captured. |
| **Photo upload** | Accept JPEG/PNG/WebP, max 10MB. Show image preview before submission. Compress client-side if >5MB. Store in Supabase Storage. |
| **Description field** | Textarea, max 1000 chars, with character counter. Placeholder: "Describe what you see — water color, flow, any organisms, smells, anything unusual..." |
| **GPS capture** | Use browser Geolocation API. Show "Getting your location..." with spinner. Fallback: allow manual pin placement on mini-map. |
| **Timestamp** | Auto-capture device time with timezone. Display as human-readable. |
| **Validation** | Photo required. Description optional but encouraged (show hint). GPS required (block submission without it). |
| **Submit action** | Upload image → create observation record → trigger AI pipeline → redirect to processing screen |
| **Priority** | P0 |
| **Estimated effort** | 4-5 hours |

### F-03: AI Triage Pipeline (Backend)

| Attribute | Detail |
|-----------|--------|
| **Description** | The core intelligence of StreamSense. 7 AI agents process each observation. |
| **Execution** | Agents 1+2+3 parallel → Agent 4 sequential → Agents 5+6 or 7+6 parallel |
| **Agent 1 (Vision)** | BioCLIP 2 via `pybioclip`. Input: image. Output: top-5 species predictions with confidence scores. Target: 15-20 curated taxa. |
| **Agent 2 (Description)** | Groq Llama-3.3-70b. Input: free-text. Output: structured JSON with extracted parameters (water_color, flow_speed, turbidity, odor, organisms_mentioned, debris, algae_presence). |
| **Agent 3 (Metadata)** | Groq Llama-3.3-70b + external API calls. Input: GPS, timestamp, EXIF. Actions: reverse geocode GPS → check if near water body; compare timestamp to local sunrise/sunset; query GBIF for species occurrence at location. Output: validation JSON with anomaly flags. |
| **Agent 4 (Quality)** | Gemini 2.0 Flash. Input: outputs from agents 1+2+3. Calculates weighted confidence score (0-100). Determines routing: ≥70 = auto-validate, <70 = expert review. Output: score, reasoning, routing decision. |
| **Agent 5 (FHIR)** | Gemini 2.0 Flash. Input: validated observation data. Generates FHIR R4 Observation resource using hl7-eu/oah profiles. Validates via fhir.resources. Output: valid FHIR JSON. |
| **Agent 6 (Impact)** | Groq Llama-3.3-70b. Input: quality score + species data + routing. Generates plain-language impact receipt for citizen. Output: impact text (2-3 sentences). |
| **Agent 7 (Expert Brief)** | Gemini 2.0 Flash. Input: all agent outputs for low-confidence observation. Generates concise review brief highlighting specific concerns. Output: brief JSON with concerns list and recommended actions. |
| **Error handling** | Every agent has a fallback response. Pipeline never crashes. If BioCLIP fails: proceed without vision data. If Groq fails: retry once, then use Gemini as backup. |
| **Priority** | P0 |
| **Estimated effort** | 10-12 hours |

### F-04: AI Feedback Display (Volunteer)

| Attribute | Detail |
|-----------|--------|
| **Description** | After AI pipeline completes, show the volunteer a beautiful, easy-to-understand summary of what the AI found. |
| **Layout** | Full-screen result card with sections: Species Identified (with confidence %), Environmental Observations (extracted from description), Data Quality Score (visual gauge), and Impact Receipt. |
| **Species display** | Show top species prediction with common name, scientific name, confidence percentage. Visual indicator: green (high conf), yellow (moderate), red (low). If multiple species: show top 3 with confidence bars. |
| **Quality score** | Circular gauge or progress bar showing 0-100 score. Color-coded: green (≥70, auto-validated), amber (<70, sent to expert). |
| **Status indicator** | Clear badge: "✅ Auto-Validated" or "🔍 Sent for Expert Review" |
| **Impact receipt** | Highlighted card with the impact statement: "Your observation helped assess water quality at Madrigueira stream. The macroinvertebrate data contributes to disease vector monitoring in your region." |
| **Priority** | P0 |
| **Estimated effort** | 4-5 hours |

### F-05: Researcher Review Queue

| Attribute | Detail |
|-----------|--------|
| **Description** | Researchers see a list of low-confidence observations requiring human expert judgment. Each item is enriched with AI-generated context. |
| **Queue list** | Table/card list showing: thumbnail, submission date, location (city name), confidence score, primary species suggestion, number of anomaly flags. Sorted by date (newest first). |
| **Detail view** | Click observation → full detail page: original photo (zoomable), citizen's description, GPS on mini-map, all AI agent outputs formatted readable, expert brief with highlighted concerns. |
| **Actions** | Three buttons: "Confirm AI Analysis" (accept as-is → triggers FHIR flow), "Correct" (opens form to modify species, parameters → triggers FHIR flow with corrections), "Reject" (requires reason selection from dropdown → notifies volunteer). |
| **Batch operations** | Select multiple → bulk confirm (if all are straightforward) |
| **Priority** | P0 |
| **Estimated effort** | 6-8 hours |

### F-06: Validated Data Dashboard (Researcher)

| Attribute | Detail |
|-----------|--------|
| **Description** | Researchers see all validated observations (both auto-validated and expert-validated) in a browsable, filterable dashboard. |
| **Table view** | Columns: Date, Location, Species, Confidence, Validation Source (AI/Expert), FHIR Status (posted/pending). Sortable by any column. |
| **Map view** | Toggle between table and map. Map shows pins for each validated observation, color-coded by species group (EPT = green, tolerant = orange, vectors = red). |
| **Filters** | Date range, location (city), species, confidence range, validation source |
| **Priority** | P0 |
| **Estimated effort** | 5-6 hours |

---

## 3. Differentiator Features (P1 — Strong Edge)

### F-07: Real-Time AI Processing Animation

| Attribute | Detail |
|-----------|--------|
| **Description** | While the AI pipeline processes, show an animated step-by-step visualization of each agent's work. This is BOTH a UX feature and a technical showcase for judges. |
| **Implementation** | WebSocket or polling. Backend sends status updates as each agent completes. Frontend shows: "🔍 Analyzing photo... ✅ Caddisfly identified (89%)" → "📝 Reading your description... ✅ 4 parameters extracted" → "📍 Checking location... ✅ Confirmed near Madrigueira stream" → "⚡ Calculating quality score... ✅ Score: 87/100" |
| **Visual** | Horizontal stepper with agent icons. Each step animates from pending → processing (spinner) → complete (checkmark). Smooth transitions. |
| **Judge target** | Kodgi (technical), op den Akker (UX, transparency), Sharma (execution quality) |
| **Criteria** | Innovation 20%, UX 15%, Technical 20% |
| **Priority** | P1 |
| **Estimated effort** | 4-5 hours |

### F-08: FHIR Resource Viewer

| Attribute | Detail |
|-----------|--------|
| **Description** | Show the generated FHIR resource in a beautiful, structured viewer (NOT raw JSON). This proves deep FHIR integration to Datta. |
| **Implementation** | Card-based FHIR viewer showing: Resource Type, Profile (hl7-eu/oah), Status, Subject, Code (LOINC), Value, Location, DateTime. Toggle to raw JSON for technical judges. |
| **POST indicator** | Show "POST to OAH Sandbox → 201 Created ✅" with response time |
| **Judge target** | Datta (FHIR co-founder — KINGMAKER), Nikolov (FAIR data), Panyam (data integrity) |
| **Criteria** | Technical 20%, Innovation 20% |
| **Priority** | P1 |
| **Estimated effort** | 3-4 hours |

### F-09: Species Educational Cards

| Attribute | Detail |
|-----------|--------|
| **Description** | When a species is identified, show an educational card with ecological significance. This turns StreamSense from a data tool into a learning experience. |
| **Content per species** | Common name, scientific name, order/family, photo reference, BMWP score, water quality indication (sensitive/tolerant/vector), One Health significance, fun fact. |
| **Data source** | Pre-authored content for 15-20 curated taxa. Stored as seed data in database. |
| **Display** | Expandable card below species identification in the AI feedback view. |
| **Judge target** | Feio (ecological accuracy), op den Akker (educational UX), Freitas (citizen engagement) |
| **Criteria** | Impact 30%, UX 15% |
| **Priority** | P1 |
| **Estimated effort** | 3-4 hours (content authoring + UI) |

### F-10: Observation Map (Volunteer)

| Attribute | Detail |
|-----------|--------|
| **Description** | Volunteers see their observations plotted on a map alongside other validated observations from the community. Creates a sense of collective contribution. |
| **Implementation** | Leaflet or Mapbox GL. Show user's observations as primary pins. Community observations as smaller dots. Cluster when zoomed out. Click pin → mini-card with species and status. |
| **Layers** | Toggle layers: My Observations, Community, Water Quality Zones |
| **Judge target** | Freitas (geographic context, GIS), González (spatial data) |
| **Criteria** | UX 15%, Impact 30% |
| **Priority** | P1 |
| **Estimated effort** | 4-5 hours |

### F-11: Researcher Analytics Dashboard

| Attribute | Detail |
|-----------|--------|
| **Description** | Charts and metrics giving researchers insight into data quality, submission trends, and species distribution. |
| **Charts** | Submissions over time (line chart), Auto-validation rate (donut chart), Species distribution (bar chart), Top rejection reasons (bar chart), Confidence score distribution (histogram). |
| **Library** | Recharts or Chart.js |
| **Judge target** | Sharma (execution quality, business value), González (data analysis) |
| **Criteria** | Technical 20%, Feasibility 15% |
| **Priority** | P1 |
| **Estimated effort** | 4-5 hours |

### F-12: DipteraCAST Mock Integration

| Attribute | Detail |
|-----------|--------|
| **Description** | After FHIR resource is created, show how the validated data would feed into DipteraCAST for disease vector prediction. Since no public API exists, we mock with a realistic data contract. |
| **Implementation** | Mock API endpoint that accepts environmental parameters and returns simulated Diptera community composition. Show the exact input payload and output prediction. |
| **Display** | Card in both volunteer (simplified) and researcher (detailed) views: "DipteraCAST Prediction: Culex pipiens activity — Moderate Risk (63%)" |
| **Transparency** | Label clearly as "Simulated — DipteraCAST integration ready" |
| **Judge target** | Koutalieris (HE BUILT DipteraCAST — must see realistic data contract) |
| **Criteria** | Impact 30%, Innovation 20% |
| **Priority** | P1 |
| **Estimated effort** | 3-4 hours |

### F-13: Notification System

| Attribute | Detail |
|-----------|--------|
| **Description** | Volunteers receive notifications when their flagged observations are reviewed by experts. |
| **Implementation** | In-app notification bell with badge count. Notification list page. Types: "Your observation has been validated by an expert!", "Your observation requires more detail — please re-submit." |
| **Technical** | Supabase Realtime subscriptions or polling |
| **Judge target** | op den Akker (UX completeness), Freitas (citizen engagement) |
| **Criteria** | UX 15% |
| **Priority** | P1 |
| **Estimated effort** | 2-3 hours |

---

## 4. Polish Features (P2 — Nice to Have)

### F-14: Volunteer Contribution Stats

| Attribute | Detail |
|-----------|--------|
| **Description** | Personal stats: total observations, auto-validation rate, species found, impact score, streak (days in a row). |
| **Priority** | P2 |
| **Estimated effort** | 2-3 hours |

### F-15: Dark Mode

| Attribute | Detail |
|-----------|--------|
| **Description** | Toggle between light and dark mode. Dark mode uses deep forest greens and warm charcoals. |
| **Priority** | P2 |
| **Estimated effort** | 2-3 hours |

### F-16: Observation Photo Annotation

| Attribute | Detail |
|-----------|--------|
| **Description** | AI overlays bounding boxes or highlights on the submitted photo showing where it detected organisms. |
| **Priority** | P2 |
| **Estimated effort** | 4-5 hours |

### F-17: Export to CSV/PDF

| Attribute | Detail |
|-----------|--------|
| **Description** | Researchers can export validated data as CSV or generate a PDF report for a monitoring site. |
| **Priority** | P2 |
| **Estimated effort** | 2-3 hours |

### F-18: Keyboard Shortcuts (Researcher)

| Attribute | Detail |
|-----------|--------|
| **Description** | J/K to navigate queue, C to confirm, R to reject, E to edit. Power user productivity. |
| **Priority** | P2 |
| **Estimated effort** | 1-2 hours |

---

## 5. Feature-to-Judge Mapping

This shows which features specifically resonate with each judge on the panel.

| Feature | Feio ★ | Kodgi | Datta | op den Akker ★ | Freitas ★ | Panyam | Nikolov ★ | Koutalieris ★ | Sharma | González |
|---------|--------|-------|-------|----------------|-----------|--------|-----------|---------------|--------|----------|
| F-01 Auth | | | | | | ✅ | | | ✅ | |
| F-02 Submission | | | | ✅ | ✅ | | | | | |
| F-03 AI Pipeline | ✅ | ✅✅ | | ✅ | | ✅ | | | ✅ | ✅ |
| F-04 AI Feedback | ✅ | | | ✅✅ | ✅ | | | | | |
| F-05 Review Queue | ✅✅ | ✅ | | ✅ | | | ✅ | | ✅ | |
| F-06 Valid. Dashboard | ✅ | | | | ✅ | | ✅ | | ✅ | ✅ |
| F-07 Processing Anim. | | ✅ | | ✅✅ | | | | | ✅ | |
| F-08 FHIR Viewer | | | ✅✅✅ | | | ✅ | ✅✅ | | | |
| F-09 Species Cards | ✅✅ | | | ✅ | ✅ | | | | | |
| F-10 Observation Map | | | | | ✅✅ | | | | | ✅✅ |
| F-11 Analytics | | | | | | | ✅ | | ✅ | ✅ |
| F-12 DipteraCAST | ✅ | | | | | | | ✅✅✅ | | |
| F-13 Notifications | | | | ✅ | ✅ | | | | | |

**Legend:** ✅ = aligns | ✅✅ = strong alignment | ✅✅✅ = kingmaker alignment

### Key Insight

**No single feature wins the hackathon.** But the combination of F-03 (AI Pipeline) + F-08 (FHIR Viewer) + F-12 (DipteraCAST Mock) + F-09 (Species Cards) covers 8 out of 10 judges.

---

## 6. Feature-to-Criteria Mapping

| Feature | Impact (30%) | Innovation (20%) | Technical (20%) | UX (15%) | Feasibility (15%) |
|---------|-------------|------------------|----------------|----------|-------------------|
| F-01 Auth | | | ● | | ●● |
| F-02 Submission | ● | | ● | ●●● | ●● |
| F-03 AI Pipeline | ●●● | ●●● | ●●● | | ● |
| F-04 AI Feedback | ●● | ●● | | ●●● | |
| F-05 Review Queue | ●●● | ●● | ●● | ●● | ● |
| F-06 Valid. Dashboard | ●● | | ●● | ●● | ●● |
| F-07 Processing Anim. | | ●● | ●● | ●●● | |
| F-08 FHIR Viewer | ●● | ●●● | ●●● | ● | ● |
| F-09 Species Cards | ●●● | ● | | ●●● | ●● |
| F-10 Observation Map | ●● | | ● | ●●● | ● |
| F-11 Analytics | ● | | ●● | ●● | ●● |
| F-12 DipteraCAST | ●●● | ●●● | ●● | | ● |
| F-13 Notifications | ● | | | ●● | ●● |

**Legend:** ● = contributes | ●● = strong contribution | ●●● = primary driver

### Weighted Score Contribution

| Feature | Total Score Weight Covered | Why It Matters |
|---------|--------------------------|----------------|
| F-03 AI Pipeline | **70%** (Impact + Innovation + Technical) | This IS the product |
| F-08 FHIR Viewer | **60%** (Innovation + Technical + Impact) | Datta kingmaker + zero competition |
| F-12 DipteraCAST | **70%** (Impact + Innovation + Technical) | One Health chain completion |
| F-04 AI Feedback | **65%** (Impact + Innovation + UX) | Citizen-facing magic moment |
| F-05 Review Queue | **85%** (all 5 criteria) | Proves the full two-panel workflow |

---

## 7. Feature Dependency Graph

```
F-01 Authentication
  ├── F-02 Observation Submission
  │     └── F-03 AI Triage Pipeline
  │           ├── F-04 AI Feedback Display
  │           │     ├── F-07 Processing Animation (enhances F-04)
  │           │     └── F-09 Species Educational Cards (enhances F-04)
  │           ├── F-05 Researcher Review Queue
  │           │     └── F-13 Notification System
  │           ├── F-06 Validated Data Dashboard
  │           │     ├── F-10 Observation Map
  │           │     ├── F-11 Analytics Dashboard
  │           │     └── F-17 Export CSV/PDF
  │           ├── F-08 FHIR Resource Viewer
  │           └── F-12 DipteraCAST Mock
  └── F-15 Dark Mode (independent, any time)

F-14 Contribution Stats ← depends on F-02 (observation count)
F-16 Photo Annotation ← depends on F-03 (BioCLIP output)
F-18 Keyboard Shortcuts ← depends on F-05 (review queue)
```

### Build Order (Following Dependencies)

```
Phase 1: F-01 → F-02 → F-03 (pipeline works end-to-end)
Phase 2: F-04 → F-05 → F-06 (both panels have basic UI)
Phase 3: F-07, F-08, F-09, F-10, F-12 (differentiators, can parallelize)
Phase 4: F-11, F-13, F-14, F-15 (polish, only if time permits)
```

---

## 8. Cut List

Features we considered but explicitly decided NOT to build, with reasoning.

| Feature | Why Considered | Why Cut |
|---------|---------------|---------|
| **Real-time chat (volunteer ↔ researcher)** | Facilitates clarification questions | Adds WebSocket complexity; not needed for demo; no judge cares about chat |
| **Native mobile app** | Better field experience | PWA gives 90% of benefit at 10% of cost; can't ship iOS/Android in 6 days |
| **Gamification (badges, leaderboard)** | Volunteer retention | Feels gimmicky; judges (especially Feio, González) may see it as trivializing science |
| **Social feed (like/comment on observations)** | Community building | Not scientific; distracts from the triage mission |
| **Video upload** | Richer data capture | Processing video through AI pipeline is exponentially harder; images are sufficient |
| **Custom training of BioCLIP** | Better accuracy | Requires training data pipeline, GPU, and time we don't have |
| **Full BMWP/ASPT calculator** | Ecological completeness | Requires extensive validated data across many sampling events; show "projected" score instead |
| **Multi-language UI** | Inclusivity for 5 EU pilot cities | English only for demo; architecture supports i18n for future |
| **Admin panel** | User management | Researchers are pre-seeded; not needed for demo |
| **Offline AI processing** | Field use without connectivity | Requires edge ML deployment; out of hackathon scope |
| **Digital twin** | Wave 3 considered this | Feasibility rated Low-Medium; too ambitious for hackathon |
| **Payment/subscription** | Business model | Not relevant for hackathon submission |

---

## 9. Winning Edge Strategy

### 9.1 The Three "Must-See" Moments in the Demo

Based on judge mapping and criteria analysis, the demo must contain these three moments:

**Moment 1: The Instant AI Triage (targets Kodgi, op den Akker, Sharma)**
> Citizen submits photo → within 5 seconds, see every agent processing in real-time → species identified, metadata validated, quality scored → "Auto-Validated ✅"

**Moment 2: The FHIR Translation (targets Datta, Nikolov)**
> Show the FHIR resource generated from the observation → validated against hl7-eu/oah profiles → POSTed to live sandbox → "201 Created ✅"

**Moment 3: The One Health Chain (targets Feio, Koutalieris, Freitas)**
> Validated data feeds DipteraCAST mock → disease vector prediction → impact receipt to citizen → "Your observation helped predict disease risk in your neighborhood"

### 9.2 Features That Other Teams WON'T Have

| Our Feature | Why Others Won't Have It |
|-------------|------------------------|
| Multi-agent parallel AI pipeline | Most teams will use a single LLM call; we show orchestrated multi-model coordination |
| FHIR R4 resource generation | Requires deep FHIR knowledge; most teams don't know what FHIR is |
| Live FHIR sandbox integration | Requires reading the hl7-eu/oah IG and understanding the sandbox API |
| DipteraCAST data contract | Requires studying the model's published inputs; most teams will just make a generic dashboard |
| Explainable confidence scoring | Most teams will show a black-box "the AI says 87%" — we show WHY |
| Expert triage queue with AI briefs | Most teams will build a one-panel app; we have two interconnected panels |
| Impact receipts | No competitor platform provides instant, personalized impact feedback |

### 9.3 The Scoring Target

Based on all analysis, our realistic post-build scoring target:

| Criterion | Target | How |
|-----------|--------|-----|
| Impact & Alignment (30%) | **8.5/10** | Complete One Health chain; 5 OAH tool integrations; FAIR data; citizen engagement loop |
| Innovation & Creativity (20%) | **7.5/10** | Multi-agent pipeline; FHIR bridge (zero competition); explainable AI |
| Technical Implementation (20%) | **7.5/10** | 7 agents, parallel execution, FHIR validation, live sandbox POST, real BioCLIP |
| Usability & UX (15%) | **8.0/10** | Cozy design; instant feedback; processing animation; impact receipts; two-panel navigation |
| Feasibility & Scalability (15%) | **7.5/10** | Standard tech stack; FHIR scales globally; architecture is city-agnostic |
| **WEIGHTED TOTAL** | **7.85** | **Competitive finalist range** |

---

*End of DOC-02: Feature Matrix*
*Next document: DOC-03 Tech Stack*
