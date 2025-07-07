import React, { useState, useEffect } from 'react'
import { Container, Typography, Box, LinearProgress } from '@mui/material'
import PaymentForm from './components/PaymentForm'
import PaymentList, { Payment } from './components/PaymentList'
import { useTheme } from '@mui/material/styles'
import { checkForMetaNetClient, NoMncModal } from 'metanet-react-prompt'

import './App.scss'

// Import PeerPayClient
import { PeerPayClient, IncomingPayment } from '@bsv/message-box-client'
import { WalletClient } from '@bsv/sdk'
import constants from './utils/constants'
import useAsyncEffect from 'use-async-effect'

const originalLog = console.log
console.log = (...args) => {
  const formattedArgs = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2)
      } catch (e) {
        return '[Unstringifiable object]'
      }
    }
    return arg
  })

  const stack = new Error().stack?.split('\n')[2]?.trim()
  originalLog('[LOG]', ...formattedArgs, '\n→', stack)
}

// Initialize PeerPayClient
const walletClient = new WalletClient()
const peerPayClient = new PeerPayClient({
  messageBoxHost: constants.messageboxURL,
  walletClient,
  enableLogging: true
})

const App: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [isMncMissing, setIsMncMissing] = useState<boolean>(false)
  const theme = useTheme()

  // Run a 1s interval for checking if MNC is running
  useAsyncEffect(async () => {
    const intervalId = setInterval(async () => {
      const hasMNC = await checkForMetaNetClient()
      if (hasMNC === 0) {
        setIsMncMissing(true) // Open modal if MNC is not found
      } else {
        clearInterval(intervalId)
        setIsMncMissing(false) // Ensure modal is closed if MNC is found
      }
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

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
      <NoMncModal appName={'PeerPay'} open={isMncMissing} onClose={() => setIsMncMissing(false)} />
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
        <PaymentList
          payments={payments}
          onUpdatePayments={(messageId: string) => {
            setPayments(prev => prev.filter(p => p.messageId !== messageId))
          }}
        />
      </Box>
    </Container>
  )
}

export default App
