# Rollorian Book Archive

Rollorian Book Archive is a small full-stack personal library app. It lets one user search books through Google Books via a local Express backend and curate a local collection stored in SQLite with Prisma.

## Stack

- Frontend: HTML, CSS, and vanilla JavaScript
- Backend: Node.js + Express
- Persistence: Prisma + SQLite
- External source: Google Books through the backend only

## Architecture Summary

- `frontend/` contains a routed vanilla SPA organized into `views/`, `shared/`, and a tiny hash router.
- `backend/` contains the Express API, Google Books integration, business services, and Prisma setup.
- The browser talks only to the local backend.
- Route handlers stay thin and delegate work to feature services.

## Data Flow

1. The user searches from the frontend.
2. The frontend calls `GET /api/search/books?q=` on the local backend.
3. The backend calls Google Books, normalizes the response, and returns a stable payload.
4. The user saves a book through `POST /api/books`.
5. Prisma persists the local collection in SQLite.
6. The frontend reads and manages saved books through the `/api/books` endpoints and uses hash routes for view-level navigation.

Search requests keep the same API contract, but the backend now applies a few deterministic quality heuristics before returning results:

- ISBN-like queries are converted into precise `isbn:` lookups.
- Queries shaped like `title by author` are sent to Google Books as `intitle:` + `inauthor:` searches.
- General free-text queries still use Google Books relevance ordering, then get a lightweight local rerank so exact title and author matches rise above noisier results.

## Getting Started

1. Run the first-time setup workflow from the repo root:

```bash
npm run setup
```

This installs backend dependencies, creates `backend/.env` from `backend/.env.example` when missing, generates the Prisma client, and initializes the SQLite schema with `prisma db push`.

2. Optional: add a Google Books API key in `backend/.env`:

```bash
GOOGLE_BOOKS_API_KEY=your_key_here
```

The app can search Google Books without a key for local development, but a key gives you higher quota and fewer rate-limit surprises.

3. Start the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

The frontend uses hash routing, so the main views are available at:

- `#/`
- `#/search`
- `#/library`
- `#/books/:id`

## Verification

- Run backend API regression tests:

```bash
npm test
```

- Run the responsive browser smoke test:

```bash
npm run smoke:responsive
```

## API Surface

- `GET /api/health`
- `GET /api/search/books?q=`
- `GET /api/books`
- `GET /api/books/:id`
- `POST /api/books`
- `PATCH /api/books/:id`
- `DELETE /api/books/:id`

## Notes

- The app rejects duplicate saved books by the same external source and external id.
- Local authors are stored as a delimited string in SQLite and exposed as arrays in API responses to keep the MVP simple.
- Search responses keep the same frontend-facing shape: `externalSource`, `externalId`, `title`, `authors`, `publishedYear`, `isbn`, `coverUrl`.
- Wishlist now lives inside the Library view as a first-class status section instead of a detached standalone area.
