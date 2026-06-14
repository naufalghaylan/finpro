import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as addressApi from '../api/user-address.api'
import type { UserAddress, CreateUserAddressDTO, UpdateUserAddressDTO } from '../types/address'

interface AddressState {
  addresses: UserAddress[]
  selectedAddressId: number | null
  isLoading: boolean
  error: string | null
  
  fetchAddresses: () => Promise<void>
  createAddress: (data: CreateUserAddressDTO) => Promise<void>
  updateAddress: (id: number, data: UpdateUserAddressDTO) => Promise<void>
  deleteAddress: (id: number) => Promise<void>
  setPrimaryAddress: (id: number) => Promise<void>
  selectAddress: (id: number | null) => void
  clearAddresses: () => void
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedAddressId: null,
      isLoading: false,
      error: null,

      fetchAddresses: async () => {
        set({ isLoading: true, error: null })
        try {
          const addresses = await addressApi.getAddresses()
          set({ addresses, isLoading: false })
        } catch (err: unknown) {
          const error = err as { response?: { data?: { message?: string } } }
          set({ 
            error: error.response?.data?.message || 'Failed to fetch addresses',
            isLoading: false 
          })
          throw err
        }
      },

      createAddress: async (data) => {
        set({ isLoading: true, error: null })
        try {
          await addressApi.createAddress(data)
          await get().fetchAddresses()
        } catch (err: unknown) {
          const error = err as { response?: { data?: { message?: string } } }
          set({ 
            error: error.response?.data?.message || 'Failed to create address',
            isLoading: false 
          })
          throw err
        }
      },

      updateAddress: async (id, data) => {
        set({ isLoading: true, error: null })
        try {
          await addressApi.updateAddress(id, data)
          await get().fetchAddresses()
        } catch (err: unknown) {
          const error = err as { response?: { data?: { message?: string } } }
          set({ 
            error: error.response?.data?.message || 'Failed to update address',
            isLoading: false 
          })
          throw err
        }
      },

      deleteAddress: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await addressApi.deleteAddress(id)
          // If the deleted address was selected, unselect it
          if (get().selectedAddressId === id) {
            set({ selectedAddressId: null })
          }
          await get().fetchAddresses()
        } catch (err: unknown) {
          const error = err as { response?: { data?: { message?: string } } }
          set({ 
            error: error.response?.data?.message || 'Failed to delete address',
            isLoading: false 
          })
          throw err
        }
      },

      setPrimaryAddress: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await addressApi.setPrimaryAddress(id)
          await get().fetchAddresses()
        } catch (err: unknown) {
          const error = err as { response?: { data?: { message?: string } } }
          set({ 
            error: error.response?.data?.message || 'Failed to set primary address',
            isLoading: false 
          })
          throw err
        }
      },

      selectAddress: (id) => {
        set({ selectedAddressId: id })
      },

      clearAddresses: () => {
        set({ addresses: [], selectedAddressId: null, error: null })
      }
    }),
    {
      name: 'panenmart-address-storage',
      partialize: (state) => ({ selectedAddressId: state.selectedAddressId }) // Only persist selectedAddressId
    }
  )
)
