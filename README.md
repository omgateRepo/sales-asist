# SalesAsist

Monorepo with **Frontend** (React + Vite + TypeScript), **Backend** (Express + Prisma + PostgreSQL), **shared types**, **GitHub Actions CI**, and **Render** hosting.

## Structure

- `frontend/` – React 19, Vite 7, TypeScript, Vitest
- `backend/` – Express 5, Prisma 7, PostgreSQL (with `pg` driver), Basic Auth, Vitest
- `packages/types/` – Shared TypeScript types and Zod (used by frontend and backend)
- `.github/workflows/ci.yml` – Lint, typecheck, Prisma migration check, tests
- `render.yaml` – Render Blueprint (API + static frontend)

## Prerequisites

- Node 22
- PostgreSQL (local or hosted)
- Git

## Quick start

1. **Clone or copy this repo** into a new directory and rename the project in `package.json` and `render.yaml` if desired.

2. **Install and run backend (with DB):**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env and set DATABASE_URL to your Postgres connection string
   npm install
   cd backend && npx prisma migrate deploy && cd ..
   npm run dev
   ```
   Backend runs on port 8080. To run without a database (stub mode):
   ```bash
   SKIP_DB=true SKIP_AUTH=true npm run dev --workspace backend
   ```

3. **Run frontend:**
   ```bash
   cp frontend/.env.example frontend/.env
   # Optional: set VITE_API_BASE_URL=http://localhost:8080 if API is on another origin
   npm run dev --workspace frontend
   ```
   Frontend runs on port 5173.

4. **Auth:** The API uses HTTP Basic Auth. A default user **admin** / **Password1** is created on deploy (change after first login). Or set `RENDER_AUTH_USER` / `RENDER_AUTH_PASSWORD` in the backend env. The frontend can store credentials via `setAuthCredentials({ username, password })` and then call `fetchCurrentUser()`.

When you push changes, bump `APP_VERSION` in [frontend/src/version.ts](frontend/src/version.ts) so you can confirm the new deploy is live (version is shown on the main page).

## Scripts (from repo root)

| Script      | Description |
|------------|-------------|
| `npm run lint` | ESLint on frontend + backend |
| `npm run typecheck` | TypeScript check on frontend + backend |
| `npm run test` | Vitest on frontend + backend |
| `npm run dev` (in backend) | `nodemon` + Prisma; in frontend: `vite` |

## CI (GitHub Actions)

On push/PR to `main`:

- Node 22, `npm install`
- `npm run lint`
- `npm run typecheck`
- `npx prisma migrate diff` in `backend` (migrations vs schema)
- `npm run test`

## Deploy on Render

**Blueprint is the source of truth:** all Render config lives in `render.yaml`; no manual build/start overrides in the dashboard. Push to GitHub, then: **New + → Blueprint** → connect repo → **Apply**. The Blueprint creates the database, API, and frontend. No env vars to set. See [RENDER_CREATE.md](RENDER_CREATE.md).

**Auto-deploy on push:** To have every push to `main` trigger a Render deploy, add a repo secret: in Render open the **sales-asist-api** service → **Settings** → **Deploy Hook**, copy the URL; in GitHub go to **Settings** → **Secrets and variables** → **Actions** and add `RENDER_DEPLOY_HOOK_URL` with that URL. CI will call it after a successful build on push to `main`.

## Git workflow

- Use **main** as the default branch.
- Open **feature branches** and merge via **pull requests**.
- CI runs on every push and PR to `main`; keep the branch passing before merging.

## Adding your first feature

- **Backend:** Add routes in `backend/src/routes.js`, models in `backend/prisma/schema.prisma`, then `npx prisma migrate dev --name your_change` in `backend/`. (Prisma 7: DB URL lives in `backend/prisma.config.ts`.)
- **Shared types:** Add types or Zod schemas in `packages/types/src/` and re-export from `index.js` / `index.d.ts`.
- **Frontend:** Add components in `frontend/src/`, call the API via `frontend/src/api.js` (or extend it with typed helpers).

## Maintenance

- **npm audit:** Run `npm audit` and `npm audit fix` (without `--force`) to address non-breaking vulnerabilities.
