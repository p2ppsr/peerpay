import { CommsLayer } from '../../../../ts-sdk/src/remittance/CommsLayer.js'
import { RemittanceManager } from '../../../../ts-sdk/src/remittance/RemittanceManager.js'
import { Brc29RemittanceModule } from '../../../../ts-sdk/src/remittance/modules/BasicBRC29.js'
import { MessageBoxClient } from '@bsv/message-box-client'
import { WalletClient } from '@bsv/sdk'
import { PeerMessage } from '../../../../ts-sdk/src/remittance/types.js'
import { PubKeyHex } from '../../../../ts-sdk/src/wallet/Wallet.interfaces.js'

// Configuration
const MODE: 'send' | 'receive' = 'send' // Toggle between 'send' and 'receive'
const RECIPIENT_PUBKEY = '0350fa50d7c23f63d949c9532f41a7ea0c01112ffb1404cfb8a9f732b11a54a1ce' // Replace with actual recipient public key
const AMOUNT_SATS = 1000

class MessageBoxAdapter implements CommsLayer {
  constructor(private readonly messageBox: MessageBoxClient) {
    console.log('[MessageBoxAdapter] Initialized')
  }

  async sendMessage(
    args: { recipient: PubKeyHex; messageBox: string; body: string },
    hostOverride?: string
  ): Promise<string> {
    console.log('[MessageBoxAdapter] sendMessage called')
    console.log('  → Recipient:', args.recipient.substring(0, 16) + '...')
    console.log('  → MessageBox:', args.messageBox)
    console.log('  → Body length:', args.body.length, 'chars')
    console.log('  → Host override:', hostOverride ?? 'none')

    const result = await this.messageBox.sendMessage({
      recipient: args.recipient,
      messageBox: args.messageBox,
      body: args.body
    })

    console.log('  ✓ Message sent, ID:', result.messageId)
    return result.messageId
  }

  async sendLiveMessage(
    args: { recipient: PubKeyHex; messageBox: string; body: string },
    hostOverride?: string
  ): Promise<string> {
    console.log('[MessageBoxAdapter] sendLiveMessage called (using regular sendMessage)')
    console.log('  → Recipient:', args.recipient.substring(0, 16) + '...')
    console.log('  → MessageBox:', args.messageBox)
    console.log('  → Body length:', args.body.length, 'chars')

    const result = await this.messageBox.sendMessage({
      recipient: args.recipient,
      messageBox: args.messageBox,
      body: args.body
    })

    console.log('  ✓ Live message sent, ID:', result.messageId)
    return result.messageId
  }

  async listMessages(args: { messageBox: string; host?: string }): Promise<PeerMessage[]> {
    console.log('[MessageBoxAdapter] listMessages called')
    console.log('  → MessageBox:', args.messageBox)
    console.log('  → Host:', args.host ?? 'default')

    const messages = await this.messageBox.listMessages({ messageBox: args.messageBox })

    console.log('  ✓ Retrieved', messages.length, 'message(s)')

    const mapped = messages.map((msg: any, index: number) => {
      console.log(`  → Message ${index + 1}:`)
      console.log('    - ID:', msg.messageId)
      console.log('    - Sender:', msg.sender.substring(0, 16) + '...')
      // console.log('    - Recipient:', msg.recipient.substring(0, 16) + '...')
      console.log('    - Body type:', typeof msg.body)
      console.log('    - Body (parsed):', msg.body)
      console.log('    - Created:', msg.createdAt)

      // MessageBoxClient returns body as parsed object, but RemittanceManager expects JSON string
      const bodyString = typeof msg.body === 'string' ? msg.body : JSON.stringify(msg.body)

      return {
        messageId: msg.messageId,
        sender: msg.sender,
        recipient: msg.recipient,
        messageBox: msg.messageBox,
        body: bodyString,
        createdAt: msg.createdAt
      }
    })

    return mapped
  }

  async acknowledgeMessage(args: { messageIds: string[] }): Promise<void> {
    console.log('[MessageBoxAdapter] acknowledgeMessage called')
    console.log('  → Acknowledging', args.messageIds.length, 'message(s)')

    for (const messageId of args.messageIds) {
      console.log('  → Acknowledging:', messageId)
      await this.messageBox.acknowledgeMessage({ messageIds: [messageId] })
      console.log('  ✓ Acknowledged:', messageId)
    }

    console.log('  ✓ All messages acknowledged')
  }

