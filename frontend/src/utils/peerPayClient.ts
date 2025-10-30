import { PeerPayClient } from '@bsv/message-box-client'
import BabbageGo from '@babbage/go'
import constants from './constants'
import { WalletClient } from '@bsv/sdk'

const babbageGo = new BabbageGo(new WalletClient(), {
  monetization: {
    developerFeeSats: 150,
    developerIdentity: '02a064784ebb435e87c3961745b01e3564d41149ea1291d1a73783d1b7b3a7a220'
  },
  walletUnavailable: {
    title: 'Instant, secure payments.'
  }
})

const peerPayClient = new PeerPayClient({
  messageBoxHost: constants.messageboxURL,
  walletClient: babbageGo,
  enableLogging: true
})

export { babbageGo, peerPayClient }
