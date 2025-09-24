import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  TextField,
  Typography,
  Alert,
  IconButton,
} from '@mui/material'
import {
  QrCodeScanner as QrIcon,
  Contacts as ContactsIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { DisplayableIdentity, IdentityClient } from '@bsv/sdk'
import { toast } from 'react-toastify'
import QRScanner from './QRScanner'
import ContactSelector from './ContactSelector'
import { parseQRData } from '../utils/qrUtils'

interface ContactModalProps {
  open: boolean
  onClose: () => void
  onContactSelected: (contact: DisplayableIdentity) => void
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <Box hidden={value !== index} sx={{ width: '100%' }}>
      {value === index && children}
    </Box>
  )
}

const ContactModal: React.FC<ContactModalProps> = ({
  open,
  onClose,
  onContactSelected,
}) => {
  const [activeTab, setActiveTab] = useState(0)
  const [showScanner, setShowScanner] = useState(false)
  const [contactName, setContactName] = useState('')
  const [scannedKey, setScannedKey] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedContact, setSelectedContact] = useState<DisplayableIdentity | null>(null)
  const [identityClient] = useState(() => new IdentityClient())

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    // Reset states when switching tabs
    setScannedKey('')
    setContactName('')
    setSelectedContact(null)
  }


  const handleQRScan = async (data: string) => {
    setIsProcessing(true)
    
    try {
      const identityKey = parseQRData(data)
      
      if (!identityKey) {
        toast.error('QR code does not contain a valid identity key')
        setShowScanner(false)
        return
      }
      
      setScannedKey(identityKey)
      setShowScanner(false)
      setActiveTab(2) // Switch to "Add Contact" tab
      toast.success('QR code scanned successfully!')
    } catch (error: any) {
      console.error('Error processing QR scan:', error)
      toast.error(`Failed to process QR code: ${error.message || 'Unknown error'}`)
      setShowScanner(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveContact = async () => {
    if (!scannedKey || !contactName.trim()) {
      toast.error('Please provide both a contact name and identity key')
      return
    }

    setIsProcessing(true)
    
    try {
      const displayableIdentity: DisplayableIdentity = {
        name: contactName.trim(),
        identityKey: scannedKey,
        avatarURL: '',
        abbreviatedKey: scannedKey.substring(0, 8) + '...',
        badgeIconURL: '',
        badgeLabel: '',
        badgeClickURL: '',
      }

      await identityClient.saveContact(displayableIdentity)
      
      toast.success(`Contact "${contactName}" saved successfully!`)
      
      // Select the newly created contact and close modal
      onContactSelected(displayableIdentity)
      handleClose()
    } catch (error: any) {
      console.error('Error saving contact:', error)
      toast.error(`Failed to save contact: ${error.message || 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleContactSelect = (contact: DisplayableIdentity) => {
    setSelectedContact(contact)
  }

  const handleUseSelectedContact = () => {
    if (selectedContact) {
      onContactSelected(selectedContact)
      handleClose()
    }
  }

  const handleClose = () => {
    // Reset all states
    setActiveTab(0)
    setShowScanner(false)
    setContactName('')
    setScannedKey('')
    setSelectedContact(null)
    setIsProcessing(false)
    onClose()
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: 500,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Select Recipient
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} centered>
            <Tab icon={<ContactsIcon />} label="Contacts" />
            <Tab icon={<QrIcon />} label="Scan QR" />
            <Tab icon={<PersonAddIcon />} label="Add Contact" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {/* Contacts Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ p: 2 }}>
              <ContactSelector
                onContactSelected={handleContactSelect}
                selectedContactKey={selectedContact?.identityKey}
              />
            </Box>
          </TabPanel>

          {/* QR Scanner Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ p: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 200,
                  p: 3,
                  textAlign: 'center',
                }}
              >
                <QrIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Scan QR Code
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Scan a QR code containing an identity key to add as a contact
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<QrIcon />}
                  onClick={() => setShowScanner(true)}
                  size="large"
                >
                  Open Camera
                </Button>
              </Box>

            </Box>
          </TabPanel>

          {/* Add Contact Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Add New Contact
              </Typography>
              
              {scannedKey && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Identity key scanned successfully!
                </Alert>
              )}
              
              <TextField
                fullWidth
                label="Contact Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="Enter a name for this contact"
              />
              
              <TextField
                fullWidth
                label="Identity Key"
                value={scannedKey}
                onChange={(e) => setScannedKey(e.target.value)}
                placeholder="Enter identity key or scan QR code"
                multiline
                rows={3}
                sx={{
                  mb: 2,
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                  },
                }}
              />
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<QrIcon />}
                  onClick={() => setShowScanner(true)}
                  disabled={isProcessing}
                >
                  Scan QR
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveContact}
                  disabled={!contactName.trim() || !scannedKey.trim() || isProcessing}
                  sx={{ ml: 'auto' }}
                >
                  {isProcessing ? 'Saving...' : 'Save Contact'}
                </Button>
              </Box>
            </Box>
          </TabPanel>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          {activeTab === 0 && (
            <Button
              variant="contained"
              onClick={handleUseSelectedContact}
              disabled={!selectedContact}
            >
              Use Selected Contact
            </Button>
          )}
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* QR Scanner Overlay */}
      <QRScanner
        isOpen={showScanner}
        onScan={handleQRScan}
        onClose={() => setShowScanner(false)}
      />
    </>
  )
}

export default ContactModal
