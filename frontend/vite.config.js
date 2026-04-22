import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Build output goes directly into FastAPI's static/ folder.
    // FastAPI serves this at GET / so users see the React app.
    outDir: path.resolve(__dirname, '../static'),
    emptyOutDir: true,      // Clear old builds before each new build
  },
  server: {
    // Dev server proxy: forward /analyze-image, /feedback, etc. to FastAPI
    proxy: {
      '/analyze-image': { target: 'http://localhost:8000', changeOrigin: true },
      '/feedback': { target: 'http://localhost:8000', changeOrigin: true },
      '/upload-manifest': { target: 'http://localhost:8000', changeOrigin: true },
      '/live-activity': { target: 'http://localhost:8000', changeOrigin: true },
      '/temp_uploads': { target: 'http://localhost:8000', changeOrigin: true },
      '/health': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})