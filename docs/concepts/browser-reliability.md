# Browser state, failure handling, and observability

[Back to concepts](../README.md)

## React orchestrates external state

[App.tsx](../../frontend/src/App.tsx) owns pending payments, recent sends, initial loading, and bulk-accept state. `PaymentForm` owns recipient/amount/send feedback. `PaymentList` owns a per-message processing map so an in-flight action disables its row controls. MUI and Emotion provide styled components; Sass supplies application layout, and Toastify displays outcomes.

The initial inbox request replaces the array. The live listener appends messages using functional state updates and checks `messageId` for duplicates. The effect's cleanup sets `isSubscribed = false` so late callbacks do not update the unmounted component. It does not explicitly disconnect the shared client or unregister its underlying listener.

These mechanisms make the small app understandable, but they do not solve every concurrency case. A full-list fetch can race a live event; separate tabs do not share processing state; and a row action already running when Accept All starts is not managed by one global operation coordinator. For an extension, design the reconciliation and subscription ownership explicitly.

## Partial failure is normal in a multi-service operation

Accept All processes the current list sequentially. Successful rows are removed as they complete; failed rows remain; the summary counts both. Sequential processing limits concurrent wallet prompts and avoids discarding successes because a later item failed. It is not an all-or-nothing batch.

The single-row path similarly removes a row only after its helper returns successfully. The wrapper rejects the client's string-shaped acceptance failures. The refund path checks acceptance before sending a refund, preventing a known failure sequence from sending a refund out of unrelated wallet funds.

The app has no durable operation journal. Sender creation, message transmission, receiver internalization, acknowledgement, and refund sending can fail between steps. A future receipt/history feature should distinguish those milestones and reconcile against wallet and service state. An in-memory boolean or a success toast is not a recovery protocol.

## Error boundaries and secondary effects

[ErrorBoundary.tsx](../../frontend/src/components/ErrorBoundary.tsx) renders a reload screen for React rendering failures and reports the component error. Global error and unhandled-rejection handlers supplement it. Async event-handler failures still need their own `try/catch` paths; an error boundary is not a substitute.

[sfx.ts](../../frontend/src/utils/sfx.ts) synthesizes quiet Web Audio cues, unlocks audio after interaction, and keeps playback failures out of payment success/failure handling. [QRScanner.tsx](../../frontend/src/components/QRScanner.tsx) handles camera permission, secure-context checks, rear-camera preference/fallback, startup timeouts, and stream cleanup. Test those paths on the actual browser/WebView used for a demo.

## What telemetry records

[telemetry.ts](../../frontend/src/utils/telemetry.ts) sends operational events to `https://usercom.babbage.systems/signals` with source `peerpay`. Events cover lifecycle/errors, inbox and payment outcomes, contacts, and QR activity. Release version comes from `frontend/package.json`.

| Field/policy | Current behavior |
| --- | --- |
| Browser identifiers | Generated persistent anonymous ID plus per-page session ID; these enable correlation and are not a promise of anonymity. |
| Page location | Origin and pathname; query and fragment are omitted from the event URL. |
| Context | Bounded depth/field/array sizes; sensitive key names are redacted. |
| Text | Redacts common long encoded/hex values, email patterns, query values, and local usernames. |
| Amounts | Payment events use ranges such as `100-999`, not exact values. |
| Queue | Up to 80 events in localStorage when available; batches of up to 20. |
| Delivery | Scheduled flush, 4-second request timeout, retries, and page-hide/visibility beacon attempts. |
| Error deduplication | Suppresses repeated matching error reports within 30 seconds. |

Telemetry is best effort. A queued/beacon event is not evidence that the server stored it. The error screen's statement that a report “was sent” should not be treated as delivery confirmation. The implementation has both a retry timer and normal follow-up flush scheduling; do not assume every retry waits the full configured 15 seconds.

## Privacy boundaries for builders

Keep event names and tags fixed and non-sensitive. Context sanitization does not make arbitrary custom event names, tags, or pathnames safe for personal data. Exact payment payloads, identity keys, certificates, and wallet responses should never be included in new telemetry calls.

Sanitization is heuristic, not a proof that every possible secret is removed. Browser console logging is separate from the telemetry sanitizer, and several failure paths log error objects. Review and redact logs before sharing them.

There is no runtime telemetry opt-out setting in this app. Local development initializes the same reporting path. A fork should deliberately review the endpoint, data policy, and any consent/disable controls before shipping. Offline unit tests are available without opening the live app.

## Transferable design lessons

Keep financially meaningful operations behind a small adapter with explicit result checks. Represent failed and completed steps independently. Treat messaging, wallet state, display state, and observability as different systems with different guarantees. Extend the [existing test suite](../../frontend/src/utils/paymentCompatibility.test.ts) at these boundaries, and use a real two-wallet session to qualify integration behavior.
