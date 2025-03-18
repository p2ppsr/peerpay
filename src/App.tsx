import React, { useState } from 'react'
import { Container, Typography, Box, LinearProgress } from '@mui/material'
import PaymentForm from './components/PaymentForm'
import PaymentList, { Payment } from './components/PaymentList'
import { useTheme } from '@mui/material/styles'
import { toast } from 'react-toastify'
import useAsyncEffect from 'use-async-effect'
import checkForMetaNetClient from './utils/checkForMetaNetClient'
import NoMncModal from './components/NoMncModal/NoMncModal'


import './App.scss'
import constants from './utils/constants'

// Import PeerPayClient instead of PaymentTokenator
import { PeerPayClient, IncomingPayment } from '@bsv/p2p'
import { WalletClient } from '@bsv/sdk'

// Initialize PeerPayClient
const walletClient = new WalletClient('json-api', 'non-admin.com')
const peerPayClient = new PeerPayClient({
  messageBoxHost: 'https://messagebox.babbage.systems',
  walletClient
})

const App: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const theme = useTheme()
  const [isMncMissing, setIsMncMissing] = useState(false)

  // Fix interval check for MNC
  useAsyncEffect(async () => {
    const intervalId = setInterval(async () => {
      const hasMNC = await checkForMetaNetClient()
      setIsMncMissing(hasMNC === 0)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  // Fix handleSendPayment to use PeerPayClient
  const handleSendPayment = async (amount: number, recipient: string) => {
    try {
      await peerPayClient.sendPayment({
        recipient,
        amount
      })
      toast.success('Payment successfully sent!')
    } catch (error) {
      toast.error('Failed to send payment!')
      console.error('Error sending payment:', error)
    }
  }

  // Fix handleAcceptPayment to use PeerPayClient
  const handleAcceptPayment = async (payment: Payment) => {
    try {
      await peerPayClient.acceptPayment({
        ...payment,
        token: {
          ...payment.token,
          transaction: Array.from(payment.token.transaction) // Convert Uint8Array to number[]
        }
      })
      toast.success('Payment accepted!')
      setPayments(payments.filter((x) => x.messageId !== payment.messageId))
    } catch (error) {
      toast.error('Failed to accept payment.')
      console.error('Error accepting payment:', error)
    }
  }

  // Fix handleRejectPayment to use PeerPayClient
  const handleRejectPayment = async (payment: Payment) => {
    try {
      await peerPayClient.rejectPayment({
        ...payment,
        token: {
          ...payment.token,
          transaction: Array.from(payment.token.transaction)
        }
      })
      toast.info('Payment rejected.')
      setPayments(payments.filter((x) => x.messageId !== payment.messageId))
    } catch (error) {
      toast.error('Failed to reject payment.')
      console.error('Error rejecting payment:', error)
    }
  }

  // Fix `useAsyncEffect` to load incoming payments and listen for live payments
  useAsyncEffect(async () => {
    try {
      setLoading(true)

      // Fetch payments and convert `token.transaction` to Uint8Array
      const paymentsToReceive = await peerPayClient.listIncomingPayments()
      const formattedPayments: Payment[] = paymentsToReceive.map((payment) => ({
        ...payment,
        token: {
          ...payment.token,
          transaction: new Uint8Array(payment.token.transaction) // Convert number[] to Uint8Array
        }
      }))

      setPayments(formattedPayments) // Now matches `Payment[]`

      // Listen for live payments and ensure `token.transaction` conversion
      await peerPayClient.listenForLivePayments({
        onPayment: (payment: IncomingPayment) => {
          setLoading(true)

          const formattedPayment: Payment = {
            ...payment,
            token: {
              ...payment.token,
              transaction: new Uint8Array(payment.token.transaction) // Convert number[] to Uint8Array
            }
          }

          setPayments((prevPayments) => [...prevPayments, formattedPayment])
          setLoading(false)
        }
      })

    } catch (error) {
      console.error('Error fetching incoming payments:', error)
    }
    setLoading(false)
}, [])


  return (
    <Container maxWidth='sm'>
      <NoMncModal open={isMncMissing} onClose={() => setIsMncMissing(false)} />
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
          <PaymentForm onSend={handleSendPayment} />
        </Box>
        <Typography variant='h6' component='h2' paddingTop={5}>
          Incoming Payments
        </Typography>
        {loading && <LinearProgress />}
        <PaymentList payments={payments} onAccept={handleAcceptPayment} onReject={handleRejectPayment} />
      </Box>
    </Container>
  )
}

export default App
