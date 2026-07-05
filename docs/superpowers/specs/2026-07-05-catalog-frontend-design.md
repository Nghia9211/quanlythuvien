# Catalog Staff Console Design

## Context

The backend already supports UC002 catalog search and UC005–UC006 catalog mutations. The staff frontend currently covers authentication, dashboard, readers, circulation, and reservations, but has no Catalog workspace. Existing management APIs can create and update records but cannot list branches, shelves, or copies, which would force staff to enter UUIDs without context.

## Goals

- Add a Catalog workspace to the existing staff console.
- Support public-style catalog search with branch filtering and pagination.
- Support staff creation and updates for titles and copies, plus creation of branches and shelves.
- Add the minimum backend read APIs required for usable selectors and copy management.
- Preserve the established domain/application/infrastructure/presentation dependency direction.
- Cover the new backend and frontend behavior with automated tests.

Inventory counting, lifecycle status changes, bulk imports, deletions, and a general-purpose CRUD framework are outside this iteration.

## Chosen Approach

Use one `/catalog` workspace with four tabs: Search, Titles, Copies, and Branches & Shelves. This matches the existing staff console and keeps navigation compact. Separate entity routes would add routing and shell complexity without improving the current workflows. A metadata-driven CRUD engine is rejected because catalog validation and relationships need explicit typed forms.

## Backend Read APIs

Add framework-free application queries and TypeORM implementations for:

- `GET /api/catalog/branches`: list branches ordered by code.
- `GET /api/catalog/branches/:branchId/shelves`: list shelves for one branch ordered by code.
- `GET /api/catalog/titles/:bookTitleId/copies`: list copies for one title ordered by barcode.

These routes require a staff role. The existing `GET /api/catalog` search remains public. Read responses use the global response envelope and expose existing domain snapshots only; they introduce no new persistence tables or migrations.

The branch view contains `id`, `code`, `name`, and `address`. The shelf view contains `id`, `branchId`, `code`, and `label`. The copy view contains `id`, `bookTitleId`, `barcode`, `rfid`, `branchId`, `shelfLocationId`, and `status`.

## Frontend Architecture

Extend the existing layers rather than creating a parallel feature structure:

- `domain/catalog.ts` defines search results, pagination metadata, title, branch, shelf, and copy models plus typed inputs.
- Application ports expose search, list, create, and update operations. Application use cases normalize search text, comma/newline lists, codes, barcodes, and optional values; they validate page bounds and UUID relationships before calling gateways.
- The infrastructure adapter maps the existing and new `/catalog` endpoints, unwraps data, and retains pagination `meta` from the response envelope.
- Composition constructs catalog use cases and adds them to `AppServices`.
- Presentation adds a Catalog sidebar entry, route, page, explicit forms, tables, status badges, and pagination controls.

The architecture test continues to prohibit presentation-to-infrastructure imports and inward-to-outward dependencies.

## Workspace Behavior

### Search

The Search tab contains query, optional branch, and page-size controls. Results show title, ISBN, authors, subjects, publisher, and availability per branch. Previous/next controls use server pagination. Selecting a result makes it the active title for the Titles and Copies tabs.

### Titles

Staff can create a title with title, optional ISBN/publisher, authors, and subjects. Authors and subjects accept comma- or newline-separated input and are normalized into non-empty unique arrays. A selected search result can be edited without a separate title-detail endpoint because the search response contains every editable title field.

### Copies

The tab requires an active title selected from search. It loads copies with `GET /catalog/titles/:id/copies`. Staff can create a copy by choosing a loaded branch and shelf, then entering barcode and optional RFID. A selected copy can update barcode, RFID, branch, and shelf. Changing branch clears an incompatible shelf selection.

### Branches & Shelves

Staff can load and view branches, create a branch, select a branch, load its shelves, and create a shelf under it. Created records are inserted into the displayed list and become selectable immediately.

## Data Flow and State

The flow remains:

```text
CatalogPage -> application use case -> catalog gateway -> HTTP adapter -> NestJS API
```

Search state contains filter and pagination values. Management state contains branches, shelves for the selected branch, active title, and copies for the active title. Mutations are not optimistic: the server response replaces or inserts the affected model, and the relevant list is refreshed when relationship data may have changed.

Tab changes preserve entered search filters and the active title during the current page session. A full page reload restores authentication but not unfinished Catalog form data.

## Authorization and Errors

- Search remains available through the public backend route, but the current staff console route remains protected by frontend authentication.
- Management tabs and actions are available only to `STAFF` and `ADMIN` UI roles; backend guards remain authoritative.
- Client validation appears beside or above the active form without clearing input.
- `404` clears stale selections and prompts the user to reload related data.
- `409` displays duplicate ISBN, barcode, RFID, branch code, or shelf code messages.
- `403` explains that the account lacks management permission.
- Network and unexpected server errors display a retryable error state.
- Submit controls are disabled while commands are in flight.

## Testing

Backend tests cover query use cases, TypeORM read queries/order/filtering, controller routes, missing parent records, and role protection. Existing catalog mutation and search tests must remain green.

Frontend tests cover:

- Application validation and normalization.
- Adapter URL, query, payload, response data, and pagination metadata mapping.
- Search loading, results, branch filter, pagination, and active-title selection.
- Title create and update forms.
- Branch and shelf loading/creation.
- Copy loading, creation, update, and branch-to-shelf reset behavior.
- Error, empty, pending, success, and permission states.
- Sidebar route and architecture dependency rules.

Verification runs frontend typecheck/test/build and backend test/build. Browser smoke checks the Catalog route at desktop and tablet widths using a local mock API when no seeded staff account is available.

## Acceptance Criteria

- Staff can search catalog titles, filter by branch, paginate, and inspect branch availability.
- Staff can create and edit titles.
- Staff can list branches, list shelves for a selected branch, and create both.
- Staff can list copies for a selected title and create or edit a copy using branch/shelf selectors.
- No Catalog presentation file imports infrastructure directly.
- Existing staff-console workflows continue to work.
- All new and existing frontend/backend tests and builds pass.
