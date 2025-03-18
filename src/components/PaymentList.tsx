import React from 'react'
import { List, ListItem, ListItemText, Button, ListItemSecondaryAction, Box, Divider } from '@mui/material'
import { IdentityCard } from 'metanet-identity-react'
import constants from '../utils/constants'
import { PeerPayClient, IncomingPayment } from '@bsv/p2p'
import { WalletClient } from '@bsv/sdk'
import { toast } from 'react-toastify'

// Initialize PeerPayClient
const walletClient = new WalletClient('json-api', 'non-admin.com')
const peerPayClient = new PeerPayClient({
  messageBoxHost: 'https://messagebox.babbage.systems',
  walletClient
})

// Updated Payment interface to match IncomingPayment from peerpay-client
export interface Payment {
  messageId: number
  sender: string
  token: {
    customInstructions: {
      derivationPrefix: string
      derivationSuffix: string
    }
    transaction: Uint8Array // Ensuring correct AtomicBEEF format
    amount: number
  }
}

// Function to format satoshis for display
const formatSatoshis = (satoshis: number): string => {
  return `${satoshis.toLocaleString()} Sats` // Display with commas for readability
}

interface PaymentListProps {
  payments: Payment[]
  onAccept: (payment: Payment) => void
  onReject: (payment: Payment) => void
}

const PaymentList: React.FC<PaymentListProps> = ({ payments, onAccept, onReject }) => {
  const handleAccept = async (payment: Payment) => {
    try {
      const formattedPayment: IncomingPayment = {
        ...payment,
        token: {
          ...payment.token,
          transaction: Array.from(payment.token.transaction), // Convert Uint8Array to number[]
        },
      }

      await peerPayClient.acceptPayment(formattedPayment)
      toast.success('Payment accepted!')
      onAccept(payment)
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
      onReject(payment)
    } catch (error) {
      toast.error('Failed to reject payment.')
      console.error('Error rejecting payment:', error)
    }
  }

  return (
    <List>
      {payments.map((payment) => (
        <Box key={payment.messageId}>
          <Divider />
          <ListItem>
            <IdentityCard
              identityKey={payment.sender}
              themeMode='dark'
            />
            <ListItemText>
              {formatSatoshis(payment.token.amount)}
            </ListItemText>
            <ListItemSecondaryAction>
              <Button onClick={() => handleAccept(payment)} color='primary'>Accept</Button>
              <Button onClick={() => handleReject(payment)} color='secondary'>Reject</Button>
            </ListItemSecondaryAction>
          </ListItem>
        </Box>
      ))}
    </List>
  )
}

export default PaymentList
