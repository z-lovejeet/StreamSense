# StreamSense — Database Schema (DOC 06)

> **Document ID:** DOC-06
> **Version:** 1.0
> **Last Updated:** September 29, 2026
> **Depends On:** DOC-01 (PRD), DOC-04 (System Architecture), DOC-05 (Agentic AI Workflow)

---

## Table of Contents

1. [Database Choice & Configuration](#1-database-choice--configuration)
2. [Entity-Relationship Diagram](#2-entity-relationship-diagram)
3. [Table Definitions](#3-table-definitions)
4. [Enums & Types](#4-enums--types)
5. [Indexes](#5-indexes)
6. [Seed Data](#6-seed-data)
7. [Common Query Patterns](#7-common-query-patterns)
8. [SQLAlchemy ORM Models](#8-sqlalchemy-orm-models)

---

## 1. Database Choice & Configuration

| Attribute | Detail |
|-----------|--------|
| **Engine** | PostgreSQL 15 (Supabase hosted) |
| **ORM** | SQLAlchemy 2.0 (async via asyncpg) |
| **Migrations** | Alembic |
| **Connection** | Async via `asyncpg` + SQLAlchemy `create_async_engine` |
| **Connection pooling** | Supabase pgBouncer (default) |
| **JSON storage** | JSONB columns for AI agent outputs (queryable, indexable) |

---

## 2. Entity-Relationship Diagram

```
┌──────────────┐       ┌─────────────────────┐       ┌──────────────────┐
│    users      │       │   observations       │       │   ai_results      │
│──────────────│       │─────────────────────│       │──────────────────│
│ id (PK)      │←──┐   │ id (PK)              │──────→│ id (PK)           │
│ email         │   │   │ user_id (FK→users)   │       │ observation_id(FK)│
│ full_name     │   ├──│ ...                   │       │ agent_name        │
│ role          │   │   │ status               │       │ model             │
│ created_at    │   │   │ confidence_score     │       │ result (JSONB)    │
│ ...           │   │   │ ...                   │       │ processing_time   │
└──────────────┘   │   └──────────┬────────────┘       │ ...               │
                    │              │                     └──────────────────┘
                    │              │
                    │              ├──────────────────────┐
                    │              │                      │
                    │   ┌──────────▼──────────┐  ┌───────▼────────────┐
                    │   │   expert_reviews     │  │   fhir_resources    │
                    │   │────────────────────│  │────────────────────│
                    │   │ id (PK)             │  │ id (PK)             │
                    ├──│ reviewer_id(FK→users)│  │ observation_id (FK) │
                    │   │ observation_id (FK) │  │ resource_type       │
                    │   │ action              │  │ resource_json(JSONB)│
                    │   │ corrections (JSONB) │  │ sandbox_status      │
                    │   │ ...                 │  │ sandbox_id          │
                    │   └─────────────────────┘  │ ...                 │
                    │                             └─────────────────────┘
                    │
                    │   ┌─────────────────────┐
                    │   │   notifications      │
                    │   │─────────────────────│
                    │   │ id (PK)              │
                    └──│ user_id (FK→users)   │
                        │ type                 │
                        │ message              │
                        │ read                 │
                        │ ...                  │
                        └─────────────────────┘

┌──────────────────────────┐
│   species_reference       │
│──────────────────────────│
│ id (PK)                   │
│ taxon_name                │
│ common_name               │
│ order_family               │
│ bmwp_score                │
│ water_quality_indication  │
│ is_disease_vector          │
│ description                │
│ educational_text           │
│ image_url                  │
│ one_health_significance    │
└──────────────────────────┘
```

---

## 3. Table Definitions

### 3.1 `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier (matches Supabase Auth user ID) |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | User email address |
| `full_name` | `VARCHAR(255)` | NOT NULL | Display name |
| `role` | `user_role` (ENUM) | NOT NULL, DEFAULT 'volunteer' | `volunteer` or `researcher` |
| `avatar_url` | `TEXT` | NULLABLE | Profile avatar URL |
| `city` | `VARCHAR(100)` | NULLABLE | User's city (for volunteer localization) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Account creation time |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Last profile update |

### 3.2 `observations`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique observation identifier |
| `user_id` | `UUID` | FOREIGN KEY → users(id), NOT NULL | Submitting volunteer |
| `image_url` | `TEXT` | NOT NULL | URL to uploaded image in Supabase Storage |
| `image_thumbnail_url` | `TEXT` | NULLABLE | Resized thumbnail URL for list views |
| `description` | `TEXT` | NULLABLE | Free-text volunteer description (max 1000 chars) |
| `latitude` | `DOUBLE PRECISION` | NOT NULL | GPS latitude |
| `longitude` | `DOUBLE PRECISION` | NOT NULL | GPS longitude |
| `location_name` | `VARCHAR(255)` | NULLABLE | Reverse-geocoded location name |
| `pilot_city` | `VARCHAR(100)` | NULLABLE | Matched pilot city (Coimbra, Toulouse, etc.) |
| `observed_at` | `TIMESTAMPTZ` | NOT NULL | When the observation was made (device time) |
| `status` | `observation_status` (ENUM) | NOT NULL, DEFAULT 'processing' | Current lifecycle status |
| `confidence_score` | `INTEGER` | NULLABLE | Agent 4 quality score (0-100) |
| `routing` | `VARCHAR(50)` | NULLABLE | `auto_validate` or `expert_review` |
| `top_species` | `VARCHAR(255)` | NULLABLE | Agent 1 top species prediction |
| `top_confidence` | `DOUBLE PRECISION` | NULLABLE | Agent 1 top confidence (0-1) |
| `impact_text` | `TEXT` | NULLABLE | Agent 6 impact receipt text |
| `impact_headline` | `VARCHAR(255)` | NULLABLE | Agent 6 short headline |
| `pipeline_time_seconds` | `DOUBLE PRECISION` | NULLABLE | Total pipeline processing time |
| `pipeline_error` | `TEXT` | NULLABLE | Pipeline error message if any |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Record creation time |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Last update time |

### 3.3 `ai_results`

Stores the raw output of each AI agent for every observation. One row per agent per observation (so typically 5-7 rows per observation).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique result identifier |
| `observation_id` | `UUID` | FOREIGN KEY → observations(id), NOT NULL | Parent observation |
| `agent_name` | `VARCHAR(50)` | NOT NULL | Agent identifier: `vision`, `description`, `metadata`, `quality`, `fhir`, `impact`, `expert_brief` |
| `agent_version` | `VARCHAR(20)` | NOT NULL, DEFAULT '1.0' | Agent version for tracking changes |
| `model_used` | `VARCHAR(100)` | NOT NULL | Actual model used (e.g., `bioclip-2`, `llama-3.3-70b-versatile`, `gemini-2.0-flash`) |
| `status` | `VARCHAR(20)` | NOT NULL | `success`, `error`, `skipped`, `fallback` |
| `result` | `JSONB` | NOT NULL | Full agent output JSON (structure varies by agent) |
| `processing_time_ms` | `INTEGER` | NULLABLE | Agent processing time in milliseconds |
| `token_count_input` | `INTEGER` | NULLABLE | Input token count (for LLM agents) |
| `token_count_output` | `INTEGER` | NULLABLE | Output token count (for LLM agents) |
| `error_message` | `TEXT` | NULLABLE | Error details if status is `error` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | When this result was created |

**Unique constraint:** `(observation_id, agent_name)` — one result per agent per observation.

### 3.4 `expert_reviews`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique review identifier |
| `observation_id` | `UUID` | FOREIGN KEY → observations(id), UNIQUE, NOT NULL | Reviewed observation (one review per observation) |
| `reviewer_id` | `UUID` | FOREIGN KEY → users(id), NOT NULL | Researcher who performed the review |
| `action` | `review_action` (ENUM) | NOT NULL | `confirm`, `correct`, `reject` |
| `corrections` | `JSONB` | NULLABLE | If action is `correct`: `{ "species": "corrected_name", "params": {...} }` |
| `rejection_reason` | `VARCHAR(500)` | NULLABLE | If action is `reject`: reason text |
| `review_notes` | `TEXT` | NULLABLE | Optional expert notes |
| `review_time_seconds` | `INTEGER` | NULLABLE | How long the review took (client-tracked) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | When the review was performed |

### 3.5 `fhir_resources`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique resource identifier |
| `observation_id` | `UUID` | FOREIGN KEY → observations(id), NOT NULL | Source observation |
| `resource_type` | `VARCHAR(100)` | NOT NULL, DEFAULT 'Observation' | FHIR resource type |
| `profile_url` | `TEXT` | NOT NULL | OAH IG profile URL used |
| `resource_json` | `JSONB` | NOT NULL | Complete FHIR R4 resource JSON |
| `validation_status` | `VARCHAR(50)` | NOT NULL | `valid`, `invalid`, `pending` |
| `validation_errors` | `JSONB` | NULLABLE | Validation error details if invalid |
| `sandbox_status` | `VARCHAR(50)` | NOT NULL, DEFAULT 'pending' | `pending`, `posted`, `failed`, `skipped` |
| `sandbox_id` | `VARCHAR(255)` | NULLABLE | Resource ID from FHIR sandbox after POST |
| `sandbox_response` | `JSONB` | NULLABLE | Full sandbox response |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | When the resource was generated |
| `posted_at` | `TIMESTAMPTZ` | NULLABLE | When successfully POSTed to sandbox |

### 3.6 `notifications`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique notification identifier |
| `user_id` | `UUID` | FOREIGN KEY → users(id), NOT NULL | Target user |
| `type` | `VARCHAR(50)` | NOT NULL | `review_complete`, `observation_validated`, `observation_rejected` |
| `title` | `VARCHAR(255)` | NOT NULL | Notification title |
| `message` | `TEXT` | NOT NULL | Notification body |
| `observation_id` | `UUID` | FOREIGN KEY → observations(id), NULLABLE | Related observation |
| `read` | `BOOLEAN` | NOT NULL, DEFAULT FALSE | Whether the user has read this notification |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | When the notification was created |

### 3.7 `species_reference`

Static reference table with curated taxa data. Seeded on deployment, not modified by the application.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `taxon_name` | `VARCHAR(255)` | UNIQUE, NOT NULL | Scientific taxon name (e.g., "Ephemeroptera") |
| `common_name` | `VARCHAR(255)` | NOT NULL | Common name (e.g., "Mayfly nymph") |
| `order_name` | `VARCHAR(255)` | NULLABLE | Taxonomic order |
| `family_name` | `VARCHAR(255)` | NULLABLE | Taxonomic family |
| `bmwp_score` | `INTEGER` | NOT NULL | BMWP biological monitoring score |
| `water_quality_indication` | `VARCHAR(50)` | NOT NULL | `good`, `moderate`, `poor`, `disease_vector` |
| `is_disease_vector` | `BOOLEAN` | NOT NULL, DEFAULT FALSE | Whether this taxon is a known disease vector |
| `ecological_description` | `TEXT` | NOT NULL | 2-3 sentence ecological description |
| `educational_text` | `TEXT` | NOT NULL | Plain-language educational content for citizen UI |
| `one_health_significance` | `TEXT` | NOT NULL | How this taxon relates to One Health |
| `image_url` | `TEXT` | NULLABLE | Reference photo URL |
| `fun_fact` | `VARCHAR(500)` | NULLABLE | Engaging fun fact for citizen UI |
| `habitat` | `VARCHAR(255)` | NULLABLE | Typical habitat description |

---

## 4. Enums & Types

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('volunteer', 'researcher');

-- Observation lifecycle status
CREATE TYPE observation_status AS ENUM (
  'processing',        -- AI pipeline is running
  'auto_validated',    -- Score >= 70, automatically validated
  'pending_review',    -- Score < 70, waiting for expert
  'expert_validated',  -- Expert confirmed or corrected
  'rejected'           -- Expert rejected
);

-- Expert review actions
CREATE TYPE review_action AS ENUM (
  'confirm',   -- Accept AI analysis as-is
  'correct',   -- Modify species/parameters
  'reject'     -- Reject observation with reason
);
```

---

## 5. Indexes

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Observations
CREATE INDEX idx_observations_user_id ON observations(user_id);
CREATE INDEX idx_observations_status ON observations(status);
CREATE INDEX idx_observations_created_at ON observations(created_at DESC);
CREATE INDEX idx_observations_pilot_city ON observations(pilot_city);
CREATE INDEX idx_observations_confidence ON observations(confidence_score);
CREATE INDEX idx_observations_top_species ON observations(top_species);
CREATE INDEX idx_observations_status_created ON observations(status, created_at DESC);

-- Composite index for researcher review queue (most common query)
CREATE INDEX idx_observations_review_queue 
  ON observations(status, created_at DESC) 
  WHERE status = 'pending_review';

-- Composite index for volunteer history
CREATE INDEX idx_observations_user_history 
  ON observations(user_id, created_at DESC);

-- AI Results
CREATE INDEX idx_ai_results_observation ON ai_results(observation_id);
CREATE INDEX idx_ai_results_agent ON ai_results(agent_name);
CREATE UNIQUE INDEX idx_ai_results_obs_agent ON ai_results(observation_id, agent_name);

-- Expert Reviews
CREATE INDEX idx_reviews_observation ON expert_reviews(observation_id);
CREATE INDEX idx_reviews_reviewer ON expert_reviews(reviewer_id);

-- FHIR Resources
CREATE INDEX idx_fhir_observation ON fhir_resources(observation_id);
CREATE INDEX idx_fhir_sandbox_status ON fhir_resources(sandbox_status);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- Species Reference
CREATE INDEX idx_species_taxon ON species_reference(taxon_name);
```

---

## 6. Seed Data

### 6.1 Species Reference (15 taxa)

```json
[
  {
    "taxon_name": "Ephemeroptera",
    "common_name": "Mayfly nymph",
    "order_name": "Ephemeroptera",
    "family_name": null,
    "bmwp_score": 10,
    "water_quality_indication": "good",
    "is_disease_vector": false,
    "ecological_description": "Mayflies are among the most sensitive aquatic insects. Their nymphs require clean, well-oxygenated water. They are a key food source for fish and their presence indicates a healthy stream ecosystem.",
    "educational_text": "You found a mayfly nymph! These delicate creatures are like water quality detectives — they can only survive in clean, healthy streams. If mayflies are here, it's a great sign for your local water.",
    "one_health_significance": "Presence of mayflies indicates low pollution and low disease vector habitat. Clean streams with mayfly populations typically have lower mosquito breeding potential.",
    "fun_fact": "Adult mayflies live for only a few hours to a few days — just long enough to find a mate. But their nymphs can live underwater for up to two years!",
    "habitat": "Fast-flowing, clean streams with rocky or gravelly bottoms"
  },
  {
    "taxon_name": "Plecoptera",
    "common_name": "Stonefly nymph",
    "order_name": "Plecoptera",
    "bmwp_score": 10,
    "water_quality_indication": "good",
    "is_disease_vector": false,
    "ecological_description": "Stoneflies are extremely pollution-sensitive. Their nymphs are found under stones in clean, cold, well-oxygenated streams. They are among the first species to disappear when water quality degrades.",
    "educational_text": "Stonefly nymphs are the gold standard of clean water! They're so sensitive to pollution that scientists use them as natural water quality monitors. Finding one means your stream is in excellent health.",
    "one_health_significance": "Stonefly presence is a strong negative indicator for disease vectors — the conditions they require are incompatible with mosquito breeding habitat.",
    "fun_fact": "Some stonefly species can survive being frozen in ice during winter and come back to life when temperatures rise!",
    "habitat": "Cold, fast-flowing mountain and upland streams with rocky substrates"
  },
  {
    "taxon_name": "Trichoptera",
    "common_name": "Caddisfly larva",
    "order_name": "Trichoptera",
    "bmwp_score": 8,
    "water_quality_indication": "good",
    "is_disease_vector": false,
    "ecological_description": "Caddisflies are diverse and relatively sensitive to pollution. Many larvae build protective cases from stones, sand, or plant material. They are important shredders of leaf litter in streams.",
    "educational_text": "Caddisfly larvae are nature's architects! They build tiny protective cases from pebbles, twigs, and sand. Each species builds its case differently — like a fingerprint. Finding them means good water quality.",
    "one_health_significance": "Caddisflies indicate moderate to good ecological status. Their presence supports balanced aquatic food webs that naturally control disease vector populations.",
    "fun_fact": "Caddisfly larvae silk is one of the strongest natural adhesives known — it works underwater and has inspired researchers developing new medical glues!",
    "habitat": "Streams and rivers with moderate to fast flow, various substrates"
  },
  {
    "taxon_name": "Chironomidae",
    "common_name": "Midge larva (bloodworm)",
    "order_name": "Diptera",
    "family_name": "Chironomidae",
    "bmwp_score": 2,
    "water_quality_indication": "poor",
    "is_disease_vector": false,
    "ecological_description": "Non-biting midges are extremely tolerant of pollution. Red 'bloodworm' larvae contain hemoglobin allowing them to survive in low-oxygen conditions. Dominance indicates organic pollution.",
    "educational_text": "These red 'bloodworms' are tough survivors! While they're not harmful, finding lots of them and few other species suggests the water may have too many nutrients (like sewage). They're actually important fish food.",
    "one_health_significance": "High Chironomidae abundance with low EPT diversity suggests organic enrichment that could favor disease vector breeding. Monitoring their ratio to sensitive species is key.",
    "fun_fact": "Chironomid bloodworms are red because they contain hemoglobin — the same oxygen-carrying molecule in human blood. They're one of very few insects with this adaptation!",
    "habitat": "All aquatic environments, especially tolerant of polluted conditions"
  },
  {
    "taxon_name": "Culicidae",
    "common_name": "Mosquito larva",
    "order_name": "Diptera",
    "family_name": "Culicidae",
    "bmwp_score": 0,
    "water_quality_indication": "disease_vector",
    "is_disease_vector": true,
    "ecological_description": "Mosquito larvae develop in standing or slow-moving water. Several European species (Culex pipiens, Aedes albopictus) are vectors for West Nile virus, dengue, and other diseases. Their presence is a public health concern.",
    "educational_text": "⚠️ Mosquito larvae alert! These wriggly creatures in still water can grow into mosquitoes that carry diseases. Your report is especially valuable — it helps health authorities identify and manage breeding sites before disease can spread.",
    "one_health_significance": "CRITICAL One Health indicator. Mosquito larvae presence directly triggers DipteraCAST disease vector prediction. Your observation feeds into community disease prevention systems.",
    "fun_fact": "A single mosquito can lay 100-300 eggs at once, and larvae can develop into adults in just 7-10 days in warm water.",
    "habitat": "Standing water, slow-moving margins, containers, blocked drains"
  },
  {
    "taxon_name": "Simuliidae",
    "common_name": "Blackfly larva",
    "order_name": "Diptera",
    "family_name": "Simuliidae",
    "bmwp_score": 5,
    "water_quality_indication": "moderate",
    "is_disease_vector": true,
    "ecological_description": "Blackfly larvae attach to rocks in fast-flowing water using silk pads and filter feed. Adults are blood-feeders and can be significant biting pests. Some species transmit river blindness (onchocerciasis) in tropical regions.",
    "educational_text": "Blackfly larvae hang onto rocks in fast water and filter their food from the current. The adults can be biting pests. Your report helps track their populations and predict when biting activity might peak.",
    "one_health_significance": "While European species don't carry onchocerciasis, blackfly population monitoring contributes to nuisance vector management and community wellbeing assessment.",
    "fun_fact": "Blackfly larvae can filter up to 2 liters of water per day per larva! They're incredibly efficient at capturing tiny food particles from the current.",
    "habitat": "Fast-flowing clean to moderate streams, attached to rocks and vegetation"
  },
  {
    "taxon_name": "Gammaridae",
    "common_name": "Freshwater shrimp",
    "order_name": "Amphipoda",
    "family_name": "Gammaridae",
    "bmwp_score": 6,
    "water_quality_indication": "moderate",
    "is_disease_vector": false,
    "ecological_description": "Freshwater shrimp are important detritivores that break down leaf litter. They are moderately sensitive to pollution and are a key food source for fish. High numbers indicate good organic matter processing.",
    "educational_text": "Freshwater shrimp are the clean-up crew of streams! They munch on fallen leaves and break them down, recycling nutrients back into the ecosystem. Finding them in good numbers means the stream's natural recycling system is working well.",
    "one_health_significance": "Gammaridae presence indicates functioning ecosystem services that naturally regulate nutrient cycling and reduce conditions favorable to pathogen proliferation.",
    "fun_fact": "Male freshwater shrimp carry females on their backs for days during mating. Scientists call this 'precopulatory mate guarding'!",
    "habitat": "Leaf packs, under stones, in vegetation in clean to moderate streams"
  },
  {
    "taxon_name": "Asellidae",
    "common_name": "Water louse",
    "order_name": "Isopoda",
    "family_name": "Asellidae",
    "bmwp_score": 3,
    "water_quality_indication": "poor",
    "is_disease_vector": false,
    "ecological_description": "Water lice are tolerant of moderate pollution and low oxygen. They feed on decaying organic matter. Common in slow-flowing or still waters with organic enrichment.",
    "educational_text": "Water lice look like tiny armored bugs. They're tougher than most aquatic creatures and can handle water that's a bit dirty. Finding mostly these (without sensitive species) suggests the water could use some improvement.",
    "one_health_significance": "Asellidae dominance can indicate organic enrichment conditions that may support higher mosquito productivity in adjacent still water habitats.",
    "fun_fact": "Female water lice carry their eggs in a special brood pouch on their underside — like tiny aquatic kangaroos!",
    "habitat": "Slow-flowing streams, pond margins, often among decaying leaves"
  },
  {
    "taxon_name": "Oligochaeta",
    "common_name": "Aquatic worm",
    "order_name": "Oligochaeta",
    "bmwp_score": 1,
    "water_quality_indication": "poor",
    "is_disease_vector": false,
    "ecological_description": "Aquatic worms are extremely pollution-tolerant. They burrow into sediments and can survive very low oxygen conditions. Mass abundance typically indicates heavy organic pollution.",
    "educational_text": "These tiny worms burrow into the mud at the bottom of streams. They're super tough and can survive even in very polluted water. If you're finding lots of them but few other creatures, the water quality might need attention.",
    "one_health_significance": "High oligochaete density signals degraded conditions that may facilitate pathogen persistence and disease vector habitat in connected water bodies.",
    "fun_fact": "Some aquatic worms can regenerate — if cut in half, both pieces can survive and grow into complete worms!",
    "habitat": "Soft sediments in slow-flowing or standing water, tolerant of pollution"
  },
  {
    "taxon_name": "Gastropoda",
    "common_name": "Freshwater snail",
    "order_name": "Gastropoda",
    "bmwp_score": 3,
    "water_quality_indication": "moderate",
    "is_disease_vector": false,
    "ecological_description": "Freshwater snails graze on algae and periphyton. Most are moderately pollution-tolerant. Some species serve as intermediate hosts for parasites (trematodes).",
    "educational_text": "Freshwater snails slowly glide over rocks, munching on algae and keeping surfaces clean. They're fairly adaptable creatures. Finding them alongside more sensitive species is a good sign for stream health.",
    "one_health_significance": "Some snail species can host parasites that affect humans and wildlife. Monitoring their presence helps assess zoonotic parasite risk in recreational water areas.",
    "fun_fact": "Some freshwater snails breathe air and must come to the surface regularly, while others have gills and can stay underwater indefinitely!",
    "habitat": "Rocks and vegetation in streams, ponds, and lake margins"
  },
  {
    "taxon_name": "Baetidae",
    "common_name": "Small mayfly nymph",
    "order_name": "Ephemeroptera",
    "family_name": "Baetidae",
    "bmwp_score": 4,
    "water_quality_indication": "moderate",
    "is_disease_vector": false,
    "ecological_description": "Baetidae are small, streamlined mayfly nymphs that are good swimmers. They are more pollution-tolerant than other mayfly families but still indicate reasonable water quality.",
    "educational_text": "These tiny mayfly nymphs are great swimmers — they dart around the stream bottom looking for food. While they're tougher than their larger mayfly cousins, they still prefer reasonably clean water.",
    "one_health_significance": "Baetidae presence suggests moderate ecological integrity. Their tolerance range makes them useful indicators for detecting early stages of water quality decline.",
    "fun_fact": "Baetidae nymphs can have three tail filaments (cerci) that help them swim — they wiggle side to side like a tiny fish!",
    "habitat": "Various stream types, from clean to moderately enriched"
  },
  {
    "taxon_name": "Hydropsychidae",
    "common_name": "Net-spinning caddisfly",
    "order_name": "Trichoptera",
    "family_name": "Hydropsychidae",
    "bmwp_score": 5,
    "water_quality_indication": "moderate",
    "is_disease_vector": false,
    "ecological_description": "Hydropsychidae larvae spin intricate silk nets between stones to catch food particles drifting in the current. They are moderately pollution-tolerant and very common in European streams.",
    "educational_text": "These clever caddisfly larvae spin silk nets between rocks to catch their meals from the current — like underwater spider webs! They're common in many European streams and tell us the water has reasonable quality.",
    "one_health_significance": "Hydropsychidae presence indicates functioning stream ecosystems with adequate flow and moderate water quality — conditions generally unfavorable for disease vector breeding.",
    "fun_fact": "Hydropsychid nets are so fine they can capture particles smaller than 0.1mm — that's thinner than a human hair!",
    "habitat": "Fast-flowing sections of streams and rivers on stable substrates"
  },
  {
    "taxon_name": "Heptageniidae",
    "common_name": "Flat-headed mayfly",
    "order_name": "Ephemeroptera",
    "family_name": "Heptageniidae",
    "bmwp_score": 10,
    "water_quality_indication": "good",
    "is_disease_vector": false,
    "ecological_description": "Heptageniidae nymphs are flattened dorsoventrally, an adaptation for clinging to stones in fast current. They are very sensitive to pollution and indicate high water quality.",
    "educational_text": "Flat-headed mayfly nymphs are shaped like tiny pancakes — perfectly designed to cling to rocks in fast-flowing water. They're very fussy about water quality, so finding one is like getting an A+ for your stream!",
    "one_health_significance": "Among the most sensitive bioindicators. Heptageniidae presence confirms high ecological integrity and conditions strongly unfavorable for disease vector establishment.",
    "fun_fact": "Flat-headed mayflies can cling to rocks in water flowing faster than 1 meter per second — imagine trying to hold on in a water park wave pool!",
    "habitat": "Clean, fast-flowing streams with stony substrates — sensitive to pollution"
  },
  {
    "taxon_name": "Leuctridae",
    "common_name": "Rolled-wing stonefly",
    "order_name": "Plecoptera",
    "family_name": "Leuctridae",
    "bmwp_score": 10,
    "water_quality_indication": "good",
    "is_disease_vector": false,
    "ecological_description": "Leuctridae are slender stonefly nymphs named for their adults' habit of rolling their wings around their body. Nymphs are shredders of leaf litter and are sensitive to pollution.",
    "educational_text": "Rolled-wing stoneflies are slender, elegant creatures that help break down fallen leaves in streams. Like their stonefly cousins, they need very clean water. Spotting one means your stream is thriving!",
    "one_health_significance": "Leuctridae presence reinforces evidence of pristine stream conditions with minimal human impact — optimal for ecosystem services and natural disease vector suppression.",
    "fun_fact": "Adult Leuctridae are named 'rolled-wing' because they wrap their wings around their body when resting — like wearing a tiny sleeping bag!",
    "habitat": "Clean woodland streams with abundant leaf litter"
  },
  {
    "taxon_name": "Tubificidae",
    "common_name": "Sludge worm",
    "order_name": "Oligochaeta",
    "family_name": "Tubificidae",
    "bmwp_score": 1,
    "water_quality_indication": "poor",
    "is_disease_vector": false,
    "ecological_description": "Tubificid worms are highly pollution-tolerant, thriving in organically enriched sediments. Dense mats of waving red worms ('sewage worms') are classic indicators of heavy organic pollution.",
    "educational_text": "Sludge worms wave their tail ends in the water while their heads burrow in mud. If you see dense patches of tiny red worms, it usually means the water has a lot of organic pollution. This is important data for researchers!",
    "one_health_significance": "Tubificid dominance indicates severely degraded conditions with potential for pathogen accumulation and creation of stagnant conditions favorable to mosquito breeding.",
    "fun_fact": "Tubificid worms breathe through their skin and wave their tails to create water currents that bring oxygen — they're basically doing yoga in the mud!",
    "habitat": "Organically enriched sediments, sewage outfalls, eutrophic conditions"
  }
]
```

### 6.2 Demo Researcher Account

```json
{
  "email": "researcher@streamsense.eu",
  "full_name": "Dr. João Ferreira",
  "role": "researcher",
  "city": "Coimbra"
}
```

### 6.3 Pilot Cities

```json
[
  { "name": "Coimbra", "country": "Portugal", "latitude": 40.2033, "longitude": -8.4103, "radius_km": 30 },
  { "name": "Toulouse", "country": "France", "latitude": 43.6047, "longitude": 1.4442, "radius_km": 30 },
  { "name": "Benevento", "country": "Italy", "latitude": 41.1297, "longitude": 14.7826, "radius_km": 30 },
  { "name": "Ghent", "country": "Belgium", "latitude": 51.0543, "longitude": 3.7174, "radius_km": 30 },
  { "name": "Oslo", "country": "Norway", "latitude": 59.9139, "longitude": 10.7522, "radius_km": 30 }
]
```

---

## 7. Common Query Patterns

### 7.1 Volunteer: My Observations

```sql
SELECT o.*, 
       sr.common_name, sr.educational_text
FROM observations o
LEFT JOIN species_reference sr ON sr.taxon_name = o.top_species
WHERE o.user_id = :user_id
ORDER BY o.created_at DESC
LIMIT :limit OFFSET :offset;
```

### 7.2 Researcher: Review Queue

```sql
SELECT o.*, 
       ar.result AS expert_brief
FROM observations o
LEFT JOIN ai_results ar ON ar.observation_id = o.id AND ar.agent_name = 'expert_brief'
WHERE o.status = 'pending_review'
ORDER BY o.created_at DESC
LIMIT :limit OFFSET :offset;
```

### 7.3 Researcher: Validated Data

```sql
SELECT o.*, 
       er.action AS review_action,
       er.reviewer_id,
       fr.sandbox_status AS fhir_status,
       fr.sandbox_id AS fhir_id
FROM observations o
LEFT JOIN expert_reviews er ON er.observation_id = o.id
LEFT JOIN fhir_resources fr ON fr.observation_id = o.id
WHERE o.status IN ('auto_validated', 'expert_validated')
ORDER BY o.created_at DESC
LIMIT :limit OFFSET :offset;
```

### 7.4 Analytics: Summary Stats

```sql
SELECT 
  COUNT(*) as total_observations,
  COUNT(*) FILTER (WHERE status = 'auto_validated') as auto_validated,
  COUNT(*) FILTER (WHERE status = 'expert_validated') as expert_validated,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
  COUNT(*) FILTER (WHERE status = 'pending_review') as pending_review,
  AVG(confidence_score) FILTER (WHERE confidence_score IS NOT NULL) as avg_confidence,
  AVG(pipeline_time_seconds) FILTER (WHERE pipeline_time_seconds IS NOT NULL) as avg_pipeline_time
FROM observations;
```

### 7.5 Analytics: Species Distribution

```sql
SELECT 
  top_species,
  sr.common_name,
  COUNT(*) as count,
  AVG(confidence_score) as avg_confidence
FROM observations o
LEFT JOIN species_reference sr ON sr.taxon_name = o.top_species
WHERE o.status IN ('auto_validated', 'expert_validated')
  AND o.top_species IS NOT NULL
GROUP BY o.top_species, sr.common_name
ORDER BY count DESC;
```

### 7.6 Unread Notifications

```sql
SELECT * FROM notifications
WHERE user_id = :user_id AND read = FALSE
ORDER BY created_at DESC;
```

---

## 8. SQLAlchemy ORM Models

```python
# backend/app/models/observation.py

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, Text, ForeignKey, Enum, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB, TIMESTAMP
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class ObservationStatus(str, enum.Enum):
    PROCESSING = "processing"
    AUTO_VALIDATED = "auto_validated"
    PENDING_REVIEW = "pending_review"
    EXPERT_VALIDATED = "expert_validated"
    REJECTED = "rejected"

class UserRole(str, enum.Enum):
    VOLUNTEER = "volunteer"
    RESEARCHER = "researcher"

class ReviewAction(str, enum.Enum):
    CONFIRM = "confirm"
    CORRECT = "correct"
    REJECT = "reject"


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.VOLUNTEER)
    avatar_url = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    observations = relationship("Observation", back_populates="user")
    reviews = relationship("ExpertReview", back_populates="reviewer")
    notifications = relationship("Notification", back_populates="user")


class Observation(Base):
    __tablename__ = "observations"
    __table_args__ = (
        Index("idx_observations_review_queue", "status", "created_at", postgresql_where="status = 'pending_review'"),
        Index("idx_observations_user_history", "user_id", "created_at"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    image_url = Column(Text, nullable=False)
    image_thumbnail_url = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(255), nullable=True)
    pilot_city = Column(String(100), nullable=True)
    observed_at = Column(TIMESTAMP(timezone=True), nullable=False)
    status = Column(Enum(ObservationStatus), nullable=False, default=ObservationStatus.PROCESSING)
    confidence_score = Column(Integer, nullable=True)
    routing = Column(String(50), nullable=True)
    top_species = Column(String(255), nullable=True)
    top_confidence = Column(Float, nullable=True)
    impact_text = Column(Text, nullable=True)
    impact_headline = Column(String(255), nullable=True)
    pipeline_time_seconds = Column(Float, nullable=True)
    pipeline_error = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="observations")
    ai_results = relationship("AIResult", back_populates="observation", cascade="all, delete-orphan")
    review = relationship("ExpertReview", back_populates="observation", uselist=False)
    fhir_resource = relationship("FHIRResource", back_populates="observation", uselist=False)
    notifications = relationship("Notification", back_populates="observation")


class AIResult(Base):
    __tablename__ = "ai_results"
    __table_args__ = (
        Index("idx_ai_results_obs_agent", "observation_id", "agent_name", unique=True),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    observation_id = Column(UUID(as_uuid=True), ForeignKey("observations.id"), nullable=False)
    agent_name = Column(String(50), nullable=False)
    agent_version = Column(String(20), nullable=False, default="1.0")
    model_used = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False)
    result = Column(JSONB, nullable=False)
    processing_time_ms = Column(Integer, nullable=True)
    token_count_input = Column(Integer, nullable=True)
    token_count_output = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    observation = relationship("Observation", back_populates="ai_results")


class ExpertReview(Base):
    __tablename__ = "expert_reviews"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    observation_id = Column(UUID(as_uuid=True), ForeignKey("observations.id"), unique=True, nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(Enum(ReviewAction), nullable=False)
    corrections = Column(JSONB, nullable=True)
    rejection_reason = Column(String(500), nullable=True)
    review_notes = Column(Text, nullable=True)
    review_time_seconds = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    observation = relationship("Observation", back_populates="review")
    reviewer = relationship("User", back_populates="reviews")


class FHIRResource(Base):
    __tablename__ = "fhir_resources"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    observation_id = Column(UUID(as_uuid=True), ForeignKey("observations.id"), nullable=False)
    resource_type = Column(String(100), nullable=False, default="Observation")
    profile_url = Column(Text, nullable=False)
    resource_json = Column(JSONB, nullable=False)
    validation_status = Column(String(50), nullable=False)
    validation_errors = Column(JSONB, nullable=True)
    sandbox_status = Column(String(50), nullable=False, default="pending")
    sandbox_id = Column(String(255), nullable=True)
    sandbox_response = Column(JSONB, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    posted_at = Column(TIMESTAMP(timezone=True), nullable=True)
    
    observation = relationship("Observation", back_populates="fhir_resource")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    observation_id = Column(UUID(as_uuid=True), ForeignKey("observations.id"), nullable=True)
    read = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="notifications")
    observation = relationship("Observation", back_populates="notifications")


class SpeciesReference(Base):
    __tablename__ = "species_reference"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    taxon_name = Column(String(255), unique=True, nullable=False)
    common_name = Column(String(255), nullable=False)
    order_name = Column(String(255), nullable=True)
    family_name = Column(String(255), nullable=True)
    bmwp_score = Column(Integer, nullable=False)
    water_quality_indication = Column(String(50), nullable=False)
    is_disease_vector = Column(Boolean, nullable=False, default=False)
    ecological_description = Column(Text, nullable=False)
    educational_text = Column(Text, nullable=False)
    one_health_significance = Column(Text, nullable=False)
    image_url = Column(Text, nullable=True)
    fun_fact = Column(String(500), nullable=True)
    habitat = Column(String(255), nullable=True)
```

---

*End of DOC-06: Database Schema*
*Next document: DOC-07 API Keys Manual*
