# StreamSense — Agentic AI Workflow Specification (DOC 05)

> **Document ID:** DOC-05
> **Version:** 1.0
> **Last Updated:** September 29, 2026
> **Depends On:** DOC-01 (PRD), DOC-03 (Tech Stack), DOC-04 (System Architecture)
> **CRITICAL:** This is the most important document. It defines the brain of StreamSense.

---

## Table of Contents

1. [Agent Inventory](#1-agent-inventory)
2. [Orchestration Pattern](#2-orchestration-pattern)
3. [Agent 1: Vision Analyzer](#3-agent-1-vision-analyzer)
4. [Agent 2: Description Interpreter](#4-agent-2-description-interpreter)
5. [Agent 3: Metadata Validator](#5-agent-3-metadata-validator)
6. [Agent 4: Quality Scorer](#6-agent-4-quality-scorer)
7. [Agent 5: FHIR Translator](#7-agent-5-fhir-translator)
8. [Agent 6: Impact Generator](#8-agent-6-impact-generator)
9. [Agent 7: Expert Brief Generator](#9-agent-7-expert-brief-generator)
10. [Orchestrator Implementation](#10-orchestrator-implementation)
11. [Fallback Chain](#11-fallback-chain)
12. [Token Budget & Cost](#12-token-budget--cost)
13. [Testing Strategy](#13-testing-strategy)

---

## 1. Agent Inventory

| # | Agent Name | Model | Execution | Speed | Input | Output |
|---|-----------|-------|-----------|-------|-------|--------|
| 1 | Vision Analyzer | BioCLIP 2 (pybioclip, local) | Parallel (Stage 1) | ~1-2s | Image file | Species predictions JSON |
| 2 | Description Interpreter | Groq llama-3.3-70b-versatile | Parallel (Stage 1) | <500ms | Free-text description | Structured environmental params |
| 3 | Metadata Validator | Groq llama-3.3-70b-versatile + GBIF + Weather APIs | Parallel (Stage 1) | <1s | GPS, timestamp, EXIF | Validation flags JSON |
| 4 | Quality Scorer | Gemini 2.0 Flash | Sequential (Stage 2) | ~2s | Outputs of Agents 1+2+3 | Confidence score + routing |
| 5 | FHIR Translator | Gemini 2.0 Flash | Conditional (Stage 3a) | ~2s | Validated observation data | FHIR R4 resource JSON |
| 6 | Impact Generator | Groq llama-3.3-70b-versatile | Parallel (Stage 3) | <500ms | Quality score + species | Impact receipt text |
| 7 | Expert Brief Generator | Gemini 2.0 Flash | Conditional (Stage 3b) | ~2s | All agent outputs (low-conf) | Expert review brief |

**Total pipeline time (best case):** ~4 seconds
**Total pipeline time (worst case):** ~8 seconds

---

## 2. Orchestration Pattern

### 2.1 Stage-Based Parallel Execution

```
STAGE 1: PARALLEL DATA EXTRACTION (all independent, fire simultaneously)
───────────────────────────────────────────────────────────────────────

  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
  │ Agent 1: Vision  │   │ Agent 2: Desc    │   │ Agent 3: Meta   │
  │ BioCLIP 2 local  │   │ Groq <500ms      │   │ Groq + APIs     │
  │                  │   │                  │   │                  │
  │ IN: image        │   │ IN: text         │   │ IN: GPS, time   │
  │ OUT: species []  │   │ OUT: params {}   │   │ OUT: flags {}   │
  └────────┬─────────┘   └────────┬─────────┘   └────────┬────────┘
           │                      │                       │
           └──────────────────────┼───────────────────────┘
                                  │
                         AWAIT ALL THREE
                                  │
                                  ▼

STAGE 2: SEQUENTIAL QUALITY ASSESSMENT (depends on all Stage 1 results)
───────────────────────────────────────────────────────────────────────

                    ┌──────────────────────┐
                    │ Agent 4: Quality      │
                    │ Gemini 2.0 Flash      │
                    │                       │
                    │ IN: Agent 1+2+3 outs  │
                    │ OUT: score, routing   │
                    └──────────┬────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
              score >= 70            score < 70
              HIGH CONF              LOW CONF
                    │                     │
                    ▼                     ▼

STAGE 3a: AUTO-VALIDATE         STAGE 3b: EXPERT ROUTE
(parallel)                      (parallel)
─────────────────               ──────────────────

┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Agent 5     │ │ Agent 6     │ │ Agent 7     │ │ Agent 6     │
│ FHIR Trans  │ │ Impact Gen  │ │ Expert Brief│ │ Impact Gen  │
│ Gemini      │ │ Groq        │ │ Gemini      │ │ Groq        │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │               │
       ▼               ▼               ▼               ▼
  FHIR resource   Impact text     Expert brief    Impact text
  → Sandbox POST  → Citizen UI    → Expert queue  → Citizen UI
```

### 2.2 Why This Pattern

- **Stage 1 agents are independent** — Vision doesn't need description, description doesn't need metadata. Running them in parallel saves ~2 seconds vs. sequential.
- **Stage 2 MUST be sequential** — Quality scoring needs ALL three inputs to make a routing decision.
- **Stage 3 is conditional** — We only run FHIR translation for high-confidence (saves API calls). We only run Expert Brief for low-confidence.
- **Agent 6 always runs** — Every citizen gets an impact receipt regardless of confidence.

---

## 3. Agent 1: Vision Analyzer

### 3.1 Purpose
Identify macroinvertebrate species from citizen-uploaded stream photos using BioCLIP 2, a vision model specifically trained on biological organisms.

### 3.2 Model
- **Model:** BioCLIP 2 via `pybioclip`
- **Execution:** Local inference (NO API call). Model loaded into memory at server startup.
- **Hardware:** CPU inference. ~300MB memory footprint.

### 3.3 Curated Taxa List
We constrain BioCLIP's output space to 15-20 key macroinvertebrate indicator taxa relevant to European urban streams:

```python
TARGET_TAXA = [
    # EPT indicators (sensitive = good water quality)
    "Ephemeroptera",    # Mayflies — BMWP 10
    "Plecoptera",       # Stoneflies — BMWP 10
    "Trichoptera",      # Caddisflies — BMWP 7-10
    
    # Common stream macroinvertebrates
    "Baetidae",         # Small mayflies — BMWP 4
    "Hydropsychidae",   # Net-spinning caddisflies — BMWP 5
    "Heptageniidae",    # Flat-headed mayflies — BMWP 10
    "Leuctridae",       # Rolled-wing stoneflies — BMWP 10
    "Gammaridae",       # Freshwater shrimp — BMWP 6
    "Asellidae",        # Water louse — BMWP 3
    
    # Pollution tolerant (moderate-poor water)
    "Chironomidae",     # Non-biting midges — BMWP 2
    "Oligochaeta",      # Aquatic worms — BMWP 1
    "Tubificidae",      # Sludge worms — BMWP 1
    
    # Disease vectors (public health relevance)
    "Culicidae",        # Mosquitoes — disease vectors
    "Simuliidae",       # Blackflies — nuisance/vector
    
    # Other indicators
    "Gastropoda",       # Snails — BMWP 3
]
```

### 3.4 Implementation

```python
# backend/app/agents/vision.py

import asyncio
from PIL import Image
from pybioclip import TreeOfLifeClassifier
from app.agents.prompts.vision_config import TARGET_TAXA
import httpx
import io

# Load model once at import time (stays in memory)
classifier = TreeOfLifeClassifier()

async def run_vision_agent(image_url: str) -> dict:
    """
    Agent 1: Vision Analyzer
    Identifies macroinvertebrate species from citizen photo using BioCLIP 2.
    
    Args:
        image_url: Public URL to the uploaded image
    
    Returns:
        {
            "agent": "vision",
            "status": "success" | "error",
            "predictions": [
                {"taxon": "Ephemeroptera", "confidence": 0.89, "common_name": "Mayfly"},
                {"taxon": "Trichoptera", "confidence": 0.07, "common_name": "Caddisfly"},
                ...
            ],
            "top_species": "Ephemeroptera",
            "top_confidence": 0.89,
            "bmwp_score": 10,
            "water_quality_indication": "good",
            "is_disease_vector": false,
            "error": null
        }
    """
    try:
        # Download image
        async with httpx.AsyncClient() as client:
            response = await client.get(image_url, timeout=10.0)
            image = Image.open(io.BytesIO(response.content))
        
        # Run BioCLIP classification (run in thread pool since it's CPU-bound)
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            lambda: classifier.predict(image, TARGET_TAXA)
        )
        
        # Process results
        predictions = []
        for taxon, score in sorted(results.items(), key=lambda x: x[1], reverse=True)[:5]:
            predictions.append({
                "taxon": taxon,
                "confidence": round(score, 4),
                "common_name": TAXA_COMMON_NAMES.get(taxon, taxon),
                "bmwp_score": BMWP_SCORES.get(taxon, 0),
            })
        
        top = predictions[0] if predictions else None
        
        return {
            "agent": "vision",
            "status": "success",
            "predictions": predictions,
            "top_species": top["taxon"] if top else None,
            "top_confidence": top["confidence"] if top else 0,
            "bmwp_score": top["bmwp_score"] if top else 0,
            "water_quality_indication": _get_quality_indication(top["taxon"]) if top else "unknown",
            "is_disease_vector": top["taxon"] in DISEASE_VECTOR_TAXA if top else False,
            "error": None
        }
    except Exception as e:
        return {
            "agent": "vision",
            "status": "error",
            "predictions": [],
            "top_species": None,
            "top_confidence": 0,
            "bmwp_score": 0,
            "water_quality_indication": "unknown",
            "is_disease_vector": False,
            "error": str(e)
        }

# Reference data
TAXA_COMMON_NAMES = {
    "Ephemeroptera": "Mayfly nymph",
    "Plecoptera": "Stonefly nymph",
    "Trichoptera": "Caddisfly larva",
    "Chironomidae": "Midge larva",
    "Culicidae": "Mosquito larva",
    "Simuliidae": "Blackfly larva",
    "Gammaridae": "Freshwater shrimp",
    "Asellidae": "Water louse",
    "Gastropoda": "Freshwater snail",
    "Oligochaeta": "Aquatic worm",
    "Baetidae": "Small mayfly nymph",
    "Hydropsychidae": "Net-spinning caddisfly",
    "Heptageniidae": "Flat-headed mayfly",
    "Leuctridae": "Rolled-wing stonefly",
    "Tubificidae": "Sludge worm",
}

BMWP_SCORES = {
    "Ephemeroptera": 10, "Plecoptera": 10, "Trichoptera": 8,
    "Heptageniidae": 10, "Leuctridae": 10, "Baetidae": 4,
    "Hydropsychidae": 5, "Gammaridae": 6, "Asellidae": 3,
    "Chironomidae": 2, "Oligochaeta": 1, "Tubificidae": 1,
    "Culicidae": 0, "Simuliidae": 5, "Gastropoda": 3,
}

DISEASE_VECTOR_TAXA = {"Culicidae", "Simuliidae"}

def _get_quality_indication(taxon: str) -> str:
    score = BMWP_SCORES.get(taxon, 0)
    if score >= 7: return "good"
    if score >= 4: return "moderate"
    if score >= 1: return "poor"
    return "disease_vector" if taxon in DISEASE_VECTOR_TAXA else "unknown"
```

### 3.5 Timeout & Fallback
- **Timeout:** 10 seconds
- **Fallback:** `{ status: "error", predictions: [], top_species: null, top_confidence: 0 }`
- **Impact:** Pipeline continues without vision data. Quality Scorer penalizes score. Routes to expert review.

---

## 4. Agent 2: Description Interpreter

### 4.1 Purpose
Extract structured environmental parameters from the volunteer's free-text description using Groq (Llama-3.3-70b).

### 4.2 Model
- **Provider:** Groq
- **Model:** `llama-3.3-70b-versatile`
- **Speed:** <500ms

### 4.3 System Prompt

```python
# backend/app/agents/prompts/description_prompt.py

DESCRIPTION_SYSTEM_PROMPT = """You are an environmental observation parser for a citizen science stream monitoring platform.

Your ONLY job is to extract structured environmental parameters from a volunteer's free-text description of a stream or river observation.

You must output a JSON object with these fields (use null for any parameter not mentioned):

{
  "water_color": "clear" | "brown" | "green" | "milky" | "dark" | "reddish" | null,
  "water_clarity": "transparent" | "slightly_turbid" | "turbid" | "opaque" | null,
  "flow_speed": "still" | "slow" | "moderate" | "fast" | "torrential" | null,
  "water_level": "dry" | "very_low" | "low" | "normal" | "high" | "flooding" | null,
  "odor": "none" | "earthy" | "chemical" | "sewage" | "rotten_eggs" | "fishy" | null,
  "algae_presence": "none" | "slight" | "moderate" | "heavy" | "bloom" | null,
  "algae_color": "green" | "blue_green" | "brown" | "red" | null,
  "debris": "none" | "natural" | "litter" | "heavy_litter" | "industrial" | null,
  "bank_condition": "natural" | "eroded" | "concrete" | "vegetated" | null,
  "organisms_mentioned": ["list of any organisms the volunteer mentions"],
  "weather_mentioned": "sunny" | "cloudy" | "rainy" | "stormy" | null,
  "temperature_feel": "cold" | "cool" | "warm" | "hot" | null,
  "unusual_observations": "any unusual things mentioned that don't fit above categories",
  "overall_impression": "healthy" | "moderate" | "degraded" | "severely_degraded" | null,
  "confidence_in_extraction": "high" | "medium" | "low"
}

Rules:
- Extract ONLY what is explicitly stated or strongly implied
- Do NOT infer or hallucinate parameters that weren't mentioned
- If the description is vague (e.g., "water looks dirty"), map to the closest parameter (water_clarity: "turbid")
- If organisms are mentioned by common name, list them as-is (e.g., "bugs", "snails", "mosquitoes")
- Set confidence_in_extraction based on how much detail the description provides
- If the description is empty or just noise, return all nulls with confidence: "low"

Output ONLY the JSON object, no explanation."""
```

### 4.4 Implementation

```python
# backend/app/agents/description.py

from groq import AsyncGroq
from app.config import settings
from app.agents.prompts.description_prompt import DESCRIPTION_SYSTEM_PROMPT
import json

client = AsyncGroq(api_key=settings.GROQ_API_KEY)

async def run_description_agent(description: str) -> dict:
    """
    Agent 2: Description Interpreter
    Extracts structured environmental parameters from free-text.
    """
    if not description or description.strip() == "":
        return {
            "agent": "description",
            "status": "skipped",
            "params": {},
            "confidence": "low",
            "error": "No description provided"
        }
    
    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": DESCRIPTION_SYSTEM_PROMPT},
                {"role": "user", "content": f"Extract parameters from this observation description:\n\n\"{description}\""}
            ],
            temperature=0.1,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        params = json.loads(response.choices[0].message.content)
        
        return {
            "agent": "description",
            "status": "success",
            "params": params,
            "confidence": params.get("confidence_in_extraction", "medium"),
            "error": None
        }
    except Exception as e:
        return {
            "agent": "description",
            "status": "error",
            "params": {},
            "confidence": "low",
            "error": str(e)
        }
```

### 4.5 Example Input/Output

**Input:** "The water is really murky today, greenish color. Can barely see the bottom. Smells a bit like sewage. Saw lots of small bugs on the surface and some snails on the rocks. There's plastic bottles stuck in the reeds."

**Output:**
```json
{
  "water_color": "green",
  "water_clarity": "turbid",
  "flow_speed": null,
  "water_level": null,
  "odor": "sewage",
  "algae_presence": null,
  "algae_color": null,
  "debris": "litter",
  "bank_condition": null,
  "organisms_mentioned": ["small bugs", "snails"],
  "weather_mentioned": null,
  "temperature_feel": null,
  "unusual_observations": "Plastic bottles stuck in reeds",
  "overall_impression": "degraded",
  "confidence_in_extraction": "high"
}
```

---

## 5. Agent 3: Metadata Validator

### 5.1 Purpose
Validate observation metadata for plausibility — check GPS, timestamp, and cross-reference with external data sources.

### 5.2 Model
- **Provider:** Groq + external API calls
- **Model:** `llama-3.3-70b-versatile` for reasoning
- **External:** GBIF API, OpenWeatherMap API, Nominatim reverse geocoding

### 5.3 Validation Checks

| Check | Source | What It Catches |
|-------|--------|----------------|
| GPS near water body | Nominatim reverse geocode | Observation submitted from a parking lot, not a stream |
| GPS in pilot city | Coordinate bounds check | GPS from wrong continent |
| Timestamp is recent | System clock comparison | Timestamp from the future or >7 days old |
| Daylight consistency | Sunrise/sunset calculation | Photo claims to be taken at 2AM but shows bright daylight |
| Species occurrence | GBIF occurrence API | Species never recorded within 200km of location |
| Weather context | OpenWeatherMap | Claims "sunny" but weather API shows heavy rain |

### 5.4 System Prompt

```python
METADATA_SYSTEM_PROMPT = """You are a metadata validation agent for a citizen science platform monitoring urban streams.

You receive metadata about a citizen observation along with data from external APIs. Your job is to identify anomalies — things that don't make sense.

You will receive:
1. GPS coordinates (latitude, longitude)
2. Reverse geocode result (what's at those coordinates)
3. Timestamp of observation
4. Weather data at that location/time
5. GBIF species occurrence data (if a species was identified)

Evaluate and output a JSON object:

{
  "gps_valid": true/false,
  "gps_near_water": true/false/null,
  "gps_location_name": "human readable location",
  "gps_in_pilot_city": true/false,
  "gps_anomaly": "description of GPS issue or null",
  
  "timestamp_valid": true/false,
  "timestamp_anomaly": "description or null",
  "daylight_consistent": true/false/null,
  
  "species_plausible": true/false/null,
  "species_gbif_records_nearby": number or null,
  "species_anomaly": "description or null",
  
  "weather_context": {
    "temperature_c": number,
    "condition": "clear/cloudy/rain/etc",
    "matches_description": true/false/null
  },
  
  "anomalies": ["list of all detected anomalies as short strings"],
  "anomaly_count": number,
  "overall_validity": "valid" | "suspicious" | "invalid",
  "confidence": "high" | "medium" | "low"
}

Rules:
- Only flag genuine anomalies, not minor inconsistencies
- GPS 50+ meters from any water body = suspicious
- GPS in the ocean or clearly wrong continent = invalid
- If GBIF has zero records of the species within 200km = suspicious (NOT invalid — could be a new observation)
- Missing data = null, NOT an anomaly
- Be conservative: when in doubt, mark as valid"""
```

### 5.5 Implementation

```python
# backend/app/agents/metadata.py

import asyncio
from groq import AsyncGroq
from app.config import settings
from app.agents.prompts.metadata_prompt import METADATA_SYSTEM_PROMPT
from app.utils.geocoding import reverse_geocode, is_near_water
import httpx
import json
from datetime import datetime, timezone

client = AsyncGroq(api_key=settings.GROQ_API_KEY)

PILOT_CITIES = {
    "Coimbra": {"lat": 40.2033, "lon": -8.4103, "radius_km": 30},
    "Toulouse": {"lat": 43.6047, "lon": 1.4442, "radius_km": 30},
    "Benevento": {"lat": 41.1297, "lon": 14.7826, "radius_km": 30},
    "Ghent": {"lat": 51.0543, "lon": 3.7174, "radius_km": 30},
    "Oslo": {"lat": 59.9139, "lon": 10.7522, "radius_km": 30},
}

async def run_metadata_agent(
    latitude: float, 
    longitude: float, 
    timestamp: str,
    species: str | None = None
) -> dict:
    """
    Agent 3: Metadata Validator
    Validates GPS, timestamp, and cross-references external APIs.
    """
    try:
        # Run external API calls in parallel
        geocode_task = reverse_geocode(latitude, longitude)
        weather_task = _get_weather(latitude, longitude)
        gbif_task = _check_gbif(latitude, longitude, species) if species else asyncio.coroutine(lambda: None)()
        
        geocode_result, weather_result, gbif_result = await asyncio.gather(
            geocode_task, weather_task, gbif_task,
            return_exceptions=True
        )
        
        # Handle exceptions from parallel tasks
        geocode_result = geocode_result if not isinstance(geocode_result, Exception) else None
        weather_result = weather_result if not isinstance(weather_result, Exception) else None
        gbif_result = gbif_result if not isinstance(gbif_result, Exception) else None
        
        # Check pilot city
        pilot_city = _check_pilot_city(latitude, longitude)
        
        # Build context for LLM
        context = f"""
GPS: {latitude}, {longitude}
Reverse Geocode: {json.dumps(geocode_result) if geocode_result else 'unavailable'}
Pilot City Match: {pilot_city or 'none'}
Timestamp: {timestamp}
Current UTC: {datetime.now(timezone.utc).isoformat()}
Weather: {json.dumps(weather_result) if weather_result else 'unavailable'}
Species identified: {species or 'none'}
GBIF records nearby: {json.dumps(gbif_result) if gbif_result else 'unavailable'}
"""
        
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": METADATA_SYSTEM_PROMPT},
                {"role": "user", "content": f"Validate this observation metadata:\n{context}"}
            ],
            temperature=0.1,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        validation = json.loads(response.choices[0].message.content)
        
        return {
            "agent": "metadata",
            "status": "success",
            "validation": validation,
            "pilot_city": pilot_city,
            "error": None
        }
    except Exception as e:
        return {
            "agent": "metadata",
            "status": "error",
            "validation": {"overall_validity": "unknown", "anomalies": [], "anomaly_count": 0},
            "pilot_city": _check_pilot_city(latitude, longitude),
            "error": str(e)
        }
```

---

## 6. Agent 4: Quality Scorer

### 6.1 Purpose
The central decision-maker. Takes all Stage 1 outputs, computes a weighted confidence score (0-100), and determines routing: auto-validate or send to expert review.

### 6.2 Model
- **Provider:** Gemini
- **Model:** `gemini-2.0-flash`
- **Reason:** Needs reasoning quality to weigh multiple signals and generate explainable justification.

### 6.3 System Prompt

```python
QUALITY_SYSTEM_PROMPT = """You are the Quality Scoring Agent for StreamSense, a citizen science stream monitoring platform.

You receive the outputs of three parallel analysis agents:
1. Vision Agent — species identification from the photo (BioCLIP)
2. Description Agent — environmental parameters extracted from text
3. Metadata Agent — GPS, timestamp, and plausibility validation

Your job is to:
1. Calculate a confidence score from 0 to 100
2. Determine routing: "auto_validate" (score >= 70) or "expert_review" (score < 70)
3. Provide explainable reasoning

Scoring Weights:
- Vision confidence (40%): How confident is the species identification?
  - top_confidence >= 0.8 → 40 points
  - top_confidence >= 0.5 → 25 points
  - top_confidence >= 0.3 → 15 points
  - top_confidence < 0.3 or vision failed → 5 points
  
- Metadata validity (35%): Are GPS, timestamp, and context plausible?
  - No anomalies → 35 points
  - 1 minor anomaly → 25 points
  - 2+ anomalies or 1 major anomaly → 10 points
  - Invalid metadata → 0 points
  
- Description quality (25%): How much useful data was extracted?
  - High confidence extraction with 5+ parameters → 25 points
  - Medium confidence with 3+ parameters → 18 points
  - Low confidence or few parameters → 10 points
  - No description → 5 points

Output JSON:
{
  "score": 0-100,
  "routing": "auto_validate" | "expert_review",
  "reasoning": "2-3 sentence explanation of the score",
  "score_breakdown": {
    "vision_score": 0-40,
    "vision_reason": "brief reason",
    "metadata_score": 0-35,
    "metadata_reason": "brief reason",
    "description_score": 0-25,
    "description_reason": "brief reason"
  },
  "key_strengths": ["list of 1-3 strengths"],
  "key_concerns": ["list of concerns, empty if none"],
  "recommended_action": "auto_validate" | "expert_review_species" | "expert_review_location" | "expert_review_quality"
}

Rules:
- Be calibrated: a score of 85+ should mean you're confident this is a valid observation
- A score of 50-69 means "probably fine but worth a human check"
- A score below 50 means "significant concerns"
- If vision failed entirely, cap the score at 50 (always route to expert)
- If GPS is invalid, cap the score at 30
- The reasoning must be understandable by a non-expert citizen"""
```

### 6.4 Deterministic Fallback

If Gemini is unavailable, use this rule-based scoring:

```python
def fallback_quality_score(vision_result: dict, description_result: dict, metadata_result: dict) -> dict:
    """Deterministic fallback if Gemini is unavailable."""
    score = 0
    
    # Vision (40 points)
    top_conf = vision_result.get("top_confidence", 0)
    if top_conf >= 0.8: score += 40
    elif top_conf >= 0.5: score += 25
    elif top_conf >= 0.3: score += 15
    else: score += 5
    
    # Metadata (35 points)
    anomaly_count = metadata_result.get("validation", {}).get("anomaly_count", 0)
    validity = metadata_result.get("validation", {}).get("overall_validity", "unknown")
    if validity == "valid" and anomaly_count == 0: score += 35
    elif anomaly_count <= 1: score += 25
    elif validity != "invalid": score += 10
    
    # Description (25 points)
    desc_conf = description_result.get("confidence", "low")
    params = description_result.get("params", {})
    non_null = sum(1 for v in params.values() if v is not None)
    if desc_conf == "high" and non_null >= 5: score += 25
    elif desc_conf in ("high", "medium") and non_null >= 3: score += 18
    elif non_null > 0: score += 10
    else: score += 5
    
    return {
        "score": score,
        "routing": "auto_validate" if score >= 70 else "expert_review",
        "reasoning": f"Automated score: {score}/100. Vision: {top_conf:.0%}, Metadata: {validity}, Description: {desc_conf}.",
        "score_breakdown": {"vision_score": 0, "metadata_score": 0, "description_score": 0},
        "key_strengths": [],
        "key_concerns": [],
        "recommended_action": "auto_validate" if score >= 70 else "expert_review"
    }
```

---

## 7. Agent 5: FHIR Translator

### 7.1 Purpose
Convert validated observation data into FHIR R4 resources compliant with the hl7-eu/oah Implementation Guide profiles.

### 7.2 Model
- **Provider:** Gemini
- **Model:** `gemini-2.0-flash`
- **Reason:** Must generate strictly valid nested JSON conforming to FHIR schemas. Gemini Flash excels at structured output.

### 7.3 When Triggered
- Only after Agent 4 routes to "auto_validate" (score ≥ 70)
- OR after a researcher manually confirms/corrects an observation

### 7.4 Validation Loop
The generated FHIR resource is ALWAYS validated by `fhir.resources` before being accepted:

```python
from fhir.resources.observation import Observation

def validate_fhir_resource(resource_json: dict) -> tuple[bool, str]:
    """Validate FHIR resource using fhir.resources Pydantic models."""
    try:
        obs = Observation.model_validate(resource_json)
        return True, obs.model_dump_json()
    except Exception as e:
        return False, str(e)
```

If validation fails, the agent retries once with the error message appended to the prompt.

### 7.5 Details
Full FHIR prompt and resource templates are defined in DOC-08 (FHIR Integration Spec).

---

## 8. Agent 6: Impact Generator

### 8.1 Purpose
Generate a plain-language impact receipt for the citizen, explaining what the AI found and how their data contributes to One Health outcomes.

### 8.2 Model
- **Provider:** Groq
- **Model:** `llama-3.3-70b-versatile`
- **Speed:** <500ms
- **Reason:** Simple text generation task. Speed matters (citizen is waiting for feedback).

### 8.3 System Prompt

```python
IMPACT_SYSTEM_PROMPT = """You are the Impact Receipt Generator for StreamSense, a citizen science stream monitoring platform.

Your job is to write a short, warm, encouraging impact statement for a citizen who just submitted a stream observation. The receipt should:

1. Acknowledge what they submitted (species found, conditions observed)
2. Explain the significance in plain language (what does this species mean for water quality?)
3. Connect to One Health (how does this help predict disease risk or protect community health?)
4. Thank them and encourage continued participation

TONE: Warm, friendly, encouraging. Like a kind teacher explaining science to a curious student.
LENGTH: 3-4 sentences maximum.
LANGUAGE: No scientific jargon. If you mention a scientific name, also give the common name.

Output JSON:
{
  "impact_text": "The main impact statement (3-4 sentences)",
  "headline": "Short headline (5-8 words)",
  "ecological_insight": "One sentence about what this means ecologically",
  "health_connection": "One sentence connecting to community health"
}

Examples of good receipts:
- "Great catch! You found mayfly nymphs — these sensitive creatures only thrive in clean, healthy water. Your observation confirms that this stretch of the Madrigueira stream maintains good ecological quality. This data helps researchers predict disease-carrying mosquito populations in your neighborhood."
- "Thank you for your observation! The murky water and algae you reported suggests possible nutrient enrichment. We've flagged this for expert review. Reports like yours help us detect water quality changes early, before they affect community health."
"""
```

### 8.4 Input
```json
{
  "species": "Ephemeroptera",
  "common_name": "Mayfly nymph",
  "confidence": 0.89,
  "quality_score": 87,
  "routing": "auto_validate",
  "water_quality": "good",
  "is_disease_vector": false,
  "location_name": "Madrigueira stream, Coimbra",
  "description_params": { "water_color": "clear", "flow_speed": "moderate" }
}
```

---

## 9. Agent 7: Expert Brief Generator

### 9.1 Purpose
For low-confidence observations (score < 70), generate a concise expert review brief that highlights specific concerns and recommends what the researcher should check.

### 9.2 Model
- **Provider:** Gemini
- **Model:** `gemini-2.0-flash`
- **Reason:** Needs reasoning quality to synthesize multiple agent outputs and formulate specific expert-facing recommendations.

### 9.3 System Prompt

```python
EXPERT_BRIEF_SYSTEM_PROMPT = """You are generating an expert review brief for a freshwater ecologist who needs to validate a citizen science stream observation.

You receive the outputs of the AI triage pipeline:
- Vision analysis (species identification + confidence)
- Description extraction (environmental parameters)
- Metadata validation (GPS, timestamp, anomaly flags)
- Quality score (overall confidence)

Write a concise brief that:
1. Summarizes what the AI found
2. Lists SPECIFIC concerns (not vague warnings)
3. Tells the expert exactly what to check
4. Recommends an action

Output JSON:
{
  "summary": "2-3 sentence summary of the observation and AI analysis",
  "concerns": [
    {
      "type": "species_uncertainty" | "gps_anomaly" | "description_mismatch" | "photo_quality" | "temporal_anomaly" | "occurrence_anomaly",
      "severity": "low" | "medium" | "high",
      "detail": "Specific concern description",
      "check_recommendation": "What the expert should look at"
    }
  ],
  "recommended_action": "confirm_with_correction" | "requires_careful_review" | "likely_reject",
  "priority": "low" | "medium" | "high",
  "estimated_review_time": "30 seconds" | "1-2 minutes" | "3-5 minutes"
}

Rules:
- Be SPECIFIC. "GPS might be wrong" is bad. "GPS is 2.3km from nearest water body (Madrigueira stream)" is good.
- Prioritize actionable concerns. The expert's time is valuable.
- If the only issue is low vision confidence but metadata is clean, recommend: "confirm_with_correction" (just needs species ID correction)
- If GPS is clearly invalid, recommend: "likely_reject"
"""
```

---

## 10. Orchestrator Implementation

```python
# backend/app/agents/orchestrator.py

import asyncio
import time
from app.agents.vision import run_vision_agent
from app.agents.description import run_description_agent
from app.agents.metadata import run_metadata_agent
from app.agents.quality import run_quality_agent
from app.agents.fhir_translator import run_fhir_agent
from app.agents.impact import run_impact_agent
from app.agents.expert_brief import run_expert_brief_agent
from typing import AsyncGenerator

async def run_pipeline(
    image_url: str,
    description: str,
    latitude: float,
    longitude: float,
    timestamp: str,
) -> AsyncGenerator[dict, None]:
    """
    Main orchestrator. Runs the 7-agent pipeline with parallel execution.
    Yields status updates as SSE events for real-time frontend display.
    
    Stages:
      1. Agents 1, 2, 3 run in PARALLEL
      2. Agent 4 runs SEQUENTIALLY (needs all Stage 1 results)
      3a. If HIGH confidence: Agents 5 + 6 run in PARALLEL
      3b. If LOW confidence: Agents 7 + 6 run in PARALLEL
    """
    pipeline_start = time.time()
    results = {}
    
    # ── STAGE 1: Parallel data extraction ──
    yield {"event": "stage", "data": {"stage": 1, "status": "started"}}
    
    vision_task = asyncio.create_task(run_vision_agent(image_url))
    description_task = asyncio.create_task(run_description_agent(description))
    metadata_task = asyncio.create_task(
        run_metadata_agent(latitude, longitude, timestamp)
    )
    
    # Wait for all three, yielding updates as each completes
    pending = {
        vision_task: "vision",
        description_task: "description", 
        metadata_task: "metadata"
    }
    
    for coro in asyncio.as_completed(pending.keys()):
        result = await coro
        agent_name = pending[next(t for t in pending if t is coro)]
        results[agent_name] = result
        yield {
            "event": "agent_update",
            "data": {
                "agent": agent_name,
                "status": result["status"],
                "summary": _summarize_agent(agent_name, result)
            }
        }
    
    # If vision identified a species, re-run metadata with species context
    if results["vision"].get("top_species"):
        metadata_with_species = await run_metadata_agent(
            latitude, longitude, timestamp,
            species=results["vision"]["top_species"]
        )
        results["metadata"] = metadata_with_species
    
    # ── STAGE 2: Sequential quality scoring ──
    yield {"event": "stage", "data": {"stage": 2, "status": "started"}}
    
    results["quality"] = await run_quality_agent(
        vision_result=results["vision"],
        description_result=results["description"],
        metadata_result=results["metadata"]
    )
    
    yield {
        "event": "agent_update",
        "data": {
            "agent": "quality",
            "status": "success",
            "summary": f"Score: {results['quality']['score']}/100 → {results['quality']['routing']}"
        }
    }
    
    # ── STAGE 3: Conditional parallel execution ──
    yield {"event": "stage", "data": {"stage": 3, "status": "started"}}
    
    score = results["quality"]["score"]
    routing = results["quality"]["routing"]
    
    impact_input = {
        "species": results["vision"].get("top_species"),
        "common_name": results["vision"].get("predictions", [{}])[0].get("common_name") if results["vision"].get("predictions") else None,
        "confidence": results["vision"].get("top_confidence", 0),
        "quality_score": score,
        "routing": routing,
        "water_quality": results["vision"].get("water_quality_indication"),
        "is_disease_vector": results["vision"].get("is_disease_vector", False),
        "location_name": results["metadata"].get("pilot_city", "your area"),
        "description_params": results["description"].get("params", {})
    }
    
    if routing == "auto_validate":
        # HIGH confidence: FHIR + Impact in parallel
        fhir_task = asyncio.create_task(run_fhir_agent(results))
        impact_task = asyncio.create_task(run_impact_agent(impact_input))
        
        results["fhir"], results["impact"] = await asyncio.gather(
            fhir_task, impact_task
        )
    else:
        # LOW confidence: Expert Brief + Impact in parallel
        brief_task = asyncio.create_task(run_expert_brief_agent(results))
        impact_task = asyncio.create_task(run_impact_agent(impact_input))
        
        results["expert_brief"], results["impact"] = await asyncio.gather(
            brief_task, impact_task
        )
    
    pipeline_time = round(time.time() - pipeline_start, 2)
    
    yield {
        "event": "pipeline_complete",
        "data": {
            "score": score,
            "routing": routing,
            "pipeline_time_seconds": pipeline_time,
            "results": results
        }
    }


def _summarize_agent(name: str, result: dict) -> str:
    """Generate a short human-readable summary for SSE events."""
    if result["status"] == "error":
        return f"{name} encountered an issue"
    
    if name == "vision":
        sp = result.get("top_species", "Unknown")
        conf = result.get("top_confidence", 0)
        return f"{sp} identified ({conf:.0%} confidence)"
    elif name == "description":
        params = result.get("params", {})
        count = sum(1 for v in params.values() if v is not None)
        return f"{count} parameters extracted"
    elif name == "metadata":
        anomalies = result.get("validation", {}).get("anomaly_count", 0)
        return f"{'No anomalies' if anomalies == 0 else f'{anomalies} anomaly(ies) detected'}"
    return "Complete"
```

---

## 11. Fallback Chain

```
PRIMARY MODEL          FALLBACK 1              FALLBACK 2
──────────────         ──────────              ──────────

Agent 1 (BioCLIP)  →   Skip vision data    →   Route to expert with "no vision" flag
Agent 2 (Groq)     →   Gemini Flash        →   Skip description extraction
Agent 3 (Groq)     →   Gemini Flash        →   Basic GPS bounds check only (no LLM)
Agent 4 (Gemini)   →   Deterministic rules →   Always route to expert
Agent 5 (Gemini)   →   Groq                →   Store as "fhir_pending", retry later
Agent 6 (Groq)     →   Gemini Flash        →   Template: "Thank you for your observation!"
Agent 7 (Gemini)   →   Groq                →   Show raw agent outputs to researcher
```

---

## 12. Token Budget & Cost

### Per-Observation Estimate

| Agent | Model | Input Tokens | Output Tokens | Cost (Free Tier) |
|-------|-------|-------------|--------------|-----------------|
| 1 | BioCLIP (local) | N/A | N/A | $0.00 |
| 2 | Groq Llama-3.3 | ~200 | ~300 | $0.00 (free tier) |
| 3 | Groq Llama-3.3 | ~400 | ~400 | $0.00 (free tier) |
| 4 | Gemini Flash | ~800 | ~500 | $0.00 (free tier) |
| 5 | Gemini Flash | ~600 | ~800 | $0.00 (free tier) |
| 6 | Groq Llama-3.3 | ~300 | ~200 | $0.00 (free tier) |
| 7 | Gemini Flash | ~800 | ~500 | $0.00 (free tier) |
| **Total** | | **~3,100** | **~2,700** | **$0.00** |

**For 100 demo observations:** ~580K total tokens. Well within free tier limits of both Gemini (1M TPD) and Groq (6000 RPD).

---

## 13. Testing Strategy

### 13.1 Unit Tests (Per Agent)

Each agent gets a test file with:
1. Happy path test (good input → expected output structure)
2. Edge case test (empty input, missing fields)
3. Error handling test (mock API failure → fallback response)

### 13.2 Integration Test

One end-to-end test with a real image:
1. Upload a known mayfly photo
2. Run full pipeline
3. Verify: vision identifies Ephemeroptera, score ≥ 70, FHIR resource generated, impact receipt created

### 13.3 Test Images

Prepare 5 test images:
1. Clear mayfly nymph (high confidence expected)
2. Blurry stream photo (low confidence expected)
3. Photo of a dog (should fail species ID)
4. Photo with wrong GPS (metadata anomaly)
5. Good photo with rich description (full pipeline test)

---

*End of DOC-05: Agentic AI Workflow Specification*
*Next document: DOC-06 Database Schema*
