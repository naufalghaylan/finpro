import { useCallback, useEffect, useState } from 'react'
import { getCheckoutPreview } from '../../api/order.api'
import type { CheckoutPreview } from '../../types/order'
import { getApiFetchError, type ApiFetchError } from '../../utils/apiError'

const getFetchError = (error: unknown) => getApiFetchError(error, 'Gagal memproses checkout')

export function useCheckoutPreview() {
  const [preview, setPreview] = useState<CheckoutPreview | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshingPreview, setIsRefreshingPreview] = useState(false)
  const [fetchError, setFetchError] = useState<ApiFetchError | null>(null)

  const loadPreview = useCallback(async (addressId?: number, showInitialLoading = false) => {
    if (showInitialLoading) {
      setIsLoading(true)
    } else {
      setIsRefreshingPreview(true)
    }

    try {
      const nextPreview = await getCheckoutPreview(addressId)
      setPreview(nextPreview)
      setSelectedAddressId(nextPreview.selectedAddress?.id ?? null)
      setFetchError(null)
    } catch (loadError) {
      setFetchError(getFetchError(loadError))
    } finally {
      setIsLoading(false)
      setIsRefreshingPreview(false)
    }
  }, [])

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => {
      void loadPreview(undefined, true)
    }, 0)

    return () => {
      window.clearTimeout(initialLoadId)
    }
  }, [loadPreview])

  return {
    preview,
    selectedAddressId,
    setSelectedAddressId,
    isLoading,
    isRefreshingPreview,
    fetchError,
    loadPreview,
  }
}
