import React from 'react'
import { List, ListItem, ListItemText, Button, ListItemSecondaryAction, Box, Divider, Typography } from '@mui/material'
import { IdentityCard } from '@bsv/identity-react'
import { PeerPayClient, IncomingPayment } from '@bsv/p2p'
import { WalletClient } from '@bsv/sdk'
import { toast } from 'react-toastify'
import { AmountDisplay } from 'amountinator-react'

// Initialize PeerPayClient
const walletClient = new WalletClient()
const peerPayClient = new PeerPayClient({
  messageBoxHost: 'https://messagebox.babbage.systems',
  walletClient
})

// Define Payment interface
export interface Payment {
  messageId: number
  sender: string
  token: {
    customInstructions: {
      derivationPrefix: string
      derivationSuffix: string
    }
    transaction: Uint8Array
    amount: number
  }
}

// Function to format satoshis for display
const formatSatoshis = (satoshis: number): string => {
  return `${satoshis.toLocaleString()} Sats`
}

interface PaymentListProps {
  payments?: Payment[] // Default to undefined to prevent crashes
  onUpdatePayments: () => void // Function to refresh payment list
}

const PaymentList: React.FC<PaymentListProps> = ({ payments = [], onUpdatePayments }) => {
  const handleAccept = async (payment: Payment) => {
    try {
      const formattedPayment: IncomingPayment = {
        messageId: payment.messageId,
        sender: payment.sender,
        token: {
          ...payment.token,
          transaction: Array.from(payment.token.transaction),
        },
      }

      await peerPayClient.acceptPayment(formattedPayment)
      toast.success('Payment accepted!')
      onUpdatePayments() // Refresh payment list
    } catch (error) {
      toast.error('Failed to accept payment.')
      console.error('Error accepting payment:', error)
    }
  }

  const handleReject = async (payment: Payment) => {
    try {
      const formattedPayment: IncomingPayment = {
        ...payment,
        token: {
          ...payment.token,
          transaction: Array.from(payment.token.transaction),
        },
      }

      await peerPayClient.rejectPayment(formattedPayment)
      toast.info('Payment rejected.')
      onUpdatePayments() // Refresh payment list
    } catch (error) {
      toast.error('Failed to reject payment.')
      console.error('Error rejecting payment:', error)
    }
  }

  return (
    <List>
      {payments.map((payment) => {
        console.log('[PaymentList] Displaying payment amount:', payment.token.amount)

        return (
          <Box key={payment.messageId}>
            <Divider />
            <ListItem sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

              {/* Sender Identity (Left Side) */}
              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '345px', flexShrink: 0 }}>
                <IdentityCard identityKey={payment.sender} themeMode="dark" />
              </Box>

              {/* Payment Amount (Now using AmountDisplay) */}
              <Box sx={{ flexShrink: 0, minWidth: '120px', textAlign: 'right', marginLeft: '50px' }}>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  <AmountDisplay
                    paymentAmount={payment.token.amount}
                    formatOptions={{ useCommas: true, decimalPlaces: 10 }}
                  />
                  {/* Optional debug fallback */}
                  <span style={{ fontSize: '0.8em', opacity: 0.4 }}>
                  </span>
                </Typography>
              </Box>

              {/* Accept & Reject Buttons (Move to the Far Right) */}
              <Box sx={{ flexShrink: 0, display: 'flex', gap: 2, marginLeft: '50px' }}>
                <Button onClick={() => handleAccept(payment)} color="primary" variant="contained" size="small">
                  Accept
                </Button>
                <Button onClick={() => handleReject(payment)} color="secondary" variant="outlined" size="small">
                  Reject
                </Button>
              </Box>

            </ListItem>
          </Box>
        )
      })}
    </List>
  )
}

export default PaymentList
