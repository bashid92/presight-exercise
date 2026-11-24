# Presight User Directory — Runbook

How to install, seed, run and test the application, locally and with Docker,
plus the design decisions behind the API and the client.
The architecture diagrams are in [ARCHITECTURE.md](ARCHITECTURE.md).

## How to run

Needs Node.js 20+ (or Docker).

```bash
npm install
npm run dev
```

- Client: http://localhost:3000
- API: http://localhost:5001 (seeds 3,000 users into SQLite on first start)

With Docker:

```bash
docker compose up --build
```

Tests: `npm test`. The sections below have the full details.

---

## 1. Quick start

### Prerequisites
- **Node.js** v20 or newer (tested on v22 and v24)
- **npm** v9 or newer
- **Docker** with Docker Compose v2 (optional, for the containerised run)

### Project layout
```text
presight-execise/
├── client/              React 19 + Vite + Tailwind CSS 4 (port 3000)
├── server/              Node.js + Express 5 + better-sqlite3 (port 5001)
│   └── data/            SQLite file, created on first run (git-ignored)
├── docker-compose.yml
├── ARCHITECTURE.md      diagrams
└── RUNBOOK.md           this file
```

---

### Option A: run locally with npm

#### 1. Install all dependencies
The repo is an npm workspace, so one install at the root covers the client and the server:
```bash
npm install
```

#### 2. Seed the database
The database is SQLite (`server/data/presight.db`). This creates the tables and
inserts **3,000** users, each with 0–10 hobbies:
```bash
npm run seed
```
- The seed is deterministic (fixed random seed), so every run gives the same directory. The name, nationality and hobby lists are in `server/src/db/seedData.ts`.
- Running it again wipes and re-creates the data.
- Change the number of users with `SEED_COUNT`, e.g. `SEED_COUNT=10000 npm run seed`.
- You can skip this step: if the database is empty when the server starts, the server seeds it itself.

#### 3. Start the server and the client
```bash
npm run dev
```
- **React client**: http://localhost:3000
- **Node API server**: http://localhost:5001

Or run them in two terminals:
```bash
# Terminal 1: API server
npm run dev:server

# Terminal 2: React client
npm run dev:client
```

The Vite dev server proxies `/api` to `http://localhost:5001`, so the browser
only talks to `localhost:3000`.

#### Running on other ports
If 3000 or 5001 is already in use (for example another copy of the app is running):
```bash
PORT=5002 npm run dev:server
CLIENT_PORT=3002 API_PROXY_TARGET=http://localhost:5002 npm run dev:client
```

#### Production build without Docker
```bash
npm run build          # server → server/dist, client → client/dist
npm --prefix server start
```

---

### Option B: run with Docker Compose

```bash
docker compose up --build
```

- **Client**: http://localhost:3000 (Nginx serves the built app and proxies `/api` to the server)
- **Server**: http://localhost:5001 (Express + SQLite)
- The SQLite file is kept in the named volume `presight-data`, so data survives restarts and rebuilds.
- On first start the volume is empty and the server seeds 3,000 users automatically.
- The client container waits until the server's `/api/health` check passes.

Stop:
```bash
docker compose down
```

Stop and delete the data (the next start re-seeds):
```bash
docker compose down -v
```

Re-seed a running container:
```bash
docker compose exec server node dist/db/seed.js
```

---

### Tests
```bash
npm test                       # both workspaces
npm --prefix server test       # API tests (in-memory SQLite)
npm --prefix client test       # URL state tests (Vitest)
```

The API tests seed an in-memory database and check, against the raw data:
OR nationalities, AND hobbies, combined filters, facet counts, hasMore,
validation errors, and that paging through every sort field in both directions
returns each user exactly once in the right order.

### Environment variables

| Variable | Used by | Default | Meaning |
|---|---|---|---|
| `PORT` | server | `5001` | API port |
| `DB_PATH` | server | `server/data/presight.db` | SQLite file (`:memory:` in tests) |
| `SEED_COUNT` | server | `3000` | Users created by the seed |
| `CORS_ORIGIN` | server | `*` | Allowed CORS origin |
| `CLIENT_PORT` | client (dev) | `3000` | Vite dev server port |
| `API_PROXY_TARGET` | client (dev) | `http://localhost:5001` | Where Vite proxies `/api` |
| `VITE_API_URL` | client (build) | `/api` | API base URL baked into the build |

