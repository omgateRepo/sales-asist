# Deploy SalesAsist on Render

**Blueprint is the source of truth:** everything (build/start commands, env, DB link) is in `render.yaml`; no manual overrides. One Blueprint creates API + frontend + DB. No env vars to set (API allows all origins by default). A default user is created on deploy: **admin** / **Password1** (change after first login).

---

## 1. Push to GitHub

Create a new repo at [github.com/new](https://github.com/new) (no README), then:

```bash
cd /path/to/sales-asist
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## 2. Create everything on Render (Blueprint)

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint**.
2. Connect the repo you pushed.
3. **Apply.**  
   Render creates **sales-asist-db**, **sales-asist-api**, and **sales-asist-frontend** from `render.yaml` (database is defined first so the API’s `fromDatabase` link works). The API can appear a few seconds after the DB.
4. Leave **Auto Sync** on (default): each push to the linked branch that changes `render.yaml` updates the services and triggers a deploy.
5. Wait until API and frontend show **Live** (first build may take several minutes).

**If the API build fails** with “datasource.url is required”: the API was likely created from an older Blueprint and Render kept that service’s build/start commands. To fix it **using only the Blueprint** (no manual command editing):

1. **Render dashboard** → **sales-asist-api** (the web service) → **Settings** → scroll to bottom → **Delete Web Service**. Confirm.
2. Open the **Blueprint** that owns this repo → **Sync** (or push a small change to `render.yaml` so Auto Sync runs).
3. Render will **recreate** **sales-asist-api** from the current `render.yaml`, with the correct `buildCommand` and `startCommand`. The new service’s first deploy will use the latest commit and the Blueprint config.

Everything stays in the Blueprint: `render.yaml` uses `npm run build:api` / `npm run start:api`, and the root `package.json` defines those scripts (build = install + prisma generate; start = migrate + seed + node). The API uses Prisma 7: the DB URL is in `backend/prisma.config.ts`, not in the schema. No dashboard overrides.

**If you fork and rename the API service:** set **VITE_API_BASE_URL** on the frontend in the Blueprint to your API URL so the frontend calls the right host.

Done. Open the frontend URL (e.g. https://sales-asist-frontend.onrender.com).
