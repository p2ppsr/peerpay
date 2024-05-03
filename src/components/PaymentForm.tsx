import React, { useCallback, useState } from 'react'
import { TextField, Button, Box, useTheme, InputAdornment } from '@mui/material'
import { Identity, IdentitySearchField } from 'metanet-identity-react'
import { toast } from 'react-toastify'
import constants from '../utils/constants'
import { CurrencyConverter } from 'amountinator'
import useAsyncEffect from 'use-async-effect'

interface PaymentFormProps {
  onSend: (amount: string, recipient: string) => void
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSend }) => {
  const [recipient, setRecipient] = useState<Identity>({} as Identity)
  const [amount, setAmount] = useState('')
  const [amountInSats, setAmountInSats] = useState(1000)
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const currencyConverter = new CurrencyConverter()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!recipient || !recipient.identityKey) {
      toast.error('Who should the payment go to?')
      return
    } else if (!amount || amount === '' || amount === '0') {
      toast.error('How much do you want to send?')
      return
    }

    onSend(amountInSats.toString(), recipient.identityKey)
    setAmount('')
    // setRecipient({} as Identity)
  }

  useAsyncEffect(async () => {
    await currencyConverter.initialize()
    setCurrencySymbol(currencyConverter.getCurrencySymbol())
  }, [])

  const handleAmountChange = useCallback(async (event: any) => {
    const input = event.target.value.replace(/[^0-9.]/g, '')
    setAmount(input)
    if (input !== amount) {
      try {
        const satoshis = await currencyConverter.convertToSatoshis(Number(input))
        console.log('amount', satoshis)
        setAmountInSats(satoshis || 1000)
      } catch (error) {
        console.error('Error converting currency:', error)
      }
    }
  }, [])

  return (
    <Box component='form' onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
      <IdentitySearchField
        confederacyHost={constants.confederacyURL}
        onIdentitySelected={(identity) => {
          setRecipient(identity)
        }}
        // theme={theme}
        appName='PeerPay'
      />
      <TextField
        sx={{ width: '350px' }}
        label='Amount'
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
