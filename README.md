# Rollorian Book Archive

Rollorian Book Archive is a small full-stack personal library app. It lets one user search books through Open Library via a local Express backend and curate a local collection stored in SQLite with Prisma.

## Stack

- Frontend: HTML, CSS, and vanilla JavaScript
- Backend: Node.js + Express
- Persistence: Prisma + SQLite
- External source: Open Library through the backend only

## Architecture Summary

- `frontend/` contains the static SPA-like interface.
- `backend/` contains the Express API, Open Library integration, business services, and Prisma setup.
- The browser talks only to the local backend.
- Route handlers stay thin and delegate work to feature services.

## Data Flow

1. The user searches from the frontend.
2. The frontend calls `GET /api/search/books?q=` on the local backend.
3. The backend calls Open Library, normalizes the response, and returns a stable payload.
4. The user saves a book through `POST /api/books`.
5. Prisma persists the local collection in SQLite.
6. The frontend reads and manages saved books through the `/api/books` endpoints.

## Getting Started

1. Install backend dependencies:

```bash
npm install --prefix backend
```

2. Generate the Prisma client:

```bash
npm run db:generate
```

3. Create the local SQLite database and first migration:

```bash
npm run db:migrate -- --name init
```

4. Start the app:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

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
