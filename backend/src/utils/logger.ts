type LogLevel = 'info' | 'warn' | 'error'
type LogMeta = Record<string, unknown>

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return error
}

const normalizeMeta = (meta?: LogMeta) => {
  if (!meta) return undefined

  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => [
      key,
      key.toLowerCase().includes('error') ? serializeError(value) : value,
    ]),
  )
}

const writeLog = (level: LogLevel, message: string, meta?: LogMeta) => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ? { meta: normalizeMeta(meta) } : {}),
  }

  if (level === 'error') {
    console.error(payload)
    return
  }

  if (level === 'warn') {
    console.warn(payload)
    return
  }

  console.info(payload)
}

export const logger = {
  info: (message: string, meta?: LogMeta) => writeLog('info', message, meta),
  warn: (message: string, meta?: LogMeta) => writeLog('warn', message, meta),
  error: (message: string, meta?: LogMeta) => writeLog('error', message, meta),
}
