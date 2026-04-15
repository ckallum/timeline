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
    port: 5173,
    strictPort: true,
    fs: {
      allow: ['.'],
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
})
