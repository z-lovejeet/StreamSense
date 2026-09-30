# StreamSense — UI/UX Specification (DOC 09)

> **Document ID:** DOC-09
> **Version:** 1.0
> **Last Updated:** September 29, 2026
> **Depends On:** DOC-01 (PRD), DOC-02 (Feature Matrix)
> **Design Philosophy:** Cozy, warm, handcrafted. NOT clinical. NOT templated. NOT "AI slop."

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design Tokens](#2-design-tokens)
3. [Typography](#3-typography)
4. [Color Palette](#4-color-palette)
5. [Spacing & Layout](#5-spacing--layout)
6. [Component Styling](#6-component-styling)
7. [Volunteer Panel Screens](#7-volunteer-panel-screens)
8. [Researcher Panel Screens](#8-researcher-panel-screens)
9. [Animations & Micro-Interactions](#9-animations--micro-interactions)
10. [Mobile Responsiveness](#10-mobile-responsiveness)
11. [Loading & Error States](#11-loading--error-states)
12. [Accessibility](#12-accessibility)
13. [Anti-Patterns (What NOT To Do)](#13-anti-patterns-what-not-to-do)

---

## 1. Design Philosophy

### The Vibe: Cozy Nature Journal

StreamSense should feel like a **warm, well-worn field notebook** — the kind a naturalist carries on stream walks. Not a clinical dashboard. Not a corporate SaaS tool. Not a generic hackathon project with default blue buttons.

### Five Design Rules

| Rule | What It Means | Example |
|------|---------------|---------|
| **1. Warmth over precision** | Rounded corners, soft shadows, earthy tones. Not sharp, not cold. | Cards with 12-16px radius, warm shadow tints |
| **2. Nature-inspired, not nature-themed** | Subtle earthy palette. No leaf emojis plastered everywhere. No forest wallpaper backgrounds. | Sage greens, warm beiges, river blues as accents — not literal tree images |
| **3. Content breathes** | Generous whitespace. Nothing crammed. Every element has room. | 24-32px gaps between sections. Cards don't touch edges. |
| **4. One thing at a time** | Each screen has ONE primary action. Don't overwhelm. | Submit page: just the form. Not the form + a map + stats + news. |
| **5. Handcrafted details** | Small touches that feel intentional: custom icons, subtle gradients, micro-animations. | Species cards with hand-drawn-style borders. Impact receipt with a gentle reveal animation. |

### What "Cozy" Does NOT Mean

- ❌ Cluttered with decorations
- ❌ Low contrast (must be readable)
- ❌ Childish or unprofessional
- ❌ Slow or heavy (cozy = warm, not sluggish)

---

## 2. Design Tokens

### Tailwind Config Extension

```typescript
// tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Primary (River Teal) ──
        stream: {
          50:  '#f0f9f6',
          100: '#d5f0e8',
          200: '#aae0d1',
          300: '#73c9b4',
          400: '#45ac93',
          500: '#2d9079',  // Primary action color
          600: '#217462',
          700: '#1d5e51',
          800: '#1a4b42',
          900: '#173f37',
          950: '#0a2420',
        },
        // ── Secondary (Forest Moss) ──
        moss: {
          50:  '#f5f7f0',
          100: '#e8ecdd',
          200: '#d3dabf',
          300: '#b5c097',
          400: '#9baa76',
          500: '#7f9058',  // Secondary accent
          600: '#637244',
          700: '#4d5837',
          800: '#404830',
          900: '#363d2a',
          950: '#1b2014',
        },
        // ── Accent (Sunset Amber) ──
        amber: {
          50:  '#fefbf0',
          100: '#fdf3d0',
          200: '#fbe5a0',
          300: '#f8d166',
          400: '#f5bb3a',
          500: '#eca216',  // Highlight, badges, notifications
          600: '#d07c0e',
          700: '#ad5a10',
          800: '#8c4714',
          900: '#743b14',
          950: '#431d06',
        },
        // ── Neutral (Warm Stone) ──
        stone: {
          50:  '#faf9f7',
          100: '#f3f1ed',
          200: '#e8e4dc',
          300: '#d4cec2',
          400: '#b8b0a0',
          500: '#a49a88',
          600: '#8a7f6e',
          700: '#736a5c',
          800: '#615a4f',
          900: '#524c44',
          950: '#2c2824',
        },
        // ── Semantic ──
        danger: {
          50: '#fef2f2',
          500: '#dc4446',
          700: '#b91c1c',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          700: '#b45309',
        },
        // ── Background ──
        background: '#faf9f7',       // Warm off-white (NOT pure white)
        surface: '#ffffff',           // Card surfaces
        'surface-hover': '#f3f1ed',   // Card hover state
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['DM Serif Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'cozy': '12px',     // Standard card radius
        'cozy-lg': '16px',  // Large cards, modals
        'cozy-xl': '20px',  // Hero sections, impact receipt
        'pill': '9999px',   // Badges, tags
      },
      boxShadow: {
        'cozy-sm': '0 1px 3px 0 rgba(82, 76, 68, 0.06), 0 1px 2px -1px rgba(82, 76, 68, 0.06)',
        'cozy': '0 4px 12px -2px rgba(82, 76, 68, 0.08), 0 2px 6px -2px rgba(82, 76, 68, 0.04)',
        'cozy-lg': '0 10px 24px -4px rgba(82, 76, 68, 0.1), 0 4px 10px -4px rgba(82, 76, 68, 0.04)',
        'cozy-xl': '0 20px 40px -8px rgba(82, 76, 68, 0.12)',
        'inner-cozy': 'inset 0 2px 4px 0 rgba(82, 76, 68, 0.04)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

---

## 3. Typography

### Font Pairing

| Role | Font | Weight | Use |
|------|------|--------|-----|
| **Display/Headers** | DM Serif Display | 400 | Page titles, hero text, impact receipt headline |
| **Body/UI** | Inter | 400, 500, 600 | All body text, labels, buttons, navigation |
| **Code/Data** | JetBrains Mono | 400 | FHIR JSON viewer, confidence scores, API data |

### Type Scale

| Element | Size | Weight | Line Height | Tracking |
|---------|------|--------|-------------|----------|
| Hero title | 40px / 2.5rem | DM Serif 400 | 1.1 | -0.02em |
| Page title | 28px / 1.75rem | DM Serif 400 | 1.2 | -0.01em |
| Section heading | 20px / 1.25rem | Inter 600 | 1.3 | -0.01em |
| Card title | 16px / 1rem | Inter 600 | 1.4 | 0 |
| Body | 15px / 0.9375rem | Inter 400 | 1.6 | 0 |
| Small body | 13px / 0.8125rem | Inter 400 | 1.5 | 0.01em |
| Label | 12px / 0.75rem | Inter 500 | 1.4 | 0.04em |
| Badge | 11px / 0.6875rem | Inter 600 | 1 | 0.05em |

### Font Loading (Next.js)

```typescript
// src/app/layout.tsx
import { Inter, DM_Serif_Display, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const dmSerif = DM_Serif_Display({ weight: '400', subsets: ['latin'], variable: '--font-display' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
```

---

## 4. Color Palette

### Usage Rules

| Context | Color | Token |
|---------|-------|-------|
| **Page background** | Warm off-white | `bg-background` (#faf9f7) |
| **Card background** | White | `bg-surface` (#ffffff) |
| **Primary buttons** | River teal | `bg-stream-500` → `hover:bg-stream-600` |
| **Secondary buttons** | Outlined stone | `border-stone-300 text-stone-700` |
| **Success states** | Mossy green | `text-success-700 bg-success-50` |
| **Warning/pending** | Sunset amber | `text-amber-700 bg-amber-50` |
| **Error/danger** | Warm red | `text-danger-700 bg-danger-50` |
| **Body text** | Dark stone | `text-stone-800` |
| **Secondary text** | Medium stone | `text-stone-500` |
| **Borders** | Light stone | `border-stone-200` |
| **Sidebar** | Deep forest | `bg-stone-900` or `bg-stream-950` |

### What Makes This NOT "AI Slop"

| AI Slop Default | Our Choice | Why |
|----------------|-----------|-----|
| Pure white (#fff) background | Warm off-white (#faf9f7) | Feels organic, not sterile |
| Blue (#3b82f6) primary | River teal (#2d9079) | Nature-connected, not generic |
| Gray (#6b7280) text | Warm stone (#524c44) | Has warmth, not cold |
| Sharp 4px corners | 12-16px cozy corners | Feels approachable |
| Default box-shadow | Warm-tinted shadows | Shadows use stone tones, not pure black |
| System fonts | DM Serif Display + Inter | Serif headers add personality |

---

## 5. Spacing & Layout

### Grid System

- **Max content width:** 1280px (centered)
- **Page padding:** 24px (mobile) / 32px (tablet) / 48px (desktop)
- **Card gap:** 16px (mobile) / 24px (desktop)
- **Section gap:** 48px (mobile) / 64px (desktop)
- **Sidebar width:** 260px (desktop), hidden on mobile (hamburger)

### Spacing Scale

Use Tailwind's default scale with these preferences:
- Between related items: `gap-2` (8px) or `gap-3` (12px)
- Between card content sections: `space-y-4` (16px)
- Between cards: `gap-4` (16px) or `gap-6` (24px)
- Between page sections: `space-y-8` (32px) or `space-y-12` (48px)
- Page top padding: `pt-6` (24px) or `pt-8` (32px)

---

## 6. Component Styling

### Buttons

```tsx
// Primary: solid teal
<Button className="bg-stream-500 hover:bg-stream-600 text-white rounded-cozy px-6 py-2.5 font-medium shadow-cozy-sm transition-all hover:shadow-cozy">
  Submit Observation
</Button>

// Secondary: outlined
<Button variant="outline" className="border-stone-300 text-stone-700 hover:bg-surface-hover rounded-cozy px-5 py-2.5">
  Cancel
</Button>

// Danger: warm red
<Button className="bg-danger-500 hover:bg-danger-700 text-white rounded-cozy">
  Reject
</Button>

// Ghost: minimal
<Button variant="ghost" className="text-stone-600 hover:text-stone-900 hover:bg-stone-100">
  View details
</Button>
```

### Cards

```tsx
<div className="bg-surface rounded-cozy-lg shadow-cozy border border-stone-100 p-6 transition-shadow hover:shadow-cozy-lg">
  {/* Card content */}
</div>
```

### Badges / Status Pills

```tsx
// Auto-validated
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-success-50 text-success-700 text-[11px] font-semibold tracking-wide uppercase">
  <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
  Auto-Validated
</span>

// Pending review
<span className="... bg-amber-50 text-amber-700">
  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
  Pending Review
</span>

// Rejected
<span className="... bg-danger-50 text-danger-700">
  Rejected
</span>
```

### Inputs

```tsx
<input className="w-full rounded-cozy border border-stone-200 bg-surface px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:border-stream-400 focus:ring-2 focus:ring-stream-100 transition-colors" />
```

---

## 7. Volunteer Panel Screens

### 7.1 Volunteer Dashboard

```
┌──────────────────────────────────────────────────────┐
│ ☰  StreamSense              Maria ○                  │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Welcome back, Maria 👋                               │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │  🟢 Submit New Observation                       │ │
│  │  [         BIG TEAL BUTTON          ]            │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  Your Contributions                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │  12  │ │   9  │ │   3  │ │  75% │               │
│  │ total│ │valid.│ │pend. │ │ auto │               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
│                                                       │
│  Recent Observations                                  │
│  ┌─────────────────────────────────────────────────┐ │
│  │ 📷 [thumb] Mayfly nymph · 89% · ✅ Validated    │ │
│  │    Madrigueira · 2h ago                          │ │
│  ├─────────────────────────────────────────────────┤ │
│  │ 📷 [thumb] Midge larva · 62% · 🔍 Under Review  │ │
│  │    Rio Mondego · 1d ago                          │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  [📍 View Map]  [📋 Full History]                     │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Key design decisions:**
- Big, obvious CTA to submit (this is the primary action)
- Stats use large numbers, not charts (quick glance)
- Recent observations show thumbnail + species + status (at-a-glance)
- Mobile-first: single column, big touch targets

### 7.2 Submit Observation Page

```
┌──────────────────────────────────────────────────────┐
│ ← Back   Submit Observation                          │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │                                                  │ │
│  │     📸  Tap to take a photo                     │ │
│  │     or select from gallery                       │ │
│  │                                                  │ │
│  │  ┌───────────┐  ┌───────────┐                   │ │
│  │  │  📷 Camera │  │ 🖼️ Gallery │                   │ │
│  │  └───────────┘  └───────────┘                   │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  [Preview: uploaded photo shows here]                 │
│                                                       │
│  What did you see?                                    │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Describe the stream conditions — water color,    │ │
│  │ flow, any organisms you noticed, smells,          │ │
│  │ anything unusual...                               │ │
│  │                                                   │ │
│  │                                                   │ │
│  │                                          0/1000   │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  📍 Location: Getting your location...                │
│  🕐 Time: Sep 29, 2026, 2:30 PM                      │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │       [   Submit Observation   ]                  │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Key design decisions:**
- Photo upload is the FIRST thing (biggest element)
- Description is inviting, not clinical ("What did you see?" not "Enter description")
- GPS and timestamp auto-captured — shown but not editable (less friction)
- Submit button is full-width, prominent
- Character counter is subtle (bottom-right)

### 7.3 AI Processing Animation Screen

```
┌──────────────────────────────────────────────────────┐
│                                                       │
│  Analyzing your observation...                        │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ [uploaded photo - slightly blurred/dimmed]       │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ✅ Identifying species...          Mayfly nymph 89% │
│  ✅ Reading your description...     4 parameters     │
│  ✅ Checking location...            Near Madrigueira  │
│  ⏳ Calculating quality score...    ░░░░░░░░░░       │
│  ○  Generating impact...                              │
│                                                       │
│  ─── Agent 4 of 5 ─── ████████░░ 80%                │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Key design decisions:**
- Photo stays visible (user sees what they submitted)
- Each agent step shows its status: ○ waiting → ⏳ processing → ✅ complete
- Completed steps show the result inline (species name, parameter count)
- Subtle progress bar at bottom
- Smooth Framer Motion transitions for each step appearance

### 7.4 AI Feedback & Impact Receipt

```
┌──────────────────────────────────────────────────────┐
│                                                       │
│  ✅ Observation Validated                             │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Species Identified                               │ │
│  │                                                  │ │
│  │  🦋 Ephemeroptera                                │ │
│  │     Mayfly nymph                                 │ │
│  │                                                  │ │
│  │  ████████████████████░░░  89% confidence         │ │
│  │                                                  │ │
│  │  BMWP Score: 10 · Water Quality: Good 🟢         │ │
│  │                                                  │ │
│  │  [▼ Learn about this species]                    │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Environmental Observations                       │ │
│  │                                                  │ │
│  │  Water Color: Clear                              │ │
│  │  Flow Speed: Moderate                            │ │
│  │  Turbidity: Slight                               │ │
│  │  Odor: None                                      │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ ✨ Your Impact                                   │ │
│  │                                                  │ │
│  │ "Great catch! You found mayfly nymphs — these    │ │
│  │  sensitive creatures only thrive in clean,        │ │
│  │  healthy water. Your observation confirms that    │ │
│  │  this stretch of the Madrigueira stream           │ │
│  │  maintains good ecological quality."              │ │
│  │                                                  │ │
│  │  🏥 Health Connection                             │ │
│  │  Your data helps predict disease vector           │ │
│  │  activity in your neighborhood.                   │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  Quality Score: 87/100 ·  FHIR: Posted ✅            │
│                                                       │
│  [Submit Another] [View History]                      │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 8. Researcher Panel Screens

### 8.1 Researcher Dashboard

```
┌─────────┬──────────────────────────────────────────────┐
│ Stream   │                                              │
│ Sense    │  Dashboard                   Dr. João ○      │
│          │                                              │
│ ─────── │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│ 📊 Dash  │  │  47 │ │  38 │ │   6 │ │   3 │           │
│ 🔍 Review│  │total│ │valid│ │pend │ │rejct│           │
│ ✅ Valid  │  └─────┘ └─────┘ └─────┘ └─────┘           │
│ 📈 Stats │                                              │
│ 🏥 FHIR  │  Review Queue (6 pending)        [View All →]│
│          │  ┌───────────────────────────────────────┐   │
│          │  │ 📷 [img] Score: 58 · Chironomidae?     │   │
│          │  │    GPS anomaly · Coimbra · 2h ago      │   │
│          │  ├───────────────────────────────────────┤   │
│          │  │ 📷 [img] Score: 42 · Unknown species   │   │
│          │  │    Low vision conf · Toulouse · 5h ago │   │
│          │  └───────────────────────────────────────┘   │
│          │                                              │
│          │  Recent Activity                              │
│          │  ┌───────────────────────────────────────┐   │
│          │  │ Submissions today: ████████░░  24      │   │
│          │  │ Auto-validation rate: 81%              │   │
│          │  │ Avg confidence: 74                     │   │
│          │  └───────────────────────────────────────┘   │
│          │                                              │
└─────────┴──────────────────────────────────────────────┘
```

### 8.2 Review Detail Page

```
┌─────────┬──────────────────────────────────────────────────────┐
│ Sidebar  │  Review Observation #OBS-2847                        │
│          │                                                      │
│          │  ┌─────────────────────┐ ┌──────────────────────────┐│
│          │  │                     │ │ AI Analysis Summary       ││
│          │  │  [Zoomable photo]   │ │                           ││
│          │  │                     │ │ Species: Chironomidae     ││
│          │  │                     │ │ Confidence: 58%           ││
│          │  │                     │ │ Quality Score: 42/100     ││
│          │  └─────────────────────┘ │                           ││
│          │                          │ ⚠️ Concerns:              ││
│          │  Volunteer Description:  │ • GPS 1.2km from water   ││
│          │  ┌─────────────────────┐ │ • Species confidence low ││
│          │  │ "Water is brownish  │ │ • Photo slightly blurry  ││
│          │  │  with some foam.    │ │                           ││
│          │  │  Smelled bad."      │ │ Recommendation:           ││
│          │  └─────────────────────┘ │ requires_careful_review   ││
│          │                          └──────────────────────────┘│
│          │  📍 Location            Extracted Parameters          │
│          │  ┌──────────────┐      ┌──────────────────────────┐  │
│          │  │ [Mini map]   │      │ Water color: brown        │  │
│          │  │ 📍 Coimbra   │      │ Odor: sewage              │  │
│          │  │              │      │ Foam: present             │  │
│          │  └──────────────┘      └──────────────────────────┘  │
│          │                                                      │
│          │  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│          │  │ ✅ Confirm │ │ ✏️ Correct│ │ ❌ Reject │             │
│          │  └──────────┘ └──────────┘ └──────────┘             │
│          │                                                      │
└─────────┴──────────────────────────────────────────────────────┘
```

---

## 9. Animations & Micro-Interactions

### Animation Principles
- **Duration:** 200-400ms for UI transitions, 500-800ms for reveals
- **Easing:** `ease-out` for entrances, `ease-in-out` for state changes
- **Philosophy:** Subtle and purposeful. Every animation should communicate something.

### Specific Animations

| Element | Animation | Framer Motion Config |
|---------|-----------|---------------------|
| **Page transitions** | Fade + slight upward slide | `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}` |
| **Card appearance** | Staggered fade-in | `transition={{ delay: index * 0.05 }}` |
| **Processing steps** | Sequential slide-in from left | `initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}` |
| **Confidence gauge** | Count-up animation | `useSpring` from 0 to final value |
| **Impact receipt** | Gentle scale + fade reveal | `initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}` |
| **Status badge change** | Color transition | `transition={{ duration: 0.3 }}` |
| **Notification bell** | Subtle bounce on new notification | `animate={{ scale: [1, 1.2, 1] }}` |
| **Success toast** | Slide in from top | `initial={{ y: -40, opacity: 0 }}` |
| **Species card expand** | Smooth height animation | `layout` prop + `AnimatePresence` |
| **Button hover** | Slight lift + shadow increase | CSS `hover:shadow-cozy hover:-translate-y-0.5` |

---

## 10. Mobile Responsiveness

### Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile (default) | <768px | Single column, hamburger nav, full-width cards |
| Tablet | 768-1024px | Two column where beneficial, sidebar as overlay |
| Desktop | >1024px | Full sidebar + content area |

### Mobile-Specific Rules

1. **Sidebar** → Hamburger menu (sheet from left, Framer Motion slide)
2. **Cards** → Full width with 16px horizontal padding
3. **Stats** → 2x2 grid instead of 4-column row
4. **Review detail** → Photo stacks above analysis (not side-by-side)
5. **Map** → Full width, 300px height
6. **Tables** → Horizontal scroll with sticky first column
7. **Submit form** → Full screen experience, native camera access
8. **Touch targets** → Minimum 44x44px (Apple HIG)

---

## 11. Loading & Error States

### Loading States

| Context | Loading UI |
|---------|-----------|
| **Page load** | Full-page skeleton with card-shaped placeholders matching expected layout |
| **Data fetching** | Skeleton cards (animated shimmer using `bg-stone-100 animate-pulse`) |
| **Image upload** | Progress bar inside upload area + percentage |
| **AI processing** | Dedicated processing animation screen (Section 7.3) |
| **FHIR POST** | Inline spinner next to "Posting to FHIR Sandbox..." text |

### Empty States

| Context | Message |
|---------|---------|
| **No observations yet** | Illustration + "Start your first observation" + CTA button |
| **Empty review queue** | "🎉 All caught up! No observations need review." |
| **No validated data** | "No validated observations yet. Review pending items to get started." |
| **No notifications** | "No notifications yet. You'll be notified when your observations are reviewed." |

### Error States

| Context | UI |
|---------|-----|
| **Network error** | Toast: "Connection lost. Your data is saved locally." with retry button |
| **API error** | Toast: "Something went wrong. Please try again." (not technical error) |
| **Image upload failed** | Inline error below upload area: "Upload failed. Try a smaller image." |
| **AI pipeline error** | Show partial results + "Some AI agents encountered issues. Results may be incomplete." |
| **FHIR POST failed** | "FHIR export queued — it will be submitted when the server is available." |

---

## 12. Accessibility

| Standard | Target |
|----------|--------|
| **WCAG** | 2.1 Level AA |
| **Color contrast** | Minimum 4.5:1 for body text, 3:1 for large text |
| **Focus indicators** | Visible focus ring (`ring-2 ring-stream-400 ring-offset-2`) on all interactive elements |
| **Alt text** | All images have descriptive alt text |
| **Keyboard navigation** | All interactive elements reachable via Tab |
| **Screen reader** | Semantic HTML (headings, landmarks, ARIA labels) |
| **Motion** | Respect `prefers-reduced-motion` — disable non-essential animations |
| **Touch targets** | Minimum 44x44px on mobile |

---

## 13. Anti-Patterns (What NOT To Do)

| ❌ DON'T | ✅ DO |
|----------|------|
| Use default shadcn blue/gray theme | Customize with warm earthy colors |
| Use pure white (#ffffff) backgrounds | Use warm off-white (#faf9f7) |
| Use cold gray shadows | Use warm stone-tinted shadows |
| Use sharp 4px border-radius | Use soft 12-16px border-radius |
| Pack everything into one screen | One primary action per screen |
| Use generic stock icons everywhere | Use Lucide icons sparingly, with purpose |
| Add gratuitous animations | Animate only to communicate state changes |
| Use blue for everything | Use teal (stream) as primary, amber as accent |
| Make the researcher panel look like the volunteer panel | Researcher = information-dense dashboard, Volunteer = clean and simple |
| Use technical jargon in volunteer-facing text | Plain language always |
| Put leaf emojis and nature wallpapers everywhere | Subtle nature-inspired palette, not literal nature imagery |
| Use a dark theme as default | Light, warm theme default (dark mode is P2 enhancement) |

---

*End of DOC-09: UI/UX Specification*
*Next document: DOC-10 Development Roadmap*
