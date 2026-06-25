import api from './axios'

export interface AdminUser {
  id: number
  name: string
  username: string | null
  email: string
  role: string
  emailVerified: boolean
  createdAt: string
}

export interface UserListResponse {
  data: AdminUser[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UserListParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  sortBy?: string
  order?: 'asc' | 'desc'
}

export async function adminListUsers(params?: UserListParams): Promise<UserListResponse> {
  const { data } = await api.get('/admin/users', { params })
  return data
}

export async function adminCreateStoreAdmin(payload: {
  name: string
  username: string
  email: string
  password: string
}): Promise<AdminUser> {
  const { data } = await api.post('/admin/users', payload)
  return data.data
}

export async function adminUpdateUser(id: number, payload: {
  name?: string
  email?: string
  username?: string
}): Promise<AdminUser> {
  const { data } = await api.put(`/admin/users/${id}`, payload)
  return data.data
}

export async function adminDeleteUser(id: number): Promise<void> {
  await api.delete(`/admin/users/${id}`)
}
