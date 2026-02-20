/**
 * Custom Next.js Server with WebSocket Support
 *
 * Next.js App Router doesn't natively support WebSocket endpoints.
 * This custom server adds a WebSocket server for the voice proxy
 * alongside the standard Next.js HTTP handler.
 *
 * Usage: npx tsx server.ts
 */

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { WebSocketServer } from 'ws'
import { getVoiceProxyHandler } from '@/lib/services/voice-proxy-handler'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOST ?? 'localhost'
const port = parseInt(process.env.PORT ?? '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling request:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  // WebSocket server for voice proxy
  const wss = new WebSocketServer({ noServer: true })

  // Next.js internal upgrade handler (handles HMR WebSocket in dev mode)
  const nextUpgradeHandler = app.getUpgradeHandler()

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url!)

    if (pathname === '/ws/voice') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    } else {
      // Forward to Next.js (e.g. HMR WebSocket: /_next/webpack-hmr)
      nextUpgradeHandler(request, socket, head)
    }
  })

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection on /ws/voice')
    const handler = getVoiceProxyHandler()
    handler.handleConnection(ws).catch((err) => {
      console.error('Voice proxy handler error:', err)
    })
  })

  server.listen(port, () => {
    console.log('='.repeat(60))
    console.log('Senacor VoiceLive - Next.js + WebSocket Server')
    console.log('='.repeat(60))
    console.log(`Server:    http://${hostname}:${port}`)
    console.log(`WebSocket: ws://${hostname}:${port}/ws/voice`)
    console.log(`Health:    http://${hostname}:${port}/api/health`)
    console.log('='.repeat(60))
  })
})
