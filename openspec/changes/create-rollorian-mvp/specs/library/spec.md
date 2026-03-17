# Delta for Library

## ADDED Requirements

### Requirement: Search External Books

The system SHALL allow the user to search books from a public external books source by title, author, or ISBN.

#### Scenario: Search by free-text query

- GIVEN the user enters a valid query
- WHEN the search is submitted
- THEN the frontend sends the query to the local backend
- AND the backend returns normalized external book results
- AND the user sees those results in the application

#### Scenario: Empty query is rejected

- GIVEN the user has not entered a meaningful query
- WHEN the search is submitted
- THEN the system rejects the request gracefully
- AND the user is informed that a valid query is required

### Requirement: Display Normalized External Results

The system SHALL present external search results using a stable internal format, even when the external provider returns partial data.

#### Scenario: Partial external data

- GIVEN the external provider omits one or more optional fields such as cover, ISBN, authors, or publication year
- WHEN the backend normalizes the result
- THEN the application still returns a valid result object
- AND the frontend can render the result without breaking

### Requirement: Save A Book To The Local Collection

The system SHALL allow the user to add a selected external book result into a local persisted collection.

#### Scenario: Add book from search results

- GIVEN the user is viewing external search results
- WHEN the user chooses to save a book
- THEN the frontend sends the selected book payload to the backend
- AND the backend persists the book in the local database
- AND the saved book becomes available in the local collection view

### Requirement: View The Local Collection

The system SHALL allow the user to view all books stored in the local collection.

#### Scenario: Load collection

- GIVEN one or more books exist in local storage
- WHEN the user opens or refreshes the collection view
- THEN the frontend requests local books from the backend
- AND the backend returns the saved collection entries
- AND the frontend renders them to the user

### Requirement: Filter And Search The Local Collection

The system SHALL allow the user to narrow the local collection by status and title.

#### Scenario: Filter by status

- GIVEN the local collection contains books in multiple statuses
- WHEN the user selects a status filter
- THEN only books matching that status are shown

#### Scenario: Search by title in local collection

- GIVEN the local collection contains one or more books
- WHEN the user searches by title
- THEN the system returns only local books matching the title query

### Requirement: Update Saved Book Metadata

The system SHALL allow the user to update mutable personal metadata for a saved book.

#### Scenario: Update status and notes

- GIVEN a book already exists in the local collection
- WHEN the user changes its status or notes
- THEN the backend persists the changes
- AND the updated values are visible in the collection view

### Requirement: Remove A Saved Book

The system SHALL allow the user to delete a saved book from the local collection.

#### Scenario: Delete saved book

- GIVEN a book exists in the local collection
- WHEN the user requests deletion
- THEN the backend removes the book from the local database
- AND the deleted book no longer appears in the collection view

### Requirement: Keep External Integration Behind The Backend

The system SHALL isolate external API access behind the backend boundary.

#### Scenario: Browser does not call the external provider directly

- GIVEN the user interacts with the search UI
- WHEN the application performs a search
- THEN the browser calls only the local backend
- AND the backend is responsible for calling the external provider
