import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    tanstackStart(),
    nitro({
      devProxy: {
        '/api': {
          target: 'http://localhost:5000/api',
          changeOrigin: true,
        },
      },
    }),
    tailwindcss(),
    react(),
  ],
})
