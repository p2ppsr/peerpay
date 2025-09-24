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
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)

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

      // Check if we're running in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        setError('Camera access requires HTTPS or localhost. Please use a secure connection.')
        setIsLoading(false)
        return
      }

      // Get camera stream directly for better compatibility
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        } 
      })
      
      // Set up video element with the stream
      videoRef.current.srcObject = stream
      setVideoStream(stream)
      
      // Ensure video plays
      await videoRef.current.play()
      
      // Initialize QR scanner on the video element
      const scanner = new QrScanner(
        videoRef.current,
        (result: any) => {
          const data = typeof result === 'string' ? result : result?.data || result
          onScan(data)
          cleanup()
        }
      )

      // Configure scanner options
      scanner.setInversionMode('both')
      scannerRef.current = scanner
      
      setHasPermission(true)
      setIsLoading(false)
      
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setError('Camera permission denied. Please allow camera access and try again.')
        setHasPermission(false)
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device')
      } else if (err.name === 'NotSupportedError') {
        setError('Camera not supported in this browser. Try using Chrome, Firefox, or Safari.')
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application')
      } else if (err.message?.includes('secure context')) {
        setError('Camera access requires HTTPS or localhost. Please use a secure connection.')
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
    
    // Clean up video stream
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop())
      setVideoStream(null)
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
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
                To enable camera access:
                <br />
                1. Click the camera/lock icon in your browser's address bar
                <br />
                2. Select "Allow" for camera permissions
                <br />
                3. Click "Try Again" below
                <br />
                <br />
                If using Chrome: Settings → Privacy → Camera → Allow this site
                <br />
                If using Safari: Settings → Websites → Camera → Allow
              </Typography>
            )}
            
            {error.includes('secure context') && (
              <Typography variant="body2" sx={{ color: 'white', mb: 2 }}>
                Camera access requires a secure connection:
                <br />
                • Use HTTPS (not HTTP)
                <br />
                • Or access via localhost
                <br />
                • Or try using Chrome's dev tools for testing
              </Typography>
            )}

            {error.includes('already in use') && (
              <Typography variant="body2" sx={{ color: 'white', mb: 2 }}>
                The camera is being used by another app:
                <br />
                • Close other camera apps
                <br />
                • Close other browser tabs using camera
                <br />
                • Try refreshing this page
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
          playsInline
          muted
          autoPlay
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
