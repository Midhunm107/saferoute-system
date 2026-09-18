# 🚦 SafeRoute — AI-Verified Traffic Accident Reporting, Hotspot Analysis & Emergency Response System

A production-grade, full-stack platform that lets citizens report accidents with AI-verified photo evidence, warns drivers before they enter accident-prone zones, coordinates police verification, and streams live ambulance GPS with automatic lane-clearing alerts.

This README is written as a **build guide for use with Claude Code**. It breaks the project into ordered phases, each scoped so you can hand it to Claude Code as a self-contained task, review the diff, test it, and move to the next phase. Keep this file in your repo root — reference specific sections in your prompts (e.g. *"Implement Phase 3, section 3.2, following the schema in this README"*).

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
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

- **Frontend:** React 18 (Vite), Tailwind CSS, Leaflet.js + `react-leaflet`, Socket.io-client, Axios, React Router
- **Backend:** Node.js 20+, Express.js, Socket.io
- **Database:** MongoDB 6+ with native geospatial support — collections use GeoJSON `Point` fields with `2dsphere` indexes, accessed through Mongoose as the ODM
- **AI Engine:** OpenAI `gpt-4o-mini` (vision) via `openai` SDK, or Gemini `1.5-flash` via `@google/generative-ai` (pick one, abstract behind an interface)
- **Auth:** JWT in HTTP-only cookies, `bcrypt` for hashing
- **Infra:** Docker Compose for local dev (MongoDB + backend + frontend), Nginx reverse proxy in prod
- **Storage:** Local disk in dev; S3-compatible bucket (e.g. Cloudflare R2 / AWS S3) in prod for accident photos

> **Geospatial note:** MongoDB's `2dsphere` index supports `$geoNear`, `$geoWithin`, and `$nearSphere`/`$centerSphere` queries directly on GeoJSON fields — no extension to install, which keeps local setup and managed hosting (Atlas) simple. The tradeoff versus PostgreSQL+PostGIS is that Mongo's spherical queries work in **radians**, not meters, so every radius-based query needs a small conversion step (`radiusInRadians = radiusInMeters / 6378137`), and there's no direct equivalent to PostGIS's `ST_DWithin` against an arbitrary linestring — route-based hotspot lookups (Phase 5) are done by sampling points along the route and querying around each one instead of a single line-distance query. Centralize that conversion and the route-sampling logic in `spatialService.js` so the rest of the codebase never touches raw radians. If you later need exact polygon/line geometry queries beyond point-radius clustering, PostgreSQL+PostGIS remains a solid alternative — the field list below maps over almost directly (GeoJSON `Point` → `geography(Point,4326)`, `2dsphere` index → `GIST` index).

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
│   │   ├── Blacklist.js
│   │   └── HotspotThreshold.js
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
│   ├── scripts/
│   │   ├── createIndexes.js      # ensures 2dsphere + unique indexes exist
│   │   └── seed.js               # demo data
│   ├── utils/
│   │   ├── logger.js
│   │   └── asyncHandler.js
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

> Note the `migrations/` folder from a SQL setup is gone — Mongoose schemas define shape at the application layer, so there's nothing to run against the DB except index creation (`scripts/createIndexes.js`) and optional seed data (`scripts/seed.js`).

---

## 4. Data Models

All models are Mongoose schemas. Geospatial fields (`location`, `center`) are stored as GeoJSON `Point` objects: `{ type: "Point", coordinates: [lng, lat] }` — **note the order is `[longitude, latitude]`**, which trips people up coming from lat/lng-first APIs.

### `users`
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| name | String | |
| email | String, unique | |
| phone | String, unique | used for blacklist matching |
| passwordHash | String | bcrypt |
| role | String enum | `CITIZEN`, `POLICE`, `AMBULANCE`, `ADMIN` |
| stationId | ObjectId, nullable | for POLICE — ref to nearest station (or another `users` doc with `role: POLICE`) |
| location | GeoJSON Point, nullable | current position, for citizens in Safety/Nav mode and for police stations |
| trustScore | Number, default 100 | slashed by admin on spam reports |
| deviceId | String, nullable | for blacklist matching |
| createdAt | Date | |

Indexes: unique on `email`, unique on `phone`, `2dsphere` on `location`.

