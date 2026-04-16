import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get backend URL from environment or use deployed default
const backendUrl = process.env.VITE_BACKEND_URL || 'https://roadguard-ai-2.onrender.com';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true
      }
    }
  }
})