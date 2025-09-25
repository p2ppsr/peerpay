import React from 'react'
import { List, ListItem, ListItemText, ListItemIcon, Typography, Box } from '@mui/material'
import { Send as SendIcon } from '@mui/icons-material'
import { AmountDisplay } from 'amountinator-react'
import { IdentityCard } from '@bsv/identity-react'
import { SentPayment } from '../App'

interface RecentlySentListProps {
  payments: SentPayment[]
}

const RecentlySentList: React.FC<RecentlySentListProps> = ({ payments }) => {
  const formatTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
      <List sx={{ width: '100%' }}>
        {payments.map((payment) => (
          <ListItem
            key={payment.id}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mb: 1,
              backgroundColor: 'background.paper',
            }}
          >
            <ListItemIcon>
              <SendIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ fontWeight: 'medium' }}>
                    <AmountDisplay 
                      paymentAmount={payment.amount}
                      formatOptions={{ useCommas: true, decimalPlaces: 2 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {formatTime(payment.timestamp)}
                  </Typography>
                </Box>
              }
              secondary={
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
                    sent to:
                  </Typography>
                  <Box sx={{
                    '& .MuiTypography-h6': {
                      color: 'text.primary !important'
                    },
                    '& .MuiTypography-body2': {
                      color: 'text.secondary !important'
                    },
                    '& *': {
                      color: 'inherit !important'
                    }
                  }}>
                    <IdentityCard 
                      identityKey={payment.recipient} 
                      themeMode="light"
                    />
                  </Box>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  )
}

export default RecentlySentList
