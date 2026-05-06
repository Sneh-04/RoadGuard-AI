import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get backend URL from environment or use local development default
const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:8000';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})