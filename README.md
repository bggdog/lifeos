# LifeOS

Family hub app (schedule, tasks, goals, hearts, warranty). Built with React, Vite, TypeScript, and Hero UI.

## Data storage

All data lives in the **browser** (`localStorage`). Nothing is sent to a server, so **no database is required** for hosting. Each device/browser has its own data.

If you later want shared cloud storage across phones and desktops, you’d add something like **Supabase** or **Firebase** and replace the `src/lib/storage.ts` layer—out of scope for the default deploy.

## Local development

```bash
npm install
npm run dev
```

Dev server uses port **5174** (`vite.config.ts`).

## Deploy on Vercel

1. Push this repo to GitHub (see below).
2. In [Vercel](https://vercel.com): **Add New Project** → import the repo.
3. Vercel detects Vite via `vercel.json`. Defaults:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Deploy. Client-side routes (`/dashboard`, `/schedule`, etc.) work via the SPA rewrite in `vercel.json`.

No environment variables are required for the current build.

## GitHub

From this folder:

```bash
git init
git add .
git commit -m "Initial commit: LifeOS"
gh repo create lifeos --public --source=. --remote=origin --push
```

(Install the [GitHub CLI](https://cli.github.com/) and run `gh auth login` first, or create an empty repo on GitHub and `git remote add origin …` then `git push -u origin main`.)
