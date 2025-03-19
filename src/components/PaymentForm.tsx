import React, { useCallback, useState } from 'react'
import { TextField, Button, Box, InputAdornment } from '@mui/material'
import { IdentitySearchField, Identity } from '@bsv/identity-react'
import { toast } from 'react-toastify'
import constants from '../utils/constants'
import { PeerPayClient } from '@bsv/p2p'
import { WalletClient } from '@bsv/sdk'

// Initialize PeerPayClient
const walletClient = new WalletClient('json-api', 'non-admin.com')
const peerPayClient = new PeerPayClient({
  messageBoxHost: 'https://messagebox.babbage.systems',
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
    console.log('Selected Identity:', identity)
    console.log('Full Identity Key:', identity.identityKey)

    setRecipient(identity) // Store the full identity directly
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!recipient || !recipient.identityKey) {
      toast.error('Who should the payment go to?')
      return
    }

    const finalRecipientKey = recipient.identityKey.trim() // Ensure no spaces
    console.log('Final Recipient Key (Before Sending):', finalRecipientKey)

    if (finalRecipientKey.length !== 66) { 
      toast.error('Invalid recipient key detected!')
      console.error('Truncated Identity Key:', finalRecipientKey)
      return
    }

    if (!amount || amount === '' || amount === '0') {
      toast.error('How much do you want to send?')
      return
    }

    try {
      // Use PeerPayClient to send the payment
      console.log('Sending Payment:', { recipient: finalRecipientKey, amount: amountInSats })

      await peerPayClient.sendPayment({ recipient: finalRecipientKey, amount: amountInSats })
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
        confederacyHost={constants.confederacyURL}
        onIdentitySelected={handleIdentitySelected}
        appName='PeerPay'
      />
      <TextField
        sx={{ width: '350px' }}
        label='Amount (Sats)'
        variant='filled'
        value={amount}
        InputProps={{
          startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>
        }}
        onChange={handleAmountChange}
      />
      <Button sx={{ width: '10em' }} type='submit' variant='contained'>Send</Button>
    </Box>
  )
}

export default PaymentForm
