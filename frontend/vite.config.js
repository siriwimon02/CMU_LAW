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
    proxy : {
      '/auth/register' : {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/auth/login' : {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/petition' : {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    }
  }

})
