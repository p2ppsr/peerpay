import React, { useEffect, useState } from 'react'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  Delete as DeleteIcon,
  Person as PersonIcon,
  ContactPage as ContactIcon,
} from '@mui/icons-material'
import { DisplayableIdentity, IdentityClient } from '@bsv/sdk'
import { toast } from 'react-toastify'

interface ContactSelectorProps {
  onContactSelected: (contact: DisplayableIdentity) => void
  selectedContactKey?: string
}

const ContactSelector: React.FC<ContactSelectorProps> = ({
  onContactSelected,
  selectedContactKey,
}) => {
  const [contacts, setContacts] = useState<DisplayableIdentity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [identityClient] = useState(() => new IdentityClient())

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const contactList = await identityClient.getContacts()
      setContacts(contactList)
    } catch (err: any) {
      console.error('Error loading contacts:', err)
      setError(`Failed to load contacts: ${err.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleContactSelect = (contact: DisplayableIdentity) => {
    onContactSelected(contact)
  }

  const handleDeleteContact = async (
    event: React.MouseEvent,
    identityKey: string,
    contactName: string
  ) => {
    event.stopPropagation() // Prevent contact selection when deleting

    try {
      await identityClient.removeContact(identityKey)
      
      // Update local state
      setContacts((prev) => prev.filter((c) => c.identityKey !== identityKey))
      
      toast.success(`Removed ${contactName} from contacts`)
    } catch (err: any) {
      console.error('Error removing contact:', err)
      toast.error(`Failed to remove contact: ${err.message || 'Unknown error'}`)
    }
  }

  const formatIdentityKey = (key: string) => {
    return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          minHeight: 200,
        }}
      >
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading contacts...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (contacts.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          textAlign: 'center',
          minHeight: 200,
        }}
      >
        <ContactIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No contacts yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add contacts by scanning QR codes or searching for identities
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', maxHeight: 400, overflow: 'auto' }}>
      <List>
        {contacts.map((contact, index) => (
          <React.Fragment key={contact.identityKey}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleContactSelect(contact)}
                selected={selectedContactKey === contact.identityKey}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                }}
              >
                <Avatar
                  src={contact.avatarURL}
                  sx={{
                    mr: 2,
                    bgcolor: selectedContactKey === contact.identityKey 
                      ? 'primary.contrastText' 
                      : 'primary.main',
                    color: selectedContactKey === contact.identityKey 
                      ? 'primary.main' 
                      : 'primary.contrastText',
                  }}
                >
                  {contact.avatarURL ? null : (
                    <PersonIcon />
                  )}
                </Avatar>
                
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 'medium',
                        color: selectedContactKey === contact.identityKey 
                          ? 'inherit' 
                          : 'text.primary',
                      }}
                    >
                      {contact.name || 'Unknown Contact'}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      sx={{
                        color: selectedContactKey === contact.identityKey 
                          ? 'rgba(255, 255, 255, 0.7)' 
                          : 'text.secondary',
                        fontFamily: 'monospace',
                      }}
                    >
                      {formatIdentityKey(contact.identityKey)}
                    </Typography>
                  }
                />
                
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={(event) =>
                      handleDeleteContact(
                        event,
                        contact.identityKey,
                        contact.name || 'Unknown Contact'
                      )
                    }
                    sx={{
                      color: selectedContactKey === contact.identityKey 
                        ? 'rgba(255, 255, 255, 0.7)' 
                        : 'text.secondary',
                      '&:hover': {
                        color: 'error.main',
                        backgroundColor: 'rgba(211, 47, 47, 0.1)',
                      },
                    }}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItemButton>
            </ListItem>
            
            {index < contacts.length - 1 && (
              <Divider sx={{ mx: 2 }} />
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  )
}

export default ContactSelector
