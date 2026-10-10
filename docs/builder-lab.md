# Builder lab: reproduce and extend the patterns

[Back to the builder guide](README.md)

Start with offline exercises, then use the [two-wallet demo](demo.md) for integration. The snippets below target the repository's locked packages. They are learning material, not a new published API.

## Exercise 1: round-trip a transaction envelope offline

From `frontend/`, create `src/utils/builderLab.test.ts` with the following code, then run `npm test -- src/utils/builderLab.test.ts`. This synthetic transaction has no funded inputs; it demonstrates encoding only and must not be broadcast or treated as a spendable payment.

```ts
import { expect, it } from 'vitest'
import { LockingScript, Transaction } from '@bsv/sdk'
import { normalizePaymentTransaction } from './paymentTransaction'

it('preserves the subject transaction across legacy and JSON byte formats', () => {
  const tx = new Transaction()
  tx.addOutput({ satoshis: 1, lockingScript: LockingScript.fromHex('51') })

  const atomic = tx.toAtomicBEEF()
  const transported = JSON.parse(JSON.stringify(new Uint8Array(atomic)))
  const recovered = normalizePaymentTransaction(transported)
  expect(recovered.format).toBe('atomic')
  expect(recovered.transaction).toEqual(atomic)

  const upgraded = normalizePaymentTransaction(tx.toBEEF())
  expect(upgraded.format).toBe('legacy-converted')
  expect(Transaction.fromAtomicBEEF(upgraded.transaction).id('hex'))
    .toBe(tx.id('hex'))
})
```

Explain why `as number[]` would not recover the JSON object and why parsing proves less than wallet acceptance. Compare the exercise with [the existing regression suite](../frontend/src/utils/paymentCompatibility.test.ts), which also covers invalid byte shapes and unrelated transaction branches. Remove your scratch test when finished unless turning it into a distinct contribution.

## Exercise 2: trace identity without sending

Run the app with a dedicated wallet and complete [the identity demonstration](demo.md#part-1-show-what-identity-means). Follow a `DisplayableIdentity` from `IdentitySearchField` into `PaymentForm`'s `recipient` state. Then select the same key using a local alias and QR.

Answer these questions from the observed UI and source:

1. Which field is ultimately passed as `recipient` to the payment client?
2. Is the selected name a certified attribute, local alias, or scanner-generated label?
3. Which certifier made the claim, and where does the wallet's trust policy enter?
4. Does a public-search error look different from no matching identity in the locked component?
5. Does changing wallet software also change the SDK bundled into this application?

Expected lesson: presentation and discovery help select an identity, while payment addressing uses the key. Record unavailable discovery separately rather than treating contact selection as equivalent evidence.

## Exercise 3: compose a small payment integration

The following browser-side excerpt uses the app's existing shared client. Put it in a module under `frontend/src/` if experimenting. It **defines** operations; call `sendToSelectedRecipient` only from an explicit user action with an independently confirmed recipient. Calling it can spend real funds.

```ts
import { PublicKey, type DisplayableIdentity } from '@bsv/sdk'
import type { IncomingPayment } from '@bsv/message-box-client'
import { peerPayClient } from './utils/peerPayClient'
import { acceptIncomingPayment } from './utils/paymentCompatibility'

export async function sendToSelectedRecipient(
  identity: DisplayableIdentity,
  sats: number
): Promise<void> {
  const recipient = identity.identityKey.trim()
  if (!/^(02|03)[0-9a-fA-F]{64}$/.test(recipient)) {
    throw new Error('A compressed identity public key is required.')
  }
  if (!PublicKey.fromString(recipient).validate()) {
    throw new Error('The identity public key is not a valid curve point.')
  }
  if (!Number.isSafeInteger(sats) || sats <= 0) {
    throw new Error('Enter positive whole satoshis.')
  }
  await peerPayClient.sendLivePayment({ recipient, amount: sats })
}

export async function acceptSelectedPayment(payment: IncomingPayment) {
  return await acceptIncomingPayment(payment)
}
```

Keep the UI's busy/error state and remove an inbox row only after acceptance succeeds. This example adds explicit public-key validation beyond the current form's length check; validation still does not prove the selected person is the intended recipient. The app's existing wrappers remain necessary even if the happy-path library call fits on one line.

For reusable components, introduce a small typed service or React context carrying payment and identity dependencies. Initialize it once per wallet session, define listener disposal, and test wallet switching. The existing app uses a module singleton and independently constructed identity clients; replacing only one of those paths is incomplete dependency injection.

## Exercise 4: design a useful extension

These are suggested projects, not implemented features.

| Extension | Starting point | Acceptance criteria |
| --- | --- | --- |
| Explain identity provenance | `PaymentForm`, identity result/card presentation | Distinguish local alias from certified claim; retain full-key inspection and certifier context. |
| Add “Show my identity QR” | Wallet `getPublicKey({ identityKey: true })`, `generateIdentityQR` | Display only the current public identity; scan it with a second device and compare keys; never expose private key material. |
| Improve identity error recovery | Identity search integration | Distinguish empty results, denied contacts, and unavailable discovery; preserve usable results without hiding failures. |
| Add durable payment activity | `handlePaymentSent`, accept/reject adapters | Model creation/delivery/internalization/acknowledgement separately and reconcile with wallet records after reload. |
| Add an explicit environment profile | Client, identity, telemetry, deployment configuration | Wallet network and every service agree; local mode cannot silently use production defaults. |
| Improve inbox concurrency | Initial fetch, live listener, row/bulk processing | Delayed fetch cannot erase newer events; duplicate delivery and remounts do not multiply effects; operations serialize appropriately. |

Preserve integer amounts, transaction validation, and truthful outcome labels while extending the UI. Run the focused tests and [full validation commands](development.md#dependencies-and-validation), then qualify the actual wallet/browser combination. UI mocks teach state transitions; they do not prove a funded payment succeeds.
