import express from 'express'

import cors from 'cors'
import cookieParser from 'cookie-parser'
import router from './routes'
import prisma from './lib/prisma'

const app = express()

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/', router)


// ── Health check & Keep Alive ──────────────────────────────────────────────
app.get('/health', cors(), async (_req, res) => {
  try {
    // Ping database to prevent Neon from going to sleep
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Health check DB ping error:', error)
    res.status(500).json({ status: 'error', database: 'disconnected', timestamp: new Date().toISOString() })
  }
})

// ── Root handler for browser ───────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to Finpro API' })
})

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

export default app
