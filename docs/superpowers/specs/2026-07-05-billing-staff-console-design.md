# Billing Staff Console Design (UC014–UC015)

## Scope

Add a small staff-facing billing workspace for assessing the current state of a reader's fines and recording payment. Fine calculation remains part of the return workflow and backend UC014; this slice exposes the resulting fines and completes UC015 through cash or simulated online payment. It does not add a real payment provider, refunds, partial payments, exports, or reader self-service.

## Architecture

The frontend follows the existing layered structure and dependency direction:

- `domain/billing.ts` defines fine and payment values without framework dependencies.
- `application/ports/billing.gateway.ts` describes the billing operations required by the UI.
- `application/use-cases/billing.use-cases.ts` validates and normalizes commands, then delegates through the port.
- `infrastructure/adapters/http-billing.gateway.ts` maps the port to the existing backend HTTP API.
- `presentation/pages/billing-page.tsx` owns transient UI state and renders reusable presentation components.
- The composition root constructs the adapter and use cases; presentation never imports infrastructure.

The existing frontend architecture test continues to enforce these boundaries.

## Backend Contract

The frontend consumes the existing staff-protected endpoints:

- `GET /api/fines/readers/:readerId` lists a reader's fines.
- `POST /api/payments` creates a cash or online payment from unique fine IDs.
- `POST /api/payments/:id/simulate` resolves an online payment as `SUCCEEDED` or `FAILED`.
- `GET /api/payments/readers/:readerId` lists a reader's payment history.

No amount is calculated in the browser. The backend validates fine ownership, availability, totals, payment method, and state transitions.

## User Experience

Add a `Phí phạt` sidebar item and protected `/billing` route. The page starts with a reader-ID lookup shared by two tabs:

1. `Khoản phạt` shows reason, amount, status, and creation date. Only unpaid fines not reserved by another payment can be selected. Staff may select one or more fines and record a cash or online payment.
2. `Lịch sử thanh toán` shows total, method, status, creation time, and completion time.

A cash payment completes immediately. An online payment is initially `PENDING`; staff can use explicit `Thành công` and `Thất bại` controls to exercise the existing simulated adapter. After every mutation, both fines and payments are reloaded so the backend remains the source of truth.

Inputs and submit controls are disabled while a request is active. Success and failure feedback uses the existing toast component. Empty results are shown explicitly rather than leaving a blank table.

## Application Rules

- Reader IDs are trimmed and must not be empty.
- Payment commands require at least one unique fine ID.
- Only `CASH` and `ONLINE` are accepted as payment methods.
- Only `SUCCEEDED` and `FAILED` are accepted simulation results.
- The UI clears stale selections after a successful payment or reader change.
- Currency is formatted as Vietnamese đồng for display only.

## Error Handling

Gateway errors flow through the existing HTTP client error mapping. The page catches them, displays a readable toast, and preserves the current lookup result when safe. Mutation controls use a single pending state to prevent duplicate submission. A failed online simulation reloads data so released fines become selectable again.

## Testing

- Use-case unit tests cover reader-ID normalization, empty/duplicate fine rejection, payment method validation, and simulation-result validation.
- HTTP adapter tests verify paths, methods, and payloads for all four operations.
- Page tests cover lookup, multi-fine cash payment, online pending-to-success/failure simulation, and payment-history rendering.
- Existing architecture tests must remain green.
- Completion requires frontend typecheck, unit tests, production build, backend tests/build, and a browser smoke test of the billing route.

## Acceptance Criteria

- Staff can load a reader's fines and payment history.
- Staff can select eligible fines and complete a cash payment.
- Staff can create an online payment and simulate success or failure without external credentials.
- Fine and payment statuses refresh after every mutation.
- Dependencies obey the repository's layered architecture and all verification commands pass.