### `incidentReports`
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| reporterId | ObjectId, ref `users` | |
| location | GeoJSON Point | `2dsphere` indexed |
| photoUrl | String | |
| capturedAt | Date | client-side capture timestamp |
| aiCredibilityScore | Number, 0-100 | from AI service |
| aiSeverityEstimate | String enum | `LOW`/`MEDIUM`/`HIGH`/`CRITICAL` |
| status | String enum | `PENDING`, `VERIFIED`, `REJECTED` |
| finalSeverity | String enum | set/overridden by police |
| assignedStationId | ObjectId, nullable | nearest station |
| assignedPoliceId | ObjectId, nullable | |
| createdAt | Date | |

Indexes: `2dsphere` on `location`, compound `{ status: 1, createdAt: -1 }` for the police queue.

### `hotspots`
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| center | GeoJSON Point | cluster centroid, `2dsphere` indexed |
| radiusM | Number | clustering radius, e.g. 300m |
| accidentCount | Number | rolling count of verified incidents |
| tier | String enum | `GREEN`, `YELLOW`, `ORANGE`, `RED` |
| lastUpdated | Date | |

### `blacklist`
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| phone | String, nullable | |
| deviceId | String, nullable | |
| reason | String | |
| createdBy | ObjectId, ref `users` (admin) | |
| createdAt | Date | |

### `hotspotThresholds` (single document, or one per region)
| Field | Type | Notes |
|---|---|---|
| tier | String enum | `GREEN`, `YELLOW`, `ORANGE`, `RED` |
| minCount | Number | |
| maxCount | Number, nullable | `null`/absent means "and above" (RED: 16+) |

Default seed values:

| tier | minCount | maxCount |
|---|---|---|
| GREEN | 1 | 3 |
| YELLOW | 4 | 8 |
| ORANGE | 9 | 15 |
| RED | 16 | — |

---

## 5. Environment Variables

