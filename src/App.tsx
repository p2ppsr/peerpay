import React, { useState, useEffect } from 'react'
import { Container, Typography, Box, LinearProgress } from '@mui/material'
import PaymentForm from './components/PaymentForm'
import PaymentList, { Payment } from './components/PaymentList'
import { useTheme } from '@mui/material/styles'

import './App.scss'

// Import PeerPayClient
import { PeerPayClient } from '../../messagebox-client/dist/esm/src/PeerPayClient.js'
import { IncomingPayment } from '@bsv/p2p'
import { WalletClient } from '@bsv/sdk'

// Initialize PeerPayClient
const walletClient = new WalletClient('json-api', 'non-admin.com')
const peerPayClient = new PeerPayClient({
  messageBoxHost: 'http://localhost:8080',
  walletClient,
  enableLogging: true
})

const App: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const theme = useTheme()

  // Function to fetch payments
const fetchPayments = async () => {
  console.log('[APP] fetchPayments() triggered')
  try {
    setLoading(true)
    const paymentsToReceive = await peerPayClient.listIncomingPayments()
    console.log('[APP] Payments fetched from listIncomingPayments:', paymentsToReceive)

    const formattedPayments: Payment[] = paymentsToReceive.map((payment) => ({
      ...payment,
      token: {
        ...payment.token,
        transaction: new Uint8Array(payment.token.transaction)
      }
    }))

    console.log('[APP] Formatted payments:', formattedPayments)
    setPayments(formattedPayments)
  } catch (error) {
    console.error('[APP] Error fetching incoming payments:', error)
  } finally {
    setLoading(false)
    console.log('[APP] Done loading payments')
  }
}

// Load initial payments
useEffect(() => {
  console.log('[APP] useEffect() for initial fetchPayments triggered')
  fetchPayments()
}, [])

// Listen for live payments
useEffect(() => {
  console.log('[APP] useEffect() for listenForLivePayments triggered')

  const listenForPayments = async () => {
    try {
      console.log('[APP] Initializing connection...')
      await peerPayClient.initializeConnection()
      console.log('[APP] Connection initialized. Listening for live payments...')

      await peerPayClient.listenForLivePayments({
        onPayment: (payment: IncomingPayment) => {
          console.log('[APP] onPayment callback triggered!')
          console.log('[APP] Raw IncomingPayment received:', payment)

          const formattedPayment: Payment = {
            ...payment,
            token: {
              ...payment.token,
              transaction: new Uint8Array(payment.token.transaction)
            }
          }

          console.log('[APP] Formatted IncomingPayment:', formattedPayment)

          setPayments((prevPayments) => {
            const updated = [...prevPayments, formattedPayment]
            console.log('[APP] Updated payments list after live payment:', updated)
            return updated
          })

          console.log('[APP] Optionally re-fetching list to verify message is still available...')
          fetchPayments()
        }
      })
    } catch (error) {
      console.error('[APP] Error listening for live payments:', error)
    }
  }

  listenForPayments()
}, [])


  return (
    <Container maxWidth='sm'>
      <Box
        sx={{
          bgcolor: 'background.default',
          minHeight: '100vh',
          color: 'text.primary',
          pt: 5
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            pt: 4
          }}
        >
          <img src='/PeerPay.png' width={'300px'} />
          <Typography variant='body1' paddingTop={5}>
            Simple Peer-to-peer Payments
          </Typography>
          <PaymentForm onSend={fetchPayments} />
        </Box>

        <Typography variant='h6' component='h2' paddingTop={5}>
          Incoming Payments
        </Typography>
        {loading && <LinearProgress />}
        <PaymentList payments={payments} onUpdatePayments={fetchPayments} />
      </Box>
    </Container>
  )
}

export default App
