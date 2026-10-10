# Message Box delivery, authentication, and overlays

[Back to concepts](../README.md)

## Why a payment app needs messaging

Creating an output is only part of this payment flow. The recipient also needs the transaction and derivation instructions to recognize and internalize it. PeerPay packages those into a payment token and delivers it to the recipient's `payment_inbox` through Message Box.

The queue lets sender and recipient act at different times. WebSocket delivery makes an open inbox responsive; an HTTP inbox fetch recovers pending messages when the application opens. A live connection is a transport convenience, not the source of financial truth.

In the locked client, `sendLivePayment` creates a payment token once, attempts live messaging, and falls back to HTTP if that attempt fails. That internal fallback reuses the token. Clicking Send again in the UI starts a new application send and can create a different payment. Do not confuse delivery retry with creating another transaction.

## Authentication and encryption solve different problems

Authentication establishes the key-based participant involved in a request or connection. Message-body encryption limits who can read the payment envelope. The Message Box client uses wallet cryptographic capabilities and authenticated HTTP/WebSocket facilities. Its default message body encryption uses wallet `encrypt`/`decrypt` under protocol `[1, 'messagebox']` with the counterparty identity and a per-message key ID.

The UI passes no `skipEncryption` option for payments. Keep this behavior when adapting the pattern. Encryption does not hide all routing metadata: services still need information such as destination, timing, and queue identity to deliver messages. HTTPS protects the network transport; end-to-end body encryption addresses a different trust boundary.

For the underlying standards see [BRC-103 peer authentication](https://github.com/bsv-blockchain/BRCs/blob/master/peer-to-peer/0103.md), [BRC-104 HTTP transport](https://github.com/bsv-blockchain/BRCs/blob/master/peer-to-peer/0104.md), and the [Message Box implementation](https://github.com/bsv-blockchain/ts-stack/tree/main/packages/messaging/message-box-client). PeerPay delegates these protocols rather than implementing a bespoke password/session backend.

## Where does the recipient receive messages?

An identity is a key, not a server URL. Message Box host advertisements connect an identity with a host. Overlay lookup can resolve those records; the client has a configured default host when no suitable advertisement is found.

An **overlay topic manager** defines which transaction outputs belong to a topic. A **lookup service** answers application queries over admitted outputs. The Message Box library uses these facilities for host advertisements, including `tm_messagebox` records and `ls_messagebox` lookup. SHIP is used by the underlying stack to discover services and distribute relevant transactions. These are application indexes over blockchain-linked records, not another consensus network.

The [Message Box overlay services](https://github.com/bsv-blockchain/messagebox-services) repository explains identity-to-host advertisements. PeerPay's own [deployment manifest](../../deployment-info.json) defines no topic managers or lookup services; its libraries consume external ones.

## What PeerPay configures explicitly

[constants.ts](../../frontend/src/utils/constants.ts) selects `https://messagebox.babbage.systems` in both hostname branches. That host is passed to the shared client and explicitly to inbox listing and live listening. The payment form calls `sendLivePayment` without an override, leaving outbound recipient routing to the client.

At startup [App.tsx](../../frontend/src/App.tsx) runs `init()` and `initializeConnection()` concurrently, then registers the listener. **The locked client's `init()` initializes the host/identity; it does not publish a host advertisement.** The comment in `App.tsx` mentioning advertisement is broader than that implementation. Publishing/changing a host advertisement is a separate library operation (`anointHost`) and is not called by this UI.

For a first demo, use the same configured service on both sides. In a multi-host extension, establish and validate the recipient's host advertisement, incoming host choice, queue permissions, and acknowledgement behavior. Changing a URL constant alone is not a complete service migration or network switch.

## Delivery semantics in the React application

The initial fetch sets the full pending-payment array. Live callbacks append only messages whose `messageId` is absent from the current array. This prevents duplicate visible rows for repeated callbacks in that state, but it is not a durable deduplication record or an exactly-once payment guarantee.

Acceptance internalizes first, then acknowledges the message. Acknowledgement advances queue state; it neither reverses a transaction nor proves a block confirmation. Reconnection, concurrent initial fetches, multiple tabs, and partial failures need explicit reconciliation in a larger product. See [browser reliability](browser-reliability.md) for the current app's limits and [wallets and payments](wallets-and-payments.md) for financial state transitions.
