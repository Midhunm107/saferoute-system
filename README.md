# 🚦 SafeRoute — AI-Verified Traffic Accident Reporting, Hotspot Analysis & Emergency Response System

A production-grade, full-stack platform that lets citizens report accidents with AI-verified photo evidence, warns drivers before they enter accident-prone zones, coordinates police verification, and streams live ambulance GPS with automatic lane-clearing alerts.

This README is written as a **build guide for use with Claude Code**. It breaks the project into ordered phases, each scoped so you can hand it to Claude Code as a self-contained task, review the diff, test it, and move to the next phase. Keep this file in your repo root — reference specific sections in your prompts (e.g. *"Implement Phase 3, section 3.2, following the schema in this README"*).

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
   - [3.5. UI Design System — Neomorphic Glass Aerodynamics](#35-ui-design-system--neomorphic-glass-aerodynamics-concept-b)
4. [Data Models](#4-data-models)
5. [Environment Variables](#5-environment-variables)
6. [Build Roadmap (Phases)](#6-build-roadmap-phases)
7. [API Reference](#7-api-reference)
8. [Socket.io Event Reference](#8-socketio-event-reference)
9. [AI Verification Engine — Design](#9-ai-verification-engine--design)
10. [4-Tier Hotspot Engine — Design](#10-4-tier-hotspot-engine--design)
11. [Security Checklist](#11-security-checklist)
12. [Local Setup](#12-local-setup)
13. [Testing Strategy](#13-testing-strategy)
14. [Deployment Guide](#14-deployment-guide)
15. [Claude Code Prompt Templates](#15-claude-code-prompt-templates)

---

## 1. System Overview

| Portal | Route | Primary Users | Core Capability |
|---|---|---|---|
| Citizen | `/citizen` | Drivers/public | Report accidents, navigate safely, receive alerts |
| Police | `/police` | Traffic police | Verify incidents, update severity |
| Ambulance | `/ambulance` | EMS crews | Receive dispatch, stream live GPS, broadcast lane-clear |
| Admin | `/admin` | System admins | Analytics, blacklist, hotspot thresholds |

Data flows in one loop: **Report → AI Verification → Police Confirmation → Hotspot Update → Citizen Warning**, with a parallel **Ambulance Dispatch → Live GPS → Geofence Broadcast → Citizen Alert** loop.

---

## 2. Tech Stack

- **Frontend:** React 18 (Vite), Tailwind CSS — **UI follows the Neomorphic Glass Aerodynamics design system, section 3.5** — Leaflet.js + `react-leaflet`, Socket.io-client, Axios, React Router
- **Backend:** Node.js 20+, Express.js, Socket.io
- **Database:** PostgreSQL 15+ with PostGIS (recommended for geospatial indexing) — MongoDB 2dsphere is a documented fallback
- **AI Engine:** OpenAI `gpt-4o-mini` (vision) via `openai` SDK, or Gemini `1.5-flash` via `@google/generative-ai` (pick one, abstract behind an interface)
- **Auth:** JWT in HTTP-only cookies, `bcrypt` for hashing
- **Infra:** Docker Compose for local dev (Postgres/PostGIS + backend + frontend), Nginx reverse proxy in prod
- **Storage:** Local disk in dev; S3-compatible bucket (e.g. Cloudflare R2 / AWS S3) in prod for accident photos

> **Decision to lock in before Phase 1:** Postgres+PostGIS vs MongoDB. PostGIS gives you real `ST_DWithin` radius queries and spatial indexes (`GIST`) — recommended for the hotspot/geofencing accuracy this project needs. This guide assumes **PostgreSQL + PostGIS**; a Mongo schema appendix is included for reference.

---

## 3. Directory Structure

```
saferoute-system/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── constants.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── reportController.js
│   │   ├── policeController.js
│   │   ├── ambulanceController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── rbacMiddleware.js
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── IncidentReport.js
│   │   ├── Hotspot.js
│   │   └── Blacklist.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── policeRoutes.js
│   │   ├── ambulanceRoutes.js
│   │   └── adminRoutes.js
│   ├── services/
│   │   ├── aiVerificationService.js
│   │   ├── spatialService.js
│   │   └── socketService.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── asyncHandler.js
│   ├── migrations/
│   ├── uploads/                  # dev-only local file storage
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── public/
    └── src/
        ├── components/
        │   ├── Navbar.jsx
        │   ├── MapComponent.jsx
        │   ├── AlertBanner.jsx
        │   └── ReportModal.jsx
        ├── context/
        │   ├── AuthContext.jsx
        │   └── SocketContext.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── CitizenDashboard.jsx
        │   ├── PoliceDashboard.jsx
        │   ├── AmbulanceDashboard.jsx
        │   └── AdminDashboard.jsx
        ├── hooks/
        │   ├── useGeolocation.js
        │   └── useGeofenceWatcher.js
        ├── api/
        │   └── axiosClient.js
        ├── App.jsx
        └── main.jsx
```

---

## 3.5. UI Design System — Neomorphic Glass Aerodynamics (Concept B)

The frontend follows this design system consistently across all four portals (Citizen, Police, Ambulance, Admin). Apply these tokens directly — don't invent new colors, shadows, or radii outside this palette.

### Tailwind Color Palette & Classes

| Element | Class(es) |
|---|---|
| Background Canvas | `bg-[#0b1320]` |
| Card Surface | `bg-white/[0.04] backdrop-blur-xl border border-white/10` |
| Card Hover | `hover:bg-white/[0.08] hover:border-white/20 transition-all` |
| Primary Glass Shadow | `shadow-[8px_8px_24px_rgba(0,0,0,0.45),-4px_-4px_16px_rgba(255,255,255,0.02)]` |

### Semantic Accents

| Meaning | Hex | Classes |
|---|---|---|
| Safe / Active | `#10b981` | `text-emerald-400`, `border-emerald-500/30`, `bg-emerald-500/20` |
| Route / Navigation | `#06b6d4` | `text-cyan-400`, `border-cyan-500/30` |
| Warning / Mid-Hotspot | `#f59e0b` | `text-amber-400`, `border-amber-500/30` |
| Emergency / High-Hotspot | `#ef4444` | `text-rose-400`, `border-rose-500/30` |

> Map these accents to app meaning consistently: hotspot tiers `GREEN→emerald`, `YELLOW/ORANGE→amber`, `RED→rose`; route lines and nav UI → cyan; "Safety Mode"/verified states → emerald.

### Typography

- Primary font: Inter or system sans (`font-sans`)
- Monospace/telemetry: `font-mono` — used for coordinates, distance metrics, AI confidence scores, and any raw numeric readout (never for regular UI copy)

### Component Patterns

- **Inputs (recessed inset style):**
  `bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none`
- **Buttons (tactile pill):**
  `rounded-xl font-medium px-4 py-2.5 transition-all active:scale-[0.98]`
  Combine with a semantic accent per action (e.g. emerald for confirm/verify, rose for reject/emergency, cyan for navigate).

### Implementation Notes

- Bake the semantic accents into `tailwind.config.js` as named theme colors (e.g. `theme.extend.colors.safe`, `.route`, `.warning`, `.emergency`) rather than repeating raw hex/opacity utility strings across components — keeps Phase 2+ components consistent without copy-pasting class strings everywhere.
- Every card-level component (`MapComponent`, `AlertBanner`, dashboard panels) should use the Card Surface + Card Hover + Primary Glass Shadow combination as its base wrapper, so the "neomorphic glass" feel is uniform across portals.
- `AlertBanner` severity levels should map directly to the four semantic accents above, not a separate ad hoc color set.

---

## 4. Data Models

### `users`
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | text | |
| email | text unique | |
| phone | text unique | used for blacklist matching |
| password_hash | text | bcrypt |
| role | enum | `CITIZEN`, `POLICE`, `AMBULANCE`, `ADMIN` |
| station_id | UUID nullable | for POLICE — links to nearest station |
| trust_score | int default 100 | slashed by admin on spam reports |
| device_id | text nullable | for blacklist matching |
| created_at | timestamptz | |

### `incident_reports`
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| reporter_id | UUID FK → users | |
| location | geography(Point,4326) | PostGIS point |
| photo_url | text | |
| captured_at | timestamptz | client-side capture timestamp |
| ai_credibility_score | int 0-100 | from AI service |
| ai_severity_estimate | enum | `LOW/MEDIUM/HIGH/CRITICAL` |
| status | enum | `PENDING`, `VERIFIED`, `REJECTED` |
| final_severity | enum | set/overridden by police |
| assigned_station_id | UUID nullable | nearest station |
| assigned_police_id | UUID nullable | |
| created_at | timestamptz | |

### `hotspots`
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| center | geography(Point,4326) | cluster centroid |
| radius_m | int | clustering radius, e.g. 300m |
| accident_count | int | rolling count of verified incidents |
| tier | enum | `GREEN`, `YELLOW`, `ORANGE`, `RED` |
| last_updated | timestamptz | |

### `blacklist`
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| phone | text nullable | |
| device_id | text nullable | |
| reason | text | |
| created_by | UUID FK → users (admin) | |
| created_at | timestamptz | |

### `hotspot_thresholds` (admin-configurable, singleton or per-region row)
| tier | min_count | max_count |
|---|---|---|
| GREEN | 1 | 3 |
| YELLOW | 4 | 8 |
| ORANGE | 9 | 15 |
| RED | 16+ | — |

> **MongoDB fallback:** mirror the same fields; store `location`/`center` as GeoJSON `Point` and add a `2dsphere` index on each. Use `$geoNear`/`$geoWithin` with `$centerSphere` in place of `ST_DWithin`.

---

## 5. Environment Variables

`backend/.env.example`
```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/saferoute

# Auth
JWT_SECRET=replace_with_long_random_string
JWT_EXPIRES_IN=7d
COOKIE_SECURE=false          # set true in production (HTTPS)

# AI Verification
AI_PROVIDER=openai           # openai | gemini
AI_API_KEY=sk-xxxxxxxx

# File storage
STORAGE_DRIVER=local         # local | s3
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=

# Hotspot defaults (overridable via Admin UI)
HOTSPOT_CLUSTER_RADIUS_M=300
GEOFENCE_WARNING_RADIUS_M=500
AMBULANCE_BROADCAST_RADIUS_M=500
AMBULANCE_GPS_INTERVAL_MS=3000
```

`frontend/.env.example`
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

---

## 6. Build Roadmap (Phases)

Work through these phases **in order** with Claude Code. Each phase is scoped to be one or two prompt/review cycles. Don't skip ahead — later phases assume earlier ones compile and run.

### Phase 0 — Scaffolding
- Initialize `backend/` (Express + `package.json`) and `frontend/` (Vite + React + Tailwind).
- Configure `tailwind.config.js` with the semantic color tokens from section 3.5 (Neomorphic Glass Aerodynamics) before building the placeholder page.
- Set up ESLint/Prettier for both.
- Docker Compose file with a `postgres:15` + PostGIS image, backend, frontend services.
- Health-check route `GET /api/health`.
- **Definition of done:** `docker-compose up` boots all three containers; frontend loads a placeholder page (styled per section 3.5 — Background Canvas + Card Surface) that successfully pings `/api/health`.

### Phase 1 — Database & Models
- Write migrations for `users`, `incident_reports`, `hotspots`, `blacklist`, `hotspot_thresholds`, enabling the PostGIS extension.
- Add GIST spatial indexes on `location`/`center` columns.
- Seed script with a few demo users (one per role) and a couple of sample hotspots.
- **DoD:** migrations run cleanly against a fresh DB; seed script populates data you can query.

### Phase 2 — Auth & RBAC
- `authController` (register/login/logout/me), password hashing with bcrypt.
- JWT issued and set as HTTP-only, `SameSite=Lax` cookie.
- `authMiddleware` (verifies cookie JWT) and `rbacMiddleware(...roles)`.
- Centralized `errorMiddleware` returning `{ success: false, error }`.
- Frontend: `AuthContext`, `Login.jsx`, protected route wrapper redirecting by role to the right dashboard. Style `Login.jsx` and the Navbar per section 3.5 (recessed inputs, tactile pill buttons).
- **DoD:** can register/login as each role from the UI; hitting a role-guarded route with the wrong role returns 403.

### Phase 3 — Citizen Reporting + AI Verification
- `ReportModal.jsx`: geolocation capture (`useGeolocation` hook), Leaflet map with draggable pin, camera/file input. Style per section 3.5 (Card Surface, cyan accents for navigation elements).
- `POST /api/reports` (multipart) → save photo (local disk in dev, abstracted storage service), call `aiVerificationService`.
- `aiVerificationService.js`: sends image + metadata (timestamp, coords) to OpenAI/Gemini vision model with a structured-JSON prompt; parses `credibilityScore`, `severityEstimate`, `reasoning`.
- Persist `incident_reports` row; if `credibilityScore` above a configurable auto-flag threshold, mark `PENDING` for police review (never auto-`VERIFIED` — police always confirm).
- **DoD:** submitting a report from the UI produces a DB row with a populated AI score and severity guess.

### Phase 4 — Hotspot Engine
- `spatialService.js`: clustering job (simple radius-based clustering to start; DBSCAN as an upgrade) that recomputes `hotspots` from `VERIFIED` incidents.
- Tier assignment against `hotspot_thresholds`.
- Trigger recompute on each new `VERIFIED` report (event-driven) plus a scheduled job (e.g. every 10 min) as a safety net.
- `GET /api/hotspots` (public, paginated/bbox-filtered for map rendering).
- Frontend: render hotspot circles color-coded by tier on `MapComponent`, using the semantic accent mapping in section 3.5 (GREEN→emerald, YELLOW/ORANGE→amber, RED→rose).
- **DoD:** verifying 4+ nearby reports visibly bumps a zone from GREEN to YELLOW on the map.

### Phase 5 — Navigation, Route Warnings & Geofencing
- Route input (source/destination) → call a routing provider (OSRM demo server or self-hosted) → draw polyline (cyan, per section 3.5).
- `spatialService.getHotspotsNearRoute(routeGeoJSON, bufferM)` using `ST_DWithin` against the route linestring.
- `useGeofenceWatcher` hook: watches live position (`navigator.geolocation.watchPosition`), computes distance to upcoming hotspot centers, triggers `AlertBanner` at 500m.
- **DoD:** simulating movement along a route (or driving a test route) shows the warning banner exactly once per hotspot approach.

### Phase 6 — Police Portal
- `GET /api/police/incidents?station=me` — nearest-station filtering using `ST_Distance` against station coordinates (add a `stations` table or reuse `users` with `role=POLICE` and a location column).
- `PATCH /api/police/incidents/:id` — confirm/reject, override severity.
- On confirm → mark `VERIFIED`, trigger hotspot recompute (Phase 4 hook) and notify nearest ambulance station via Socket.io.
- Police dashboard UI: incident queue, photo viewer, severity selector, map pin of the incident. Style per section 3.5 — confirm actions use emerald, reject actions use rose.
- **DoD:** confirming an incident as police updates its status, appears in ambulance dispatch feed, and nudges the hotspot count.

### Phase 7 — Ambulance Portal & Live GPS Streaming
- `ambulanceController`: list assigned dispatches, accept dispatch.
- "Emergency Mode" toggle → frontend starts emitting `ambulance:position` every 3s via socket.
- `socketService.js`: on each position update, run `spatialService.findNearbyDrivers(position, 500)` (requires drivers' last-known position to be tracked — citizens emit their position when "Safety Mode"/navigation is active) and broadcast `emergency:proximity-alert` to those specific sockets/rooms.
- Ambulance dashboard: live map of self + active mission incident. Style the "CLEAR THE LANE" banner using the Emergency (rose) accent from section 3.5.
- **DoD:** toggling Emergency Mode on one browser tab (ambulance) triggers the flashing "CLEAR THE LANE" banner on another tab (citizen) simulated within 500m.

### Phase 8 — Admin Module
- Analytics endpoints: totals, verified vs rejected, active missions (aggregate queries).
- Blacklist CRUD (`phone`/`device_id`), and a trust-score slash action tied to rejected reports.
- Hotspot threshold editor (writes to `hotspot_thresholds`, immediately affects tier computation).
- Admin dashboard UI: charts (simple bar/line, e.g. Recharts), tables with filters, styled per section 3.5.
- **DoD:** blacklisting a phone number blocks that phone from submitting new reports (checked in `reportController`); threshold edits change tier colors without a redeploy.

### Phase 9 — Hardening & Polish
- Rate limiting on report submission and login (`express-rate-limit`).
- Input validation (`zod`/`joi`) on every route.
- CORS locked to `CLIENT_ORIGIN`.
- Structured logging (`pino` or `winston`) + request ID correlation.
- Loading/error states, mobile-responsive Tailwind pass, accessibility pass on forms/banners (verify contrast ratios still pass against the `#0b1320` canvas per section 3.5).
- **DoD:** `npm audit` clean of high/critical issues; Lighthouse mobile score reasonable; no unhandled promise rejections in server logs during a manual smoke test.

### Phase 10 — Testing, CI, Deployment
- Unit tests for `spatialService` and `aiVerificationService` (mock the AI SDK).
- Integration tests for auth + report submission flow (Supertest).
- GitHub Actions: lint → test → build on PR.
- Production Docker images + docker-compose.prod.yml, Nginx config, PostGIS-enabled managed DB (e.g. Supabase/Neon+PostGIS or RDS).
- **DoD:** CI green on a clean clone; a documented `docker-compose -f docker-compose.prod.yml up` brings up a working prod-like stack.

---

## 7. API Reference

| Method | Route | Role | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Login, sets JWT cookie |
| POST | `/api/auth/logout` | Any | Clears cookie |
| GET | `/api/auth/me` | Any | Current user |
| POST | `/api/reports` | CITIZEN | Submit incident (multipart: photo + coords + timestamp) |
| GET | `/api/reports/mine` | CITIZEN | Own report history |
| GET | `/api/hotspots` | Public | Hotspots, optionally filtered by bounding box |
| GET | `/api/route/hotspots` | Public | Hotspots intersecting a given route |
| GET | `/api/police/incidents` | POLICE | Queue for the officer's station |
| PATCH | `/api/police/incidents/:id` | POLICE | Verify/reject, set severity |
| GET | `/api/ambulance/dispatches` | AMBULANCE | Active/pending dispatches |
| PATCH | `/api/ambulance/dispatches/:id/accept` | AMBULANCE | Accept mission |
| GET | `/api/admin/analytics` | ADMIN | Dashboard aggregates |
| GET/POST/DELETE | `/api/admin/blacklist` | ADMIN | Manage blacklist |
| PUT | `/api/admin/thresholds` | ADMIN | Update hotspot tier thresholds |

All error responses: `{ "success": false, "error": "message" }`. All success responses: `{ "success": true, "data": ... }`.

---

## 8. Socket.io Event Reference

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `driver:position` | client → server | `{ lat, lng }` | Citizen in Safety/Nav mode streams position |
| `ambulance:emergency-mode-on` | client → server | `{ ambulanceId }` | Starts 3s GPS streaming |
| `ambulance:position` | client → server | `{ lat, lng, ambulanceId }` | Every 3s while in Emergency Mode |
| `emergency:proximity-alert` | server → client(s) | `{ ambulanceId, distanceM }` | Sent to drivers within 500m |
| `incident:new` | server → police room | `{ incidentId, stationId }` | New report near a station |
| `incident:verified` | server → ambulance room | `{ incidentId, severity }` | Triggers dispatch |
| `hotspot:updated` | server → all clients | `{ hotspotId, tier }` | Live map refresh |

Use Socket.io **rooms** per station (`station:<id>`) and per role (`role:AMBULANCE`) rather than broadcasting globally.

---

## 9. AI Verification Engine — Design

`aiVerificationService.js` should expose one function:

```js
async function verifyIncident({ imageBuffer, capturedAt, lat, lng }) {
  // returns { credibilityScore: 0-100, severity: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL', reasoning: string }
}
```

Prompt design principles:
- Ask the model to respond **only** with strict JSON matching a schema (score, severity enum, short reasoning) — no prose.
- Feed the model: the image, capture timestamp, and coordinates, and ask it to flag inconsistencies (e.g. an obviously stock/indoor photo, timestamp mismatch signals passed in from the backend, no visible vehicle/road damage).
- Treat the AI score as **advisory only** — it feeds `ai_credibility_score`/`ai_severity_estimate`, but a human (police) always makes the final `VERIFIED`/`REJECTED` call before it affects hotspots. This keeps the system safe against AI mistakes and adversarial submissions.
- Wrap the SDK call in a timeout + fallback (`credibilityScore: null`, route straight to manual review) so a provider outage never blocks report submission.

---

## 10. 4-Tier Hotspot Engine — Design

1. On each newly `VERIFIED` report, find or create a cluster within `HOTSPOT_CLUSTER_RADIUS_M` of the incident (nearest-centroid radius search via PostGIS `ST_DWithin`).
2. Increment `accident_count`, recompute centroid as a running average of member incident coordinates.
3. Look up `hotspot_thresholds` to assign `tier`.
4. Emit `hotspot:updated` so connected maps refresh without a reload.
5. Periodic job re-scans for decay (optional v2: reduce weight of older incidents so a hotspot can cool down over time).

Start with simple radius clustering (Phase 4); DBSCAN (via a library or a Python microservice) is a documented upgrade path once you have enough data volume to justify it — don't over-engineer this on day one.

---

## 11. Security Checklist

- [ ] Passwords hashed with bcrypt (cost factor ≥ 12), never logged.
- [ ] JWT in HTTP-only, `SameSite=Lax`/`Strict`, `Secure` (prod) cookies — never in localStorage.
- [ ] RBAC middleware on every non-public route.
- [ ] Rate limiting on `/auth/login`, `/auth/register`, `/reports`.
- [ ] File upload validation: mime-type + size limits + re-encode images server-side (strip EXIF/GPS metadata after extracting what you need, to avoid leaking reporter location in the file itself).
- [ ] Blacklist check (phone/device) before accepting a new report.
- [ ] Input validation/schema checks on every request body.
- [ ] CORS restricted to known origins.
- [ ] Secrets only via `.env`, never committed; `.env` in `.gitignore`.
- [ ] Centralized error handler never leaks stack traces in production responses.

---

## 12. Local Setup

```bash
# 1. Clone and install
git clone <your-repo-url> saferoute-system
cd saferoute-system

# 2. Backend
cd backend
cp .env.example .env    # fill in secrets
npm install
npm run migrate         # run DB migrations
npm run seed             # optional demo data
npm run dev

# 3. Frontend (new terminal)
cd ../frontend
cp .env.example .env
npm install
npm run dev

# OR, all at once with Docker
docker-compose up --build
```

Default dev URLs: frontend `http://localhost:5173`, backend `http://localhost:5000`.

---

## 13. Testing Strategy

- **Unit:** `spatialService` (distance/geofence math), `aiVerificationService` (mock provider responses, assert schema parsing), hotspot tier assignment logic.
- **Integration:** auth flow, report submission → DB row, police verify → hotspot side-effect, blacklist blocking a submission.
- **Socket tests:** use `socket.io-client` in tests to assert `emergency:proximity-alert` fires for a client within radius and not for one outside it.
- **Manual/E2E:** two-browser-tab simulation for the ambulance-proximity flow; mobile device test for camera capture + GPS permission prompts.

---

## 14. Deployment Guide

- **Database:** managed Postgres with PostGIS enabled (Neon, Supabase, or RDS + the `postgis` extension).
- **Backend:** containerized, deployed to Render/Railway/Fly.io/ECS; enable sticky sessions or a Redis adapter for Socket.io if you scale beyond one instance (`socket.io-redis`/`@socket.io/redis-adapter`).
- **Frontend:** static build (`npm run build`) served via Vercel/Netlify/Nginx.
- **File storage:** move from local disk to S3-compatible storage before going live.
- **HTTPS everywhere** — required for `navigator.geolocation` and camera access in browsers, and for `Secure` cookies.
- **Env parity:** keep `.env.example` in sync with every new variable you add during development.

---

## 15. Claude Code Prompt Templates

Use these as starting prompts, one phase at a time:

> "Using the SafeRoute README in this repo, implement Phase 0 (scaffolding) exactly as specified in section 6. Create the directory structure from section 3. Configure Tailwind with the design tokens from section 3.5 (Neomorphic Glass Aerodynamics) and style the placeholder page with the Background Canvas and Card Surface classes. Don't implement any business logic yet — just get a health-check route and placeholder frontend page working end-to-end."

> "Implement Phase 2 (Auth & RBAC) from the SafeRoute README. Follow the `users` schema in section 4 and the env vars in section 5. Write `authController.js`, `authMiddleware.js`, `rbacMiddleware.js`, and the frontend `AuthContext` + `Login.jsx`. Use bcrypt and HTTP-only JWT cookies as specified in section 11. Style `Login.jsx` and the Navbar per the design system in section 3.5 (recessed inputs, tactile pill buttons, Card Surface)."

> "Implement Phase 4 (Hotspot Engine) per section 10 of the SafeRoute README, using PostGIS `ST_DWithin` as described. Add the `GET /api/hotspots` route from section 7 and wire up the `hotspot:updated` socket event from section 8. Color-code hotspot circles on the map using the semantic accent mapping in section 3.5 (GREEN→emerald, YELLOW/ORANGE→amber, RED→rose)."

Keep prompts scoped to one phase/section so Claude Code's diffs stay reviewable, and paste in the relevant table/schema from this README rather than re-describing it from memory — that keeps every phase consistent with the same data model and design system.
