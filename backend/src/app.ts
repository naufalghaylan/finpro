import express from 'express'

import cors from 'cors'
import cookieParser from 'cookie-parser'
import router from './routes'

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


// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
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
