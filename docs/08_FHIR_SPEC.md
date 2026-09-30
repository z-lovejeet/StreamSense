# StreamSense — FHIR Integration Specification (DOC 08)

> **Document ID:** DOC-08
> **Version:** 1.0
> **Last Updated:** September 29, 2026
> **Depends On:** DOC-01 (PRD), DOC-05 (Agentic AI Workflow), DOC-06 (Database Schema)

---

## Table of Contents

1. [FHIR R4 Primer](#1-fhir-r4-primer)
2. [OAH Implementation Guide Profiles](#2-oah-implementation-guide-profiles)
3. [Resource Templates](#3-resource-templates)
4. [Code Mappings (LOINC / SNOMED)](#4-code-mappings-loinc--snomed)
5. [Sandbox API Reference](#5-sandbox-api-reference)
6. [Agent 5 FHIR Prompt](#6-agent-5-fhir-prompt)
7. [Validation Strategy](#7-validation-strategy)
8. [Error Handling](#8-error-handling)
9. [Demo Data](#9-demo-data)

---

## 1. FHIR R4 Primer

**FHIR** (Fast Healthcare Interoperability Resources) is the global standard for exchanging health data. StreamSense uses FHIR to make environmental health observations consumable by health information systems worldwide.

### Key Concepts

| Concept | Meaning |
|---------|---------|
| **Resource** | A unit of health data (like a row in a database). Types: Patient, Observation, Location, etc. |
| **Profile** | A set of constraints on a resource for a specific use case. OAH defines profiles for environmental observations. |
| **Bundle** | A collection of resources. Used for bulk export/import. |
| **Coding** | A standardized code from a code system (LOINC, SNOMED). |
| **Reference** | A link from one resource to another (e.g., Observation references Location). |

### Resources We Generate

| FHIR Resource | StreamSense Use |
|---------------|----------------|
| **Observation** | The core resource — one per validated citizen observation. Contains species, water quality parameters, confidence score. |
| **Location** | The monitoring site — GPS coordinates, pilot city, stream name. Referenced by Observation. |

---

## 2. OAH Implementation Guide Profiles

The OneAquaHealth FHIR IG (https://github.com/hl7-eu/oah) defines specific profiles:

### Profile: observation-indicators-oah

**Purpose:** Environmental indicator observations (species, water quality parameters)
**Base:** FHIR R4 Observation
**URL:** `http://hl7.eu/fhir/ig/oah/StructureDefinition/observation-indicators-oah`

**Key constraints (from IG):**
- `status` must be "final" or "preliminary"
- `code` should use LOINC or a custom OAH code system
- `subject` references a Location resource (monitoring site)
- `effectiveDateTime` is required
- `component` can hold multiple parameters per observation

### Profile: observation-health-measure-oah

**Purpose:** Health-related measurements linked to environmental data
**URL:** `http://hl7.eu/fhir/ig/oah/StructureDefinition/observation-health-measure-oah`

### Profile: location-oah

**Purpose:** Monitoring site location
**URL:** `http://hl7.eu/fhir/ig/oah/StructureDefinition/location-oah`

**Key fields:**
- `name` — Site name
- `position.latitude` / `position.longitude`
- `address.city` — Pilot city

> **Note:** The OAH IG is at v0.1.0-ci-build and may have limited profile documentation. When in doubt, use base FHIR R4 Observation with the OAH profile URL in `meta.profile`. Judges (especially Datta) will appreciate the attempt even if profile conformance isn't perfect.

---

## 3. Resource Templates

### 3.1 Location Resource

```json
{
  "resourceType": "Location",
  "meta": {
    "profile": [
      "http://hl7.eu/fhir/ig/oah/StructureDefinition/location-oah"
    ]
  },
  "status": "active",
  "name": "Madrigueira Stream - Site M01",
  "description": "Urban stream monitoring site in Coimbra, Portugal",
  "mode": "instance",
  "type": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
          "code": "HUSCS",
          "display": "specimen collection site"
        }
      ]
    }
  ],
  "position": {
    "longitude": -8.4103,
    "latitude": 40.2033
  },
  "address": {
    "city": "Coimbra",
    "country": "PT"
  }
}
```

### 3.2 Observation Resource (Environmental Indicator)

This is the primary resource StreamSense generates for each validated observation:

```json
{
  "resourceType": "Observation",
  "meta": {
    "profile": [
      "http://hl7.eu/fhir/ig/oah/StructureDefinition/observation-indicators-oah"
    ],
    "tag": [
      {
        "system": "http://streamsense.eu/tags",
        "code": "citizen-science",
        "display": "Citizen Science Observation"
      }
    ]
  },
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "survey",
          "display": "Survey"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "72166-2",
        "display": "Environmental assessment"
      }
    ],
    "text": "Stream Health Observation - Macroinvertebrate Survey"
  },
  "subject": {
    "reference": "Location/location-id-here",
    "display": "Madrigueira Stream - Site M01"
  },
  "effectiveDateTime": "2026-09-29T14:30:00+01:00",
  "issued": "2026-09-29T14:30:05+01:00",
  "performer": [
    {
      "display": "Citizen Scientist (StreamSense Volunteer)"
    }
  ],
  "valueString": "Macroinvertebrate community assessment indicating good water quality",
  "note": [
    {
      "text": "AI-validated observation. Confidence: 87/100. Validation: auto_validated."
    },
    {
      "text": "Volunteer description: The water is clear with moderate flow. I saw several small insects under the rocks."
    }
  ],
  "component": [
    {
      "code": {
        "coding": [
          {
            "system": "http://streamsense.eu/codes",
            "code": "species-identified",
            "display": "Species Identified"
          }
        ]
      },
      "valueString": "Ephemeroptera (Mayfly nymph)"
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://streamsense.eu/codes",
            "code": "species-confidence",
            "display": "Species Identification Confidence"
          }
        ]
      },
      "valueQuantity": {
        "value": 89,
        "unit": "%",
        "system": "http://unitsofmeasure.org",
        "code": "%"
      }
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://streamsense.eu/codes",
            "code": "bmwp-score",
            "display": "BMWP Biological Monitoring Score"
          }
        ]
      },
      "valueQuantity": {
        "value": 10,
        "unit": "score",
        "system": "http://unitsofmeasure.org",
        "code": "1"
      }
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://streamsense.eu/codes",
            "code": "water-quality-indication",
            "display": "Water Quality Indication"
          }
        ]
      },
      "valueString": "good"
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://streamsense.eu/codes",
            "code": "water-color",
            "display": "Observed Water Color"
          }
        ]
      },
      "valueString": "clear"
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://streamsense.eu/codes",
            "code": "flow-speed",
            "display": "Observed Flow Speed"
          }
        ]
      },
      "valueString": "moderate"
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://streamsense.eu/codes",
            "code": "ai-confidence-score",
            "display": "StreamSense AI Confidence Score"
          }
        ]
      },
      "valueQuantity": {
        "value": 87,
        "unit": "score",
        "system": "http://unitsofmeasure.org",
        "code": "1"
      }
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://streamsense.eu/codes",
            "code": "disease-vector-detected",
            "display": "Disease Vector Detected"
          }
        ]
      },
      "valueBoolean": false
    }
  ]
}
```

### 3.3 FHIR Bundle (Bulk Export)

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "fullUrl": "urn:uuid:location-uuid",
      "resource": { "...Location resource..." },
      "request": {
        "method": "POST",
        "url": "Location"
      }
    },
    {
      "fullUrl": "urn:uuid:observation-uuid",
      "resource": { "...Observation resource..." },
      "request": {
        "method": "POST",
        "url": "Observation"
      }
    }
  ]
}
```

---

## 4. Code Mappings (LOINC / SNOMED)

### LOINC Codes Used

| Code | Display | Use |
|------|---------|-----|
| `72166-2` | Environmental assessment | Main observation code |
| `LA28177-4` | Stream health status | Alternative observation code |

### Custom StreamSense Code System

Since LOINC doesn't have specific codes for macroinvertebrate survey components, we define a custom code system at `http://streamsense.eu/codes`:

| Code | Display | Value Type |
|------|---------|-----------|
| `species-identified` | Species Identified | valueString |
| `species-confidence` | Species Identification Confidence | valueQuantity (%) |
| `bmwp-score` | BMWP Biological Monitoring Score | valueQuantity (integer) |
| `water-quality-indication` | Water Quality Indication | valueString |
| `water-color` | Observed Water Color | valueString |
| `water-clarity` | Observed Water Clarity | valueString |
| `flow-speed` | Observed Flow Speed | valueString |
| `odor` | Observed Odor | valueString |
| `algae-presence` | Algae Presence | valueString |
| `debris` | Debris Level | valueString |
| `ai-confidence-score` | StreamSense AI Confidence Score | valueQuantity |
| `disease-vector-detected` | Disease Vector Detected | valueBoolean |
| `validation-source` | Validation Source | valueString (ai / expert) |

> **Judge note for Datta:** We acknowledge these are custom codes. In a production system, we would register them with the appropriate standards body or map to existing environmental vocabularies (e.g., EPA, EEA).

---

## 5. Sandbox API Reference

### Base URL
```
https://sandbox.hl7europe.eu/oneaquahealth/fhir
```

### Endpoints

| Operation | Method | URL | Headers | Description |
|-----------|--------|-----|---------|-------------|
| Capability Statement | GET | `/metadata` | Accept: application/fhir+json | Server capabilities |
| Create Observation | POST | `/Observation` | Content-Type: application/fhir+json | Create new observation |
| Read Observation | GET | `/Observation/{id}` | Accept: application/fhir+json | Get specific observation |
| Search Observations | GET | `/Observation?{params}` | Accept: application/fhir+json | Search observations |
| Create Location | POST | `/Location` | Content-Type: application/fhir+json | Create monitoring site |
| Create Bundle | POST | `/` | Content-Type: application/fhir+json | Submit bundle (batch/transaction) |

### Common Search Parameters

```
GET /Observation?date=2026-09-29              # By date
GET /Observation?subject=Location/123         # By location
GET /Observation?_tag=citizen-science         # By tag
GET /Observation?_count=10&_offset=0          # Pagination
GET /Observation?_sort=-date                  # Sort by date descending
```

### Expected Responses

| HTTP Status | Meaning |
|------------|---------|
| 200 | Success (GET/Search) |
| 201 | Created (POST) |
| 400 | Invalid resource (validation errors in OperationOutcome) |
| 404 | Resource not found |
| 422 | Unprocessable entity (profile validation failure) |

---

## 6. Agent 5 FHIR Prompt

```python
FHIR_TRANSLATOR_SYSTEM_PROMPT = """You are the FHIR Translator Agent for StreamSense. You convert validated stream observation data into FHIR R4 Observation resources.

You MUST generate a VALID FHIR R4 Observation resource that:
1. Uses the OAH profile: "http://hl7.eu/fhir/ig/oah/StructureDefinition/observation-indicators-oah"
2. Has status "final"
3. Has category "survey"
4. Has a proper effectiveDateTime (from observation timestamp)
5. Uses components for each data parameter

You will receive:
- Species identified (name, confidence, BMWP score)
- Environmental parameters (water color, flow speed, etc.)
- Quality score
- GPS coordinates
- Observation timestamp
- Volunteer description

Map these to FHIR Observation components using the StreamSense code system (http://streamsense.eu/codes).

Available component codes:
- species-identified → valueString
- species-confidence → valueQuantity (%)
- bmwp-score → valueQuantity (integer)
- water-quality-indication → valueString (good/moderate/poor/disease_vector)
- water-color → valueString
- water-clarity → valueString
- flow-speed → valueString
- odor → valueString
- algae-presence → valueString
- debris → valueString
- ai-confidence-score → valueQuantity (0-100)
- disease-vector-detected → valueBoolean
- validation-source → valueString (ai/expert)

Only include components for parameters that have actual values (skip null parameters).

Include the volunteer's description as a note.
Include the AI confidence score and validation source as notes.

Output ONLY the FHIR JSON resource — no explanation, no markdown, no code blocks.
The output must be valid JSON that can be parsed by json.loads().
"""
```

---

## 7. Validation Strategy

### 7.1 Pre-POST Validation (fhir.resources)

Before POSTing to the sandbox, ALWAYS validate locally:

```python
from fhir.resources.observation import Observation
from fhir.resources.location import Location
import json

def validate_observation(resource_dict: dict) -> tuple[bool, str | None]:
    """Validate FHIR Observation resource locally before POST."""
    try:
        obs = Observation.model_validate(resource_dict)
        # Re-serialize to ensure clean JSON
        return True, obs.model_dump_json(exclude_none=True)
    except Exception as e:
        return False, str(e)

def validate_location(resource_dict: dict) -> tuple[bool, str | None]:
    """Validate FHIR Location resource locally before POST."""
    try:
        loc = Location.model_validate(resource_dict)
        return True, loc.model_dump_json(exclude_none=True)
    except Exception as e:
        return False, str(e)
```

### 7.2 Retry on Validation Failure

If the LLM-generated FHIR resource fails validation:

```python
async def generate_fhir_with_retry(observation_data: dict, max_retries: int = 2) -> dict:
    """Generate FHIR resource with validation retry loop."""
    for attempt in range(max_retries + 1):
        # Generate FHIR resource
        resource_json = await call_gemini_fhir_agent(observation_data, error_context=None)
        
        # Validate
        is_valid, result = validate_observation(resource_json)
        
        if is_valid:
            return {"status": "valid", "resource": json.loads(result)}
        
        if attempt < max_retries:
            # Retry with error context
            error_context = f"Previous attempt failed validation: {result}. Fix the issue and regenerate."
            resource_json = await call_gemini_fhir_agent(observation_data, error_context=error_context)
    
    # All retries exhausted — return raw resource with warning
    return {"status": "invalid", "resource": resource_json, "error": result}
```

### 7.3 POST to Sandbox

```python
import httpx

async def post_to_fhir_sandbox(resource_json: dict) -> dict:
    """POST validated FHIR resource to OAH sandbox."""
    sandbox_url = settings.FHIR_SANDBOX_URL
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{sandbox_url}/Observation",
                json=resource_json,
                headers={
                    "Content-Type": "application/fhir+json",
                    "Accept": "application/fhir+json"
                }
            )
            
            if response.status_code == 201:
                created = response.json()
                return {
                    "status": "posted",
                    "sandbox_id": created.get("id"),
                    "response_status": 201
                }
            else:
                return {
                    "status": "failed",
                    "response_status": response.status_code,
                    "error": response.text
                }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
```

---

## 8. Error Handling

| Error | Cause | Recovery |
|-------|-------|----------|
| LLM generates invalid FHIR | Missing required fields, wrong types | Retry with error context (max 2 retries) |
| fhir.resources validation fails after retries | Complex schema issue | Store resource with `validation_status=invalid`, skip sandbox POST, show in UI as "FHIR pending" |
| Sandbox returns 400 | Resource structure issue | Log error, store resource locally, mark `sandbox_status=failed` |
| Sandbox returns 401/403 | Auth required | Fall back to showing FHIR resource JSON without POST confirmation |
| Sandbox unreachable (timeout/5xx) | Server down | Cache resource, retry later, show "FHIR export queued" |
| Sandbox returns 422 | Profile validation failure | Store resource without profile, retry with base Observation profile |

---

## 9. Demo Data

### 9.1 Pre-Crafted FHIR Resource for Reliable Demo

Store this as a fallback — if the LLM-generated resource fails during live demo, use this pre-validated resource:

```python
DEMO_FHIR_OBSERVATION = {
    "resourceType": "Observation",
    "meta": {
        "profile": ["http://hl7.eu/fhir/ig/oah/StructureDefinition/observation-indicators-oah"]
    },
    "status": "final",
    "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "survey", "display": "Survey"}]}],
    "code": {"coding": [{"system": "http://loinc.org", "code": "72166-2", "display": "Environmental assessment"}], "text": "Stream Health Observation"},
    "effectiveDateTime": "2026-09-29T14:30:00+01:00",
    "issued": "2026-09-29T14:30:05+01:00",
    "valueString": "Macroinvertebrate community assessment — Ephemeroptera detected, indicating good water quality",
    "component": [
        {"code": {"coding": [{"system": "http://streamsense.eu/codes", "code": "species-identified"}]}, "valueString": "Ephemeroptera (Mayfly nymph)"},
        {"code": {"coding": [{"system": "http://streamsense.eu/codes", "code": "species-confidence"}]}, "valueQuantity": {"value": 89, "unit": "%", "system": "http://unitsofmeasure.org", "code": "%"}},
        {"code": {"coding": [{"system": "http://streamsense.eu/codes", "code": "bmwp-score"}]}, "valueQuantity": {"value": 10, "unit": "score"}},
        {"code": {"coding": [{"system": "http://streamsense.eu/codes", "code": "water-quality-indication"}]}, "valueString": "good"},
        {"code": {"coding": [{"system": "http://streamsense.eu/codes", "code": "ai-confidence-score"}]}, "valueQuantity": {"value": 87, "unit": "score"}},
        {"code": {"coding": [{"system": "http://streamsense.eu/codes", "code": "disease-vector-detected"}]}, "valueBoolean": false}
    ]
}
```

---

*End of DOC-08: FHIR Integration Specification*
*Next document: DOC-09 UI/UX Specification*
