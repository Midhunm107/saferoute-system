# Swapping your Postgres init for MongoDB

You already did Phase 0's DB piece with Postgres (docker image + presumably
a `db.js`/migrations). Here's exactly what to tear out, what to drop in from
this folder, and what to do next.

## 1. Remove the Postgres pieces

- In your `docker-compose.yml`, delete the `postgres` service and its volume
  (replace with the `docker-compose.yml` in this folder, or merge its `mongo`
  service into yours if you've already added `backend`/`frontend` services).
- `docker-compose down -v` first if the Postgres container is running — the
  `-v` also drops its data volume, which is fine since you're abandoning it.
- Uninstall whatever Postgres client/ORM you added, e.g.:
  ```bash
  npm uninstall pg pg-hstore sequelize knex
  npm install mongoose bcrypt dotenv
  ```
- Delete (or just stop referencing) any `backend/migrations/` SQL files —
  Mongoose schemas replace them; there's nothing to "run" against the DB
  except index creation (step 4 below).
- If you already wrote a `config/db.js` for a Postgres pool/Sequelize
  instance, replace it with the one in this folder.

## 2. Drop in the MongoDB files

Copy these into your repo, preserving the paths:

```
docker-compose.yml
backend/.env.example
backend/config/db.js
backend/utils/logger.js          (skip if you already have a logger)
backend/models/shared/geoPoint.js
backend/models/User.js
backend/models/IncidentReport.js
backend/models/Hotspot.js
backend/models/Blacklist.js
backend/models/HotspotThreshold.js
backend/scripts/createIndexes.js
backend/scripts/seed.js
backend/routes/healthRoutes.js
```

Then update your real `backend/.env` (not just `.env.example`) with a
`MONGODB_URI` — see the comments in that file for local vs. Docker vs. Atlas
connection strings.

## 3. Wire it into `server.js`

```js
require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
app.use(express.json());
app.use('/api', healthRoutes);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB, exiting:', err.message);
    process.exit(1);
  });
```

Add to `backend/package.json` scripts:

```json
"scripts": {
  "dev": "nodemon server.js",
  "create-indexes": "node scripts/createIndexes.js",
  "seed": "node scripts/seed.js"
}
```

## 4. Bring it up and verify (Phase 0 + Phase 1 DoD)

```bash
docker-compose up -d mongo          # or the full stack: docker-compose up --build
cd backend
npm run create-indexes              # creates the 2dsphere + unique indexes
npm run seed                        # inserts demo users, hotspots, thresholds
npm run dev
```

- `curl http://localhost:5000/api/health` → `{ "success": true, "data": { "status": "ok", "dbConnected": true, ... } }`
- Confirm indexes actually landed:
  ```bash
  docker exec -it saferoute-mongo mongosh saferoute --eval "db.hotspots.getIndexes()"
  ```
  You should see a `2dsphere` index on `center`.
- Confirm seed data is queryable:
  ```bash
  docker exec -it saferoute-mongo mongosh saferoute --eval "db.users.countDocuments()"
  ```

Once both of those check out, Phase 0 and Phase 1 are done on MongoDB.

## 5. What's next: Phase 2 — Auth & RBAC

This is the next phase in the roadmap (section 6 of the README), and the
`User` model above already has everything it needs (`passwordHash` field,
`role` enum):

- `authController.js` — register / login / logout / me, hashing with
  `bcrypt` against `User.passwordHash`.
- Issue a JWT on login, set it as an HTTP-only, `SameSite=Lax` cookie (not
  localStorage).
- `authMiddleware.js` — verifies the cookie JWT and attaches `req.user`.
- `rbacMiddleware(...roles)` — 403s if `req.user.role` isn't in the allowed
  list.
- Centralized `errorMiddleware.js` returning `{ success: false, error }`.
- Frontend: `AuthContext.jsx`, `Login.jsx`, and a protected-route wrapper
  that redirects each role to its own dashboard (`/citizen`, `/police`,
  `/ambulance`, `/admin`).

**Phase 2 DoD:** you can register/login as each of the four demo roles from
the UI, and hitting a role-guarded route with the wrong role returns 403.

A ready-to-use Claude Code prompt for this phase:

> "Implement Phase 2 (Auth & RBAC) from the SafeRoute README. Follow the
> `User` model in `backend/models/User.js` and the env vars in
> `backend/.env.example`. Write `authController.js`, `authMiddleware.js`,
> `rbacMiddleware.js`, and the frontend `AuthContext` + `Login.jsx`. Use
> bcrypt and HTTP-only JWT cookies as specified in the README's security
> checklist."

After Phase 2 is working, Phase 3 (Citizen Reporting + AI Verification) is
the one that starts using `IncidentReport` and the AI verification service —
that's where the `2dsphere` index on `incidentReports.location` starts
earning its keep.
