# LifeOS

Family hub app (schedule, tasks, goals, hearts, warranty). Built with React, Vite, TypeScript, and Hero UI.

## Data storage

- **With Supabase env vars set:** Data is stored in Postgres (`lifeos_kv` table) and synced from the browser using the **anon key only** — **no login / no Supabase Auth**. Row-level policies allow open read/write for `anon` (fine only for private or low-risk deployments).
- **Without Supabase:** The app falls back to **browser `localStorage`** only (same device).

See `.env.example` for variables.

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL in `supabase/migrations/20260205120000_lifeos_kv.sql` (**SQL Editor** → paste → run), or use the Supabase CLI migrations workflow.
3. **Realtime (multi-device / multi-tab):** Dashboard → **Database → Replication** → enable **`lifeos_kv`** (or run  
   `alter publication supabase_realtime add table public.lifeos_kv;`).
4. Copy **Project URL** + **anon** / publishable key into `.env` locally and into **Vercel → Project → Environment Variables** as  
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`).
5. First deploy with an empty table: existing **`Branson.*` / `Kelsee.*` / `shared.*`** keys from `localStorage` are **imported once** into Supabase (see flag `lifeos.supabase.ls_import_done` in localStorage).

**Security:** Anyone with your anon key and URL can read/write this table. Treat the repo and Vercel env as trusted.

## Local development

```bash
cp .env.example .env
# fill VITE_SUPABASE_* if using Supabase
npm install
npm run dev
```

Dev server uses port **5174** (`vite.config.ts`).

## Deploy on Vercel

1. Import the GitHub repo.
2. **Build:** `npm run build` · **Output:** `dist` · SPA rewrites in `vercel.json`.
3. Add **Environment Variables** if using Supabase (same names as `.env.example`).

## GitHub

```bash
git init
git add .
git commit -m "Initial commit: LifeOS"
gh repo create lifeos --public --source=. --remote=origin --push
```

Use `gh auth login` first if needed.
