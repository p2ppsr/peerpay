import React, { useState, useEffect } from 'react'
import { Container, Typography, Box, LinearProgress } from '@mui/material'
import PaymentForm from './components/PaymentForm'
import PaymentList, { Payment } from './components/PaymentList'
import { useTheme } from '@mui/material/styles'

import './App.scss'

// Import PeerPayClient
import { PeerPayClient, IncomingPayment } from '@bsv/p2p'
import { WalletClient } from '@bsv/sdk'

// Initialize PeerPayClient
const walletClient = new WalletClient('json-api', 'non-admin.com')
const peerPayClient = new PeerPayClient({
  messageBoxHost: 'https://messagebox.babbage.systems',
  walletClient,
  enableLogging: true
})

const App: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const theme = useTheme()

  // Function to fetch payments
const fetchPayments = async () => {
  try {
    setLoading(true)
    const paymentsToReceive = await peerPayClient.listIncomingPayments()

    const formattedPayments: Payment[] = paymentsToReceive.map((payment) => ({
      ...payment,
      token: {
        ...payment.token,
        transaction: new Uint8Array(payment.token.transaction)
      }
    }))

    setPayments(formattedPayments)
  } catch (error) {
    console.error('[APP] Error fetching incoming payments:', error)
  } finally {
    setLoading(false)
  }
}

// Load initial payments
useEffect(() => {
  fetchPayments()
}, [])

// Listen for live payments
useEffect(() => {

  const listenForPayments = async () => {
    try {
      await peerPayClient.initializeConnection()

      await peerPayClient.listenForLivePayments({
        onPayment: (payment: IncomingPayment) => {

          const formattedPayment: Payment = {
            ...payment,
            token: {
              ...payment.token,
              transaction: new Uint8Array(payment.token.transaction)
            }
          }

          setPayments((prevPayments) => {
            const updated = [...prevPayments, formattedPayment]
            return updated
          })

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
