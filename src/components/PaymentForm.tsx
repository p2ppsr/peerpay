import React, { useCallback, useState } from 'react'
import { TextField, Button, Box, InputAdornment, CircularProgress, Chip, Avatar, Typography } from '@mui/material'
import { IdentitySearchField } from '@bsv/identity-react'
import { ContactPage as ContactsIcon, Person as PersonIcon, QrCodeScanner as QrIcon } from '@mui/icons-material'
import { toast } from 'react-toastify'
import constants from '../utils/constants'
import { PeerPayClient } from '@bsv/message-box-client'
import { DisplayableIdentity, WalletClient } from '@bsv/sdk'
import { AmountInputField } from 'amountinator-react'
import ContactModal from './ContactModal'

// Initialize PeerPayClient
const walletClient = new WalletClient()
const peerPayClient = new PeerPayClient({
  messageBoxHost: constants.messageboxURL,
  walletClient
})

interface PaymentFormProps {
  onSend: (amount: number, recipient: string) => void
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSend }) => {
  const [recipient, setRecipient] = useState<DisplayableIdentity | null>(null)
  const [amount, setAmount] = useState('')
  const [amountInSats, setAmountInSats] = useState(0) // Default to 0
  const [isSending, setIsSending] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const currencySymbol = 'Sats' // Default to Bitcoin satoshis

  // Store identity
  const handleIdentitySelected = (identity: DisplayableIdentity) => {
    setRecipient(identity) // Store the full identity directly
  }

  // Handle contact selection from modal
  const handleContactSelected = (contact: DisplayableIdentity) => {
    setRecipient(contact)
    setShowContactModal(false)
  }

  const clearRecipient = () => {
    setRecipient(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!recipient || !recipient.identityKey) {
      toast.error('Who should the payment go to?')
      return
    }

    const finalRecipientKey = recipient.identityKey.trim() // Ensure no spaces

    if (finalRecipientKey.length !== 66) {
      toast.error('Invalid recipient key detected!')
      console.error('Truncated Identity Key:', finalRecipientKey)
      return
    }

    if (amountInSats <= 0) {
      toast.error('How much do you want to send?')
      return
    }

    setIsSending(true)

    try {
      // Use PeerPayClient to send the payment
      await peerPayClient.sendLivePayment({ recipient: finalRecipientKey, amount: amountInSats })
      toast.success('Payment sent successfully!')

      onSend(amountInSats, finalRecipientKey)
      setAmount('')
    } catch (error: any) {
      toast.error('Error sending payment.')

      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error)

      console.error('[Payment Error]', message)
    } finally {
      setIsSending(false)
    }
  }

  const handleAmountChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value.replace(/[^0-9]/g, '') // Allow only numbers
    setAmount(input)

    if (input) {
      const satoshis = Number(input) // Assume user enters satoshis directly
      setAmountInSats(satoshis || 0) // Default to 0
    }
  }, [])

  return (
    <Box component='form' onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
      {/* Recipient Selection */}
      <Box sx={{ width: '100%', maxWidth: '350px' }}>
        {recipient ? (
          // Show selected recipient
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: 1,
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
            }}
          >
            <Avatar
              src={recipient.avatarURL}
              sx={{ bgcolor: 'primary.main' }}
            >
              {recipient.avatarURL ? null : <PersonIcon />}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                {recipient.name || 'Unknown Contact'}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  wordBreak: 'break-all',
                }}
              >
                {recipient.abbreviatedKey || recipient.identityKey}
              </Typography>
            </Box>
            <Button
              size="small"
              onClick={clearRecipient}
              sx={{ minWidth: 'auto' }}
            >
              Change
            </Button>
          </Box>
        ) : (
          // Show recipient selection options
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ContactsIcon />}
              onClick={() => setShowContactModal(true)}
              sx={{ flex: 1 }}
            >
              Select Contact
            </Button>
            <Button
              variant="outlined"
              startIcon={<QrIcon />}
              onClick={() => setShowContactModal(true)}
              sx={{ flex: 1 }}
            >
              Scan QR
            </Button>
          </Box>
        )}

        {/* Fallback to identity search */}
        {!recipient && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
              Or search for an identity:
            </Typography>
            <IdentitySearchField
              onIdentitySelected={handleIdentitySelected}
              appName='PeerPay'
            />
          </Box>
        )}
      </Box>

      <Box sx={{ width: '100%', maxWidth: '350px' }}>
        <Box
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#222', // dark input
              color: '#fff',
            },
            '& .MuiInputBase-input': {
              color: '#fff', // typed text
            },
            '& .MuiInputLabel-root': {
              color: '#ccc', // label color
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#555',
            },
            '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#888',
            },
          }}
        >
          <AmountInputField
            onSatoshisChange={(sats: number) => {
              console.log('[AmountInputField] Satoshis:', sats)
              setAmountInSats(sats)
            }}
          />
        </Box>
      </Box>


      <Button
        sx={{ width: '10em' }}
        type='submit'
        variant='contained'
        disabled={isSending}
      >
        {isSending ? (
          <>
            <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
            Sending...
          </>
        ) : 'Send'}
      </Button>

      {/* Contact Modal */}
      <ContactModal
        open={showContactModal}
        onClose={() => setShowContactModal(false)}
        onContactSelected={handleContactSelected}
      />
    </Box>
  )
}

export default PaymentForm
