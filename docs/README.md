# Learn the patterns behind PeerPay

PeerPay is small enough to trace from a button click to a wallet call. Read these guides alongside the linked source. Application behavior is based on the checked-in frontend and its lockfile; library behavior described here refers to that resolved version. Upstream documentation can describe newer APIs.

## Suggested reading order

1. [Run a two-wallet demo](demo.md). Observe send, receive, accept, and reload before learning the protocol names.
2. [Architecture](architecture.md). Separate the app, wallet, messaging, discovery, and hosting responsibilities.
3. [Identity and contacts](concepts/identity-and-contacts.md). Distinguish a key, a certificate, a saved contact, and a QR representation.
4. [Wallets and payments](concepts/wallets-and-payments.md). Learn BRC-100, key derivation, BRC-29 remittance, and the payment lifecycle.
5. [Messaging and overlays](concepts/messaging-and-overlays.md). Learn how a recipient is located and how a payment envelope gets delivered.
6. [Transactions and bytes](concepts/transactions-and-bytes.md). Understand transaction proof packaging and compatibility boundaries.
7. [Browser reliability](concepts/browser-reliability.md). Study async state, failure handling, observability, and privacy boundaries.
8. [Builder lab](builder-lab.md). Reproduce the encoding patterns offline and plan an extension with explicit acceptance criteria.

Keep [development](development.md) and [troubleshooting](troubleshooting.md) open while working.

## Glossary

| Term | Meaning in this project |
| --- | --- |
| BSV / satoshi | The blockchain used for settlement / its smallest monetary unit; 100,000,000 sats equal 1 BSV. |
| Identity key | A public key used to identify a wallet participant, not a private key or a conventional payment address. |
| Counterparty | The other participant supplied to wallet key derivation, encryption, or authentication operations. |
| Protocol ID / key ID | Namespaces and per-use identifiers that keep wallet-derived keys scoped to a purpose. |
| UTXO / outpoint | An unspent transaction output / the transaction ID and output index that identify an output. |
| Basket | A wallet's named grouping of outputs, such as encrypted contacts. |
| Remittance | Transaction data plus information the recipient needs to recognize and spend the payment output. |
| Internalization | The wallet imports a transaction/output using its remittance metadata and validation policy. |
| Message Box | A service that queues and routes messages addressed to identities. |
| Acknowledgement | Removal of a processed message from the messaging queue; separate from blockchain confirmation. |
| Overlay | A service that indexes a particular class of transaction outputs for application lookup. |
| Topic manager / lookup service | Overlay admission rules / an API that queries indexed records. This repo defines neither. |
| BEEF / AtomicBEEF | Transaction/proof packaging / packaging that identifies one subject transaction. |
| SPV | Simplified Payment Verification using transaction ancestry, Merkle proofs, and trusted block-header information. |
| Certificate / certifier | A signed identity claim / the party making that claim. Trust policy still matters. |
| PushDrop | A script template used by SDK facilities to associate data with a spendable output. |
| UHRP | Universal Hash Resolution Protocol: resolve content by hash rather than tying it to one storage URL. |
| LARS / CARS | Local / cloud application orchestration used by the root tooling. |

## Standards and upstream code

These are primary references, not a list of features PeerPay implements in full. Most protocol machinery belongs to its wallet and client libraries.

| Reference | Why it matters here |
| --- | --- |
| [BRC-100](https://github.com/bsv-blockchain/BRCs/blob/master/wallet/0100.md) | App-to-wallet operations and types. |
| [BRC-29](https://github.com/bsv-blockchain/BRCs/blob/master/payments/0029.md) | Payment remittance and recipient output derivation. |
| [BRC-42](https://github.com/bsv-blockchain/BRCs/blob/master/key-derivation/0042.md), [BRC-43](https://github.com/bsv-blockchain/BRCs/blob/master/key-derivation/0043.md) | Counterparty key derivation and purpose scoping. |
| [BRC-46](https://github.com/bsv-blockchain/BRCs/blob/master/wallet/0046.md), [BRC-48](https://github.com/bsv-blockchain/BRCs/blob/master/scripts/0048.md) | Output baskets and PushDrop. |
| [BRC-52](https://github.com/bsv-blockchain/BRCs/blob/master/peer-to-peer/0052.md), [BRC-68](https://github.com/bsv-blockchain/BRCs/blob/master/peer-to-peer/0068.md) | Identity certificates and domain-published trust-anchor details. |
| [BRC-189](https://github.com/bsv-blockchain/BRCs/blob/master/wallet/0189.md) | Further reading on identity, discovery, and personal trust in applications; compare newer guidance with this app's locked implementation. |
| [BRC-26](https://github.com/bsv-blockchain/BRCs/blob/master/overlays/0026.md) | UHRP content addressing and resolution. |
| [BRC-62](https://github.com/bsv-blockchain/BRCs/blob/master/transactions/0062.md), [BRC-95](https://github.com/bsv-blockchain/BRCs/blob/master/transactions/0095.md), [BRC-67](https://github.com/bsv-blockchain/BRCs/blob/master/transactions/0067.md) | BEEF, AtomicBEEF, and SPV. |
| [BRC-103](https://github.com/bsv-blockchain/BRCs/blob/master/peer-to-peer/0103.md), [BRC-104](https://github.com/bsv-blockchain/BRCs/blob/master/peer-to-peer/0104.md) | Peer authentication and its HTTP transport. |
| [Message Box client](https://github.com/bsv-blockchain/ts-stack/tree/main/packages/messaging/message-box-client) | Payment envelopes, HTTP/WebSocket delivery, host discovery, acceptance. |
| [BSV SDK](https://github.com/bsv-blockchain/ts-stack/tree/main/packages/sdk) | Wallet client, remittance, transactions, identities, contacts, overlays. |
| [Identity React](https://github.com/bsv-blockchain/identity-react), [UHRP React](https://github.com/bsv-blockchain/uhrp-react) | Discovery/display components and hash-addressed images. |

For exact dependency implementations after `npm ci`, inspect `frontend/node_modules/@bsv/message-box-client/dist/src/` and `frontend/node_modules/@bsv/sdk/dist/esm/src/`. The installed `package.json` files identify their upstream repositories. Do not assume a current upstream example is compatible with an older lockfile.
