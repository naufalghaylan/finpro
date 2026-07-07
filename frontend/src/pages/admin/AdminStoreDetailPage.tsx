import { useEffect, useState, type FormEvent } from 'react'
import { AxiosError } from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CircleCheck,
  CircleX,
  Info,
  Loader2,
  MapPin,
  Package,
  Phone,
  Radar,
  Tag,
  Users,
  LineChart,
  BarChart3,
} from 'lucide-react'
import { getStoreById, updateStore } from '../../api/store'
import { AdminStoreDetailsForm, type StoreDetailFormData } from '../../components/admin/AdminStoreDetailsForm'
import { useToast } from '../../components/common/Toast'
import type { Store } from '../../types/store'
import ErrorPage from '../error/ErrorPage'

const fallbackPosition: [number, number] = [-6.2088, 106.8456]

export default function AdminStoreDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState<{ message: string; code: number } | null>(null)
  const [formData, setFormData] = useState<StoreDetailFormData>({
    name: '',
    address: '',
    phone: '',
    description: '',
    latitude: fallbackPosition[0],
    longitude: fallbackPosition[1],
    serviceRadius: 50,
  })
  const [position, setPosition] = useState<[number, number]>(fallbackPosition)

  useEffect(() => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      latitude: position[0],
      longitude: position[1],
    }))
  }, [position])

  const fetchStore = async () => {
    try {
      setLoading(true)
      setFetchError(null)
      const response = await getStoreById(Number(id))
      const storeData = response.data
      const nextPosition: [number, number] = [
        storeData.latitude || fallbackPosition[0],
        storeData.longitude || fallbackPosition[1],
      ]

      setStore(storeData)
      setFormData({
        name: storeData.name,
        address: storeData.address,
        phone: storeData.phone || '',
        description: storeData.description || '',
        latitude: nextPosition[0],
        longitude: nextPosition[1],
        serviceRadius: storeData.serviceRadius || 50,
      })
      setPosition(nextPosition)
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>
      setFetchError({
        message: error.response?.data?.message || 'Gagal mengambil data toko',
        code: error.response?.status || 500,
      })
      showToast(error.response?.data?.message || 'Gagal mengambil data toko', 'error')
      if (error.response?.status === 403) navigate('/admin/stores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!id) return
    void fetchStore()
  }, [id])

  const handleUpdateStore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      setSaving(true)
      await updateStore(Number(id), formData)
      showToast('Detail toko berhasil diperbarui', 'success')
      await fetchStore()
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>
      showToast(error.response?.data?.message || 'Gagal memperbarui toko', 'error')
    } finally {
      setSaving(false)
    }
  }

      <div className="admin-fade-in">
        <AdminStoreDetailsForm
          formData={formData}
          position={position}
          saving={saving}
          setFormData={setFormData}
          setPosition={setPosition}
          onSubmit={handleUpdateStore}
        />
      </div>
    </div>
  )
}