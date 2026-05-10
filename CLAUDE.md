# Personal CRM — CLAUDE.md

## Project Overview
Single Page Application (SPA) — personal relationship/dating CRM.
Hosted on GitHub Pages: `https://cichy7768.github.io/Apka`
Repo: `https://github.com/Cichy7768/Apka`

## Tech Stack
- **Frontend**: React 18 + Vite 5 + Tailwind CSS 3
- **UI Components**: shadcn/ui (manual install — no CLI, Radix UI primitives)
- **Database & Auth**: Supabase (PostgreSQL + RLS + Supabase Auth)
- **Charts**: Recharts
- **Hosting**: GitHub Pages via GitHub Actions (`gh-pages` branch)
- **Language**: JavaScript (JSX) — no TypeScript

## Project Structure
```
src/
  App.jsx                    # Root: auth state, tab navigation
  index.css                  # Tailwind + shadcn CSS vars (dark theme hardcoded in :root)
  main.jsx
  lib/
    supabase.js              # Supabase client (URL + anon key hardcoded)
    scoring.js               # Score calculation logic (calculateScore, ageMultiplier)
    utils.js                 # cn() helper (clsx + tailwind-merge)
  components/
    AdminLogin.jsx           # Supabase Auth login dialog
    PersonForm.jsx           # Add/edit person modal (all fields)
    PersonsTable.jsx         # Spreadsheet-like table, admin-only tab
    RankingChart.jsx         # Recharts BarChart (horizontal, sorted by score)
    EventsModule.jsx         # Events: nearest shown publicly, all for admin
    EventForm.jsx            # Add/edit event modal
    ui/                      # shadcn components (button, input, label, select,
                             # dialog, table, tabs, card, badge, textarea)
.github/workflows/deploy.yml # npm ci → vite build → peaceiris/actions-gh-pages
supabase-schema.sql          # Full schema + RLS policies (run in Supabase SQL Editor)
```

## Database Schema (Supabase)

### `persons` table
| Column | Type | Values |
|---|---|---|
| id | uuid PK | auto |
| name | text | required |
| wyglad | text | E, D, C, B, A, S, SS |
| pracuje | text | Tak, Nie, Part time |
| studiuje | text | Tak, Nie, Part time |
| adhd | text | Tak, Nie |
| autyzm | text | Tak, Nie |
| psychiczna | text | Tak, Nie, Pozytywnie |
| wspolne_tematy | integer | 1–4 (4 displayed as "4+") |
| zabawna | integer | 1–10 |
| dystans_i_luz | text | Tak, Nie |
| inteligencja | text | E, D, C, B, A, S, SS |
| wiek | integer | 20–30 |

### `events` table
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto |
| person_id | uuid FK | → persons(id) ON DELETE SET NULL |
| title | text | required |
| date | timestamptz | required |
| notes | text | optional |

### RLS Policies
- Both tables: public SELECT (no auth required)
- Both tables: ALL operations require `auth.role() = 'authenticated'`

## Scoring System (src/lib/scoring.js)

```
E=1, D=2, C=4, B=6, A=8, S=9, SS=10   (wyglad, inteligencja)
Pracuje/Studiuje: Tak=8, Part time=5, Nie=2
ADHD/Autyzm: Nie=0, Tak=-3
Psychiczna: Pozytywnie=+2, Nie=0, Tak=-5
Wspolne tematy: 1→2, 2→5, 3→8, 4→10
Zabawna: direct 1–10
Dystans i luz: Tak=5, Nie=0

Age multiplier: 1 + (30 - age) * 0.025
  20→×1.25, 21→×1.225 ... 30→×1.00

Final score = round(sum × multiplier, 1)
```

Scores are computed client-side only — not stored in DB.

## Auth Model
- Public: Ranking tab + nearest Event visible without login
- Admin: Login via lock icon (top right) → Supabase Auth email/password
- Admin-only: "Osoby" tab (PersonsTable + PersonForm), event CRUD in EventsModule
- Session persisted via `supabase.auth.onAuthStateChange`

## Key Conventions
- Path alias `@/` maps to `src/` (configured in vite.config.js)
- Dark theme only — CSS vars set in `:root` (no `.dark` class toggle)
- No TypeScript, no React Router (state-based navigation with Tabs)
- shadcn components written manually in `src/components/ui/` (no shadcn CLI)
- Supabase credentials in `src/lib/supabase.js` (public anon key — safe for frontend)
- `vite.config.js` base: `/Apka/` (required for GitHub Pages subdirectory)

## Deployment
Push to `main` → GitHub Actions builds → deploys to `gh-pages` branch → GitHub Pages serves.
Workflow file: `.github/workflows/deploy.yml` using `peaceiris/actions-gh-pages@v4`.

## Installed Claude Code Skills
Located in `~/.claude/skills/`:
- `frontend-patterns` — React composition, hooks, performance (from ECC)
- `api-design` — REST patterns (from ECC)
- `database-migrations` — DB migration patterns (from ECC)
- `security-review` — Security audit workflow (from ECC)
- `e2e-testing` — End-to-end testing patterns (from ECC)
- `git-workflow` — Git branching, PRs (from ECC)
- `github-ops` — GitHub Actions, CI/CD (from ECC)
- `deployment-patterns` — Deployment strategies (from ECC)
- `claude-md-optimizer` — Optimizes this CLAUDE.md file (from wrsmith108)
