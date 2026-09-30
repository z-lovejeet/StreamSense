# StreamSense 🌊

> **OneAquaHealth IEEE Global Hackathon 2026**
> Turning citizen stream observations into standardized health intelligence with human expert oversight.

---

## 🌟 Overview

StreamSense connects citizens and freshwater researchers to safeguard urban stream ecosystems and public health. Citizens upload photos of urban streams; a 7-agent AI triage pipeline analyzes macroinvertebrate bioindicators, checks environmental context, scores observation quality, and formats validated data into HL7 FHIR R4 health observations.

- **Volunteer Panel:** Mobile-first PWA for photo submissions, instant AI feedback, and personalized One Health Impact Receipts.
- **Researcher Panel:** Desktop dashboard with a low-confidence review queue, AI expert briefs, interactive maps, and FHIR export.
- **Pilot Cities:** Coimbra (PT), Toulouse (FR), Benevento (IT), Ghent (BE), Oslo (NO).

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** FastAPI (Python 3.13), SQLAlchemy 2.0 (async), Pydantic v2
- **Database & Storage:** Supabase PostgreSQL 15, Supabase Storage (`observations`)
- **AI Triage:** BioCLIP 2 (vision), Groq (`qwen/qwen3.8-27b`), Google Gemini Flash cascading chain
- **Standard:** HL7 FHIR R4 (`hl7-eu/oah` profile integration)

---

## 🚀 Quickstart

### Frontend
```bash
cd frontend
pnpm install
pnpm dev
```
Runs at `http://localhost:3000`.

### Backend
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```
Runs at `http://localhost:8000`. Interactive docs available at `http://localhost:8000/docs`.

---

## 📄 Documentation

Comprehensive technical specifications are available in the [`docs/`](./docs) folder:
- [01. PRD](./docs/01_PRD.md)
- [02. Feature Matrix](./docs/02_FEATURE_MATRIX.md)
- [03. Tech Stack](./docs/03_TECH_STACK.md)
- [04. System Architecture](./docs/04_SYSTEM_ARCHITECTURE.md)
- [05. Agentic AI Workflow](./docs/05_AGENTIC_AI_WORKFLOW.md)
- [06. Database Schema](./docs/06_DATABASE_SCHEMA.md)
- [07. API Keys Manual](./docs/07_API_KEYS_MANUAL.md)
- [08. FHIR Specification](./docs/08_FHIR_SPEC.md)
- [09. UI/UX Specification](./docs/09_UI_UX_SPEC.md)
- [10. Development Roadmap](./docs/10_DEVELOPMENT_ROADMAP.md)
- [11. AI Build Instructions](./docs/11_AI_BUILD_INSTRUCTIONS.md)
