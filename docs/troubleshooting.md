# Troubleshooting by boundary

[Back to the builder guide](README.md)

First identify the last confirmed milestone: page load, wallet access, identity selection, transaction creation, delivery, internalization, or acknowledgement. A later error does not undo earlier completed work.

| Symptom | What to check | Useful source |
| --- | --- | --- |
| `npm start` launches unexpected tooling | You are probably in the root project. Run `cd frontend` and `npm run dev` for Vite. | [Package/script guide](development.md) |
| Engine/install/build errors | Node 22.12+ in the Node 22 line, correct directory, and `npm ci` against the committed lockfile. | [frontend/package.json](../frontend/package.json) |
| Port 5173 unavailable | Stop the process you own on that port or explicitly choose another port; use the resulting origin with the wallet. | [vite.config.mjs](../frontend/vite.config.mjs) |
| Page loads but wallet operations fail | Wallet unlocked and funded, bridge reachable from this browser/WebView, correct origin permissions and network. | [peerPayClient.ts](../frontend/src/utils/peerPayClient.ts) |
| Identity search shows no results | Check wallet discovery/trust settings, contact permissions, and service errors. This locked search component can render failures as empty results. | [Identity guide](concepts/identity-and-contacts.md) |
| A saved nickname is not found in public search | Use Select Contact's local filter. The nickname is not automatically a public certified attribute; the locked `any` query has contact-matching limits. | [ContactSelector.tsx](../frontend/src/components/ContactSelector.tsx) |
| Contact save/delete fails | Wallet basket/crypto/action permissions, funding for applicable actions, and storage availability. Contacts are not plain localStorage. | [ContactModal.tsx](../frontend/src/components/ContactModal.tsx) |
| Contact changes are not immediately visible | Separate identity-client caches and component lifetimes can differ. Close/reopen the modal or reload, then re-read wallet-backed state before writing again. | [Architecture](architecture.md) |
| Avatar missing but key is visible | Image URL/UHRP host availability and which component renders the image. Confirm the key independently. | [Identity media](concepts/identity-and-contacts.md#uhrp-identity-media-without-one-permanent-storage-url) |
| Camera blocked/unavailable | HTTPS or localhost, camera permission, camera not held by another app, and WebView support. Use contact entry while diagnosing camera support. | [QRScanner.tsx](../frontend/src/components/QRScanner.tsx) |
| QR does not select the intended identity | Use the recipient's identity-key QR, not an unrelated address/invoice QR. Compare the full public key. Extraction is not identity verification. | [QR explanation](concepts/identity-and-contacts.md#qr-is-a-transport-for-a-key) |
| Amount rejected | Enter digits representing positive whole sats, within JavaScript's safe-integer range. No decimal BSV, currency symbol, commas, or exponent notation. | [SatoshiInput.tsx](../frontend/src/components/SatoshiInput.tsx) |
| Send reports failure | Inspect the sender wallet before resending; creation may have succeeded before delivery failed. Then inspect recipient host/queue and permissions. | [Payment milestones](concepts/wallets-and-payments.md#creation-delivery-acceptance-acknowledgement) |
| No live incoming row | Check receiver identity, Message Box host/routing and connection; reload to inspect queued inbox delivery. Record whether live or delayed delivery passed. | [Messaging guide](concepts/messaging-and-overlays.md) |
| Invalid transaction-format error | Capture only the format category/version for a report. The app accepts supported byte shapes and AtomicBEEF/convertible legacy BEEF, not arbitrary raw transaction/hex input. | [Transaction guide](concepts/transactions-and-bytes.md) |
| Accept fails or a row returns | Check wallet receipt/internalization and queue acknowledgement separately before retrying. The row can remain after a later-stage failure. | [paymentCompatibility.ts](../frontend/src/utils/paymentCompatibility.ts) |
| Reject did not return the full amount | Review the under-2,000-sat no-refund branch and 1,000-sat deduction; inspect both wallets for partial completion. | [Rejection policy](concepts/wallets-and-payments.md#reject-is-a-policy-not-an-undo) |
| Recent sends disappear after reload | Expected: only five entries in React memory. Use wallet records for durable history. | [App.tsx](../frontend/src/App.tsx) |
| No sound or telemetry endpoint unavailable | These are secondary effects. Check payment state independently; blocked audio or reporting is not proof of a failed payment. | [Reliability guide](concepts/browser-reliability.md) |

## Report a useful issue

Include the app commit/version, wallet/browser/device versions, network, action, expected result, actual result, and last confirmed milestone. Distinguish a public-discovery failure from local contact lookup, and message delivery from wallet acceptance. State whether the problem survives reload without repeating a financial action.

Share sanitized error text and dependency versions. Keep identity keys, contact details, message IDs, transaction/BEEF payloads, wallet responses, and credentials out of public logs/screenshots. Do not clear wallet state or manually acknowledge pending payments as a generic troubleshooting step.
