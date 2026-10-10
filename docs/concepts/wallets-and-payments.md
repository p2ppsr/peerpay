# Wallets, identity-addressed outputs, and payment state

[Back to concepts](../README.md)

## BRC-100: ask the wallet to do the sensitive work

A wallet is a capability provider. The application requests actions; the wallet mediates permission and holds the keys. `WalletClient` exposes the interface to the browser application. The concrete transport and approval UI depend on the installed wallet/host environment.

PeerPay constructs one payment client in [peerPayClient.ts](../../frontend/src/utils/peerPayClient.ts):

```ts
import { WalletClient } from '@bsv/sdk'
import { PeerPayClient } from '@bsv/message-box-client'
import BabbageGo from '@babbage/go'
import { withPortableCreateActionResults } from './walletCompatibility'
import constants from './constants'

const wallet = new BabbageGo(
  withPortableCreateActionResults(new WalletClient()),
  { walletUnavailable: { title: 'Instant, secure payments.' } }
)

const client = new PeerPayClient({
  messageBoxHost: constants.messageboxURL,
  walletClient: wallet,
  enableLogging: false
})
```

This excerpt belongs in the same utility directory as the referenced imports. Prefer the existing exported singleton when changing this app. BabbageGo provides wallet-facing onboarding/availability handling; it does not make the browser a wallet. The portable-result adapter handles representation differences at `createAction`'s return boundary.

Through its libraries, the app relies on wallet public-key derivation, encryption/decryption, authentication, transaction creation, internalization, and contact storage operations. [BRC-100](https://github.com/bsv-blockchain/BRCs/blob/master/wallet/0100.md) specifies the interface. A wallet permission refusal should be handled as a failed operation, not worked around by embedding a private key in frontend code.

## An identity key is not the payment output key

The recipient's identity key is a compressed secp256k1 public key, commonly represented as 66 hexadecimal characters beginning with `02` or `03`. It identifies the counterparty. A BRC-29 payment derives an output key for that payment rather than repeatedly paying directly to the same identity key.

[BRC-42](https://github.com/bsv-blockchain/BRCs/blob/master/key-derivation/0042.md) defines counterparty key derivation. [BRC-43](https://github.com/bsv-blockchain/BRCs/blob/master/key-derivation/0043.md) scopes use with a protocol ID, key ID, and counterparty. These are contexts that both wallets must agree on, not arbitrary labels to rename in one app.

The locked Message Box client delegates to the SDK's `Brc29RemittanceModule`, with payment protocol ID `[2, '3241645161d8']`. It produces a P2PKH output and remittance metadata containing a derivation prefix and suffix. The recipient uses the sender identity and those instructions to derive the corresponding spending key through its wallet. The frontend does not receive that private key.

The transferable pattern is **stable identity for addressing, purpose-scoped derived keys for operations**. Reuse the remittance implementation instead of recreating cryptographic derivation in a React component. [BRC-29](https://github.com/bsv-blockchain/BRCs/blob/master/payments/0029.md) is the payment reference.

## Outputs and exact amounts

A transaction consumes earlier outputs and creates new outputs. An outpoint identifies one output by transaction ID and output index. The wallet handles inputs, fees, change, signing, and its broadcast policy; the app requests an amount to a counterparty.

PeerPay accepts positive safe-integer **satoshis**, not decimal BSV or fiat. [SatoshiInput.tsx](../../frontend/src/components/SatoshiInput.tsx) accepts digits only and checks `Number.isSafeInteger`. `PaymentForm` validates again before sending. Display uses locale grouping and rejects fractional, negative, or unsafe numbers. There is no exchange-rate dependency. For example, enter `100`, not `0.000001` or `1e2`.

Safe-integer validation prevents JavaScript precision loss; it does not establish available balance, fee sufficiency, or wallet policy approval.

## Creation, delivery, acceptance, acknowledgement

| Milestone | Actual path | What you know |
| --- | --- | --- |
| Create | `sendLivePayment` → remittance module → wallet action | The client obtained the payment transaction/artifact. |
| Send | Client delivers its envelope through messaging | The send operation resolved; recipient processing is separate. |
| Receive | List/live callback supplies an incoming envelope | A payment candidate is available to inspect and accept. |
| Normalize | `prepareIncomingPayment` → `normalizePaymentTransaction` | Bytes parse as supported transaction packaging. |
| Accept | Client remittance module calls wallet internalization | Wallet processing returned; validation belongs to the wallet/SDK. |
| Acknowledge | Client removes the message after internalization | Queue lifecycle advanced. This is not a block confirmation. |
| Update UI | Compatibility helper returns; React removes the row | This application observed completion of the helper call. |

An incoming envelope includes `messageId`, `sender`, and `token`. The token carries `transaction`, `amount`, `customInstructions.derivationPrefix`, `customInstructions.derivationSuffix`, and optionally `outputIndex`. `messageId` identifies delivery; an outpoint identifies a transaction output. Do not use one as a substitute for the other.

The locked client's `acceptPayment` can return a string on failure instead of rejecting its promise. PeerPay's [acceptance wrapper](../../frontend/src/utils/paymentCompatibility.ts) rejects strings, null, and non-object results. This guard is intentionally small: it is not a full receipt schema or proof of finality.

If internalization succeeds but acknowledgement fails, the call may appear failed even though the wallet already imported the output. If sending creates an action but delivery fails, a failed toast does not prove no funds moved. Reconcile wallet and inbox state before repeating a financial operation.

## Reject is a policy, not an undo

The current [reject wrapper](../../frontend/src/utils/paymentCompatibility.ts) first normalizes the transaction and validates a positive safe-integer amount.

| Incoming amount | Current behavior |
| --- | --- |
| 1–1,999 sats | Delegate to the client's small-payment rejection path: acknowledge/ignore the message, with no refund. |
| 2,000 sats or more | Accept successfully first, then send a new payment to the sender for `amount - 1,000` sats. |

The 1,000-sat deduction and 1,000-sat minimum refund are current library/application policy, not a blockchain rule or a promise about actual miner fees. At 2,000 sats the refund request is 1,000 sats. The returned payment is a new message that the original sender may need to accept.

Acceptance and refund sending are separate operations. If acceptance succeeds and refund sending fails, the original payment may already be internalized and acknowledged. The app has no durable refund-recovery state machine. Small-payment rejection also inherits the library's acknowledgement error handling. A disappearing row alone is not sufficient evidence that funds were returned.

For a basic demo, use **Accept**. If demonstrating rejection, explain the policy first, record both wallets' outcomes, and never describe it as canceling or reversing a confirmed transaction.
