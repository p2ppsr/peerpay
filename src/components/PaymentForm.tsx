import React, { useState } from 'react'
import { TextField, Button, Box, useTheme } from '@mui/material'
import { Identity, IdentitySearchField } from 'metanet-identity-react'
import { toast } from 'react-toastify'

interface PaymentFormProps {
  onSend: (amount: string, recipient: string) => void
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSend }) => {
  const [recipient, setRecipient] = useState<Identity>({} as Identity)
  const [amount, setAmount] = useState('')
  const theme = useTheme()
  console.log('pf', theme)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!recipient || !recipient.identityKey) {
      toast.error('Who should the payment go to?')
      return
    } else if (!amount || amount === '' || amount === '0') {
      toast.error('How much do you want to send?')
      return
    }

    onSend(amount, recipient.identityKey)
    setAmount('')
    // setRecipient({} as Identity)
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
        <IdentitySearchField 
            confederacyHost={'https://staging-confederacy.babbage.systems'} 
            onIdentitySelected={(identity) => {
                setRecipient(identity)
            }}
            theme={theme}
        />
      <TextField sx={{width: '350px'}} label="Amount (satoshis)" variant="filled" value={amount} onChange={e => setAmount(e.target.value)} />
      <Button sx={{ width: '10em'}} type="submit" variant="contained">Send</Button>
    </Box>
  )
}

export default PaymentForm
