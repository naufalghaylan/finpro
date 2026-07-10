import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ActiveFulfillmentStore = {
  id: number
  name: string
  city: string
  address: string
  latitude: number
  longitude: number
}

export type FulfillmentSource = 'nearest_location' | 'manual_store' | 'fallback'

type FulfillmentState = {
  selectedStoreId: string | null
  activeStore: ActiveFulfillmentStore | null
  source: FulfillmentSource | null
  setSelectedStoreId: (storeId: string | null) => void
  setActiveStore: (store: ActiveFulfillmentStore | null, source: FulfillmentSource | null) => void
  clearSelectedStore: () => void
}

export const useFulfillmentStore = create<FulfillmentState>()(
  persist(
    (set) => ({
      selectedStoreId: null,
      activeStore: null,
      source: null,

      setSelectedStoreId: (selectedStoreId) => set({ selectedStoreId }),

      setActiveStore: (activeStore, source) => set({ activeStore, source }),

      clearSelectedStore: () => set({ selectedStoreId: null }),
    }),
    {
      name: 'panenmart-fulfillment-storage',
    },
  ),
)
