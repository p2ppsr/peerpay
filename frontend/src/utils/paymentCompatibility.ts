import type { IncomingPayment } from '@bsv/message-box-client'
import { peerPayClient } from './peerPayClient'
import { normalizePaymentTransaction, type PaymentTransactionFormat } from './paymentTransaction'

export { InvalidPaymentTransactionError, normalizePaymentTransaction } from './paymentTransaction'
export type { PaymentTransactionFormat } from './paymentTransaction'

export function prepareIncomingPayment(payment: IncomingPayment): {
  payment: IncomingPayment
  format: PaymentTransactionFormat
} {
  const normalized = normalizePaymentTransaction(payment.token.transaction)
  return {
    format: normalized.format,
    payment: {
      ...payment,
      token: {
        ...payment.token,
        transaction: normalized.transaction
      }
    }
  }
}

function assertPaymentAccepted(result: unknown): void {
  if (typeof result === 'string' || result == null || typeof result !== 'object' ||
      (result as { paymentResult?: { accepted?: unknown } }).paymentResult?.accepted !== true) {
    throw new Error(typeof result === 'string' ? result : 'The wallet did not confirm the payment.')
  }
}

export async function acceptIncomingPayment(payment: IncomingPayment): Promise<PaymentTransactionFormat> {
  const prepared = prepareIncomingPayment(payment)
  const result = await peerPayClient.acceptPayment(prepared.payment)
  assertPaymentAccepted(result)
  return prepared.format
}

export async function rejectIncomingPayment(payment: IncomingPayment): Promise<PaymentTransactionFormat> {
  const prepared = prepareIncomingPayment(payment)
  const amount = prepared.payment.token.amount
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('The payment amount is invalid.')

  // The SDK's tiny-payment rejection acknowledges without crediting or returning
  // funds. Keep the message queued so the recipient can explicitly accept it.
  // Larger payments must be accepted successfully before
  // refunding; the upstream rejectPayment method does not currently enforce
  // that result and could otherwise refund from unrelated wallet funds.
  if (amount - 1_000 < 1_000) {
    throw new Error('This payment is too small to return after the fee. It has been kept; accept it to add it to your balance.')
  } else {
    const result = await peerPayClient.acceptPayment(prepared.payment)
    assertPaymentAccepted(result)
    await peerPayClient.sendPayment({ recipient: prepared.payment.sender, amount: amount - 1_000 })
  }
  return prepared.format
}
