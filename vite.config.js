import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import handler from './api/gerar-plano.js'

// Carrega variáveis do arquivo .env.local de forma manual para preencher o process.env no Node local
try {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const parts = line.trim().split('=')
      if (parts.length >= 2) {
        const key = parts[0].trim()
        const value = parts.slice(1).join('=').trim()
        // Remove aspas simples/duplas das pontas do valor se houver
        const cleanValue = value.replace(/^['"]|['"]$/g, '')
        if (key && cleanValue && !process.env[key]) {
          process.env[key] = cleanValue
        }
      }
    })
  }
} catch (e) {
  console.warn('Não foi possível carregar o arquivo .env.local manualmente no vite.config.js:', e)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-serverless-simulated-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url.startsWith('/api/gerar-plano')) {
            let body = ''
            req.on('data', chunk => {
              body += chunk
            })

            req.on('end', async () => {
              try {
                req.body = body ? JSON.parse(body) : {}
              } catch (err) {
                req.body = {}
              }

              // Cria um mock de res compatível com Serverless Functions Vercel
              const mockRes = {
                status(statusCode) {
                  res.statusCode = statusCode
                  return this
                },
                json(data) {
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(data))
                  return this
                }
              }

              try {
                // Adiciona cabeçalhos CORS básicos se o frontend estiver rodando em outra porta por acaso
                res.setHeader('Access-Control-Allow-Origin', '*')
                res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

                if (req.method === 'OPTIONS') {
                  res.statusCode = 200
                  res.end()
                  return
                }

                // Executa a função serverless
                await handler(req, mockRes)
              } catch (err) {
                console.error('Erro na execução do handler local:', err)
                mockRes.status(500).json({ error: err.message || 'Erro interno no handler local.' })
              }
            })
            return
          }
          next()
        })
      }
    }
  ],
})
