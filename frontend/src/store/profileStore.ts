import { create } from 'zustand'
import api from '../api/axios'


type UserVoucher = {
  id: number
  code: string
  name: string
  discountType: 'PERCENTAGE' | 'NOMINAL' | 'BUY_ONE_GET_ONE'
  discountValue: number
  minPurchase: number
  expiredAt: string
}

interface UserProfile {
  id: number
  name: string
  email: string
  phone: string | null
  profilePicture: string | null
  role: string
  emailVerified: boolean
  createdAt: string
  referralCode?: { code: string } | null
  vouchers?: UserVoucher[]
}

interface ProfileState {
  profile: UserProfile | null
  isLoading: boolean
  isUpdating: boolean
  error: string | null
  fetchProfile: () => Promise<void>
  updateProfile: (formData: FormData) => Promise<void>
  updateEmail: (email: string) => Promise<void>
  verifyEmailChange: (token: string) => Promise<void>
  reverifyEmail: () => Promise<void>
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,
  isUpdating: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/profile')
      set({ profile: response.data, isLoading: false })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      set({ 
        error: error.response?.data?.message || 'Failed to fetch profile',
        isLoading: false 
      })
      throw error
    }
  },

  updateProfile: async (formData: FormData) => {
    set({ isUpdating: true, error: null })
    try {
      const response = await api.put('/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      set({ profile: response.data.user, isUpdating: false })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      set({ 
        error: error.response?.data?.message || 'Failed to update profile',
        isUpdating: false 
      })
      throw error
    }
  },

  updateEmail: async (email: string) => {
    set({ isUpdating: true, error: null })
    try {
      await api.put('/profile/email', { email })
      // Email verification sent, we don't refresh the profile yet until verified
      set({ isUpdating: false })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      set({ 
        error: error.response?.data?.message || 'Failed to update email',
        isUpdating: false 
      })
      throw error
    }
  },

  verifyEmailChange: async (token: string) => {
    set({ isUpdating: true, error: null })
    try {
      await api.post('/profile/verify-email-change', { token })
      // Email updated successfully, refresh the profile
      const response = await api.get('/profile')
      set({ profile: response.data, isUpdating: false })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      set({ 
        error: error.response?.data?.message || 'Failed to verify email change',
        isUpdating: false 
      })
      throw error
    }
  },

  reverifyEmail: async () => {
    set({ isUpdating: true, error: null })
    try {
      await api.post('/profile/reverify-email')
      set({ isUpdating: false })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      set({ 
        error: error.response?.data?.message || 'Failed to resend verification',
        isUpdating: false 
      })
      throw error
    }
  },
}))