`backend/.env.example`
```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/saferoute
# In production (MongoDB Atlas): mongodb+srv://user:password@cluster.mongodb.net/saferoute?retryWrites=true&w=majority

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
- Set up ESLint/Prettier for both.
- Docker Compose file with a `mongo:7` image, backend, frontend services.
- Health-check route `GET /api/health` (include a Mongo connection ping so the health check reflects real DB reachability).
- **Definition of done:** `docker-compose up` boots all three containers; frontend loads a placeholder page that successfully pings `/api/health`.

### Phase 1 — Database & Models
- Define Mongoose schemas for `User`, `IncidentReport`, `Hotspot`, `Blacklist`, `HotspotThreshold` per section 4.
- `scripts/createIndexes.js` — connects and ensures all indexes exist (unique indexes on `email`/`phone`, `2dsphere` on every `location`/`center` field, the compound status/createdAt index). Safe to re-run (Mongoose's `createIndexes()`/`syncIndexes()` is idempotent).
- `scripts/seed.js` — inserts a few demo users (one per role), a couple of sample hotspots, and default `hotspotThresholds`.
- **DoD:** `createIndexes.js` runs cleanly against a fresh DB (`db.collection.getIndexes()` shows the `2dsphere` indexes); seed script populates data you can query.

### Phase 2 — Auth & RBAC
- `authController` (register/login/logout/me), password hashing with bcrypt.
- JWT issued and set as HTTP-only, `SameSite=Lax` cookie.
- `authMiddleware` (verifies cookie JWT) and `rbacMiddleware(...roles)`.
- Centralized `errorMiddleware` returning `{ success: false, error }`.
- Frontend: `AuthContext`, `Login.jsx`, protected route wrapper redirecting by role to the right dashboard.
- **DoD:** can register/login as each role from the UI; hitting a role-guarded route with the wrong role returns 403.

### Phase 3 — Citizen Reporting + AI Verification
- `ReportModal.jsx`: geolocation capture (`useGeolocation` hook), Leaflet map with draggable pin, camera/file input.
- `POST /api/reports` (multipart) → save photo (local disk in dev, abstracted storage service), call `aiVerificationService`.
- `aiVerificationService.js`: sends image + metadata (timestamp, coords) to OpenAI/Gemini vision model with a structured-JSON prompt; parses `credibilityScore`, `severityEstimate`, `reasoning`.
- Persist an `incidentReports` document (remember: `location.coordinates` is `[lng, lat]`); if `credibilityScore` above a configurable auto-flag threshold, mark `PENDING` for police review (never auto-`VERIFIED` — police always confirm).
- **DoD:** submitting a report from the UI produces a document with a populated AI score and severity guess.

### Phase 4 — Hotspot Engine
- `spatialService.js`: clustering job (simple radius-based clustering to start; DBSCAN as an upgrade) that recomputes `hotspots` from `VERIFIED` incidents, using `$geoWithin`/`$centerSphere` (or a `$geoNear` aggregation stage) to find incidents near a candidate centroid.
- Tier assignment against `hotspotThresholds`.
- Trigger recompute on each new `VERIFIED` report (event-driven) plus a scheduled job (e.g. every 10 min) as a safety net.
- `GET /api/hotspots` (public, paginated/bbox-filtered for map rendering — a bbox filter maps to `$geoWithin: { $box: [...] }` or `$geoWithin: { $geometry: { type: "Polygon", ... } } }`).
- Frontend: render hotspot circles color-coded by tier on `MapComponent`.
- **DoD:** verifying 4+ nearby reports visibly bumps a zone from GREEN to YELLOW on the map.

### Phase 5 — Navigation, Route Warnings & Geofencing
- Route input (source/destination) → call a routing provider (OSRM demo server or self-hosted) → draw polyline.
- `spatialService.getHotspotsNearRoute(routeCoordinates, bufferM)`: since Mongo has no single-query equivalent to PostGIS's `ST_DWithin` against an arbitrary linestring, sample points along the route polyline at a fixed interval (e.g. every 200m) and run a `$geoNear`/`$centerSphere` query around each sampled point with the buffer as radius, then dedupe the matched hotspot IDs. Keep the sampling interval and radius-in-radians conversion in this one function.
- `useGeofenceWatcher` hook: watches live position (`navigator.geolocation.watchPosition`), computes distance to upcoming hotspot centers, triggers `AlertBanner` at 500m.
- **DoD:** simulating movement along a route (or driving a test route) shows the warning banner exactly once per hotspot approach.

### Phase 6 — Police Portal
- `GET /api/police/incidents?station=me` — nearest-station filtering via a `$geoNear` aggregation stage (or `$near` query) against the officer's station coordinates.
- `PATCH /api/police/incidents/:id` — confirm/reject, override severity.
- On confirm → mark `VERIFIED`, trigger hotspot recompute (Phase 4 hook) and notify nearest ambulance station via Socket.io.
- Police dashboard UI: incident queue, photo viewer, severity selector, map pin of the incident.
- **DoD:** confirming an incident as police updates its status, appears in ambulance dispatch feed, and nudges the hotspot count.

### Phase 7 — Ambulance Portal & Live GPS Streaming
- `ambulanceController`: list assigned dispatches, accept dispatch.
- "Emergency Mode" toggle → frontend starts emitting `ambulance:position` every 3s via socket.
- `socketService.js`: on each position update, run `spatialService.findNearbyDrivers(position, 500)` (a `$geoNear`/`$centerSphere` query against tracked driver positions — requires drivers' last-known position to be tracked in the `users` collection, updated when citizens emit their position while "Safety Mode"/navigation is active) and broadcast `emergency:proximity-alert` to those specific sockets/rooms.
- Ambulance dashboard: live map of self + active mission incident.
- **DoD:** toggling Emergency Mode on one browser tab (ambulance) triggers the flashing "CLEAR THE LANE" banner on another tab (citizen) simulated within 500m.

### Phase 8 — Admin Module
- Analytics endpoints: totals, verified vs rejected, active missions (aggregation pipelines with `$group`/`$facet`).
- Blacklist CRUD (`phone`/`deviceId`), and a trust-score slash action tied to rejected reports.
- Hotspot threshold editor (writes to `hotspotThresholds`, immediately affects tier computation).
- Admin dashboard UI: charts (simple bar/line, e.g. Recharts), tables with filters.
- **DoD:** blacklisting a phone number blocks that phone from submitting new reports (checked in `reportController`); threshold edits change tier colors without a redeploy.

### Phase 9 — Hardening & Polish
- Rate limiting on report submission and login (`express-rate-limit`).
- Input validation (`zod`/`joi`) on every route.
- CORS locked to `CLIENT_ORIGIN`.
- Structured logging (`pino` or `winston`) + request ID correlation.
- Loading/error states, mobile-responsive Tailwind pass, accessibility pass on forms/banners.
- **DoD:** `npm audit` clean of high/critical issues; Lighthouse mobile score reasonable; no unhandled promise rejections in server logs during a manual smoke test.

### Phase 10 — Testing, CI, Deployment
- Unit tests for `spatialService` and `aiVerificationService` (mock the AI SDK; use `mongodb-memory-server` for a real-but-ephemeral Mongo instance in spatial-query tests so `$geoNear`/`2dsphere` behavior is actually exercised, not mocked).
- Integration tests for auth + report submission flow (Supertest).
- GitHub Actions: lint → test → build on PR.
- Production Docker images + docker-compose.prod.yml, Nginx config, managed MongoDB (Atlas) connection string via secrets.
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
- Treat the AI score as **advisory only** — it feeds `aiCredibilityScore`/`aiSeverityEstimate`, but a human (police) always makes the final `VERIFIED`/`REJECTED` call before it affects hotspots. This keeps the system safe against AI mistakes and adversarial submissions.
- Wrap the SDK call in a timeout + fallback (`credibilityScore: null`, route straight to manual review) so a provider outage never blocks report submission.

---

## 10. 4-Tier Hotspot Engine — Design

1. On each newly `VERIFIED` report, find or create a cluster within `HOTSPOT_CLUSTER_RADIUS_M` of the incident. Query candidate hotspots with `$geoWithin: { $centerSphere: [[lng, lat], radiusInRadians] }` (where `radiusInRadians = HOTSPOT_CLUSTER_RADIUS_M / 6378137`), or a `$geoNear` aggregation stage with `maxDistance` in meters if you'd rather stay in meters and let Mongo do the conversion.
2. Increment `accidentCount`, recompute `center` as a running average of member incident coordinates.
3. Look up `hotspotThresholds` to assign `tier`.
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
- [ ] Input validation/schema checks on every request body (don't rely on Mongoose schema validation alone — it runs after the request is parsed, not before).
- [ ] MongoDB connection string and credentials only via `.env`/secrets manager, never committed; enable Atlas IP allowlisting or VPC peering in production.
- [ ] Sanitize any user-supplied object used to build a Mongo query (guard against NoSQL injection via operators like `$where`/`$ne` in query params — e.g. with `express-mongo-sanitize`).
- [ ] CORS restricted to known origins.
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
npm run create-indexes   # ensure 2dsphere/unique indexes exist
npm run seed              # optional demo data
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

- **Unit:** `spatialService` (distance/geofence math, the meters↔radians conversion, route-sampling logic), `aiVerificationService` (mock provider responses, assert schema parsing), hotspot tier assignment logic.
- **Integration:** auth flow, report submission → DB document, police verify → hotspot side-effect, blacklist blocking a submission. Use `mongodb-memory-server` to spin up a real in-memory MongoDB instance per test run so `2dsphere` queries are tested against actual Mongo behavior rather than mocks.
- **Socket tests:** use `socket.io-client` in tests to assert `emergency:proximity-alert` fires for a client within radius and not for one outside it.
- **Manual/E2E:** two-browser-tab simulation for the ambulance-proximity flow; mobile device test for camera capture + GPS permission prompts.

---

## 14. Deployment Guide

- **Database:** MongoDB Atlas (managed) — geospatial indexes work out of the box, no extension to enable. Set up a dedicated database user, IP allowlist or VPC peering, and enable automated backups.
- **Backend:** containerized, deployed to Render/Railway/Fly.io/ECS; enable sticky sessions or a Redis adapter for Socket.io if you scale beyond one instance (`socket.io-redis`/`@socket.io/redis-adapter`).
- **Frontend:** static build (`npm run build`) served via Vercel/Netlify/Nginx.
- **File storage:** move from local disk to S3-compatible storage before going live.
- **HTTPS everywhere** — required for `navigator.geolocation` and camera access in browsers, and for `Secure` cookies.
- **Env parity:** keep `.env.example` in sync with every new variable you add during development.

---

## 15. Claude Code Prompt Templates

Use these as starting prompts, one phase at a time:

> "Using the SafeRoute README in this repo, implement Phase 0 (scaffolding) exactly as specified in section 6. Create the directory structure from section 3. Don't implement any business logic yet — just get a health-check route (including a MongoDB connection ping) and placeholder frontend page working end-to-end."

> "Implement Phase 2 (Auth & RBAC) from the SafeRoute README. Follow the `users` schema in section 4 and the env vars in section 5. Write `authController.js`, `authMiddleware.js`, `rbacMiddleware.js`, and the frontend `AuthContext` + `Login.jsx`. Use bcrypt and HTTP-only JWT cookies as specified in section 11."

> "Implement Phase 4 (Hotspot Engine) per section 10 of the SafeRoute README, using MongoDB `$geoWithin`/`$centerSphere` (or a `$geoNear` aggregation) as described — remember the meters-to-radians conversion. Add the `GET /api/hotspots` route from section 7 and wire up the `hotspot:updated` socket event from section 8."

Keep prompts scoped to one phase/section so Claude Code's diffs stay reviewable, and paste in the relevant table/schema from this README rather than re-describing it from memory — that keeps every phase consistent with the same data model.
