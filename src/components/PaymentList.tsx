import React, { useEffect, useState } from 'react'
import { List, ListItem, ListItemText, Button, ListItemSecondaryAction, useTheme, Box, Divider } from '@mui/material'
import { IdentityCard } from 'metanet-identity-react'

export interface Payment {
    messageId: string
  sender: string
  amount: string
  token: Token
}

interface Token {
    amount: number,
    derivationPrefix: string,
    transaction: object
}

interface PaymentListProps {
  payments: Payment[]
  onAccept: (payment: Payment) => void
  onReject: (messageId: string) => void
}

const PaymentList: React.FC<PaymentListProps> = ({ payments, onAccept, onReject }) => {
const theme = useTheme()
  console.log('a', theme)
  return (
    <List>
      {payments.map(payment => (
        <Box>
          <Divider />
        <ListItem key={payment.messageId}>
          <IdentityCard 
            confederacyHost={'https://staging-confederacy.babbage.systems'}
            identityKey={payment.sender} 
            themeMode='dark'
          />
          <ListItemText primary={`${payment.token.amount} satoshis`} />
          <ListItemSecondaryAction>
            <Button onClick={() => onAccept(payment)} color="primary">Accept</Button>
            <Button onClick={() => onReject(payment.messageId)} color="secondary">Reject</Button>
          </ListItemSecondaryAction>
        </ListItem>
        </Box>
      ))}
    </List>
  )
}

export default PaymentList
