# Rollorian Book Archive

Rollorian Book Archive is a small full-stack personal library app. It lets one user search books through Google Books via a local Express backend and curate a local collection stored in SQLite with Prisma.

## Stack

- Frontend: HTML, CSS, and vanilla JavaScript
- Backend: Node.js + Express
- Persistence: Prisma + SQLite
- External source: Google Books through the backend only

## Architecture Summary

- `frontend/` contains the static SPA-like interface.
- `backend/` contains the Express API, Google Books integration, business services, and Prisma setup.
- The browser talks only to the local backend.
- Route handlers stay thin and delegate work to feature services.

## Data Flow

1. The user searches from the frontend.
2. The frontend calls `GET /api/search/books?q=` on the local backend.
3. The backend calls Google Books, normalizes the response, and returns a stable payload.
4. The user saves a book through `POST /api/books`.
5. Prisma persists the local collection in SQLite.
6. The frontend reads and manages saved books through the `/api/books` endpoints.

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
- `POST /api/books`
- `PATCH /api/books/:id`
- `DELETE /api/books/:id`

## Notes

- The app rejects duplicate saved books by the same external source and external id.
- Local authors are stored as a delimited string in SQLite and exposed as arrays in API responses to keep the MVP simple.
- Search responses keep the same frontend-facing shape: `externalSource`, `externalId`, `title`, `authors`, `publishedYear`, `isbn`, `coverUrl`.
