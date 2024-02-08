import React, { useEffect, useState } from 'react'
import { Container, Typography, Box } from '@mui/material'
import PaymentForm from './components/PaymentForm'
import PaymentList, { Payment } from './components/PaymentList'
import PaymentTokenator from 'payment-tokenator'


const App: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const paymentTokenator = new PaymentTokenator()

  const handleSendPayment = async (amount: string, recipient: string) => {
    // TODO
  }

  const handleAcceptPayment = async (payment: Payment) => {
    await paymentTokenator.acceptPayment(payment)
  }

  const handleRejectPayment = (id: string) => {
    // TODO Implement logic to reject payment
  }

  useEffect(() => {
    (async() => {
        const paymentsToReceive = await paymentTokenator.listIncomingPayments()
        console.log('incoming payments', paymentsToReceive)
        setPayments(paymentsToReceive)
    })()
}, [])

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" component="h1" gutterBottom>
        PeerPay
      </Typography>
      <PaymentForm onSend={handleSendPayment} />
      <Box sx={{ marginY: 4 }}>
        <Typography variant="h6" component="h2">
          Incoming Payments
        </Typography>
        <PaymentList payments={payments} onAccept={handleAcceptPayment} onReject={handleRejectPayment} />
      </Box>
    </Container>
  )
}

export default App
