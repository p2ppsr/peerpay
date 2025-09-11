import React, { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import { Box, Button, CircularProgress, Typography, Alert } from '@mui/material'
import { Close as CloseIcon, CameraAlt as CameraIcon } from '@mui/icons-material'

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
  isOpen: boolean
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isOpen) {
      cleanup()
      return
    }

    initializeScanner()

    return () => {
      cleanup()
    }
  }, [isOpen])

  const initializeScanner = async () => {
    if (!videoRef.current) return

    try {
      setIsLoading(true)
      setError('')

      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera()
      if (!hasCamera) {
        setError('No camera found on this device')
        setIsLoading(false)
        return
      }

      // Initialize QR Scanner
      const scanner = new QrScanner(
        videoRef.current,
        (result: any) => {
          console.log('QR Code scanned:', result.data)
          onScan(result.data)
          cleanup()
        },
        {
          onDecodeError: (error: any) => {
            // Don't log decode errors - they're normal when no QR code is visible
            console.debug('QR Decode attempt:', error?.message || error)
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
        }
      )

      scannerRef.current = scanner

      // Start scanning
      await scanner.start()
      setHasPermission(true)
      setIsLoading(false)
    } catch (err: any) {
      console.error('Scanner initialization error:', err)
      
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setError('Camera permission denied. Please allow camera access and try again.')
        setHasPermission(false)
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device')
      } else if (err.name === 'NotSupportedError') {
        setError('Camera not supported in this browser')
      } else {
        setError(`Failed to initialize camera: ${err.message || 'Unknown error'}`)
      }
      
      setIsLoading(false)
    }
  }

  const cleanup = () => {
    if (scannerRef.current) {
      scannerRef.current.destroy()
      scannerRef.current = null
    }
    setIsLoading(true)
    setError('')
    setHasPermission(null)
  }

  const handleRetry = () => {
    setError('')
    setHasPermission(null)
    initializeScanner()
  }

  if (!isOpen) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10000,
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          Scan QR Code
        </Typography>
        <Button
          onClick={onClose}
          sx={{
            color: 'white',
            minWidth: 'auto',
            p: 1,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <CloseIcon />
        </Button>
      </Box>

      {/* Scanner Area */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          height: '100%',
          maxHeight: 400,
          position: 'relative',
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isLoading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              color: 'white',
            }}
          >
            <CircularProgress color="inherit" />
            <Typography>Initializing camera...</Typography>
          </Box>
        )}

        {error && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              p: 3,
              textAlign: 'center',
            }}
          >
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            {hasPermission === false && (
              <Typography variant="body2" sx={{ color: 'white', mb: 2 }}>
                To scan QR codes, please:
                <br />
                1. Click the camera icon in your browser's address bar
                <br />
                2. Select "Allow" for camera access
                <br />
                3. Refresh the page
              </Typography>
            )}
            <Button
              variant="contained"
              onClick={handleRetry}
              startIcon={<CameraIcon />}
            >
              Try Again
            </Button>
          </Box>
        )}

        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: isLoading || error ? 'none' : 'block',
          }}
        />
      </Box>

      {/* Instructions */}
      {!isLoading && !error && (
        <Typography
          variant="body2"
          sx={{
            color: 'white',
            textAlign: 'center',
            mt: 2,
            opacity: 0.8,
          }}
        >
          Position the QR code within the camera view
        </Typography>
      )}
    </Box>
  )
}

export default QRScanner
