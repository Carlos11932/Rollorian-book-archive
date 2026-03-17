# Rollorian Book Archive - Product Brief

## Source

- Original planning prompt preserved in GitHub issue `#1` (`configuracion inicial`)
- This file is the local, versioned source of truth for the MVP brief

## Product Summary

Rollorian Book Archive is a full-stack personal library app that lets a single user discover books from a public API and curate a local collection with personal status and notes.

The project should live inside one repository and be easy to run locally, understand quickly, and extend in future iterations.

## MVP Goals

- Search books from a public API, using Google Books for the current MVP
- Show useful external metadata such as title, authors, cover, publication year, and ISBN when available
- Add selected external books into a local collection stored by the project
- Manage a personal collection with statuses `wishlist`, `to_read`, `reading`, and `read`
- Search and filter the local collection
- Edit status and personal notes for saved books
- Remove books from the local collection

## Non-Goals

- Authentication
- Multi-user support
- Cloud sync
- Deployment setup
- Microservices
- Native mobile apps

## Required Stack

- JavaScript across the project
- Frontend: HTML, CSS, JavaScript vanilla
- Backend: Node.js + Express
- ORM: Prisma
- Database: SQLite
- External books API: Google Books via backend-managed configuration

## Architecture Constraints

1. Frontend and backend must live in the same repository.
2. The frontend must not call the external books provider directly.
3. The frontend must not access the database directly.
4. The backend is the only layer allowed to:
   - call the external books API
   - normalize external data
   - persist local collection data
5. Route handlers should stay thin and delegate business logic.
6. Google Books integration should not live inside route handlers.
7. Avoid unnecessary abstractions; do not force a repository layer if Prisma already covers the need.
8. Keep the MVP simple and maintainable.

## Expected User Flows

### Search and save a book

1. The user searches by title, author, or ISBN.
2. The frontend sends the query to the backend.
3. The backend queries Google Books.
4. The backend normalizes results to the app format.
5. The frontend renders the results.
6. The user adds one result to the local collection.
7. The backend saves it in SQLite through Prisma.

### Manage local collection

1. The user opens the collection view.
2. The frontend fetches local books from the backend.
3. The user filters by status or searches by title.
4. The user updates a book status or notes.
5. The backend persists the change.
6. The user can also remove a book from the collection.

## Minimum Book Data Model

Each saved book should support at least:

- local id
- externalSource
- externalId
- title
- authors
- publishedYear
- isbn
- coverUrl
- status
- notes
- createdAt
- updatedAt

## Minimum API Surface

- `GET /api/health`
- `GET /api/search/books?q=`
- `GET /api/books`
- `POST /api/books`
- `PATCH /api/books/:id`
- `DELETE /api/books/:id`

## UI Expectations

- Responsive layout for desktop and mobile
- Clean and functional presentation over visual excess
- Vanilla JS SPA-like behavior without frontend frameworks

## Delivery Priorities

1. Clear architecture
2. Small, coherent MVP scope
3. Good base for later iterations
4. Clean backend boundaries
5. Solid but lightweight UI
