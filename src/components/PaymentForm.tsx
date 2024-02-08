import React, { useState } from 'react'
import { TextField, Button, Box } from '@mui/material'
import { Identity, IdentitySearchField } from 'metanet-identity-react'

interface PaymentFormProps {
  onSend: (amount: string, recipient: string) => void
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSend }) => {
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState<Identity>({} as Identity)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSend(amount, recipient.identityKey)
    setAmount('')
    setRecipient({} as Identity)
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField label="Amount" variant="outlined" value={amount} onChange={e => setAmount(e.target.value)} />
      <IdentitySearchField 
            confederacyHost={'https://staging-confederacy.babbage.systems'} 
            onIdentitySelected={(identity) => {
                setRecipient(identity)
          }}/>
      <Button type="submit" variant="contained">Send</Button>
    </Box>
  )
}

export default PaymentForm
