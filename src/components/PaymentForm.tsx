import React, { useCallback, useState } from 'react'
import { TextField, Button, Box, InputAdornment } from '@mui/material'
import { Identity, IdentitySearchField } from 'metanet-identity-react'
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
  const [recipient, setRecipient] = useState<Identity>({} as Identity)
  const [amount, setAmount] = useState('')
  const [amountInSats, setAmountInSats] = useState(1000)
  const currencySymbol = 'Sats' // Default to Bitcoin satoshis

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!recipient || !recipient.identityKey) {
      toast.error('Who should the payment go to?')
      return
    } else if (!amount || amount === '' || amount === '0') {
      toast.error('How much do you want to send?')
      return
    }

    try {
      // Use PeerPayClient to send the payment
      await peerPayClient.sendPayment({ recipient: recipient.identityKey, amount: amountInSats })
      toast.success('Payment sent successfully!')

      onSend(amountInSats, recipient.identityKey)
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
      setAmountInSats(satoshis || 1000)
    }
  }, [])

  return (
    <Box component='form' onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
      <IdentitySearchField
        confederacyHost={constants.confederacyURL}
        onIdentitySelected={(identity) => setRecipient(identity)}
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
