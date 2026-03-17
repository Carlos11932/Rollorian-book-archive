# Tasks

## 1. Project foundation

- [x] 1.1 Create the initial repository structure for `frontend/`, `backend/`, and shared project docs
- [x] 1.2 Add root and backend package configuration with local run scripts
- [x] 1.3 Add a README with startup instructions, architecture summary, and data flow overview

## 2. Backend bootstrap

- [x] 2.1 Create the Express app and server entrypoints
- [x] 2.2 Add a health endpoint and shared backend error handling pattern
- [x] 2.3 Configure Prisma with SQLite and create the first migration

## 3. External search feature

- [x] 3.1 Implement the Google Books client service
- [x] 3.2 Implement normalization for external search results
- [x] 3.3 Expose `GET /api/search/books?q=` with validation and error handling

## 4. Local collection feature

- [x] 4.1 Define the `Book` model in Prisma with the MVP fields
- [x] 4.2 Implement create and list collection operations
- [x] 4.3 Implement update operations for `status` and `notes`
- [x] 4.4 Implement delete operations for saved books
- [x] 4.5 Expose `GET /api/books`, `POST /api/books`, `PATCH /api/books/:id`, and `DELETE /api/books/:id`

## 5. Frontend shell

- [x] 5.1 Create the base HTML structure and responsive layout
- [x] 5.2 Add shared styling primitives and core UI sections
- [x] 5.3 Add frontend bootstrap code for loading, rendering, and API calls

## 6. Search UI

- [x] 6.1 Build the search form for title, author, or ISBN queries
- [x] 6.2 Render normalized search results with useful metadata and fallbacks
- [x] 6.3 Add the flow to save a selected result into the local collection

## 7. Collection UI

- [x] 7.1 Render the saved collection list
- [x] 7.2 Add title search and status filtering for local books
- [x] 7.3 Add editing for status and notes
- [x] 7.4 Add book deletion with immediate UI refresh

## 8. Validation and polish

- [x] 8.1 Verify the local end-to-end flow from external search to local persistence
- [x] 8.2 Validate responsive behavior for desktop and mobile widths
- [x] 8.3 Review naming, folder boundaries, and API contracts for MVP clarity
