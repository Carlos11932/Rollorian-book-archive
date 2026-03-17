# Design: Create Rollorian Book Archive MVP

## Overview

Rollorian Book Archive will be implemented as a single repository containing:

- a static frontend written in HTML, CSS, and JavaScript vanilla
- a Node.js backend with Express
- a SQLite database managed through Prisma

The backend acts as the only integration boundary for both external book search and local persistence.

## Repository Layout

```text
Rollorian-book-archive/
  docs/
    product-brief.md
  frontend/
    index.html
    styles/
    js/
      app/
      features/
      shared/
  backend/
    src/
      app.js
      server.js
      routes/
      services/
      lib/
      features/
    prisma/
      schema.prisma
    data/
  openspec/
  README.md
```

## Architecture

### Frontend

- Framework-free SPA-like experience
- Uses fetch to call only local backend endpoints
- Organized into app bootstrap code, feature modules, and shared utilities
- Renders two main concerns:
  - external search results
  - local collection management

### Backend

- Express app with thin route handlers
- Service layer for:
  - Open Library search integration
  - normalization of external payloads
  - book collection business rules
- Prisma client for persistence
- Optional static file serving from the backend to keep local startup simple

### Persistence

- SQLite for local development simplicity
- Prisma schema defines the local `Book` model
- Prisma migrations manage schema changes over time

## Data Model

Initial `Book` fields:

- `id`
- `externalSource`
- `externalId`
- `title`
- `authors`
- `publishedYear`
- `isbn`
- `coverUrl`
- `status`
- `notes`
- `createdAt`
- `updatedAt`

### Status Values

- `wishlist`
- `to_read`
- `reading`
- `read`

## API Design

### Health

- `GET /api/health`
  - returns a simple service status payload

### External Search

- `GET /api/search/books?q=`
  - validates the query
  - queries Open Library
  - normalizes results into a stable response shape

### Local Collection

- `GET /api/books`
  - optionally accepts `status` and `q` query filters
  - returns local collection entries sorted predictably

- `POST /api/books`
  - accepts a normalized external result or equivalent app payload
  - prevents malformed inserts
  - persists a local book record

- `PATCH /api/books/:id`
  - updates mutable fields, initially `status` and `notes`

- `DELETE /api/books/:id`
  - deletes a local collection entry by id

## External Data Normalization

Open Library can omit authors, cover images, ISBNs, or years. The backend should convert raw results into a stable app-level contract with safe fallbacks:

- missing authors -> empty array or display fallback
- missing cover -> null `coverUrl`
- missing year -> null `publishedYear`
- missing ISBN -> null `isbn`

Normalization happens before data reaches the frontend and before any record is saved locally.

## Error Handling

- Return clear JSON error payloads from the backend
- Handle empty search queries with validation responses
- Gracefully handle upstream API failures and timeouts
- Keep frontend rendering resilient when data is partial

## Key Technical Decisions

1. Use Express instead of raw Node HTTP to keep routing simple and maintainable.
2. Use Prisma instead of handwritten SQL for faster iteration and clearer schema management.
3. Keep the frontend framework-free to stay aligned with the project constraints.
4. Keep the browser isolated from Open Library so API shape and persistence rules stay centralized.

## Risks

- External API payload drift could break assumptions if normalization is too brittle.
- Without careful module boundaries, vanilla frontend code could become hard to evolve.
- Duplicate book handling needs a deliberate policy during implementation.

## Open Questions To Resolve During Implementation

- Whether duplicate `externalId` values should be rejected or merged
- Whether `authors` should be stored as a JSON string, delimited string, or related table for the MVP
- Whether the backend should fully serve the frontend in development or only in production mode
