import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LockingScript, Transaction } from '@bsv/sdk'
const client = vi.hoisted(() => ({ acceptPayment: vi.fn(), rejectPayment: vi.fn(), sendPayment: vi.fn() }))
vi.mock('./peerPayClient', () => ({ peerPayClient: client }))
import { acceptIncomingPayment, rejectIncomingPayment } from './paymentCompatibility'

// Unfunded bytes are used only by the format parser. No wallet or service runs.
const transaction = new Transaction()
transaction.addOutput({ satoshis: 1000, lockingScript: LockingScript.fromHex('51') })
const incoming = (amount = 1000) => ({
  messageId: 'lab-fixture', sender: '02' + '11'.repeat(32),
  token: { amount, transaction: transaction.toAtomicBEEF(), customInstructions: { derivationPrefix: 'AQ==', derivationSuffix: 'Ag==' } }
})
beforeEach(() => vi.resetAllMocks())
describe('retaining funds when accepting or returning a payment is unsafe', () => {
  it.each([1000, 1999])('keeps a %i-satoshi payment queued instead of acknowledging without a credit or refund', async amount => {
    await expect(rejectIncomingPayment(incoming(amount))).rejects.toThrow('too small to return')
    expect(client.rejectPayment).not.toHaveBeenCalled()
    expect(client.acceptPayment).not.toHaveBeenCalled()
    expect(client.sendPayment).not.toHaveBeenCalled()
  })
  it.each([undefined, 'failed', {}, { paymentResult: {} }, { paymentResult: { accepted: false } }])('requires an affirmative wallet receipt before removing an incoming row: %j', async result => {
    client.acceptPayment.mockResolvedValue(result)
    await expect(acceptIncomingPayment(incoming())).rejects.toThrow()
  })
  it('retains legacy BEEF compatibility when the wallet confirms acceptance', async () => {
    client.acceptPayment.mockResolvedValue({ paymentResult: { accepted: true } })
    const payment = incoming()
    payment.token.transaction = transaction.toBEEF()
    await expect(acceptIncomingPayment(payment)).resolves.toBe('legacy-converted')
    expect(Transaction.fromAtomicBEEF(client.acceptPayment.mock.calls[0][0].token.transaction).id('hex')).toBe(transaction.id('hex'))
  })
  it('does not fund a return from unrelated balance after a negative acceptance receipt', async () => {
    client.acceptPayment.mockResolvedValue({ paymentResult: { accepted: false } })
    await expect(rejectIncomingPayment(incoming(5000))).rejects.toThrow()
    expect(client.sendPayment).not.toHaveBeenCalled()
    expect(client.rejectPayment).not.toHaveBeenCalled()
  })
})
