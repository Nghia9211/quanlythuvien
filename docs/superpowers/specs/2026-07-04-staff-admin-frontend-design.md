# Staff/Admin Frontend Design

## Context

The backend implements the library use cases behind a NestJS API under `/api`, but the `frontend` directory currently contains only Docker and Nginx configuration. This iteration creates the first usable staff console and preserves the dependency direction described by the layered architecture diagram.

## Goals

- Build a desktop-first staff/admin console with a business-oriented sidebar.
- Deliver login, operational dashboard, reader management, circulation, and reservation workflows.
- Keep domain logic, application use cases, infrastructure adapters, and presentation code separate.
- Integrate with the existing API rather than duplicating backend business rules.
- Include automated tests for the primary success and failure flows.

The first iteration does not implement the remaining catalog, inventory, billing, backup, or administration screens. The structure must allow those modules to be added without reorganizing the application.

## Chosen Approach

Use React, Vite, and TypeScript with explicit layered modules. React Router handles navigation. Authentication uses React Context because it is cross-cutting UI state; no general-purpose state store is introduced. Asynchronous page state remains local to presentation hooks and components.

This approach was selected over direct API calls from feature components because it keeps the dependency boundary testable. Next.js was rejected because server rendering and a second server-side application layer provide no useful benefit for this internal console.

## Dependency Rules

Dependencies point from outer layers toward inner layers:

1. `domain` contains models, value types, and UI-relevant pure rules. It imports no outer layer.
2. `application` contains use cases and gateway interfaces. It may import `domain` only.
3. `infrastructure` implements application gateways using HTTP. It may import `application` and `domain`.
4. `presentation` contains React routes, pages, components, and UI state. It may call application use cases and consume domain models, but it must not import HTTP adapters directly.
5. `composition` is the application boundary that constructs adapters and use cases and exposes them to presentation.

An automated architecture test will reject forbidden imports between these directories.

## Project Structure

```text
frontend/src/
  domain/
    auth/
    readers/
    circulation/
    reservations/
    reporting/
  application/
    ports/
    use-cases/
  infrastructure/
    http/
    adapters/
    auth/
  presentation/
    app/
    components/
    layouts/
    pages/
    hooks/
    styles/
  composition/
```

Files remain grouped by responsibility and use case rather than accumulating logic in large page components.

## Screens and Components

The visual direction is option A: a business-oriented left sidebar, a compact user header, and a content workspace.

- `/login`: username/password login with validation and visible authentication errors.
- `/dashboard`: operational report summary and recent operational data available from `/api/reports/operations`.
- `/readers`: register a reader, look up a reader by ID, view and edit the profile, renew the card, and lock or unlock it. The current backend has no reader search/list endpoint, so this iteration explicitly uses direct ID lookup rather than presenting a non-functional global list.
- `/circulation`: borrow and return tabs, plus lookup of a reader's current loans.
- `/reservations`: lookup reservations by reader ID, cancel a reservation with the staff reason required by the API, and trigger title/branch allocation. Creating a reservation remains a reader-only API action and is therefore not shown in the staff console.

Shared presentation components include `AppShell`, `Sidebar`, `UserHeader`, `DataTable`, `FormField`, `StatusBadge`, `ConfirmDialog`, `Toast`, and `EmptyState`. Shared components contain no business decisions.

Staff and admin accounts use the same shell. Navigation and actions are filtered using the role and permissions returned by `/api/auth/me`. The layout prioritizes laptop/desktop use and remains usable at tablet widths; phone-specific optimization is outside this iteration.

## Data Flow

The normal request flow is:

```text
Page or component
  -> application use case
  -> gateway interface
  -> HTTP adapter
  -> NestJS API
```

HTTP adapters unwrap the backend response envelope and map transport DTOs to frontend domain models. Pages never know endpoint URLs or call `fetch` directly. Mutations disable duplicate submission and refresh the affected query after success. Borrow, return, reservation, and reader state are not updated optimistically because server-side eligibility and concurrency checks are authoritative.

## Authentication

Login calls `/api/auth/login`, persists the returned access and refresh tokens, then loads `/api/auth/me`. The HTTP client attaches the access token to protected requests. On the first `401`, it performs one coordinated `/api/auth/refresh` attempt and retries the original request. If refresh fails, it clears the local session and redirects to `/login`. Logout calls `/api/auth/logout`, clears the session even if the network request fails, and returns to login.

Protected routes wait for session restoration before rendering so that page content does not flash before redirecting. Token handling is isolated behind an application port and infrastructure implementation.

## Error and Loading Behavior

- Client validation errors appear beside the relevant field.
- Backend validation and business errors remain visible on the active form without clearing entered values.
- `403` produces a permission message; controls known to be forbidden are hidden or disabled from the start.
- `404` produces an empty/not-found state appropriate to the lookup.
- Network and unexpected server failures produce a toast and allow retry.
- Every async screen has explicit initial, loading, empty, success, and failure states.
- Submit actions remain disabled while in flight to prevent duplicate commands.

## Testing Strategy

Vitest and Testing Library provide the test runner and React integration tests.

- Domain tests cover pure formatting and status/eligibility presentation rules introduced by the frontend.
- Application tests use gateway fakes and cover success, validation failure, and propagated business errors.
- HTTP adapter tests verify method, URL, payload, response-envelope mapping, bearer token attachment, one-time refresh, request retry, and session clearing after refresh failure.
- Component/integration tests cover login success and failure, reader lookup and update, borrow and return, reservation lookup and cancellation, protected-route redirects, loading states, and visible business errors.
- The architecture test verifies dependency direction.
- Verification runs type checking, the complete test suite, and a production Vite build.

## Acceptance Criteria

- A staff/admin user can sign in, restore a session, navigate with the sidebar, and log out.
- Dashboard data is loaded from the existing operational report API.
- Reader registration, direct lookup, profile update, card renewal, lock, and unlock work against the existing membership endpoints.
- Borrow, return, and reader-loan lookup work against the circulation endpoints.
- Reservation lookup, cancellation, and allocation work against the reservation endpoints.
- Loading, empty, success, validation, authorization, business-error, and network-error states are represented.
- Presentation has no direct dependency on infrastructure, and inner layers do not import outer layers.
- Type checking, automated tests, and the production build pass.
