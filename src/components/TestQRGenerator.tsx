import React, { useState } from 'react'
import { Box, Button, Typography, TextField, Card, CardContent } from '@mui/material'
import { generateSimpleIdentityQR, generateIdentityQR } from '../utils/qrUtils'

const TestQRGenerator: React.FC = () => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [testKey] = useState('0279BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798')
  const [customKey, setCustomKey] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const generateTestQR = async (key: string, structured = false) => {
    setIsGenerating(true)
    try {
      const qrUrl = structured 
        ? await generateIdentityQR(key, { width: 300 })
        : await generateSimpleIdentityQR(key, { width: 300 })
      setQrDataUrl(qrUrl)
    } catch (error) {
      console.error('Error generating QR:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card sx={{ mt: 2, p: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Test QR Code Generator
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            onClick={() => generateTestQR(testKey, false)}
            disabled={isGenerating}
          >
            Generate Simple QR
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => generateTestQR(testKey, true)}
            disabled={isGenerating}
          >
            Generate JSON QR
          </Button>
        </Box>

        <TextField
          fullWidth
          label="Custom Identity Key"
          value={customKey}
          onChange={(e) => setCustomKey(e.target.value)}
          placeholder="Enter 66-character hex identity key"
          sx={{ mb: 2 }}
        />

        {customKey && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button 
              variant="contained" 
              onClick={() => generateTestQR(customKey, false)}
              disabled={isGenerating}
            >
              Generate Custom Simple QR
            </Button>
            <Button 
              variant="contained" 
              onClick={() => generateTestQR(customKey, true)}
              disabled={isGenerating}
            >
              Generate Custom JSON QR
            </Button>
          </Box>
        )}

        {qrDataUrl && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Test QR Code (scan this with the scanner):
            </Typography>
            <img 
              src={qrDataUrl} 
              alt="Test QR Code" 
              style={{ maxWidth: '100%', border: '1px solid #ccc' }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default TestQRGenerator