  async listenForLiveMessages(args: {
    messageBox: string
    overrideHost?: string
    onMessage: (msg: PeerMessage) => void
  }): Promise<void> {
    console.log('[MessageBoxAdapter] listenForLiveMessages called')
    console.log('  ✗ Live message listening not supported by MessageBoxClient')
    throw new Error('Live message listening not supported by MessageBoxClient')
  }
}

/**
 * Initialize RemittanceManager with BasicBRC29 module and MessageBoxClient
 * Receipting is disabled as per requirements
 */
async function initializeRemittanceManager(): Promise<RemittanceManager> {
  const wallet = new WalletClient('auto', 'localhost')
  const messageBoxClient = new MessageBoxClient({
    walletClient: wallet
  })
  const commsLayer = new MessageBoxAdapter(messageBoxClient)

  const brc29Module = new Brc29RemittanceModule()
  const manager = new RemittanceManager(
    {
      messageBox: 'direct_payment_test',
      remittanceModules: [brc29Module],
      options: {
        receiptProvided: false, // Disable receipting
        autoIssueReceipt: false,
        invoiceExpirySeconds: 3600
      },
      logger: console
    },
    wallet,
    commsLayer
  )

  await manager.init()
  return manager
}

/**
 * Test method: Send unsolicited settlement
 * Sends a direct payment to the recipient without an invoice
 */
async function testSendUnsolicitedSettlement(
  manager: RemittanceManager,
  recipient: PubKeyHex,
  amountSats: number
): Promise<void> {
  console.log(`\n=== Sending Unsolicited Settlement ===`)
  console.log(`Recipient: ${recipient}`)
  console.log(`Amount: ${amountSats} sats`)

  try {
    const option = {
      amountSatoshis: amountSats,
      payee: recipient
    }

    const threadHandle = await manager.sendUnsolicitedSettlement(
      recipient,
      {
        moduleId: 'brc29.p2pkh',
        option,
        note: `Direct payment test - ${amountSats} sats`
      }
    )

    console.log(`✓ Settlement sent successfully`)
    console.log(`Thread ID: ${threadHandle.threadId}`)

    const thread = manager.getThread(threadHandle.threadId)
    if (thread) {
      console.log(`Thread state: ${thread.state}`)
      console.log(`Settlement:`, thread.settlement)
    }
  } catch (error) {
    console.error(`✗ Failed to send settlement:`, error)
    throw error
  }
}

/**
 * Test method: Sync threads
 * Receives and processes incoming messages
 */
async function testSyncThreads(manager: RemittanceManager): Promise<void> {
  console.log(`\n=== Syncing Threads ===`)

  try {
    await manager.syncThreads()
    console.log(`✓ Sync completed successfully`)

    const threads = manager.threads
    console.log(`Total threads: ${threads.length}`)

    threads.forEach((thread, index) => {
      console.log(`\nThread ${index + 1}:`)
      console.log(`  ID: ${thread.threadId}`)
      console.log(`  State: ${thread.state}`)
      console.log(`  Role: ${thread.myRole}`)
      console.log(`  Counterparty: ${thread.counterparty}`)
      console.log(`  Has Invoice: ${thread.invoice != null}`)
      console.log(`  Has Settlement: ${thread.settlement != null}`)
      console.log(`  Has Receipt: ${thread.receipt != null}`)

      if (thread.settlement && thread.settlement.artifact) {
        const artifact = thread.settlement.artifact as { amountSatoshis?: number }
        console.log(`  Settlement Amount: ${artifact.amountSatoshis ?? 'N/A'} sats`)
      }
    })
  } catch (error) {
    console.error(`✗ Failed to sync threads:`, error)
    throw error
  }
}

/**
 * Main test execution
 * Toggles between send and receive modes
 */
async function runTest(): Promise<void> {
  console.log(`=================================`)
  console.log(`Direct Payment Test - BRC29`)
  console.log(`Mode: ${MODE.toUpperCase()}`)
  console.log(`=================================`)

  // Get wallet identity key for manager initialization
  const wallet = new WalletClient('auto', 'localhost')
  const identityResult = await wallet.getPublicKey({ identityKey: true })
  const myIdentityKey = identityResult.publicKey

  console.log(`My Identity Key: ${myIdentityKey.substring(0, 16)}...`)

  const manager = await initializeRemittanceManager()

  // if (MODE === 'send') {
  await testSendUnsolicitedSettlement(manager, RECIPIENT_PUBKEY, AMOUNT_SATS)
  // } else {
  debugger
  await testSyncThreads(manager)
  // }

  // Persist state
  await manager.persistState()
  console.log(`\n✓ Test completed successfully`)
}

// Execute the test
runTest().catch((error) => {
  console.error(`\n✗ Test failed:`, error)
  process.exit(1)
})