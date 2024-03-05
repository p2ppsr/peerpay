import React, { useEffect, useState } from 'react'
import { Container, Typography, Box, LinearProgress } from '@mui/material'
import PaymentForm from './components/PaymentForm'
import PaymentList, { Payment } from './components/PaymentList'
import PaymentTokenator from 'payment-tokenator'
import { useTheme } from '@mui/material/styles'
import { toast } from 'react-toastify'
// import { useMNCErrorHandler } from 'metanet-react-prompt'

const App: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const paymentTokenator = new PaymentTokenator()
  const [loading, setLoading] = useState(false)
  const theme = useTheme()
  // const handleMNCError = useMNCErrorHandler();

  const handleSendPayment = async (amount: string, recipient: string) => {
    try {
      const newPayment = await paymentTokenator.sendPayment({
        recipient,
        amount: Number(amount)
      })
      toast.success('Payment successfully sent! 🎉')
      console.log(newPayment)
    } catch (error) {
      toast.error('Failed to send payment! 😭')
    }
  }

  const handleAcceptPayment = async (payment: Payment) => {
    await paymentTokenator.acceptPayment(payment)
    setPayments([...payments.filter(x => x.messageId !== payment.messageId)])
  }

  const handleRejectPayment = (id: string) => {
    // TODO Implement logic to reject payment
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const paymentsToReceive = await paymentTokenator.listIncomingPayments()
        console.log('incoming payments', paymentsToReceive)
        setPayments(paymentsToReceive)
      } catch (error: any) {
        if (error.code === 'ERR_NO_METANET_IDENTITY') {
          // Set the state to indicate the specific MNC error
          // setHasMNCError(true);
          // handleMNCError(error);
        } else {
          // Handle other errors or rethrow them
          console.error(error);
        }
        // }
      }
      setLoading(false)
    })()
  }, [])

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          bgcolor: 'background.default', // Use the default background color from the theme
          minHeight: '100vh', // Ensure it covers the full viewport height
          // minWidth: '100vw', // Ensure it covers the full viewport width
          color: 'text.primary', // Use the primary text color from the theme
          pt: 5, // Add padding to the top, '4' is based on the theme's spacing scale
        }}
      >
        <Box sx={{
          display: 'flex', // Enable flex container
          flexDirection: 'column', // Stack children vertically
          justifyContent: 'center', // Center horizontally (in the context of the column layout)
          alignItems: 'center', // Center items horizontally in the container
          pt: 4, // Add padding to the top
        }}>
          <img src='https://peerpay.babbage.systems/Images/PeerPay.png' width={'300px'} />
          <Typography variant="body1" paddingTop={5}>
            Simple Peer-to-peer Payments
          </Typography>
          <PaymentForm onSend={handleSendPayment} />
        </Box>
        <Typography variant="h6" component="h2" paddingTop={5}>
          Incoming Payments
        </Typography>
        {loading && <LinearProgress />}
        <PaymentList payments={payments} onAccept={handleAcceptPayment} onReject={handleRejectPayment} />
      </Box>
    </Container>
  )
}

export default App
