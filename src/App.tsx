import React, { useState } from 'react'
import { Container, Typography, Box, LinearProgress, TextField, InputAdornment } from '@mui/material'
import PaymentForm from './components/PaymentForm'
import PaymentList, { Payment } from './components/PaymentList'
import PaymentTokenator from 'payment-tokenator'
import { useTheme } from '@mui/material/styles'
import { toast } from 'react-toastify'
import useAsyncEffect from 'use-async-effect'
import checkForMetaNetClient from './utils/checkForMetaNetClient'
import NoMncModal from './components/NoMncModal/NoMncModal'

import './App.scss'
import constants from './utils/constants'

const App: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const paymentTokenator = new PaymentTokenator({ peerServHost: constants.peerservURL })
  const [loading, setLoading] = useState(false)
  const theme = useTheme()
  const [isMncMissing, setIsMncMissing] = useState(false)
  const [preferredCurrency, setPreferredCurrency] = useState('BSV')


  // Run a 1s interval for checking if MNC is running
  useAsyncEffect(async () => {
    const intervalId = setInterval(async () => {
      const hasMNC = await checkForMetaNetClient()
      if (hasMNC === 0) {
        setIsMncMissing(true)
      } else {
        setIsMncMissing(false)
      }
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  const handleSendPayment = async (amount: string, recipient: string) => {
    try {
      await paymentTokenator.sendLivePayment({
        recipient,
        amount: Number(amount),
      })
      toast.success('Payment successfully sent! 🎉')
    } catch (error) {
      toast.error('Failed to send payment! 😭')
    }
  }

  const handleAcceptPayment = async (payment: Payment) => {
    await paymentTokenator.acceptPayment(payment)
    setPayments([...payments.filter((x) => x.messageId !== payment.messageId)])
  }

  const handleRejectPayment = async (payment: Payment) => {
    await paymentTokenator.rejectPayment(payment)
    setPayments([...payments.filter((x) => x.messageId !== payment.messageId)])
  }

  useAsyncEffect(async () => {
    try {
      setLoading(true)
      const paymentsToReceive = await paymentTokenator.listIncomingPayments()
      setPayments(paymentsToReceive)

      await paymentTokenator.listenForLivePayments({
        onPayment: (payment: any) => {
          setLoading(true)
          setPayments((prevPayments) => [
            ...prevPayments,
            {
              messageId: payment.messageId,
              sender: payment.sender,
              amount: payment.body.amount,
              token: payment.body,
            },
          ])
          setLoading(false)
        },
        autoAcknowledge: false
      })
    } catch (error) {
      // @ts-ignore
      if (error.code === 'ERR_NO_METANET_IDENTITY') {
        console.log(error)
      } else {
        // Handle other errors or rethrow them
        console.error(error)
      }
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
          pt: 5,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            pt: 4,
          }}
        >
          <img
            src='/PeerPay.png'
            width={'300px'}
          />
          <Typography variant='body1' paddingTop={5}>
            Simple Peer-to-peer Payments
          </Typography>
          <PaymentForm onSend={handleSendPayment} />
        </Box>
        <Typography variant='h6' component='h2' paddingTop={5}>
          Incoming Payments
        </Typography>
        {loading && <LinearProgress />}
        <PaymentList
          payments={payments}
          onAccept={handleAcceptPayment}
          onReject={handleRejectPayment}
        />
      </Box>
    </Container>
  )
}

export default App
