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
  isBulkAccepting?: boolean
}

const PaymentList: React.FC<PaymentListProps> = ({ payments = [], onUpdatePayments, isBulkAccepting = false }) => {
  const [processingMap, setProcessingMap] = useState<Record<string, 'accept' | 'reject'>>({})
  const handleAccept = async (payment: Payment) => {
    try {
      setProcessingMap(prev => ({ ...prev, [payment.messageId]: 'accept' }))
      
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
      setProcessingMap(prev => {
        const next = { ...prev }
        delete next[payment.messageId]
        return next
      })
    }
  }

  const handleReject = async (payment: Payment) => {
    try {
      setProcessingMap(prev => ({ ...prev, [payment.messageId]: 'reject' }))
      
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
      setProcessingMap(prev => {
        const next = { ...prev }
        delete next[payment.messageId]
        return next
      })
    }
  }

  return (
    <List sx={{ pb: 3 }}>
      {payments.length === 0 ? (
        <ListItem>
          <Typography variant="body2" color="text.secondary">No incoming payments</Typography>
        </ListItem>
      ) : payments.map((payment) => {
        console.log('[PaymentList] Displaying payment amount:', payment.token.amount)

        return (
          <Box key={payment.messageId}>
            <Divider />
            <ListItem sx={{ py: 2 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr auto', sm: '1fr auto auto' },
                  alignItems: 'center',
                  columnGap: 2,
                  rowGap: { xs: 1, sm: 0 },
                  width: '100%'
                }}
              >
                {/* Sender Identity (Left Side) */}
                <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                  <IdentityCard identityKey={payment.sender} themeMode="dark" />
                </Box>

                {/* Payment Amount (Now using AmountDisplay) */}
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    <AmountDisplay
                      paymentAmount={payment.token.amount}
                      formatOptions={{ useCommas: true, decimalPlaces: 0 }}
                    />
                    <span style={{ fontSize: '0.8em', opacity: 0.4 }}>
                    </span>
                  </Typography>
                </Box>

                {/* Accept & Reject Buttons (Move to the Far Right) */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                    gridColumn: { xs: '1 / -1', sm: 'auto' }
                  }}
                >
                  <Button 
                    onClick={() => handleAccept(payment)} 
                    color="primary" 
                    variant="contained" 
                    size="small"
                    disabled={isBulkAccepting || !!processingMap[payment.messageId]}
                  >
                    {processingMap[payment.messageId] === 'accept' ? (
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
                    disabled={isBulkAccepting || !!processingMap[payment.messageId]}
                  >
                    {processingMap[payment.messageId] === 'reject' ? (
                      <>
                        <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                        Processing...
                      </>
                    ) : 'Reject'}
                  </Button>
                </Box>
              </Box>
            </ListItem>
          </Box>
        )
      })}
    </List>
  )
}

export default PaymentList
