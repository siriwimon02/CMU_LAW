import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    host: '0.0.0.0',
    proxy : {
      '/auth/register' : {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
      '/auth/login' : {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
      '/petition' : {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
      '/api' : {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
      '/petitionAudit' : {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
      '/petitionSuperAudit' : {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
      '/petitionHeadAudit' : {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
      '/petitionAdmin' : {
        target: 'http://backend:3001',
        changeOrigin: true,
      }
    }
  }
})
