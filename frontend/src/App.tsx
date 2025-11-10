import React, { useState, useEffect, useCallback } from 'react'
import { Container, Typography, Box, LinearProgress, Button, CircularProgress } from '@mui/material'
import PaymentForm from './components/PaymentForm'
import PaymentList, { Payment } from './components/PaymentList'
import RecentlySentList from './components/RecentlySentList'

import './App.scss'
import { toast } from 'react-toastify'
import { AmountDisplay } from 'amountinator-react'

// Import PeerPayClient
import {WalletClient} from '@bsv/sdk'
import { IncomingPayment } from '@bsv/message-box-client'
import constants from './utils/constants'
import { peerPayClient } from './utils/peerPayClient'

// Interface for sent payments
export interface SentPayment {
  amount: number
  recipient: string
  timestamp: number
  id: string
}

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

const App: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [recentlySent, setRecentlySent] = useState<SentPayment[]>([])
  const [loading, setLoading] = useState(false)
  const [bulkAccepting, setBulkAccepting] = useState(false)

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      const paymentsToReceive = await peerPayClient.listIncomingPayments(constants.messageboxURL)

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
  }, [])

  // Load initial payments
  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  // Listen for live payments
  useEffect(() => {
    let isSubscribed = true
    const listenForPayments = async () => {
      try {
        await peerPayClient.initializeConnection()

        await peerPayClient.listenForLivePayments({
          overrideHost: constants.messageboxURL,
          onPayment: (payment: IncomingPayment) => {
            if (!isSubscribed) return
            const formattedPayment: Payment = {
              ...payment,
              token: {
                ...payment.token,
                transaction: new Uint8Array(payment.token.transaction)
              }
            }

            setPayments((prevPayments) => {
              const exists = prevPayments.some(existing => existing.messageId === formattedPayment.messageId)
              return exists ? prevPayments : [...prevPayments, formattedPayment]
            })
          }
        })
      } catch (error) {
        console.error('[APP] Error listening for live payments:', error)
      }
    }

    listenForPayments()
    return () => {
      isSubscribed = false
    }
  }, [])

  // Handle payment sent
  const handlePaymentSent = (amount: number, recipient: string) => {
    const sentPayment: SentPayment = {
      id: Date.now().toString(),
      amount,
      recipient,
      timestamp: Date.now()
    }
    
    setRecentlySent(prev => [sentPayment, ...prev.slice(0, 4)]) // Keep only last 5 sent payments
    fetchPayments() // Refresh incoming payments
  }
  useEffect(() => {
      (async () => {
        try {
          const wallet = await new WalletClient()
          await wallet.waitForAuthentication()
        } catch (e) {
          console.error(e)
        }
      })()
    }, [])
  const handleAcceptAll = async () => {
    if (!payments.length) return
    setBulkAccepting(true)
    const tasks = payments.map(async (p) => {
      try {
        const formatted: IncomingPayment = {
          messageId: p.messageId,
          sender: p.sender,
          token: {
            ...p.token,
            transaction: Array.from(p.token.transaction)
          },
          outputIndex: p.token.outputIndex ?? 0
        }
        await peerPayClient.acceptPayment(formatted)
        setPayments(prev => prev.filter(x => x.messageId !== p.messageId))
        return { ok: true }
      } catch (e) {
        console.error('[APP] Failed to accept payment', p.messageId, e)
        return { ok: false }
      }
    })
    const results = await Promise.all(tasks)
    const accepted = results.filter(r => r.ok).length
    const failed = results.length - accepted
    if (accepted) toast.success(`Accepted ${accepted} payment${accepted !== 1 ? 's' : ''}.`)
    if (failed) toast.error(`Failed to accept ${failed} payment${failed !== 1 ? 's' : ''}.`)
    setBulkAccepting(false)
  }

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
          <PaymentForm onSend={handlePaymentSent} />
        </Box>

        {recentlySent.length > 0 && (
          <>
            <Typography variant='h6' component='h2' paddingTop={5}>
              Recently Sent
            </Typography>
            <RecentlySentList payments={recentlySent} />
          </>
        )}

        <Typography variant='h6' component='h2' paddingTop={5}>
          Incoming Payments
        </Typography>
        {payments.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1,
              mb: 2,
              gap: 1,
              flexWrap: 'wrap'
            }}
          >
            <Typography variant='body2'>
              {payments.length} payments • Total{' '}
              <AmountDisplay
                paymentAmount={payments.reduce((s, p) => s + (p.token.amount || 0), 0)}
                formatOptions={{ useCommas: true, decimalPlaces: 0 }}
              />
            </Typography>
            <Button
              variant='contained'
              color='primary'
              onClick={handleAcceptAll}
              disabled={bulkAccepting}
              size='small'
            >
              {bulkAccepting ? (
                <>
                  <CircularProgress size={16} color='inherit' sx={{ mr: 1 }} />
                  Accepting...
                </>
              ) : `Accept All (${payments.length})`}
            </Button>
          </Box>
        )}
        {loading && <LinearProgress />}
        <PaymentList
          payments={payments}
          onUpdatePayments={(messageId: string) => {
            setPayments(prev => prev.filter(p => p.messageId !== messageId))
          }}
          isBulkAccepting={bulkAccepting}
        />
      </Box>
    </Container>
  )
}

export default App
