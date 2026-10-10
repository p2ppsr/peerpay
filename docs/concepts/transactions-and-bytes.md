# Transaction proofs and portable bytes

[Back to concepts](../README.md)

## Raw transaction, BEEF, and AtomicBEEF

A raw transaction describes inputs and outputs. A receiver validating it may also need ancestry and evidence that earlier transactions were included in blocks. **BEEF** packages transactions with supporting information such as Merkle paths so that a receiver can work with a transaction graph rather than only a transaction ID. **AtomicBEEF** identifies one subject transaction within that packaging.

“Atomic” here names a serialization format. It does not make message delivery, wallet acceptance, acknowledgement, and refunds one database transaction.

Relevant references are [BRC-62 BEEF](https://github.com/bsv-blockchain/BRCs/blob/master/transactions/0062.md), [BRC-95 AtomicBEEF](https://github.com/bsv-blockchain/BRCs/blob/master/transactions/0095.md), and [BRC-67 SPV](https://github.com/bsv-blockchain/BRCs/blob/master/transactions/0067.md). SPV connects transaction ancestry and Merkle inclusion evidence to block-header information. Parsing a BEEF envelope is not the same as verifying scripts, proving current spendability, or counting confirmations.

PeerPay's parser checks format locally; the SDK/wallet's payment acceptance path performs the relevant transaction and output processing. Do not interpret a successful `Transaction.fromAtomicBEEF` call as permission to credit a user in an independent ledger.

## Bytes change shape at JavaScript transport boundaries

The same byte sequence can appear as a `number[]`, a `Uint8Array`, or a numeric-key object left by an older JSON bridge:

```js
JSON.stringify([1, 2, 3])                 // "[1,2,3]"
JSON.stringify(new Uint8Array([1, 2, 3])) // '{"0":1,"1":2,"2":3}'
```

Those are illustrative bytes, not a valid payment transaction. `JSON.parse` cannot infer that the second value should become an array. TypeScript type assertions also do not convert runtime data.

[byteArrayCompatibility.ts](../../frontend/src/utils/byteArrayCompatibility.ts) implements a narrow conversion contract:

| Input | Result |
| --- | --- |
| Dense array of integer bytes, each 0–255 | Return the same array. |
| `Uint8Array` | Copy to a number array. |
| Object with contiguous numeric keys starting at zero and byte values | Copy to a number array. |
| Sparse array/object, invalid values, another typed-array kind, unrelated shape | Return `undefined`; do not silently coerce values. |

The transaction parser additionally requires nonempty data. Shape recognition is deliberately separate from transaction validation. An empty generic object must not be treated as evidence of a valid transaction.

## Outgoing boundary: preserve the wallet interface

[walletCompatibility.ts](../../frontend/src/utils/walletCompatibility.ts) wraps `createAction` and normalizes `result.tx` and `result.signableTransaction.tx`. It preserves references when already portable and binds other methods to the original wallet, retaining their `this` context. Invalid shapes are left for downstream validation instead of being converted into fabricated transaction bytes.

This is an adapter pattern: contain representation differences at the external boundary instead of adding conversions to every UI component. It is intentionally narrow, not a recursive serializer for every possible wallet response. New wallet methods or SDK versions require their own compatibility review.

## Incoming boundary: parse before internalizing

[paymentTransaction.ts](../../frontend/src/utils/paymentTransaction.ts) follows this sequence:

1. Convert a supported byte representation and require nonempty bytes.
2. Try `Transaction.fromAtomicBEEF(bytes)`. If it succeeds, preserve the bytes and report `atomic`.
3. Otherwise try `Transaction.fromBEEF(bytes).toAtomicBEEF()`, then parse the result again. Report `legacy-converted` on success.
4. If neither path succeeds, throw `InvalidPaymentTransactionError`.

The regression suite also covers a historical envelope with unrelated transaction branches: conversion preserves the subject transaction while pruning unrelated data. This is targeted backward compatibility, not a policy of accepting arbitrary malformed transaction packages.

[paymentCompatibility.ts](../../frontend/src/utils/paymentCompatibility.ts) applies normalization before accept/reject. On failure, the row remains available rather than being removed as though acceptance succeeded.

## Learn it without a wallet

Run the existing tests from `frontend/`:

```sh
npm test -- src/utils/paymentCompatibility.test.ts src/utils/walletCompatibility.test.ts
```

They exercise valid AtomicBEEF, legacy conversion, typed-array JSON recovery, unrelated-branch pruning, malformed bytes, and method binding. Their synthetic transactions test serialization, not real spendable funds. The [builder lab](../builder-lab.md#exercise-1-round-trip-a-transaction-envelope-offline) provides an executable exercise using the same boundary.
