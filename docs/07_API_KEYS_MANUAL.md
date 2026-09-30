# StreamSense — API Integrations & Keys Manual (DOC 07)

> **Document ID:** DOC-07
> **Version:** 1.0
> **Last Updated:** September 29, 2026
> **Purpose:** Step-by-step instructions for YOU to grab every API key and credential needed before development begins.

---

## Table of Contents

1. [Pre-Flight Checklist](#1-pre-flight-checklist)
2. [Supabase Setup](#2-supabase-setup)
3. [Google Gemini API](#3-google-gemini-api)
4. [Groq API](#4-groq-api)
5. [BioCLIP 2 Setup](#5-bioclip-2-setup)
6. [FHIR Sandbox Access](#6-fhir-sandbox-access)
7. [OpenWeatherMap API](#7-openweathermap-api)
8. [GBIF API](#8-gbif-api)
9. [Vercel Deployment](#9-vercel-deployment)
10. [Railway Deployment](#10-railway-deployment)
11. [Complete .env Files](#11-complete-env-files)
12. [Verification Checklist](#12-verification-checklist)

---

## 1. Pre-Flight Checklist

Before starting, make sure you have:

- [ ] A Google account (for Gemini API)
- [ ] A GitHub account (for Vercel/Railway deployment)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Python 3.11+ installed (`python3 --version`)
- [ ] pnpm installed (`pnpm --version`) — if not: `npm install -g pnpm`
- [ ] uv installed (`uv --version`) — if not: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- [ ] Git configured (`git config --global user.name` / `user.email`)

**Estimated time for all setup:** 30-45 minutes

---

## 2. Supabase Setup

Supabase provides our database (PostgreSQL), authentication, file storage, and realtime subscriptions.

### Step 1: Create Account
1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign in with GitHub (recommended) or email

### Step 2: Create Project
1. Click **"New project"**
2. Fill in:
   - **Name:** `streamsense`
   - **Database Password:** Generate a strong password → **SAVE THIS PASSWORD** (you'll need it for the connection string)
   - **Region:** Choose closest to you (e.g., `West EU (Ireland)` for European focus)
   - **Plan:** Free tier is sufficient
3. Click **"Create new project"**
4. Wait ~2 minutes for provisioning

### Step 3: Get API Keys
1. In your project dashboard, go to **Settings → API**
2. Copy these values:

| Key | Where to Find | Environment Variable |
|-----|--------------|---------------------|
| **Project URL** | Under "Project URL" | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon/public key** | Under "Project API keys" → `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role key** | Under "Project API keys" → `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ **IMPORTANT:** The `service_role` key bypasses Row Level Security. NEVER expose it to the client. Use it ONLY in the backend.

### Step 4: Get Database Connection String
1. Go to **Settings → Database**
2. Under "Connection string", select **URI**
3. Copy the connection string. It looks like:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
4. For async Python (asyncpg), change `postgresql://` to `postgresql+asyncpg://`:
   ```
   postgresql+asyncpg://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
5. Save as `DATABASE_URL`

### Step 5: Create Storage Bucket
1. Go to **Storage** in the sidebar
2. Click **"New bucket"**
3. Name: `observations`
4. Toggle **"Public bucket"** ON (images need to be displayable)
5. Click **"Create bucket"**

### Step 6: Set Storage Policy
1. Click on the `observations` bucket
2. Go to **"Policies"** tab
3. Create policies:

**Policy 1: Allow authenticated uploads**
- Policy name: `Allow authenticated uploads`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- WITH CHECK expression: `true`

**Policy 2: Allow public read**
- Policy name: `Allow public read`
- Allowed operation: `SELECT`
- Target roles: `public`
- USING expression: `true`

### Step 7: Disable Email Confirmation (for hackathon)
1. Go to **Authentication → Providers → Email**
2. Toggle OFF **"Confirm email"** (so registration works instantly during demo)
3. Save

---

## 3. Google Gemini API

Used for Agents 4 (Quality Scorer), 5 (FHIR Translator), and 7 (Expert Brief Generator).

### Step 1: Get API Key
1. Go to **https://aistudio.google.com/apikey**
2. Sign in with your Google account
3. Click **"Create API key"**
4. Select a Google Cloud project (or create one, it's free)
5. Copy the API key

### Step 2: Save Key
```bash
# Save as environment variable
GEMINI_API_KEY=your_key_here
```

### Step 3: Verify
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Say hello"}]}]}'
```

**Expected:** JSON response with generated text. If you get `API_KEY_INVALID`, regenerate the key.

### Rate Limits (Free Tier)
| Limit | Value |
|-------|-------|
| Requests per minute | 15 |
| Tokens per day | 1,000,000 |
| Requests per day | 1,500 |

This is sufficient for demo (we'll process maybe 20-50 observations total).

---

## 4. Groq API

Used for Agents 2 (Description), 3 (Metadata), and 6 (Impact). Ultra-fast inference.

### Step 1: Create Account
1. Go to **https://console.groq.com**
2. Sign up with Google, GitHub, or email
3. Verify your email

### Step 2: Get API Key
1. In the Groq Console, go to **API Keys** (left sidebar)
2. Click **"Create API Key"**
3. Name: `streamsense`
4. Copy the key immediately (it won't be shown again)

### Step 3: Save Key
```bash
GROQ_API_KEY=gsk_your_key_here
```

### Step 4: Verify
```bash
curl "https://api.groq.com/openai/v1/chat/completions" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"llama-3.3-70b-versatile","messages":[{"role":"user","content":"Say hello"}],"max_tokens":50}'
```

**Expected:** JSON response with generated text.

### Rate Limits (Free Tier)
| Limit | Value |
|-------|-------|
| Requests per minute | 30 |
| Requests per day | 14,400 |
| Tokens per minute | 6,000 |

More than enough for demo use.

---

## 5. BioCLIP 2 Setup

BioCLIP runs locally — no API key needed. But the model must be downloaded.

### Step 1: Install pybioclip
```bash
cd backend
uv pip install pybioclip
```

### Step 2: First Run (Downloads Model)
```python
# Run this once to download the model (~300MB)
python3 -c "
from pybioclip import TreeOfLifeClassifier
classifier = TreeOfLifeClassifier()
print('BioCLIP 2 model loaded successfully!')
print('Model ready for inference.')
"
```

**Expected:** First run downloads the model from HuggingFace (~300MB). Subsequent runs load from cache.

### Step 3: Test Inference
```python
python3 -c "
from pybioclip import TreeOfLifeClassifier
from PIL import Image
import requests
from io import BytesIO

classifier = TreeOfLifeClassifier()

# Test with a sample image (use any insect photo URL)
url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Mayfly.jpg/640px-Mayfly.jpg'
response = requests.get(url)
image = Image.open(BytesIO(response.content))

taxa = ['Ephemeroptera', 'Trichoptera', 'Chironomidae', 'Culicidae', 'Gastropoda']
results = classifier.predict(image, taxa)
print('Predictions:', results)
"
```

### Notes
- BioCLIP requires `torch` which is large (~2GB). The `pybioclip` package handles this.
- CPU inference takes ~1-2 seconds per image. No GPU needed.
- Model is cached at `~/.cache/huggingface/` after first download.
- If server has <1GB RAM, BioCLIP may OOM. Railway free tier provides 512MB which is tight — may need to use 1GB plan or optimize.

---

## 6. FHIR Sandbox Access

The OneAquaHealth FHIR Sandbox is the live server where we POST validated FHIR resources.

### Step 1: Access Swagger Docs
1. Go to **https://sandbox.hl7europe.eu/oneaquahealth/fhir**
2. The FHIR base URL is: `https://sandbox.hl7europe.eu/oneaquahealth/fhir`
3. Swagger/OpenAPI docs should be at: `https://sandbox.hl7europe.eu/oneaquahealth/fhir/swagger-ui/`

### Step 2: Test GET Request
```bash
# List existing Observation resources
curl "https://sandbox.hl7europe.eu/oneaquahealth/fhir/Observation?_count=5" \
  -H "Accept: application/fhir+json"
```

**Expected:** JSON Bundle with FHIR Observation resources, or an empty Bundle if no data exists yet.

### Step 3: Test POST Request
```bash
# POST a minimal test Observation
curl -X POST "https://sandbox.hl7europe.eu/oneaquahealth/fhir/Observation" \
  -H "Content-Type: application/fhir+json" \
  -H "Accept: application/fhir+json" \
  -d '{
    "resourceType": "Observation",
    "status": "final",
    "code": {
      "coding": [{
        "system": "http://loinc.org",
        "code": "LA28177-4",
        "display": "Stream health observation"
      }]
    },
    "effectiveDateTime": "2026-09-29T14:00:00+01:00"
  }'
```

**Expected:** `201 Created` with the created resource (including a server-assigned ID). If you get `401`, the sandbox may require authentication — check hackathon docs or contact organizers.

### Step 4: Save Configuration
```bash
FHIR_SANDBOX_URL=https://sandbox.hl7europe.eu/oneaquahealth/fhir
# If auth is required:
# FHIR_SANDBOX_TOKEN=your_token_here
```

### FHIR IG Reference
- **GitHub:** https://github.com/hl7-eu/oah
- **Published IG:** Check for CI build at the GitHub Actions artifacts
- **Key Profiles:**
  - `observation-indicators-oah` — Environmental indicator observations
  - `observation-health-measure-oah` — Health-related measurements
  - `location-oah` — Monitoring site locations

### Notes
- The sandbox is a shared resource. Other hackathon participants may also be POSTing data.
- FHIR resources on the sandbox may be periodically purged. Don't rely on data persistence.
- If the sandbox is down during demo, we have fallback: show the generated FHIR JSON and cached POST response.

---

## 7. OpenWeatherMap API

Used by Agent 3 (Metadata Validator) to check weather conditions at observation time/location.

### Step 1: Create Account
1. Go to **https://openweathermap.org/api**
2. Click **"Sign Up"** (or sign in if you have an account)
3. Verify email

### Step 2: Get API Key
1. Go to **https://home.openweathermap.org/api_keys**
2. You'll see a default API key already generated
3. Copy it

### Step 3: Save Key
```bash
OPENWEATHERMAP_API_KEY=your_key_here
```

### Step 4: Verify
```bash
# Test with Coimbra coordinates
curl "https://api.openweathermap.org/data/2.5/weather?lat=40.2033&lon=-8.4103&appid=$OPENWEATHERMAP_API_KEY&units=metric"
```

**Expected:** JSON with current weather data (temperature, conditions, etc.)

### Rate Limits (Free Tier)
| Limit | Value |
|-------|-------|
| Calls per minute | 60 |
| Calls per month | 1,000,000 |

More than sufficient.

> **Note:** New API keys take up to 2 hours to activate. Get this early!

---

## 8. GBIF API

Used by Agent 3 to check species occurrence plausibility. **No API key required** for read access.

### Test Request
```bash
# Check if Ephemeroptera has been observed near Coimbra
curl "https://api.gbif.org/v1/occurrence/search?decimalLatitude=40.2&decimalLongitude=-8.4&radius=50&taxonKey=81&limit=5"
```

**Expected:** JSON with occurrence records. `taxonKey=81` is Ephemeroptera.

### Key Endpoints
| Endpoint | Purpose |
|----------|---------|
| `GET /v1/occurrence/search` | Search occurrences by location, taxon, etc. |
| `GET /v1/species/match?name={name}` | Match a species name to GBIF taxonomy |
| `GET /v1/species/{key}` | Get species details by GBIF taxon key |

### Rate Limits
- No strict rate limit for read access
- Be respectful: cache results, don't hammer the API
- Include a `User-Agent` header with your project name

```bash
GBIF_API_URL=https://api.gbif.org/v1
```

---

## 9. Vercel Deployment

For deploying the Next.js frontend.

### Step 1: Create Vercel Account
1. Go to **https://vercel.com**
2. Sign up with GitHub
3. Authorize Vercel to access your repos

### Step 2: Connect Repository
1. Push your project to GitHub
2. In Vercel dashboard, click **"New Project"**
3. Import from GitHub → select your repo
4. Framework preset: **Next.js** (auto-detected)
5. Root directory: `frontend`
6. **Environment Variables:** Add all `NEXT_PUBLIC_*` variables here

### Step 3: Environment Variables in Vercel
Add these in the Vercel project settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_APP_URL` | Your Vercel app URL (after first deploy) |
| `BACKEND_URL` | Your Railway backend URL |

### Step 4: Deploy
```bash
# Or just push to GitHub — Vercel auto-deploys
cd frontend
npx vercel
```

---

## 10. Railway Deployment

For deploying the Python FastAPI backend.

### Step 1: Create Railway Account
1. Go to **https://railway.app**
2. Sign up with GitHub
3. Authorize Railway

### Step 2: Create Project
1. Click **"New Project"**
2. Choose **"Deploy from GitHub repo"**
3. Select your repo
4. Set root directory: `backend`

### Step 3: Environment Variables in Railway
Add ALL backend environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase connection string (asyncpg format) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GROQ_API_KEY` | Groq API key |
| `OPENWEATHERMAP_API_KEY` | OpenWeatherMap key |
| `FHIR_SANDBOX_URL` | FHIR sandbox URL |
| `FRONTEND_URL` | Vercel frontend URL (for CORS) |

### Step 4: Configure Build
Railway should auto-detect Python. If not, create a `Procfile`:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Step 5: Resources
- Free tier: 512MB RAM, $5 credit/month
- If BioCLIP needs more RAM, upgrade to Hobby plan ($5/month, 8GB RAM)

---

## 11. Complete .env Files

### Frontend (.env.local)

```bash
# ── Supabase ──
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...

# ── Backend ──
BACKEND_URL=http://localhost:8000

# ── App ──
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Backend (.env)

```bash
# ── Database ──
DATABASE_URL=postgresql+asyncpg://postgres.xxxxx:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres

# ── Supabase ──
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...

# ── AI Models ──
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...

# ── External APIs ──
OPENWEATHERMAP_API_KEY=...
FHIR_SANDBOX_URL=https://sandbox.hl7europe.eu/oneaquahealth/fhir
GBIF_API_URL=https://api.gbif.org/v1

# ── CORS ──
FRONTEND_URL=http://localhost:3000

# ── Server ──
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

---

## 12. Verification Checklist

Run each of these to verify everything works before starting development:

### Quick Verification Script

```bash
#!/bin/bash
echo "=== StreamSense Setup Verification ==="
echo ""

# 1. Node.js
echo -n "Node.js: "
node --version 2>/dev/null || echo "❌ NOT INSTALLED"

# 2. Python
echo -n "Python: "
python3 --version 2>/dev/null || echo "❌ NOT INSTALLED"

# 3. pnpm
echo -n "pnpm: "
pnpm --version 2>/dev/null || echo "❌ NOT INSTALLED"

# 4. uv
echo -n "uv: "
uv --version 2>/dev/null || echo "❌ NOT INSTALLED"

# 5. Git
echo -n "Git: "
git --version 2>/dev/null || echo "❌ NOT INSTALLED"

echo ""
echo "=== API Key Verification ==="
echo ""

# 6. Supabase
echo -n "Supabase: "
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_URL not set"
else
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY")
  [ "$STATUS" = "200" ] && echo "✅ Connected" || echo "❌ HTTP $STATUS"
fi

# 7. Gemini
echo -n "Gemini API: "
if [ -z "$GEMINI_API_KEY" ]; then
  echo "❌ GEMINI_API_KEY not set"
else
  RESP=$(curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY" \
    -H 'Content-Type: application/json' \
    -d '{"contents":[{"parts":[{"text":"Say OK"}]}]}')
  echo "$RESP" | grep -q "candidates" && echo "✅ Working" || echo "❌ Error: $RESP"
fi

# 8. Groq
echo -n "Groq API: "
if [ -z "$GROQ_API_KEY" ]; then
  echo "❌ GROQ_API_KEY not set"
else
  RESP=$(curl -s "https://api.groq.com/openai/v1/chat/completions" \
    -H "Authorization: Bearer $GROQ_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"model":"llama-3.3-70b-versatile","messages":[{"role":"user","content":"Say OK"}],"max_tokens":10}')
  echo "$RESP" | grep -q "choices" && echo "✅ Working" || echo "❌ Error"
fi

# 9. OpenWeatherMap
echo -n "OpenWeatherMap: "
if [ -z "$OPENWEATHERMAP_API_KEY" ]; then
  echo "❌ OPENWEATHERMAP_API_KEY not set"
else
  RESP=$(curl -s "https://api.openweathermap.org/data/2.5/weather?lat=40.2&lon=-8.4&appid=$OPENWEATHERMAP_API_KEY")
  echo "$RESP" | grep -q "main" && echo "✅ Working" || echo "❌ Error (may need 2hrs to activate)"
fi

# 10. GBIF (no key needed)
echo -n "GBIF API: "
RESP=$(curl -s "https://api.gbif.org/v1/species/match?name=Ephemeroptera")
echo "$RESP" | grep -q "usageKey" && echo "✅ Working" || echo "❌ Error"

# 11. FHIR Sandbox
echo -n "FHIR Sandbox: "
RESP=$(curl -s -o /dev/null -w "%{http_code}" "https://sandbox.hl7europe.eu/oneaquahealth/fhir/metadata" \
  -H "Accept: application/fhir+json")
[ "$RESP" = "200" ] && echo "✅ Reachable" || echo "⚠️ HTTP $RESP (may need auth)"

echo ""
echo "=== Complete ==="
```

### Manual Verification Checklist

| # | Service | Status | Notes |
|---|---------|--------|-------|
| 1 | Node.js 18+ | ☐ | `node --version` |
| 2 | Python 3.11+ | ☐ | `python3 --version` |
| 3 | pnpm | ☐ | `pnpm --version` |
| 4 | uv | ☐ | `uv --version` |
| 5 | Supabase project created | ☐ | Dashboard accessible |
| 6 | Supabase API keys copied | ☐ | URL + anon + service_role |
| 7 | Supabase `observations` bucket created | ☐ | Public read enabled |
| 8 | Supabase email confirmation disabled | ☐ | Auth → Email → Confirm OFF |
| 9 | Gemini API key | ☐ | Test curl returns content |
| 10 | Groq API key | ☐ | Test curl returns content |
| 11 | OpenWeatherMap API key | ☐ | May take 2hrs to activate |
| 12 | GBIF API working | ☐ | No key needed |
| 13 | FHIR Sandbox reachable | ☐ | GET /metadata returns 200 |
| 14 | BioCLIP model downloaded | ☐ | `pybioclip` test script works |
| 15 | `.env.local` created (frontend) | ☐ | All vars populated |
| 16 | `.env` created (backend) | ☐ | All vars populated |

---

*End of DOC-07: API Integrations & Keys Manual*
*Next document: DOC-08 FHIR Integration Spec*
