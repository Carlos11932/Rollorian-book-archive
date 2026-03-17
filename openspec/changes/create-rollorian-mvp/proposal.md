# Proposal: Create Rollorian Book Archive MVP

## Why

The project currently has no product structure, no implementation, and no shared source of truth for what the first version should do.

This change establishes a clear MVP for a personal library application that combines discovery from a public books API with a locally managed collection. The goal is to create a simple but extensible foundation that can later grow into a richer product without reworking the entire base.

## What Changes

- Introduce a full-stack app inside one repository
- Build a backend that searches Open Library and manages local persisted books
- Build a frontend in vanilla HTML, CSS, and JavaScript
- Persist the user collection in SQLite through Prisma
- Support the first collection lifecycle states: `wishlist`, `to_read`, `reading`, `read`
- Add search, filter, edit, and delete flows for the local collection

## Scope

### In scope

- Search external books by title, author, or ISBN
- Show normalized search results in the app UI
- Add an external result to the local collection
- View all saved books
- Search saved books by title
- Filter saved books by status
- Edit status and notes for a saved book
- Delete a saved book
- Keep frontend and backend in the same repo with a simple local run flow

### Out of scope

- Authentication and user accounts
- Multi-user support
- Cloud sync
- Deployment and hosting setup
- Advanced recommendation features
- Bulk import/export

## Approach

- Use a simple monorepo-style layout with `frontend/` and `backend/`
- Keep the frontend framework-free and consume only the local backend API
- Use Express for HTTP routing and Prisma with SQLite for persistence
- Normalize Open Library responses into a stable app-level shape before the frontend consumes them or the backend stores them
- Let the backend optionally serve the static frontend to simplify local development

## Risks And Trade-Offs

- Open Library data can be incomplete or inconsistent, so normalization and fallbacks are required
- Vanilla JS keeps the app lightweight, but structure must be deliberate to avoid frontend sprawl
- SQLite is ideal for the MVP, but future multi-user or hosted scenarios would likely require a different database

## Success Criteria

- A new developer can understand the product scope from the repo alone
- The app can run locally with a straightforward install and start flow
- The user can search external books and fully manage a local collection without touching external APIs directly from the browser
