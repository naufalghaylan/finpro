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
  const [status, setStatus] = useState<LocationStatus>(() => {
    return typeof navigator !== 'undefined' && navigator.geolocation
      ? 'requesting'
      : 'unavailable'
  })
  const [coords, setCoords] = useState<Coordinates | null>(null)
  const [error, setError] = useState<string | null>(() => {
    return typeof navigator !== 'undefined' && navigator.geolocation
      ? null
      : 'Geolocation is not supported in this browser.'
  })
  const [isFallback, setIsFallback] = useState(false)

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setCoords({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    })
    setStatus('granted')
    setError(null)
  }, [])

  const handleError = useCallback((err: GeolocationPositionError) => {
    setStatus('denied')
    setError(err.message || 'Location permission denied.')
    setIsFallback(true)
  }, [])

  const requestLocation = useCallback(() => {
    setIsFallback(false)

    if (!navigator.geolocation) {
      setStatus('unavailable')
      setError('Geolocation is not supported in this browser.')
      return
    }

    setStatus('requesting')
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 300000,
    })
  }, [handleSuccess, handleError])

  const fallbackToMainStore = useCallback(() => {
    setIsFallback(true)
    setStatus('fallback')
  }, [])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return
    }

    // Call getCurrentPosition directly without synchronous setState to avoid set-state-in-effect warning
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 300000,
    })
  }, [handleSuccess, handleError])

  return {
    status,
    coords,
    error,
    requestLocation,
    fallbackToMainStore,
    isFallback,
  }
}
