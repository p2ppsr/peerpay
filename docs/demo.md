# Demonstrate PeerPay with two wallets

[Back to the builder guide](README.md)

This walkthrough demonstrates identity selection, encrypted payment delivery, wallet acceptance, and persistence boundaries. It uses the existing UI. For a demonstration without network access or funds, use the [offline builder lab](builder-lab.md#exercise-1-round-trip-a-transaction-envelope-offline).

## Prepare the demo

1. Run the [frontend quick start](../README.md#quick-start), or open the [hosted PeerPay app](https://peerpay.metanet.app/).
2. Prepare two distinct, unlocked BRC-100 wallet identities, Alice and Bob. Two tabs connected to one wallet identity do not demonstrate two-party payment. Prefer separate devices or independently configured wallet profiles.
3. Confirm each wallet is reachable from its browser/WebView, uses the intended network, and has the required permissions. Alice needs funds for the agreed payment and applicable fees; Bob may need funds for wallet actions such as contact writes or host setup.
4. Use a small agreed amount, for example **100 sats** if supported by the wallet/service policy, plus fee headroom. The checked-in environment uses public Message Box infrastructure and mainnet deployment settings. This can move real funds.
5. Exchange Bob's **public identity key** through a trusted channel. Do not exchange private keys or recovery phrases. Prepare Bob's identity QR using his wallet if it offers one.
6. Record app commit/version, wallet/browser versions, network, and the expected roles. Keep any detailed transaction evidence private; use sanitized role labels in a public demo.

Allow initial wallet prompts and wait for both inboxes to load. Confirm the actual recipient key before every send. Merely opening the app can initialize network activity and telemetry.

## Part 1: show what identity means

Use the same Bob identity for all three paths, returning with **Change** between selections.

| Path | Action | What to explain |
| --- | --- | --- |
| Public discovery | Search for an attribute Bob has made discoverable through an identity certificate; select the result. | Name/avatar/badge are interpreted claims. Inspect which certifier made the claim and compare the full identity key. |
| Saved contact | Choose **Select Contact → Add New Contact**, enter Bob's public key and a local alias, then **Save Contact**. Approve the wallet operation. | A local alias need not be public or certified. It is saved through the wallet. |
| QR | Choose **Scan QR** and scan Bob's identity QR. | The QR transports a key; it does not authenticate the person holding the code. Main-screen scanning selects without saving. |

The selected key should remain Bob's even if the labels differ. PeerPay's own UI does not generate a receive QR; helpers for building that feature exist in `qrUtils.ts`.

If public discovery is unavailable, record that step as unavailable and continue with an independently verified contact/key. Do not present contact selection as proof that public identity discovery passed. The [identity guide](concepts/identity-and-contacts.md) explains known search/version limits.

## Part 2: send and accept

| Step | Alice | Bob | Evidence |
| --- | --- | --- | --- |
| Select | Select Bob and compare the full key. | Confirm the intended receiving identity. | Both sides agree on the recipient identity. |
| Send | Enter the agreed whole-satoshi amount; choose **Send Payment**; approve the wallet action. | Keep PeerPay open. | Alice sees send completion and a Recently Sent row. |
| Receive | Wait rather than sending again. | Observe the Incoming Payments row. | Delivery is visible; acceptance has not yet occurred. |
| Accept | Observe only. | Choose **Accept** and approve if prompted. | Bob sees acceptance completion; row is removed. |
| Reconcile | Inspect the send in the wallet's own history. | Inspect the received output/payment in the wallet. | Wallet state corroborates the app; account for fees rather than comparing only gross balances. |
| Reload | Reload PeerPay. | Reload PeerPay. | Alice's Recently Sent display resets. Bob's acknowledged payment should no longer be pending. Wallet records persist. |

Explain the three distinct milestones: **delivery**, **wallet acceptance**, and **block confirmation**. PeerPay does not provide a block-confirmation tracker. Inspect that state in the wallet/service if it matters to the demonstration.

## Part 3: asynchronous delivery

Close Bob's PeerPay page while keeping his wallet/service configuration intact. Send one additional small agreed payment from Alice. Reopen Bob's page and inspect the initial inbox fetch, then accept the payment.

Expected result: the queued message appears without requiring Bob to have watched the live event. This demonstrates delayed application-level receipt under the configured service; it does not establish unlimited message retention, offline transaction construction, or universal service availability.

## Part 4: contacts and local state

Reload and reopen **Select Contact**. A successfully saved contact should be available through the wallet-backed store, while recent sends remain absent after reload. Search the contact modal by the local alias and compare that with public identity search. The modal's local filter and the public search component use different paths.

Contact removal is optional and can involve a wallet action. It removes the active contact record, not historical blockchain data. Do not delete an existing personal contact just to demonstrate the button.

## Optional: bulk acceptance and rejection

For **Accept All**, first prepare a small known set of pending demo payments. Explain that processing is sequential and partial success is possible. Record each outcome rather than assuming the whole group is one atomic operation.

For **Reject**, read [the exact policy](concepts/wallets-and-payments.md#reject-is-a-policy-not-an-undo) with the participants first. Below 2,000 sats it does not refund. At or above 2,000 sats it accepts the payment before requesting a new refund of `amount - 1,000` sats. Verify both wallets and the returned inbox message. This is not an undo operation; do not use it as casual demo cleanup.

## When a step fails

Stop advancing that payment and record the last confirmed milestone. A failed send may follow successful transaction creation; a failed accept may follow successful internalization; a failed reject may follow successful acceptance. Inspect wallet and inbox state before any retry. Keep failed outcomes separate from later successful attempts.

Use [troubleshooting](troubleshooting.md). Do not publish raw payment envelopes or full console logs. Never clear wallet data, acknowledge messages manually, or rotate identities merely to make a demo look successful.

## A useful demonstration record

```text
App commit/version:
Wallet A and B versions; browser/device:
Network and Message Box configuration:
Public discovery: passed / failed / not demonstrated
Contact selection: passed / failed / not demonstrated
QR selection: passed / failed / not demonstrated
Send completed:
Recipient row observed:
Wallet acceptance corroborated:
Acknowledged row absent after reload:
Delayed delivery: passed / failed / not demonstrated
Block confirmation: observed separately / not checked
Failures, recovery, and limitations:
```

Keep any transaction identifiers needed for reconciliation in a private evidence record. This script describes what to verify; it is not a claim that every wallet/browser combination has been qualified.
