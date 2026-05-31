import { useCallback, useEffect, useState } from 'react'
import type { Coordinates } from '../../types/home/home'

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'fallback'

export const useLocationSelection = () => {
  const [status, setStatus] = useState<LocationStatus>('idle')
  const [coords, setCoords] = useState<Coordinates | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  const requestLocation = useCallback(() => {
    setIsFallback(false)

    if (!navigator.geolocation) {
      setStatus('unavailable')
      setError('Geolocation is not supported in this browser.')
      return
    }

    setStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setStatus('granted')
        setError(null)
      },
      (err) => {
        setStatus('denied')
        setError(err.message || 'Location permission denied.')
        setIsFallback(true)
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 300000,
      },
    )
  }, [])

  const fallbackToMainStore = useCallback(() => {
    setIsFallback(true)
    setStatus('fallback')
  }, [])

  useEffect(() => {
    if (status === 'idle') {
      requestLocation()
    }
  }, [requestLocation, status])

  return {
    status,
    coords,
    error,
    requestLocation,
    fallbackToMainStore,
    isFallback,
  }
}
