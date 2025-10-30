import React, { useState } from 'react'
import { List, ListItem, Button, Box, Divider, Typography, CircularProgress } from '@mui/material'
import { IdentityCard } from '@bsv/identity-react'
import { IncomingPayment } from '@bsv/message-box-client'
import { toast } from 'react-toastify'
import { AmountDisplay } from 'amountinator-react'
import { peerPayClient } from '../utils/peerPayClient'

// Define Payment interface
export interface Payment {
  messageId: string
  sender: string
  token: {
    customInstructions: {
      derivationPrefix: string
      derivationSuffix: string
    }
    transaction: Uint8Array
    amount: number
    outputIndex?: number
  }
}

interface PaymentListProps {
  payments?: Payment[] // Default to undefined to prevent crashes
  onUpdatePayments: (messageId: string) => void // Function to refresh payment list
}

const PaymentList: React.FC<PaymentListProps> = ({ payments = [], onUpdatePayments }) => {
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null)
  const [processingAction, setProcessingAction] = useState<'accept' | 'reject' | null>(null)
  const handleAccept = async (payment: Payment) => {
    try {
      setProcessingPaymentId(payment.messageId)
      setProcessingAction('accept')
      
      const formattedPayment: IncomingPayment = {
        messageId: payment.messageId,
        sender: payment.sender,
        token: {
          ...payment.token,
          transaction: Array.from(payment.token.transaction),
        },
        outputIndex: payment.token.outputIndex ?? 0
      }

      await peerPayClient.acceptPayment(formattedPayment)
      toast.success('Payment accepted!')
      onUpdatePayments(payment.messageId) // Refresh payment list
    } catch (error) {
      toast.error('Failed to accept payment.')
      console.error('Error accepting payment:', error)
    } finally {
      setProcessingPaymentId(null)
      setProcessingAction(null)
    }
  }

  const handleReject = async (payment: Payment) => {
    try {
      setProcessingPaymentId(payment.messageId)
      setProcessingAction('reject')
      
      const formattedPayment: IncomingPayment = {
        ...payment,
        token: {
          ...payment.token,
          transaction: Array.from(payment.token.transaction),
        },
        outputIndex: payment.token.outputIndex ?? 0
      }

      await peerPayClient.rejectPayment(formattedPayment)
      toast.info('Payment rejected.')
      onUpdatePayments(payment.messageId) // Refresh payment list
    } catch (error) {
      toast.error('Failed to reject payment.')
      console.error('Error rejecting payment:', error)
    } finally {
      setProcessingPaymentId(null)
      setProcessingAction(null)
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
                    formatOptions={{ useCommas: true, decimalPlaces: 0 }}
                  />
                  {/* Optional debug fallback */}
                  <span style={{ fontSize: '0.8em', opacity: 0.4 }}>
                  </span>
                </Typography>
              </Box>

              {/* Accept & Reject Buttons (Move to the Far Right) */}
              <Box sx={{ flexShrink: 0, display: 'flex', gap: 2, marginLeft: '50px' }}>
                <Button 
                  onClick={() => handleAccept(payment)} 
                  color="primary" 
                  variant="contained" 
                  size="small"
                  disabled={processingPaymentId === payment.messageId}
                >
                  {processingPaymentId === payment.messageId && processingAction === 'accept' ? (
                    <>
                      <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                      Processing...
                    </>
                  ) : 'Accept'}
                </Button>
                <Button 
                  onClick={() => handleReject(payment)} 
                  color="secondary" 
                  variant="outlined" 
                  size="small"
                  disabled={processingPaymentId === payment.messageId}
                >
                  {processingPaymentId === payment.messageId && processingAction === 'reject' ? (
                    <>
                      <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                      Processing...
                    </>
                  ) : 'Reject'}
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
