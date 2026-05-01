import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // In-memory queue for jobs POSTed by the userscript
  const pendingJobs = []

  return {
    plugins: [
      react(),
      {
        name: 'jhcc-tracker-api',
        configureServer(server) {
          server.middlewares.use('/api/track', (req, res) => {
            // Allow cross-origin requests from any job site (linkedin, jobstreet, etc.)
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

            if (req.method === 'OPTIONS') {
              res.writeHead(204); res.end(); return
            }

            if (req.method === 'POST') {
              let body = ''
              req.on('data', chunk => { body += chunk })
              req.on('end', () => {
                try {
                  pendingJobs.push(JSON.parse(body))
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ ok: true }))
                } catch (e) {
                  res.writeHead(400)
                  res.end(JSON.stringify({ error: 'invalid json' }))
                }
              })
              return
            }

            if (req.method === 'GET') {
              // Return and drain the queue
              const jobs = pendingJobs.splice(0)
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ jobs }))
              return
            }

            res.writeHead(405); res.end()
          })
        }
      }
    ],
    server: {
      proxy: {
        '/api/groq': {
          target: 'https://api.groq.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/groq/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Authorization', `Bearer ${env.GROQ_API_KEY || ''}`)
            })
          }
        }
      }
    }
  }
})
