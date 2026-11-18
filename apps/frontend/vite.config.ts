import http from 'node:http'
import { defineConfig, type Plugin } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

function devApiProxy(): Plugin {
  return {
    name: 'dev-api-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/api')) {
          return next()
        }

        const options: http.RequestOptions = {
          hostname: '127.0.0.1',
          port: 5000,
          path: req.url,
          method: req.method,
          headers: {
            ...req.headers,
            host: '127.0.0.1:5000',
          },
        }

        const proxyReq = http.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 500, proxyRes.headers)
          proxyRes.pipe(res)
        })

        proxyReq.on('error', (err) => {
          console.error('[API Proxy Error]:', err.message)
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              error: 'Backend server unavailable on port 5000',
              details: err.message,
            })
          )
        })

        req.pipe(proxyReq)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    devApiProxy(),
    tanstackStart(),
    nitro(),
    tailwindcss(),
    react(),
  ],
})
