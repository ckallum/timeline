import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    copyPublicDir: true,
  },
  server: {
    // Serve data/ as static files in dev mode
    fs: {
      allow: ['.'],
    },
  },
})
