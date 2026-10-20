import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compactPromptIcons } from './tooling/compact-prompt-icons.mjs'

export default defineConfig({
  plugins: [compactPromptIcons(), react()],
  build: {
    outDir: 'build'
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true
  }
})
