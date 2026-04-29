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
    // Proxy QMD HTTP search to avoid CORS (qmd 2.1.0 does not emit CORS headers).
    proxy: {
      '/api/qmd': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/qmd/, ''),
      },
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
})
