import React, { useCallback, useState } from 'react'
import { TextField, Button, Box, InputAdornment } from '@mui/material'
import { IdentitySearchField, Identity } from '@bsv/identity-react'
import { toast } from 'react-toastify'
import constants from '../utils/constants'
import { PeerPayClient } from '@bsv/p2p'
import { WalletClient } from '@bsv/sdk'
import { AmountInputField } from 'amountinator-react'

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
  const [recipient, setRecipient] = useState<Identity | null>(null)
  const [amount, setAmount] = useState('')
  const [amountInSats, setAmountInSats] = useState(0) // Default to 0
  const currencySymbol = 'Sats' // Default to Bitcoin satoshis


  // Store identity
  const handleIdentitySelected = (identity: Identity) => {

    setRecipient(identity) // Store the full identity directly
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

    try {
      // Use PeerPayClient to send the payment

      await peerPayClient.sendLivePayment({ recipient: finalRecipientKey, amount: amountInSats })
      toast.success('Payment sent successfully!')

      onSend(amountInSats, finalRecipientKey)
      setAmount('')
    } catch (error) {
      toast.error('Error sending payment.')
      console.error('Payment error:', error)
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
      <IdentitySearchField
        onIdentitySelected={handleIdentitySelected}
        appName='PeerPay'
      />

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


      <Button sx={{ width: '10em' }} type='submit' variant='contained'>Send</Button>
    </Box>
  )
}

export default PaymentForm