### Troubleshooting
- **`EADDRINUSE` / "Port 3000 is in use"**: another process holds the port; stop it or use the other-ports commands above.
- **`better-sqlite3` was compiled against a different Node.js version**: you switched Node versions after installing; run `npm rebuild better-sqlite3`.
- **Avatars do not load**: they come from `randomuser.me`; offline, each card falls back to the user's initials.
- **Start over with fresh data**: stop the server, delete `server/data/`, start again (or run `npm run seed`).

---

## 2. Architecture and data model

See [ARCHITECTURE.md](ARCHITECTURE.md) for the component, request-flow,
deployment and data-model diagrams.

### SQLite schema (`server/src/db/schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  avatar TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age > 0),
  nationality TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hobbies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE
);

CREATE TABLE IF NOT EXISTS user_hobbies (
  user_id INTEGER NOT NULL,
  hobby_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, hobby_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (hobby_id) REFERENCES hobbies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_users_nationality ON users(nationality COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_users_age ON users(age);
CREATE INDEX IF NOT EXISTS idx_user_hobbies_user_id ON user_hobbies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_hobbies_hobby_id ON user_hobbies(hobby_id);
CREATE INDEX IF NOT EXISTS idx_hobbies_name ON hobbies(name COLLATE NOCASE);
```

### Performance choices
- **`better-sqlite3`**: synchronous native driver; for a local SQLite file it is faster than an async wrapper.
- **WAL mode** (`PRAGMA journal_mode = WAL`): reads are not blocked by a write.
- **Junction table** for hobbies: AND-matching and hobby counts are indexed joins, not string parsing.
- **Seed in one transaction**: 3,000 users and ~15,000 hobby links insert in under 100 ms.

---

## 3. API

### `GET /api/users`

| Parameter | Type | Description |
|---|---|---|
| `search` (or `q`) | string | Case-insensitive match on `first_name`, `last_name` or "first last" (max 100 chars) |
| `nationalities` (or `nat`) | string | Comma-separated nationalities — **OR** |
| `hobbies` (or `hob`) | string | Comma-separated hobbies — **AND** |
| `sortField` (or `sort`) | string | `first_name` (default), `last_name`, `age`, `nationality` |
| `sortOrder` (or `order`) | string | `asc` (default) or `desc` |
| `page` | number | Page number, from 1 (default `1`) |
| `limit` | number | Page size, 1–100 (default `24`) |

Invalid values (unknown sort field, `page=0`, `limit=1000`, …) return **400** with an `error` message.

Example:
```bash
curl "http://localhost:5001/api/users?search=am&nationalities=Emirati,Indian&hobbies=Chess,Yoga&sortField=age&sortOrder=desc&page=1&limit=24"
```

Response:
```json
{
  "data": [
    {
      "id": 42,
      "avatar": "https://randomuser.me/api/portraits/men/12.jpg",
      "first_name": "Amir",
      "last_name": "Al-Shamsi",
      "age": 61,
      "nationality": "Emirati",
      "hobbies": ["Chess", "Cooking", "Yoga"]
    }
  ],
  "pagination": { "page": 1, "limit": 24, "total": 3, "totalPages": 1, "hasMore": false },
  "facets": {
    "topHobbies": [{ "value": "Chess", "count": 3 }],
    "topNationalities": [{ "value": "Emirati", "count": 2 }]
  }
}
```

### `GET /api/users/facets`
Same filter parameters; returns only `{ topHobbies, topNationalities }`.

### `GET /api/health`
Returns `{ "status": "ok" }`. Used by the Docker health check.

### Filter logic
All three filters share one `WHERE` builder (`buildFilterConditions` in
`server/src/repositories/user.repository.ts`), used by the list, the total count and the facets.

1. **Text search**
   ```sql
   (u.first_name LIKE ? ESCAPE '\' OR u.last_name LIKE ? ESCAPE '\'
     OR (u.first_name || ' ' || u.last_name) LIKE ? ESCAPE '\')
   ```
   `%` and `_` typed by the user are escaped, so they match literally.
2. **Nationalities (OR)**
   ```sql
   u.nationality IN (?, ?, ...)
   ```
3. **Hobbies (AND)** — users who have *every* selected hobby:
   ```sql
   u.id IN (
     SELECT uh.user_id FROM user_hobbies uh
     JOIN hobbies h ON h.id = uh.hobby_id
     WHERE h.name IN (?, ?)          -- name is COLLATE NOCASE
     GROUP BY uh.user_id
     HAVING COUNT(DISTINCT uh.hobby_id) = ?
   )
   ```
   Repeated values are removed first, so `hobbies=Chess,chess` counts as one hobby.
4. **Top 20 facets** for the active text filter and filter state, sorted by count, then name:
   - **Hobbies** apply every active filter (text + nationalities + hobbies).
   - **Nationalities** apply the text and hobby filters but not the nationality selection itself.
     Nationalities are OR'ed, so after picking "Emirati" the list must still show the other
     nationalities and how many users each would add; otherwise one click would hide every
     other choice. This is the standard "disjunctive facet" behaviour of search UIs.
5. **Deterministic sort**
   ```sql
   ORDER BY u.<sortField> [COLLATE NOCASE] <ASC|DESC>, u.id ASC
   ```
   `id` breaks ties, so offset pagination never repeats or skips a user.
   `sortField` is checked against a whitelist before it is placed in the SQL.

---

## 4. Client

- **Stack**: React 19, TypeScript, Vite 6, Tailwind CSS 4 (theme and shared classes in `src/index.css`), `lucide-react` icons.
- **Components** are grouped by area under `src/components/`: `layout/`, `toolbar/`, `filters/`, `users/`, `states/`.
- **User card** (`users/UserCard.tsx`, `users/HobbyChips.tsx`, `users/Avatar.tsx`):
  ```text
  |----------------------------------|
  | avatar      first_name+last_name |
  |             nationality      age |
  |                                  |
  |             (2 hobbies) (+n)     |
  |----------------------------------|
  ```
  - Up to 2 hobby badges; hobbies you are filtering by are shown first.
  - `+n` opens a popover with the other hobbies (closes on outside click or Escape). It opens downward for cards near the top of the list so it is never cut off.
  - Clicking a hobby or the nationality on a card toggles that filter.
  - If an avatar fails to load, the card shows the user's initials.
- **Virtualised infinite scroll** (`users/UserList.tsx`):
  - `@tanstack/react-virtual`; only rows near the viewport are in the DOM.
  - 1 column under 600 px, 2 under 1000 px, otherwise 3 (based on the list width, via `ResizeObserver`).
  - The next page loads when the last rendered row is within 2 rows of the end.
  - `overscan: 5` avoids blank rows during fast scrolling.
- **URL-synced state** (`useUrlFilters.ts`, `filterParams.ts`):
  - `q`, `nat`, `hob`, `sort`, `order` live in the query string; defaults are left out.
  - Reloading or sharing the URL restores the same view.
  - Filter and sort clicks add a history entry (Back/Forward step through them); typing replaces the entry.
  - Invalid values in a hand-edited URL fall back to defaults.
- **Data loading** (`useUsers.ts`):
  - Any filter change restarts at page 1 and refreshes the list and the sidebar together.
  - The previous request is aborted, so a slow old response can never overwrite new results.
  - Search input is debounced by 300 ms.
- **States**:
  - Loading: skeleton cards on first load and on every filter change; spinner row while the next page loads.
  - Empty: "No users found" with a "Clear all filters" button.
  - Error: "Unable to load data" with "Try Again"; if a later page fails, the loaded cards stay and a retry row appears at the bottom.
- **Responsive**: sticky sidebar on desktop (≥1024 px); below that, a "Filters" button opens a slide-in drawer (`filters/MobileFilterDrawer.tsx`, closes on Escape).

---

## 5. Evaluation focus

| Focus | How it is met |
|---|---|
| Data persistence and API | Normalised SQLite with foreign keys and cascades, WAL, seed in a transaction, validated query params with 400s, central error handler |
| Filtering, sorting, pagination, top 20 | One shared `WHERE` builder for list, count and facets; AND hobbies / OR nationalities; `id` tie-breaker; covered by API tests |
| Smooth virtualised scroll | `@tanstack/react-virtual` with measured rows, overscan, prefetch 2 rows early, memoised cards |
| URL-synced state | URL is the single source of truth; reload, share and Back/Forward all work |
| Loading, empty, error states | Skeletons, spinner row, empty state with reset, error state with retry, inline retry for later pages |
| Local and Docker setup | `npm install && npm run dev`; `docker compose up --build`; auto-seed on first start |

### Next steps for production scale
- **Search**: SQLite `FTS5` (or Meilisearch / Elasticsearch) for prefix and typo-tolerant search on millions of rows.
- **Pagination**: keyset (cursor) pagination on `(sortField, id)` instead of `OFFSET` for very deep pages.
- **Database**: PostgreSQL, or libSQL / LiteFS for replicated SQLite.
- **Caching**: short-lived cache for facet queries keyed by the normalised filter string.
